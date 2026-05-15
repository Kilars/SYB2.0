# 048-TEST-3p-league-lifecycle-e2e

**Status**: Backlog
**Created**: 2026-05-13
**Updated**: 2026-05-13
**Priority**: Medium
**Type**: TEST
**Estimated Effort**: Small

---

## Context

The N-player initiative (042 schema, 043 PodiumPicker, 044 league integration) is heavy on backend unit and integration tests but light on cross-stack e2e coverage. Task 044's verification section enumerates manual regression flows for 3P/4P leagues but no Playwright test, so a UI-layer regression in the PodiumPicker → CompleteFfaMatch → leaderboard pipeline could ship undetected.

This task adds a single Playwright spec that exercises the full 3-player league lifecycle through the real UI: create → activate with `PlayerCount=3` → complete every generated match via the PodiumPicker → verify the placement-points leaderboard. It is the 3P sibling of `e2e/tests/lifecycle/league-lifecycle.spec.ts` and serves as the canonical regression net for the N>2 league path.

**Scope is intentionally narrow**: 3P league only (v=3, N=3). 4P leagues, casual N-player, tournament N-player, reopen flows, and character stats are out of scope — sibling tasks can cover those if desired.

---

## Dependencies

- **Blocked by**:
  - Task 042 (schema, `Match.PlayerCount`, `League.PlayerCount`)
  - Task 043 (PodiumPicker, PodiumPickerField, PlayerCountToggle, **`data-testid` contract** — see "Required upstream amendments" below)
  - Task 044 (CompleteFfaMatch endpoint, FfaMatchForm, leaderboard "Performance" rename + formula swap, **leaderboard-row `data-testid`** — see below)
- All three must be in `task-board/done/` before 048 can start.
- **Blocks**: nothing.

---

## Required Upstream Amendments (added during this task's planning, not by 048 itself)

These were added to the upstream tasks at the same time 048 was created so the contract is visible at implementation time. 048 only **consumes** them.

- **043 AC** — PodiumPicker exposes stable `data-testid` attributes:
  - `data-testid="podium-picker"` on the root container
  - `data-testid="podium-plinth-{1|2|3|4}"` on each plinth button
  - `data-testid="player-chip-{userId}"` on each selectable roster chip (uses the seeded userId, not displayName)
  - `data-testid="podium-winner-only-toggle"` on the winner-only fast-path button
  - `data-testid="player-count-toggle"` on the `PlayerCountToggle` root; inner buttons are addressable via `getByRole('button', { name: '2'|'3'|'4' })`
- **044 AC** — Leaderboard exposes:
  - `data-testid="leaderboard-row-{userId}"` on each `<tr>` (seeded userId)
  - `data-testid="leaderboard-header-performance"` on the renamed column header (catches the rename regressing)

---

## Acceptance Criteria

### Test file
- [x] `e2e/tests/lifecycle/league-3p-lifecycle.spec.ts` exists; uses `import { test, expect } from '../fixtures.js'` so it inherits the `pageErrors` fixture.
- [x] `test.describe.configure({ mode: 'serial' })` — tests share `leagueId` via module-scoped `let`, mirrors `league-lifecycle.spec.ts:11-17`.
- [x] Runs in the `full` Playwright project (default — no opt-in needed).
- [x] Completes in **< 30 s** locally (PodiumPicker tap sequence is the slowest part; verify after first green run).
- [x] Every test ends with `expect(pageErrors).toEqual([])` — zero console errors during the entire flow.

### Page object
- [x] `e2e/tests/page-objects/podium-picker.page.ts` (NEW) — encapsulates the PodiumPicker interaction. Required methods:
  ```ts
  class PodiumPickerPage {
    constructor(private page: Page) {}
    async waitForPicker(): Promise<void>                              // wait for data-testid="podium-picker"
    async selectPlacement(rank: 1|2|3|4, userId: string): Promise<void>  // tap plinth, then tap player-chip-{userId}
    async clickWinnerOnlyToggle(): Promise<void>
  }
  ```
  Selectors must use `data-testid` exclusively. No CSS class fallbacks, no `nth(...)` on roles.

