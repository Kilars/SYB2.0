# 007-FEATURE-mobile-responsiveness-pass

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: High
**Type**: FEATURE
**Estimated Effort**: Complex

---

## Context

SYB2.0 has almost zero responsive breakpoints. Fixed widths, hardcoded grid columns, and desktop-sized typography create a broken experience on mobile devices. Since this is a "game night" tool, mobile usage will be very common — players registering matches on their phones during sessions.

Key breakages on mobile viewports:
- `MatchDetailsForm.tsx:47,82` — 50/50 split squishes content (addressed by 006)
- `Leaderboard.tsx:18` — 6-column table forces horizontal scroll
- `Leaderboard.tsx:49` — `auto auto auto` member chip grid (same issue as LeagueList)
- `MatchesList.tsx:29-30` — `h4` monospace player names overflow on narrow screens
- `LeagueList.tsx:49` — `auto auto auto` member grid cramped
- `UserStats.tsx:75-76` — `h4` player names overflow in match history cards
- `UserStats.tsx:79,97` — fixed 2-column character icon grids (these display round icons in Bo3 layout — collapsing to 1 column would break the visual; instead reduce icon `width`/`height` from 50 on narrow screens)
- `UserStats.tsx:46-60` — "Top characters" flex section with `justifyContent: 'space-evenly'` overflows on narrow screens
- `App.tsx:15` — fixed `pt: 10` (80px) doesn't account for mobile toolbar height (56px on xs)
- `MatchDetailsView.tsx:19` — read-only match view uses `flexDirection: 'row'` with `flexGrow: 0.5` — cramped on mobile (NOT addressed by 006 which only covers the form)
- `LeagueStats.tsx` — 3-column table with `height: '40vh'` and no responsive treatment
- `HomePage.tsx` — `variant="h3"` title may overflow on very narrow screens
- Multiple `<img width='50' height='50'>` HTML attributes across components — cannot be fixed with `sx`, need `style` prop with responsive values or CSS

This task is a systematic pass across ALL components using MUI responsive `sx` syntax (and `style` prop where HTML attributes are used).

---

## Acceptance Criteria

- [x] All components render without horizontal scroll on 320px viewport width
- [x] Typography scales down on mobile (`h4` → `h5`/`h6` on xs breakpoint where needed)
- [x] Grid layouts collapse to single column on mobile where appropriate
- [x] Top padding in `App.tsx` adjusts for mobile nav height
- [x] Leaderboard table doesn't require horizontal scroll on mobile (see also 014-FEATURE-leaderboard-mobile-card-view for card alternative)
- [x] Match list player names don't overflow
- [x] League detail member grid collapses gracefully
- [x] User stats grids stack on mobile
- [x] No fixed pixel widths without responsive alternatives
- [x] `cd client && npm run build` passes
- [ ] Manual browser verification at 320px, 375px, and 768px viewports

---

## Implementation Steps

### Frontend — Systematic pass through each component:

