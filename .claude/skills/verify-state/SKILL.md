---
name: verify-state
description: Verify application state by running the full e2e test suite, checking console health (warnings + errors), and generating documentation screenshots. Starts Docker if needed, lets Playwright manage backend/frontend. Iteratively fixes failures — preferring app fixes over test changes.
---

# Verify State Skill

Run the full verification pipeline: Docker health check, Playwright e2e tests, documentation screenshots, and a structured summary report. When tests fail, iteratively diagnose and fix the root cause in application code.

---

## When to Use

Use this skill when:
- User says "verify state", "run e2e", "run the test suite", "check everything works"
- After completing a feature to verify nothing is broken
- Before pushing code to confirm app health
- User invokes `/verify-state`

---

## Workflow

### Phase 1: Docker Prerequisite

Docker must be healthy before anything else. **STOP if it's not.**

```bash
# Check if SQL Server container is running
docker ps --filter "name=syb20" --format "{{.Names}} {{.Status}}"
```

**If not running:**

```bash
cd /home/lars.skifjeld/Claude/SYB2.0 && docker compose up -d
```

**Health-check loop** — poll for up to 60 seconds:

```bash
for i in $(seq 1 30); do
  if docker exec syb20-sql-1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'Password@1' -C -Q "SELECT 1" &>/dev/null; then
    echo "SQL Server ready after $((i*2))s"; break
  fi
  if [ $i -eq 30 ]; then echo "FAILED: SQL Server not ready after 60s"; fi
  sleep 2
done
```

**STOP conditions (report and halt):**
- `Cannot connect to the Docker daemon` — tell user: `sudo systemctl start docker`
- SQL Server won't become healthy after 60s — report timeout error

---

### Phase 2: Run E2E Test Suite

**Do NOT start backend or frontend manually.** Playwright's `webServer` config handles both automatically (`reuseExistingServer: true` for local dev).

Check/install Playwright dependencies:

```bash
ls /home/lars.skifjeld/Claude/SYB2.0/e2e/node_modules/.bin/playwright || (cd /home/lars.skifjeld/Claude/SYB2.0/e2e && npm install)
```

Run the test suite with a **10-minute timeout** (backend build + EF seeding + tests):

```bash
cd /home/lars.skifjeld/Claude/SYB2.0/e2e && npm run test 2>&1
```

Use `timeout: 600000` on the Bash tool call.

**Capture the full output** — you'll parse it in Phase 3 or Phase 5 for the summary report.

Record the exit code: `0` = all passed, non-zero = failures.

**If all tests pass → skip to Phase 4 (screenshots).**
**If any tests fail → proceed to Phase 3 (fix loop).**

---

### Phase 3: Iterative Fix Loop

When tests fail, diagnose and fix the root cause. **Maximum 3 iterations** — if failures persist after 3 rounds, stop and report remaining issues.

#### Step 3a: Diagnose Each Failure

For each failed test, determine the failure category:

**Category A — App bug (fix the app)**
The test caught a genuine application defect. The test is correct; the app is wrong.
- Backend returning wrong data or error codes
- Frontend navigating to wrong routes
- Missing API endpoints or broken handlers
- UI rendering incorrect content
- State management bugs (React Query, form state)

**Category B — UI changed, test stale (update the test)**
The app changed legitimately (new UI, renamed elements, restructured layout), and the test's selectors or assertions no longer match the real UI.
- Element selectors targeting old class names, labels, or structure
- URL patterns that don't match new route structure
- Assertions checking for text that was intentionally changed
- Page objects using stale DOM traversal

**Category C — Test workaround exposed (fix the app)**
A previous test workaround was removed or a filter was tightened, and now a pre-existing app bug is surfacing.
- Console error filters that were hiding routing errors
- Broad URL patterns that were masking wrong navigation
- Tests that navigated manually to avoid broken auto-navigation

#### Step 3b: Apply the Fix

**Decision tree:**

```
Test failed
    │
    ├─ Is the test asserting something the app SHOULD do correctly?
    │   ├─ YES → Fix the APPLICATION code (Category A or C)
    │   └─ NO → The app behavior changed intentionally
    │       └─ Update the TEST to match new behavior (Category B)
    │
    └─ Is the test working around a known bug?
        ├─ YES → Fix the APPLICATION code, then fix the test (Category C)
        └─ NO → Standard diagnosis above
```

**Rules for fixing:**
1. **Default to fixing application code.** Tests are the source of truth for expected behavior.
2. **Only update tests when UI legitimately changed.** New component structure, renamed elements, changed routes — these are valid reasons to update test selectors.
3. **Never add workarounds to tests.** No `.catch(() => {})`, no broad regex patterns, no "navigate manually because auto-nav is broken" hacks.
4. **Never add console error filters.** If the app emits a console error, fix the app.
5. **Read the application code before deciding.** Don't guess — open the component/handler, understand what changed, then decide if it's an app bug or a stale test.

#### Step 3c: Re-run Tests

After applying fixes, re-run the full test suite:

```bash
cd /home/lars.skifjeld/Claude/SYB2.0/e2e && npm run test 2>&1
```

