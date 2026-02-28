# E2E Test Coverage — User Story Traceability Matrix

## Verified User Stories

| User Story | Test File | Scenario | Coverage |
|------------|-----------|----------|----------|
| League Creation | `lifecycle/league-lifecycle.spec.ts` | #1 Create league with 3 players | Full: form fill, member select, submit, verify Planned status |
| League Start | `lifecycle/league-lifecycle.spec.ts` | #2 Start league | Full: owner starts, match count = N*(N-1) = 6 for 3 players |
| Match Registration | `lifecycle/league-lifecycle.spec.ts` | #3, #5 Register matches | Full: character select, winner checkbox, Bo3 format |
| Match Editing | `lifecycle/flawless-bonus.spec.ts` | #2, #3 Reopen + re-register | Full: reopen completed match, re-register with different result |
| Flawless Bonus | `lifecycle/flawless-bonus.spec.ts` | #1, #3, #4 | Full: 2-1 = no bonus (4pts), edit to 2-0 = bonus (5pts), persists after reload |
| League Table | `lifecycle/league-lifecycle.spec.ts` | #4, #5 | Full: sorted by points, reflects latest match state |
| Stats Page | `lifecycle/league-lifecycle.spec.ts` | #6 + `league-navigation.spec.ts` | Partial: table structure + seeded data display |
| Data Persistence | `lifecycle/flawless-bonus.spec.ts` | #4 | Full: reload page, verify data persists |
| Cancel & Restart | `lifecycle/cancel-regenerate.spec.ts` | #1-#5 | Full: cancel deletes matches, add player, restart regenerates correctly |
| Permissions | `lifecycle/permissions.spec.ts` | #1-#3 | Full: admin vs non-admin button visibility |
| Auth / Login | `auth-smoke.spec.ts` | #1-#3 | Smoke: login, invalid creds, protected redirect |
| Match Viewing | `match-details.spec.ts` | existing tests | Full: completed match display, round rendering, navigation |
| League Navigation | `league-navigation.spec.ts` | existing tests | Full: list, tabs, leaderboard columns |

## Test File Inventory

| File | Tests | Focus |
|------|-------|-------|
| `sanity.spec.ts` | 5 | Smoke: app alive, pages render |
| `auth-smoke.spec.ts` | 3 | Login, invalid creds, protected redirect |
| `league-navigation.spec.ts` | 10 | League list, tabs, leaderboard data |
| `match-details.spec.ts` | 8 | Match view, rounds, navigation |
| `lifecycle/league-lifecycle.spec.ts` | 6 | Create → Start → Register → Leaderboard → Stats |
| `lifecycle/flawless-bonus.spec.ts` | 4 | Match editing, flawless recalculation, persistence |
| `lifecycle/cancel-regenerate.spec.ts` | 5 | Cancel, add player, restart, match regeneration |
| `lifecycle/permissions.spec.ts` | 3 | Admin vs non-admin visibility |

**Total: 44 tests**

## Shared Infrastructure

| File | Purpose |
|------|---------|
| `fixtures.ts` | Custom test fixture, seeded data constants, login/health helpers |
| `helpers/test-data.ts` | User IDs, character IDs, unique name generator |
| `helpers/api-helpers.ts` | API-level setup (create league, start, complete match, login) |
| `page-objects/league-form.page.ts` | League create/edit form interactions |
| `page-objects/match-form.page.ts` | Match registration form (characters + winners) |
| `page-objects/leaderboard.page.ts` | Leaderboard table assertions |
| `page-objects/status-button.page.ts` | Status button + confirmation dialog |

## Future User Stories (NOT Tested)

| User Story | Status | Notes |
|------------|--------|-------|
| Tournament system | Future | Not implemented |
| Best-of-N configuration | Future | Currently hardcoded Bo3 |
| Guest players | Future | Not implemented |
| User registration flow | Future | Only login tested, not registration |
| Profile management | Future | Not covered in E2E |