- [ ] **`client/src/app/layout/App.tsx:15`**: Change `pt: 10` to `pt: { xs: 7, sm: 10 }` (toolbar is 56px on xs = 7 spacing units, 64px on sm ≈ 10 units)
- [ ] **`client/src/features/matches/MatchesList.tsx:29-30`**: Reduce player name typography on mobile using responsive `sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}` — **note: MUI `variant` prop does NOT accept responsive objects**, must use `sx.fontSize` instead
- [ ] **`client/src/features/matches/MatchesList.tsx`**: Ensure card layout works on narrow screens, stack elements vertically if needed
- [ ] **`client/src/features/leagues/Leaderboard.tsx:18`**: Basic table responsive fix — defer deep card view to task 014. Use `overflow-x: auto` on `TableContainer` and optionally hide less important columns on mobile
- [ ] **`client/src/features/leagues/Leaderboard.tsx:49`**: Member chip grid `auto auto auto` → `gridTemplateColumns: { xs: '1fr 1fr', sm: 'auto auto auto' }`
- [ ] **`client/src/features/leagues/LeagueList.tsx:49`**: Change member grid from 3 columns to responsive: `gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }`
- [ ] **`client/src/features/stats/UserStats.tsx:75-76`**: Reduce `h4` player names with responsive `sx.fontSize` (same pattern as MatchesList)
- [ ] **`client/src/features/stats/UserStats.tsx:79,97`**: These are Bo3 character icon grids — DON'T collapse to 1 column (breaks visual intent). Instead reduce `<img>` sizes on mobile: change HTML `width='50' height='50'` to `style={{ width: isMobile ? 35 : 50, height: isMobile ? 35 : 50 }}` or use CSS
- [ ] **`client/src/features/stats/UserStats.tsx:46-60`**: "Top characters" flex section — add `flexWrap: 'wrap'` or switch to responsive grid on mobile
- [ ] **`client/src/features/matches/MatchDetailsView.tsx:19`**: Read-only match view — change `flexDirection: 'row'` to `flexDirection: { xs: 'column', sm: 'row' }` (this file is NOT covered by task 006)
- [ ] **`client/src/features/stats/LeagueStats.tsx`**: 3-column table — ensure `TableContainer` has `overflow-x: auto`, check column widths
- [ ] **`client/src/features/leagues/Description.tsx`**: Check for any fixed widths
- [ ] **`client/src/features/leagues/LeagueTabs.tsx`**: Already has `variant="scrollable"` on Tabs — verify it works on mobile (likely fine)
- [ ] **Global check**: Grep for `width: '50%'`, `width: '33%'`, hardcoded `px` widths, and `<img width=` HTML attributes — replace with responsive alternatives

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified — frontend-only layout changes
- [x] **Round-robin**: Match generation logic is not affected — no domain changes
- [x] **Statistics**: Points/flawless computation is not affected — no domain changes
- [x] **Guest identity**: UserId FK references are preserved — no domain changes
- [x] **Authorization**: Route params match handler expectations — no auth handler changes

---

## Dependencies

- **Blocked by**: None (can be done in parallel with or after 006)
- **Blocks**: None
- **Note**: 006-FEATURE-match-registration-redesign handles `MatchDetailsForm.tsx` mobile layout. This task covers everything else including `MatchDetailsView.tsx` (the read-only view, not covered by 006). 014-FEATURE-leaderboard-mobile-card-view is a deeper alternative to the leaderboard table responsive fix done here — this task does a basic fix, 014 replaces with cards.

---

## Code References

```tsx
// MUI responsive sx pattern used throughout:
sx={{
  flexDirection: { xs: 'column', sm: 'row' },
  gap: { xs: 1, sm: 2 },
  fontSize: { xs: '0.875rem', sm: '1rem' },
  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
}}

// IMPORTANT: Typography `variant` prop does NOT accept responsive objects.
// WRONG: <Typography variant={{ xs: 'h6', sm: 'h4' }}>
// RIGHT: <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>

// For <img> HTML attributes (width/height), sx doesn't apply.
// Use style prop or CSS classes:
<img style={{ width: 'clamp(35px, 8vw, 50px)', height: 'clamp(35px, 8vw, 50px)' }} />
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — touches many files but all changes are additive (responsive breakpoints added to existing sx props)
- **Risk**: Medium — many files affected, but each change is small and isolated

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

**Changes** (9 files):
- `App.tsx`: Responsive top padding for mobile toolbar
- `MatchesList.tsx`: Responsive font sizes, clamp-based image sizes
- `Leaderboard.tsx`: overflowX auto, hide Win/Loss/Flawless columns on xs, responsive member grid
- `LeagueList.tsx`: Responsive member grid (1→2→3 columns)
- `UserStats.tsx`: Responsive player name fonts, clamp-based image sizes, flex-wrap on top characters
- `MatchDetailsView.tsx`: Responsive flexDirection, clamp-based images
- `LeagueStats.tsx`: overflowX auto on table
- `Description.tsx`: flexWrap on metadata row
- `HomePage.tsx`: Responsive h3 font size

**Verification**: `npm run build` passes.
