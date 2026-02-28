---
name: verify-state
description: Verify application state by running the full e2e test suite, checking console health (warnings + errors), and generating documentation screenshots. Starts Docker if needed, lets Playwright manage backend/frontend.
---

# Verify State Skill

Run the full verification pipeline: Docker health check, Playwright e2e tests, documentation screenshots, and a structured summary report.

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

**Capture the full output** — you'll parse it in Phase 4 for the summary report.

Record the exit code: `0` = all passed, non-zero = failures.

**Continue to Phase 3 regardless of pass/fail.**

---

### Phase 3: Run Screenshot Script

`take-screenshots.ts` connects directly to `localhost:3000` — it does NOT use Playwright's webServer. After Phase 2, Playwright may have shut down its servers.

**Check if servers are still responding:**

```bash
# Check backend
curl -sk -o /dev/null -w "%{http_code}" https://localhost:5002/api/leagues

# Check frontend
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

**If either server is down**, start them as background tasks and wait for readiness:

Backend (only if down):
```bash
cd /home/lars.skifjeld/Claude/SYB2.0 && dotnet run --project API
```
Run as `run_in_background: true`. Wait up to 120s:
```bash
for i in $(seq 1 60); do
  if curl -sk -o /dev/null -w "%{http_code}" https://localhost:5002/api/leagues 2>/dev/null | grep -q "200"; then
    echo "Backend ready after $((i*2))s"; break
  fi
  sleep 2
done
```

Frontend (only if down):
```bash
cd /home/lars.skifjeld/Claude/SYB2.0/client && npm run dev
```
Run as `run_in_background: true`. Wait up to 15s:
```bash
for i in $(seq 1 15); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200"; then
    echo "Frontend ready after ${i}s"; break
  fi
  sleep 1
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

### Phase 4: Summary Report

Parse the Playwright output from Phase 2 and present a structured report:

```
## Verification Report

### E2E Tests
| Metric | Value |
|--------|-------|
| Status | PASSED / FAILED |
| Passed | X |
| Failed | X |
| Duration | Xs |

### Failed Tests (if any)
- test name — error message (file:line)

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
| Some/all tests fail | Record failures | Yes -> screenshots |
| Servers down for screenshots | Restart them | Yes |
| Screenshot script fails | Record error | Yes -> summary |

---

## Critical Rules

1. **Docker must be healthy before anything else** — no tests without a database
2. **Let Playwright manage servers for tests** — do NOT start backend/frontend manually before `npm run test`
3. **Always run screenshots even if tests fail** — screenshots capture current visual state
4. **Restart servers for screenshots if Playwright shut them down** — check with curl first
5. **Use 10-minute timeout for test suite** — backend build + EF seeding + tests takes time
6. **Never modify test files** — this skill is read-only verification
7. **Always output the summary report** — even if everything passed, the table is useful

---

## Key Files

| File | Purpose |
|------|---------|
| `e2e/playwright.config.ts` | webServer config, projects (smoke/full), reporters |
| `e2e/package.json` | npm scripts: `test`, `screenshots` |
| `e2e/take-screenshots.ts` | Screenshot script (needs running servers) |
| `.docs/screenshots/` | Screenshot output directory |
| `playwright-report/index.html` | HTML test report |