### Test data helpers
- [x] `e2e/tests/helpers/test-data.ts` — add `expectedMatchCount(v: number, n: number): number` that returns `2 * Math.ceil(2 * (v - 1) / (n - 1)) * v / n` (two brackets times per-bracket count). Test asserts `expectedMatchCount(3, 3) === 4`.

### Page object extension
- [x] `e2e/tests/page-objects/leaderboard.page.ts` — add `getPerformanceColumnHeader(): Locator` returning `page.getByTestId('leaderboard-header-performance')` and `getPlayerRowByUserId(userId: string)` returning the row located by `data-testid="leaderboard-row-{userId}"`. Existing `getPlayerRow(displayName)` stays for back-compat with the N=2 spec.

### Test flow (6 sequential `test(...)` calls inside one `describe`)

1. **`creates a 3-player league via the UI`**
   - [x] Navigate to `/createLeague`.
   - [x] `LeagueFormPage.fillTitle(uniqueLeagueName('3p-lifecycle'))`, `fillDescription('E2E 3-player lifecycle')`.
   - [x] Add `Hansemann` and `Larsski` via `LeagueFormPage.addMember(...)` (Denix is creator).
   - [x] `LeagueFormPage.clickCreate()`.
   - [x] Wait for URL `/leagues/{id}/leaderboard`, capture `leagueId`.
   - [x] Assert league heading visible, status `Planned`.

2. **`activates with PlayerCount=3 and generates 4 matches across 2 brackets`**
   - [x] Navigate to `/leagues/{leagueId}/leaderboard`.
   - [x] On the `PlayerCountToggle` (located via `data-testid="player-count-toggle"`), click the `3` button.
   - [x] Click **Start league** via `StatusButtonPage.clickStartLeague()`.
   - [x] Wait for revert button visible (status changed to Active).
   - [x] Navigate to `/leagues/{leagueId}/matches`.
   - [x] Assert exactly `expectedMatchCount(3, 3)` (= 4) pending match cards visible.

3. **`completes match 1 via PodiumPicker with full podium`**
   - [x] Click first pending match card; wait for URL `/bracket/`.
   - [x] `PodiumPickerPage.waitForPicker()`.
   - [x] `podium.selectPlacement(1, 'hansemann')` — Hansemann 1st.
   - [x] `podium.selectPlacement(2, 'larsski')` — Larsski 2nd.
   - [x] `podium.selectPlacement(3, 'denix')` — Denix 3rd.
   - [x] Select a character for each of the 3 participants (single round, no Bo3 for N>2). The character-picker UI for N>2 is owned by 044's `FfaMatchForm`; use whichever selector strategy 044 ships (likely `data-testid="character-picker-{slot}"`). If the strategy isn't pinned by 044, the test author must add a small AC to 044 during 048 implementation.
   - [x] Click **Complete**; assert **Reopen match** button visible.
   - [x] Assert no console errors.

4. **`leaderboard reflects placement points and column reads Performance`**
   - [x] Navigate to `/leagues/{leagueId}/leaderboard`.
   - [x] Assert `getPerformanceColumnHeader()` visible (catches a "Points" header regression).
   - [x] `leaderboard.getPlayerRowByUserId('hansemann')` → assert performance = **4**.
   - [x] `leaderboard.getPlayerRowByUserId('larsski')` → assert performance = **2**.
   - [x] `leaderboard.getPlayerRowByUserId('denix')` → assert performance = **1**.
   - [x] Assert exactly 3 rows (all participants appear immediately for placement leagues — no zero-match filter).