**If all pass → proceed to Phase 4.**
**If failures remain → return to Step 3a (max 3 iterations).**
**If iteration limit hit → proceed to Phase 4, report remaining failures in Phase 5.**

---

### Phase 4: Run Screenshot Script

`take-screenshots.ts` connects directly to `localhost:3000` — it does NOT use Playwright's webServer. After Phase 2, Playwright may have shut down its servers.

**Check if servers are still responding:**

```bash
cd /home/lars.skifjeld/Claude/SYB2.0/e2e && npm run health
```

**If either server reports DOWN**, start them as background tasks and wait for readiness:

Backend (only if down):
```bash
cd /home/lars.skifjeld/Claude/SYB2.0 && dotnet run --project API
```
Run as `run_in_background: true`.

Frontend (only if down):
```bash
cd /home/lars.skifjeld/Claude/SYB2.0/client && npm run dev
```
Run as `run_in_background: true`.

**After starting servers, poll with health check** (up to 120s):
```bash
for i in $(seq 1 60); do
  output=$(cd /home/lars.skifjeld/Claude/SYB2.0/e2e && npm run --silent health 2>/dev/null)
  if echo "$output" | grep -q "Backend: OK" && echo "$output" | grep -q "Frontend: OK"; then
    echo "Both servers ready after $((i*2))s"; break
  fi
  if [ $i -eq 60 ]; then echo "Servers not ready after 120s"; fi
  sleep 2
done
```

**Run screenshot script** with 2-minute timeout:

```bash
cd /home/lars.skifjeld/Claude/SYB2.0/e2e && npm run screenshots 2>&1
```

Use `timeout: 120000` on the Bash tool call.

Screenshots output to `.docs/screenshots/` (leaderboard.png, stats.png, profile.png).

**Run this phase regardless of whether tests passed or failed** — screenshots capture current visual state.

---

### Phase 5: Summary Report

Parse the Playwright output and present a structured report:

```
## Verification Report

### E2E Tests
| Metric | Value |
|--------|-------|
| Status | PASSED / FAILED |
| Passed | X |
| Failed | X |
| Duration | Xs |
| Fix iterations | N |

### Fixes Applied (if any)
| File | Category | Change |
|------|----------|--------|
| path/to/file.tsx | App bug | Description of fix |
| path/to/test.ts | Stale test | Updated selector for new UI |

### Remaining Failures (if any)
- test name — error message (file:line)
- diagnosis: [why it's failing and what needs to happen]

### Console Health
| Metric | Value |
|--------|-------|
| Warnings | X |
| Errors | X |

If any: list them (from Playwright output — lines matching "Console warning:" or "Console error:")

### Screenshots
| Screenshot | Status |
|------------|--------|
| leaderboard.png | Generated / Missing |
| stats.png | Generated / Missing |
| profile.png | Generated / Missing |

### Infrastructure
| Service | Status |
|---------|--------|
| SQL Server | Running |
| Backend | Running / Stopped |
| Frontend | Running / Stopped |
```

Also mention the HTML report path: `e2e/../playwright-report/index.html`

Check screenshot existence:
```bash
ls -la /home/lars.skifjeld/Claude/SYB2.0/.docs/screenshots/
```

---

## Error Handling

| Failure | Behavior | Continue? |
|---------|----------|-----------|
| Docker daemon down | Report, STOP | No |
| SQL Server won't start | Report, STOP | No |
| npm install fails | Report, STOP | No |
| Some/all tests fail | Enter fix loop (Phase 3) | Yes |
| Fix loop exhausted (3 iterations) | Report remaining failures | Yes -> screenshots |
| Servers down for screenshots | Restart them | Yes |
| Screenshot script fails | Record error | Yes -> summary |

---

## Critical Rules

1. **Docker must be healthy before anything else** — no tests without a database
2. **Let Playwright manage servers for tests** — do NOT start backend/frontend manually before `npm run test`
3. **Always run screenshots even if tests fail** — screenshots capture current visual state
4. **Restart servers for screenshots if Playwright shut them down** — check with curl first
5. **Use 10-minute timeout for test suite** — backend build + EF seeding + tests takes time
6. **Fix the app, not the tests** — tests are the source of truth; only update tests when UI legitimately changed
7. **No workarounds in tests** — never add `.catch(() => {})`, broad regex, manual navigation hacks, or console error filters
8. **Read before fixing** — always read the relevant application code before deciding if it's an app bug or stale test
9. **Max 3 fix iterations** — if failures persist after 3 rounds, report and stop
10. **Always output the summary report** — even if everything passed, the table is useful

---

## Key Files

| File | Purpose |
|------|---------|
| `e2e/playwright.config.ts` | webServer config, projects (smoke/full), reporters |
| `e2e/package.json` | npm scripts: `test`, `screenshots` |
| `e2e/take-screenshots.ts` | Screenshot script (needs running servers) |
| `e2e/tests/fixtures.ts` | Console error filters, test helpers — check for workarounds here |
| `.docs/screenshots/` | Screenshot output directory |
| `playwright-report/index.html` | HTML test report |
