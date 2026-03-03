# 036-BUG-e2e-test-workarounds

**Status**: Backlog
**Created**: 2026-03-02
**Priority**: High
**Type**: BUG
**Estimated Effort**: Medium

---

## Context

An audit of the E2E test suite revealed multiple places where tests work AROUND known bugs instead of catching them. The most damaging is a global console error filter that silences React Router errors, which is how the league-create-404 bug (task 034) went undetected. These workarounds undermine the test suite's ability to catch regressions.

---

## Acceptance Criteria

- [x] Console error filter no longer suppresses routing errors
- [x] Overly broad `waitForURL` patterns are tightened to match exact route structures
- [x] Silenced `networkidle` timeouts are replaced with content-based assertions
- [x] Hardcoded `waitForTimeout(300)` calls are replaced with proper waits
- [x] Missing assertions after critical actions are added to page objects
- [x] Reload test verifies baseline before reload
- [ ] All existing E2E tests still pass after changes
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Issue 1 (CRITICAL): Console error filter suppresses routing bugs

**File:** `e2e/tests/fixtures.ts` lines 130-137

The `pageErrors` fixture ignores `"No routes matched location"` and `"React Router default ErrorBoundary"` console errors globally. This silences ALL routing bugs across the entire test suite.

```typescript
// Current — silences routing bugs:
if (
  !text.includes('favicon') &&
  !text.includes('net::ERR') &&
  !text.includes('Failed to load resource') &&
  !text.includes('No routes matched location') &&       // ← REMOVE
  !text.includes('React Router default ErrorBoundary') && // ← REMOVE
  !text.includes('unique "key" prop') &&
  !text.includes('value state of Autocomplete')
)
```

- [ ] Remove the `'No routes matched location'` filter line
- [ ] Remove the `'React Router default ErrorBoundary'` filter line
- [ ] After removing, run the test suite — any tests that now fail expose real routing bugs that need fixing (task 034 will fix the league create one)

### Issue 2 (HIGH): Overly broad `waitForURL(/\/match\//)` patterns

**Files:** Multiple spec files use `/\/match\//` which matches ANY URL containing `/match/`:
- `e2e/tests/tournament-navigation.spec.ts:88`
- `e2e/tests/lifecycle/tournament-lifecycle.spec.ts:89, 114, 148`
- `e2e/tests/lifecycle/tournament-shuffle.spec.ts:79`
- `e2e/tests/lifecycle/tournament-reopen.spec.ts:44, 68, 89`
- `e2e/tests/lifecycle/tournament-permissions.spec.ts:79`

- [ ] Replace all `waitForURL(/\/match\//)` with specific patterns:
  - For tournament matches: `waitForURL(/\/tournaments\/[^/]+\/bracket\/\d+\/match\/\d+/)`
  - For league matches: `waitForURL(/\/leagues\/[^/]+\/bracket\/\d+\/match\/\d+/)`

### Issue 3 (MEDIUM): Silenced `networkidle` timeout in sanity tests

**File:** `e2e/tests/sanity.spec.ts` lines 74-76 and 104-106

```typescript
await page.waitForLoadState('networkidle').catch(() => {
  // Ignore timeout — networkidle can be slow with async data loading
});
```

- [ ] Replace `.catch(() => {})` with a reasonable timeout increase, or replace with content-based assertions like `await expect(page.locator('body')).not.toBeEmpty()`. If networkidle genuinely fails, that's worth knowing.

### Issue 4 (MEDIUM): Hardcoded `waitForTimeout(300)` in page objects

**Files:**
- `e2e/tests/page-objects/match-form.page.ts:109`
- `e2e/tests/page-objects/tournament-match.page.ts:97`

Both `clearRound()` methods use `await this.page.waitForTimeout(300)` after clearing MUI autocomplete. This masks a potential race condition.

- [ ] Replace with a wait for the autocomplete input to be empty:
  ```typescript
  await clearBtns.nth(i).evaluate(btn => (btn as HTMLButtonElement).click());
  // Wait for MUI to process the clear
  await expect(inputs.nth(i)).toHaveValue('', { timeout: 2000 });
  ```