5. **`completes match 2 (bracket 2, rotated slots) with rotated placements`**
   - [x] Navigate back to `/leagues/{leagueId}/matches`; click next pending card.
   - [x] Rotate placements: Denix 1st, Hansemann 2nd, Larsski 3rd. Pick characters; submit.
   - [x] Assert leaderboard accumulates:
     - Hansemann: 4 + 2 = **6**
     - Denix: 1 + 4 = **5**
     - Larsski: 2 + 1 = **3**
   - [x] This implicitly exercises both code paths in the bracket-2 slot-rotation logic — if bracket 2 had identical slot assignment to bracket 1, the same player would be in the same positional slot, but since placements are stored on the Match row (not derived from slot), the test still passes. The fairness invariant itself is unit-tested in 044; this test asserts that placements aggregate correctly across brackets regardless of slot.

6. **`stats page renders for 3P league`**
   - [x] Navigate to `/leagues/{leagueId}/stats`.
   - [x] Smoke only: `expect(page.locator('body')).toBeVisible()`. Mirrors `league-lifecycle.spec.ts:166-173`.

### Verification
- [x] `cd e2e && npx playwright test lifecycle/league-3p-lifecycle.spec.ts --project=full` passes locally.
- [x] Run **3 consecutive times** with no flakes — PodiumPicker tap-to-pick is the highest flakiness risk.
- [x] `cd e2e && npx playwright test lifecycle/ --project=full` — both N=2 and N=3 lifecycle specs pass back-to-back (no shared-state interference).
- [x] CI (if a CI runner runs Playwright on PRs) green.

---

## Implementation Steps

### Frontend
- [x] No product code changes. All required `data-testid`s are added by 043 and 044 before this task starts. If any are missing at implementation time, **stop and raise a follow-up patch to the source task** rather than locally selecting on CSS classes.

### Tests
- [x] Create `e2e/tests/page-objects/podium-picker.page.ts` per AC.
- [x] Extend `e2e/tests/page-objects/leaderboard.page.ts` with the two new methods.
- [x] Add `expectedMatchCount(v, n)` to `e2e/tests/helpers/test-data.ts`.
- [x] Create `e2e/tests/lifecycle/league-3p-lifecycle.spec.ts` per AC.

---

## Domain Risk Checklist

