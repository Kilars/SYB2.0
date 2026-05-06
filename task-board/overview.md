# Task Board — SYB2.0

## Current Focus

UX & Accessibility audit — 22 tasks covering bugs, mobile responsiveness, interaction design, accessibility, and polish.

## Status

| Status | Count |
|--------|-------|
| Backlog | 0 |
| In Progress | 0 |
| Done | 42 |

## Top Priorities

_Backlog is empty — run `backlog-scan` or `feature-planning` to queue more work._

## Recently Completed

1. **042-FEATURE-character-select-top-picks** — Added top-5 most-used character picks to CharacterSelect dropdown with "Most likely picks" grouped header. New backend endpoint `GET /api/characters/user/{userId}/top`, new `useTopCharacters` hook, and MUI grouped Autocomplete. Completed 2026-05-06.
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
