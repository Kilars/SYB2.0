# Task Board — SYB2.0

## Current Focus

UX & Accessibility audit — 22 tasks covering bugs, mobile responsiveness, interaction design, accessibility, and polish.

## Status

| Status | Count |
|--------|-------|
| Backlog | 2 |
| In Progress | 0 |
| Done | 48 |

## Top Priorities

N-player support initiative — sub-plans 5 onward. Dependency order: (046a → 046b) → 048.

1. **046b-FEATURE-tournament-n-player-frontend** — Tournament frontend (Complete/Reopen + bracket UI + SlotMapping)
2. **048-TEST-3p-league-lifecycle-e2e** — 3-player league lifecycle E2E test

## Recently Completed

1. **046a-FEATURE-tournament-n-player-backend** — Tournament N-player backend groundwork. Added `Tournament.PerHeatPlayerCount` (int NOT NULL DEFAULT 2, hand-written migration `AddTournamentPerHeatPlayerCount` + AppDbContext registration + snapshot). New shared `BracketSizing` (integer-safe switch tables — valid sizes/total rounds/advance ratio/advancers per heat, NO Math.Log) and `BracketBuilder` (single-elim generator: round-robin seed distribution across heats, randomized in-heat positional slot fill, globally monotonic MatchNumber for 046b's SlotMapping). `StartTournament` and `ShuffleBracket` refactored to delegate to `BracketBuilder` (inline duplicated bracket loops removed); `StartTournament` enforces exact-size roster (no CPU padding) with a legal-counts error message. `CreateTournament`/validator/DTOs carry `PerHeatPlayerCount` (2..4; BestOf forced to 1 when N>2; BracketSize initialized to N at create to avoid log2(0) pathologies). `/simplify` pass applied comment cleanups; build/tests deferred (no dotnet/test harness — precedent 043/044/045). Frontend + advancement logic deferred to 046b. Completed 2026-05-15.
2. **045-FEATURE-casual-n-player-integration** — Casual mode N-player support. Extended `CreateCasualMatch` handler to lazy-join up to 4 participants (Distinct dedup) preserving the two-phase save required by 042's composite FKs, populating Match.PlayerOne..Four + placement columns + PlayerCount and a single Round row carrying all 4 character slots. Validator rewritten with N-branched rules (PlayerCount∈{2,3,4}, char fields required only for N=2). `GetCasualMatches` now Includes PlayerThree/Four. Frontend: `casualSchema` rewritten as discriminated union with `makeFfaResultSchema` factory, `CasualMatchForm` adds `PlayerCountToggle` + `PodiumPickerField` (RHF adapter, not bare `usePodiumState`) for N>2, `CasualPage` row layout branches on N rendering `PodiumDisplay`, `UserStats` and `statUtils.computePlayerWinRates` extended to detect/score across all 4 positional slots (winrate-only, no `PlacementPoints` import). Frontend build passes; dotnet not installed in this environment, code review confirms no compile errors (same precedent as 043/044). Completed 2026-05-15.
2. **044-FEATURE-league-n-player-integration** — Wired N-player schedule, stats, and match entry through the league lifecycle. `ChangeLeagueStatus` now resolves N from `League.PlayerCount` (or activation request, coalesced to 2), forces `BestOf=1` for N>2, rejects illegal (v,N) combos, and dispatches to either the verbatim N=2 round-robin or a new BIBD-style greedy `CreateFfaSchedule` (multi-seed retry capped at 16, two brackets with cyclic slot rotation). New `Application.Common.PlacementPoints` helper (1st=4, 2nd=2, 3rd=1, 4th=0; flawless gated by `match.PlayerCount==2`) consumed by the rewritten `GetLeagueLeaderboard`. New `CompleteFfaMatch` command + validator + `POST /complete-ffa` endpoint (body bound via `FfaMatchBody` DTO to avoid `required` deserialization conflict with URL-supplied keys). `ReopenMatch` now clears placement fields, round winner, and character selections. Frontend adds `FfaMatchForm.tsx` (RHF + `PodiumPickerField` + `makeFfaResultSchema`), branches `MatchDetails` on `playerCount`, renders `PodiumDisplay` in `MatchDetailsView` for completed FFA matches, renames the leaderboard column to "Performance" with `data-testid` hooks, and threads optional `playerCount` through `useLeagues.updateStatus`. CLAUDE.md invariants #1 and #3 updated. Unit/integration tests deferred (no test harness — same precedent as 043/047). Frontend build passes. Completed 2026-05-14.
2. **047-REFACTOR-matchdetailsform-rhf-conversion** — Converted `MatchDetailsForm` from local `useState` to React Hook Form with parent-owned `useForm`. `MatchDetails.tsx` now owns `useForm<{ rounds: Round[] }>`, runs `reset({ rounds })` on matchData change, and passes `control`/`handleSubmit`/`watch`/`isSubmitting` to a presentational `MatchDetailsForm`. Manual `schema.parse` + per-issue toast preserved bit-identically. New e2e spec `match-form-branches.spec.ts` covers the decided-early branch; the other 4 branches were already covered by existing lifecycle specs. Unit tests deferred (no JS harness). Completed 2026-05-14.
2. **043-FEATURE-podium-picker-ui-primitives** — Shipped headless `usePodiumState` hook, dumb `PodiumPicker` view, RHF `PodiumPickerField` adapter, `PodiumDisplay`, `PodiumPlinth`, `PlayerCountToggle`, lifted `rankStyles`, `makeFfaResultSchema` factory, `useFfaMatch` mutation, and a `/_dev/podium` demo route. CompetitionForm now wires `PlayerCountToggle` for leagues. Unit tests deferred (no JS test harness in repo). Completed 2026-05-13.
2. **043-FEATURE-unselectable-played-characters-bo-n** — Enforced per-player, per-match character lockout in Bo-N matches. Backend validators and handlers reject duplicate-character submissions; frontend disables already-used characters in CharacterSelect dropdowns; Zod schemas provide frontend parity. Completed 2026-05-06.
2. **042-FEATURE-character-select-top-picks** — Added top-5 most-used character picks to CharacterSelect dropdown with "Most likely picks" grouped header. New backend endpoint `GET /api/characters/user/{userId}/top`, new `useTopCharacters` hook, and MUI grouped Autocomplete. Completed 2026-05-06.
2. **041-BUG-recharts-responsive-container-warnings** — Replaced `ready` boolean with measured `dims` and passed numeric width/height to ResponsiveContainer in 3 chart components. Completed 2026-04-29.
2. **036-BUG-e2e-test-workarounds** — Removed console error suppressions, tightened URL patterns, replaced hardcoded waits. Completed 2026-03-03.
2. **035-BUG-tournament-delete-404** — Fixed race condition: cancel queries before remove to prevent 404 toast. Completed 2026-03-03.
3. **034-BUG-league-create-404** — Fixed navigation to `/leagues/${id}/leaderboard` after create/update. Completed 2026-03-03.
4. **033-BUG-gameboy-icon-home-navigation** — Replaced Box+NavLink with direct NavLink for reliable home navigation. Completed 2026-03-03.
5. **032-FEATURE-members-grid-layout** — Added more grid columns at sm/md breakpoints. Completed 2026-03-03.
6. **031-BUG-best-worst-matchup-duplicates** — Fixed overlap by filtering best from worst, requiring 4+ matchups. Completed 2026-03-03.
7. **030-FEATURE-match-history-card-sizing** — Larger padding, fonts, images, scroll container. Completed 2026-03-03.
8. **029-FEATURE-scatter-chart-xaxis-rounds** — X-axis now shows rounds played, uniform dot size. Completed 2026-03-03.
9. **009-FEATURE-navigation-wayfinding** — Breadcrumbs, back navigation, prominent Create League button. Completed 2026-02-28.
10. **008-FEATURE-loading-empty-state-system** — LoadingSkeleton + EmptyState components. Completed 2026-02-28.
11. **007-FEATURE-mobile-responsiveness-pass** — Responsive breakpoints across 9 components. Completed 2026-02-28.
12. **006-FEATURE-match-registration-redesign** — Redesigned Bo3 match form. Completed 2026-02-28.
13. **005-BUG-registerform-wrong-function-name** — Renamed LoginForm to RegisterForm. Completed 2026-02-28.
14. **004-BUG-leaderboard-nan-no-matches** — Fixed NaN% win rate. Completed 2026-02-28.
15. **003-BUG-login-password-not-masked** — Added type="password". Completed 2026-02-28.
16. **002-BUG-userstats-character-guids** — Fixed character GUIDs. Completed 2026-02-28.
17. **001-FEATURE-playwright-e2e-testing** — Playwright E2E infrastructure. Completed 2026-02-27.

---

## Quick Reference

- **Backlog**: `task-board/backlog/` — queued tasks ready for implementation
- **In Progress**: `task-board/in-progress.md` — single active task slot
- **Review**: `task-board/review.md` — completed tasks awaiting verification
- **Done**: `task-board/done/` — completed and verified tasks (immutable history)

## Workflow

```
backlog/ → in-progress.md → review.md → done/
```

1. Pick top priority from backlog
2. Move to in-progress (only 1 task at a time)
3. Implement and verify
4. Move to review for verification
5. Move to done when verified
6. Update this file with new statistics
