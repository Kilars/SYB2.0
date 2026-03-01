# Task Board — SYB2.0

## Current Focus

UX & Accessibility audit — 22 tasks covering bugs, mobile responsiveness, interaction design, accessibility, and polish.

## Status

| Status | Count |
|--------|-------|
| Backlog | 0 |
| In Progress | 0 |
| Done | 23 |

## Top Priorities

### Bugs (Fix First)
1. **002-BUG-userstats-character-guids** — Character GUIDs shown instead of names
2. **003-BUG-login-password-not-masked** — Password field visible as plain text
3. **004-BUG-leaderboard-nan-no-matches** — NaN% win rate with zero matches
4. **005-BUG-registerform-wrong-function-name** — Component function named `LoginForm`

### High Impact
5. **006-FEATURE-match-registration-redesign** — Redesign Bo3 match flow (toggle winners, inline validation, mobile layout)
6. **007-FEATURE-mobile-responsiveness-pass** — Responsive breakpoints across all components
7. **008-FEATURE-loading-empty-state-system** — Skeleton loaders + contextual empty states
8. **009-FEATURE-navigation-wayfinding** — Breadcrumbs, back nav, prominent Create League

### Accessibility
9. **010-BUG-form-label-associations** — Winner checkboxes missing label associations
10. **011-BUG-missing-aria-labels** — NavBar, CharacterSelect, StatusButton ARIA labels
11. **012-BUG-missing-image-alt-text** — Character images missing alt text
12. **013-BUG-color-only-information** — Win/loss indicators rely on color alone

### Medium Impact
13. **014-FEATURE-leaderboard-mobile-card-view** — Card layout for leaderboard on mobile
14. **015-FEATURE-match-list-visual-polish** — Status indicators, image guards, click targets
15. **016-FEATURE-match-details-view-improvements** — Score summary, larger images, reopen confirmation
16. **017-FEATURE-status-button-ux** — Color/icon differentiation for status transitions
17. **018-FEATURE-form-submission-feedback** — Loading spinners on form submit buttons
18. **019-FEATURE-userstats-top-characters** — Character cards with images and stats

### Low / Polish
19. **020-REFACTOR-theme-configuration** — MUI ThemeProvider + design tokens
20. **021-FEATURE-homepage-polish** — Game-themed hero, tagline, prominent CTA
21. **022-REFACTOR-duplicate-league-statuses** — Extract shared constant
22. **023-REFACTOR-clean-up-unused-files** — Delete App.css and unused CreateLeague.tsx

## Key Dependencies

- **019** blocked by **002** (fix GUIDs before enhancing character section)
- **010** may be superseded by **006** (match redesign replaces checkboxes)
- **014** extends work started in **007** (mobile pass covers basic table fix, 014 adds card view)

## Recently Completed

1. **009-FEATURE-navigation-wayfinding** — Breadcrumbs, back navigation, prominent Create League button. Completed 2026-02-28.
2. **008-FEATURE-loading-empty-state-system** — LoadingSkeleton + EmptyState components, replaced 13 loading/13 empty states. Completed 2026-02-28.
2. **007-FEATURE-mobile-responsiveness-pass** — Responsive breakpoints across 9 components. Completed 2026-02-28.
2. **006-FEATURE-match-registration-redesign** — Redesigned Bo3 match form with toggle buttons, responsive layout, score indicator. Completed 2026-02-28.
2. **005-BUG-registerform-wrong-function-name** — Renamed LoginForm to RegisterForm. Completed 2026-02-28.
2. **004-BUG-leaderboard-nan-no-matches** — Fixed NaN% win rate with zero-division guard. Completed 2026-02-28.
2. **003-BUG-login-password-not-masked** — Added type="password" to login form. Completed 2026-02-28.
2. **002-BUG-userstats-character-guids** — Fixed character GUIDs showing instead of names in UserStats. Completed 2026-02-28.
2. **001-FEATURE-playwright-e2e-testing** — Playwright E2E testing infrastructure (34 tests, 4 spec files). Completed 2026-02-27.

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
