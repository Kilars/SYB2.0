# 009-FEATURE-navigation-wayfinding

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: High
**Type**: FEATURE
**Estimated Effort**: Medium

---

## Context

SYB2.0 has 3-4 levels of route nesting (Home → League → Matches → Match Detail) but no breadcrumbs, no back buttons, and minimal navigation affordances. "Create League" is buried inside the hamburger menu. The NavBar only shows "Leagues" and the hamburger.

Users get lost navigating between match details and match lists, and there's no quick way to go back up the hierarchy without using the browser back button.

---

## Acceptance Criteria

- [x] **Breadcrumb trail** displayed below NavBar for nested routes:
  - League detail: `Leagues > League Name`
  - Match list: `Leagues > League Name > Matches`
  - Match detail: `Leagues > League Name > Match #N`
- [x] **"Create League" button** prominently visible on the LeagueList page (FAB or header button, not buried in hamburger)
- [x] **Back navigation** affordance on match detail pages (back arrow or link to match list)
- [x] Breadcrumbs are responsive — truncate long league names on mobile
- [x] Breadcrumbs use React Router links for navigation
- [x] `cd client && npm run build` passes
- [ ] Manual browser verification of navigation flow

---

## Implementation Steps

### Frontend
- [x] Create `client/src/app/shared/components/AppBreadcrumbs.tsx`:
  - Use MUI `<Breadcrumbs>` component
  - Accept breadcrumb items as props or derive from route params
  - Each item links to the appropriate route via React Router
  - Truncate long text on mobile with `<Typography noWrap>`
- [x] Add breadcrumbs **per-page** (Option B — each page passes its own breadcrumb config):
  - Option A (global) is impractical — a global component would need league name, requiring an API call on every route even those without `leagueId`
  - Option B is cleaner: each page already fetches its own data and can pass league name directly
- [x] Add "Create League" button to `client/src/features/leagues/LeagueList.tsx`:
  - Prominent button in the page header area (not FAB — consistent with existing patterns)
  - Links to the create league route
- [x] Add back navigation to `client/src/features/matches/MatchDetails.tsx`:
  - Back arrow icon + "Back to matches" link at top of page
  - Link target: `/leagues/${leagueId}/matches` (the matches tab of LeagueTabs)
  - **Note**: route param is named `match` (not `matchNumber`) — use `const { leagueId, split, match } = useParams()`
- [x] **League name for breadcrumbs on MatchDetails**: Add `useLeagues(leagueId)` call to get `league.title` — the data is typically already in React Query cache from prior navigation through LeagueTabs, so this will be a cache hit, not a real network request
- [x] **Breadcrumb "League Name" link target**: There is no `/leagues/:leagueId` route — the league detail is always a tab. Link the league breadcrumb to `/leagues/${leagueId}/leaderboard` (default tab)
- [x] Add "Create League" button to LeagueList — **conditional on `currentUser` being logged in** (consistent with NavBar.tsx:47 which guards on `currentUser`)
- [x] Review `client/src/app/layout/NavBar.tsx` — keep "Create League" in hamburger as secondary access point

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified — frontend navigation only
- [x] **Round-robin**: Match generation logic is not affected — no domain changes
- [x] **Statistics**: Points/flawless computation is not affected — no domain changes
- [x] **Guest identity**: UserId FK references are preserved — no domain changes
- [x] **Authorization**: Route params match handler expectations — no auth handler changes

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None

---

## Code References

```tsx
// MUI Breadcrumbs pattern:
import { Link as RouterLink } from "react-router";
import { Link, Breadcrumbs } from "@mui/material";

// On MatchDetails page (needs useLeagues(leagueId) for league.title):
const { leagueId, split, match } = useParams();
const { league } = useLeagues(leagueId); // typically a React Query cache hit

<Breadcrumbs aria-label="breadcrumb">
  <Link component={RouterLink} to="/leagues">Leagues</Link>
  <Link component={RouterLink} to={`/leagues/${leagueId}/leaderboard`}>{league?.title ?? '...'}</Link>
  <Typography color="text.primary">Match #{match}</Typography>
</Breadcrumbs>

// On LeagueTabs pages (league already fetched):
<Breadcrumbs aria-label="breadcrumb">
  <Link component={RouterLink} to="/leagues">Leagues</Link>
  <Typography color="text.primary">{league.title}</Typography>
</Breadcrumbs>
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — new Breadcrumbs component + modifications to page components
- **Risk**: Low — additive navigation features, no existing behavior changed

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

### Changes made

1. **Created** `client/src/app/shared/components/AppBreadcrumbs.tsx` — reusable MUI Breadcrumbs wrapper accepting `{ label, href? }[]` props. Items with `href` render as React Router `<Link>`, the last item renders as `<Typography color="text.primary">`. All items use `noWrap` with `maxWidth: { xs: 120, sm: 200 }` for mobile truncation.

2. **Modified** `client/src/features/leagues/LeagueTabs.tsx` — added `<AppBreadcrumbs items={[{ label: 'Leagues', href: '/leagues' }, { label: league.title }]} />` above the league title.

3. **Modified** `client/src/features/matches/MatchDetails.tsx` — added breadcrumbs `Leagues > League Name > Match #N` plus an `<IconButton>` + "Back to matches" text link pointing to `/leagues/${leagueId}/matches`. League name is fetched via `useLeagues(leagueId)` (React Query cache hit after normal navigation through LeagueTabs).

4. **Modified** `client/src/features/leagues/LeagueList.tsx` — added "Create League" button in the page header (next to the `<Typography variant='h2'>Leagues</Typography>` heading), guarded by `currentUser`, linking to `/createLeague`. The hamburger menu entry in NavBar is preserved as secondary access.

### Build result: PASS (`tsc -b && vite build` — no errors)