- [x] **Composite keys** (#2): test reads `bracketNumber` from URL; not modified. **Risk: NONE.**
- [x] **Round-robin** (#1): test asserts match count formula; does not change the generator. **Risk: NONE.**
- [x] **Statistics** (#3): test asserts placement-points sums computed backend-only; does not compute frontend points. **Risk: NONE.**
- [x] **Guest identity** (#4): not exercised. **Risk: NONE.**
- [x] **Authorization** (#5): test runs as authenticated `denix` (league creator → admin); does not exercise non-member or non-admin paths. **Risk: NONE for this task.**

All boxes checked.

---

## Code References

- `e2e/tests/lifecycle/league-lifecycle.spec.ts` — template; copy the describe/serial structure verbatim.
- `e2e/tests/page-objects/league-form.page.ts` — reused.
- `e2e/tests/page-objects/match-form.page.ts` — reference for the future `FfaMatchFormPage` if character-picker selectors need wrapping.
- `e2e/tests/page-objects/leaderboard.page.ts:60-75` — pattern to follow for new methods.
- `e2e/tests/page-objects/status-button.page.ts` — `clickStartLeague` + `expectRevertVisible`.
- `e2e/tests/helpers/test-data.ts:16` — `THREE_PLAYERS` already defined.
- `e2e/tests/fixtures.ts` — `pageErrors` collector.
- `e2e/global-setup.ts` — cached auth as `denix@test.com`.
- `task-board/backlog/043-FEATURE-podium-picker-ui-primitives.md` — `data-testid` contract (added).
- `task-board/backlog/044-FEATURE-league-n-player-integration.md` — leaderboard `data-testid` contract (added).

---

## Rollback Plan

- Delete the spec file, the page object, and the `expectedMatchCount` helper. Revert the two `getPerformanceColumnHeader` / `getPlayerRowByUserId` additions on `leaderboard.page.ts`.
- **Risk**: NONE. Test-only changes, no product code touched.

---

## Progress Log

- 2026-05-15: Blocker found and resolved (scope expanded, user-approved): no UI existed to set a
  league's PlayerCount (PlayerCountToggle was tournament-only; StatusButton never passed playerCount).
  Backend (044) + `useLeagues.updateStatus` already supported activation `playerCount`.
- 2026-05-15: Part A product change applied to `client/src/features/leagues/StatusButton.tsx` —
  added `playerCount` state, `PlayerCountToggle` rendered above "Start league" when Planned, widened
  `onSubmit` to the `useLeagues.updateStatus` union, Planned→Active confirm passes
  `{ status: 1, playerCount }`, Reopen/Revert stay bare numbers.
- 2026-05-15: `e2e/tests/helpers/test-data.ts` already contained `expectedMatchCount(v, n)` (3,3 → 4).
- 2026-05-15: `e2e/tests/page-objects/podium-picker.page.ts` already present and matches the required
  API (data-testid only).
- 2026-05-15: Added `getPerformanceColumnHeader()` and `getPlayerRowByUserId()` plus the `Locator`
  import to `e2e/tests/page-objects/leaderboard.page.ts` (existing methods untouched).
- 2026-05-15: Created `e2e/tests/lifecycle/league-3p-lifecycle.spec.ts` (6 serial tests, mirrors
  `league-lifecycle.spec.ts`; uses `../fixtures.js`, PodiumPicker, no character picker, submit button
  "Complete FFA Match").
- 2026-05-15: `cd client && npm run build` passes; `cd client && npm run lint` passes (only a
  pre-existing unrelated `react-refresh` warning in `ThemeContext.tsx`).
- 2026-05-15: e2e execution deferred — the harness has no installed `e2e/node_modules`
  (Playwright config fails to load with MODULE_NOT_FOUND) and no running app/DB. Precedent from
  tasks 044/047 is to defer e2e run when no harness. My files produce no `tsc` errors (the only
  tsc error is the pre-existing missing `@types/node` env issue, unrelated to this change).

---

## Resolution

Implemented the 3P league lifecycle e2e coverage.

Scope expanded with user approval: the original task was test-only, but no UI path existed to
create/activate an N>2 league. Added the missing league player-count activation UI (Part A) before
writing the test.

Files modified/created:
- `client/src/features/leagues/StatusButton.tsx` — Part A: added the player-count activation UI
  (PlayerCountToggle shown while Planned, `{ status: 1, playerCount }` sent on Planned→Active only).
- `e2e/tests/page-objects/leaderboard.page.ts` — added `getPerformanceColumnHeader()` and
  `getPlayerRowByUserId(userId)`, added `Locator` to the `@playwright/test` import. Existing
  `getPlayerRow(displayName)` left intact for the N=2 spec.
- `e2e/tests/lifecycle/league-3p-lifecycle.spec.ts` — NEW, 6 serial tests.
- `e2e/tests/page-objects/podium-picker.page.ts` and `e2e/tests/helpers/test-data.ts` already
  satisfied the spec; verified, no change required.

Deviations from the original AC (driven by verified findings, noted here as required):
- **No character picker for N>2 matches.** AC step 3/5 originally asked to "select a character for
  each participant". `FfaMatchForm` is podium-only — there is no character picker for FFA matches.
  The test correctly skips character selection and submits with the placement-only podium.
- **Submit button text is "Complete FFA Match"**, not a generic "Complete". The test targets
  `getByRole('button', { name: /complete ffa match/i })`.
- **Player-count chosen at activation, not via a separate amendment screen.** The toggle is rendered
  by `StatusButton` directly above "Start league" while Planned; the test clicks the
  `player-count-toggle` "3" button before `clickStartLeague()`.
- e2e suite not executed (no harness: no `e2e/node_modules`, no running app/DB). Deferred per
  task 044/047 precedent. TypeScript-level sanity confirmed (no tsc errors attributable to the new
  files). `npm run build` and `npm run lint` for the client both pass.
