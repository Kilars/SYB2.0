# 034-BUG-league-create-404

**Status**: Backlog
**Created**: 2026-03-02
**Priority**: High
**Type**: BUG
**Estimated Effort**: Simple

---

## Context

After creating or updating a league, the app navigates to `/leagues/${id}` — but no route exists for that path. The router only defines sub-routes like `/leagues/:competitionId/leaderboard`, `/leagues/:competitionId/matches`, etc. This causes the user to land on a blank page (no matching route = effectively a 404).

**Root cause** — `CompetitionForm.tsx` lines 72 and 78:
```tsx
// Create
onSuccess: (id) => navigate(`/leagues/${id}`)
// Update
onSuccess: () => navigate(`/leagues/${league.id}`)
```

**Routes.tsx** has NO entry for `leagues/:competitionId` — only:
- `leagues/:competitionId/description`
- `leagues/:competitionId/leaderboard`
- `leagues/:competitionId/matches`
- `leagues/:competitionId/stats`

---

## Acceptance Criteria

- [x] After creating a league, user is navigated to the league's leaderboard page (`/leagues/${id}/leaderboard`)
- [x] After updating a league, user is navigated to the league's leaderboard page
- [x] No blank/404 page is shown after league creation or update
- [x] E2E test updated — no longer works around the 404, asserts correct landing page
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [x] **`client/src/features/competitions/CompetitionForm.tsx` line 72** — Change create navigation:
  ```tsx
  // Before:
  onSuccess: (id) => navigate(`/leagues/${id}`)
  // After:
  onSuccess: (id) => navigate(`/leagues/${id}/leaderboard`)
  ```
- [x] **`client/src/features/competitions/CompetitionForm.tsx` line 78** — Change update navigation:
  ```tsx
  // Before:
  onSuccess: () => navigate(`/leagues/${league.id}`)
  // After:
  onSuccess: () => navigate(`/leagues/${league.id}/leaderboard`)
  ```

### E2E Test
- [x] **`e2e/tests/lifecycle/league-lifecycle.spec.ts` lines 41-48** — Fix the workaround that tolerates the 404:
  ```typescript
  // Before (works around the bug):
  // After create, app navigates to /leagues/{id} (which 404s — no tab route).
  // Extract the league ID from the URL.
  await page.waitForURL(/\/leagues\/[^/]+$/, { timeout: 15000 });
  const url = page.url();
  leagueId = url.split('/leagues/')[1];
  // Navigate to the description tab to verify league was created
  await page.goto(`/leagues/${leagueId}/description`);

  // After (asserts correct behavior):
  await page.waitForURL(/\/leagues\/[^/]+\/leaderboard$/, { timeout: 15000 });
  const url = page.url();
  leagueId = url.split('/leagues/')[1].split('/')[0];
  // Verify we landed on a real page, not a 404
  await expect(page.getByRole('tab', { name: /leaderboard/i })).toBeVisible({ timeout: 10000 });
  // Navigate to description tab to continue the test flow
  await page.goto(`/leagues/${leagueId}/description`);
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

- **Blocked by**: None
- **Blocks**: None

---

## Code References

Router definition (`client/src/app/router/Routes.tsx` lines 28-39) — no `/leagues/:competitionId` route exists:
```tsx
{ path: "leagues/:competitionId/description", element: <LeagueTabs key="description" tab="description" /> },
{ path: "leagues/:competitionId/leaderboard", element: <LeagueTabs key="leaderboard" tab="leaderboard" /> },
{ path: "leagues/:competitionId/matches", element: <LeagueTabs key="matches" tab="matches" /> },
{ path: "leagues/:competitionId/stats", element: <LeagueTabs key="stats" tab="stats" /> },
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — single file, two line changes
- **Risk**: Low — isolated navigation path fix

---

## Progress Log

- 2026-03-03: Fixed create navigation in CompetitionForm.tsx (line 72): `/leagues/${id}` -> `/leagues/${id}/leaderboard`
- 2026-03-03: Fixed update navigation in CompetitionForm.tsx (line 78): `/leagues/${league.id}` -> `/leagues/${league.id}/leaderboard`
- 2026-03-03: Updated E2E test to assert correct `/leaderboard` URL, extract leagueId correctly, and verify leaderboard tab visibility
- 2026-03-03: `cd client && npm run build` passes (0 errors, 1 pre-existing warning)

---

## Resolution

Fixed by appending `/leaderboard` to the navigation paths in `CompetitionForm.tsx` for both create and update flows. The E2E test in `league-lifecycle.spec.ts` was updated to assert the correct URL pattern and verify the leaderboard tab is visible instead of working around the 404.