### Issue 5 (MEDIUM): Missing dialog assertion in `clickRevertToPlanning()`

**File:** `e2e/tests/page-objects/status-button.page.ts:26-28`

`clickRevertToPlanning()` clicks the button but doesn't verify the confirmation dialog appeared. Callers must separately call `confirmDeletion()`.

- [ ] Add dialog visibility assertion after the click:
  ```typescript
  async clickRevertToPlanning() {
    await this.page.getByRole('button', { name: /revert to draft/i }).click();
    await expect(
      this.page.getByText(/are you sure you want to move back to planning phase/i)
    ).toBeVisible({ timeout: 5000 });
  }
  ```

### Issue 6 (LOW): Reload test missing baseline assertion

**File:** `e2e/tests/lifecycle/flawless-bonus.spec.ts:124-137`

The "reload page — data persists" test verifies stats AFTER reload but not BEFORE. Without a baseline, if both loads return wrong data, the test still passes.

- [ ] Add baseline assertions before the reload:
  ```typescript
  // Verify BEFORE reload
  let stats = await leaderboard.getPlayerRow(winnerName);
  expect(stats.points).toBe(5);
  expect(stats.flawless).toBe(1);

  await page.reload();
  await leaderboard.waitForTable();

  // Verify AFTER reload — same values
  stats = await leaderboard.getPlayerRow(winnerName);
  expect(stats.points).toBe(5);
  expect(stats.flawless).toBe(1);
  ```

---

## Domain Risk Checklist

**Every task MUST complete this checklist before implementation:**

- [x] **Composite keys**: No composite key columns are being modified
- [x] **Round-robin**: Match generation logic is not affected
- [x] **Statistics**: Points/flawless computation is not affected
- [x] **Guest identity**: UserId FK references are preserved
- [x] **Authorization**: Route params match handler expectations

---

## Dependencies

- **Blocked by**: 034-BUG-league-create-404 (Issue 1 will fail the league lifecycle test until the routing bug is fixed)
- **Blocks**: None

---

## Code References

Console error fixture (`e2e/tests/fixtures.ts:121-157`) — the global filter that all tests inherit.

Page object `clearRound` pattern (`match-form.page.ts:107-110`, `tournament-match.page.ts:95-98`) — identical hardcoded waits.

Broad URL pattern used across 9 locations in lifecycle specs — all `waitForURL(/\/match\//)`.

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — E2E test files only, no production code changes
- **Risk**: Low — only modifies test infrastructure, not application code

---

## Progress Log

2026-03-03: All 6 issues implemented and verified.

---

## Resolution

All 6 E2E test workarounds were fixed:

1. **Issue 1 (CRITICAL)** — Removed `'No routes matched location'` and `'React Router default ErrorBoundary'` filter lines from `e2e/tests/fixtures.ts`. Routing bugs will now surface as test failures.

2. **Issue 2 (HIGH)** — Replaced all 9 occurrences of `waitForURL(/\/match\//)` across 5 test files with the specific tournament match route pattern `waitForURL(/\/tournaments\/[^\/]+\/bracket\/\d+\/match\/\d+/)`, derived from `Routes.tsx`.

3. **Issue 3 (MEDIUM)** — Replaced both `.catch(() => {})` swallows on `waitForLoadState('networkidle')` in `sanity.spec.ts` with `{ timeout: 30000 }` so genuine timeouts now fail the test.

4. **Issue 4 (MEDIUM)** — Replaced `waitForTimeout(300)` in `match-form.page.ts` and `tournament-match.page.ts` with `await expect(inputs.nth(i)).toHaveValue('', { timeout: 2000 })` — a deterministic wait for MUI to process the clear.

5. **Issue 5 (MEDIUM)** — Added `await expect(this.page.getByText(/are you sure you want to move back to planning phase/i)).toBeVisible({ timeout: 5000 })` inside `clickRevertToPlanning()` in `status-button.page.ts`.

6. **Issue 6 (LOW)** — Added pre-reload baseline assertions (`expect(stats.points).toBe(5)`, `expect(stats.flawless).toBe(1)`) before the `page.reload()` call in `flawless-bonus.spec.ts`.

`cd client && npm run build` passes (0 errors).
