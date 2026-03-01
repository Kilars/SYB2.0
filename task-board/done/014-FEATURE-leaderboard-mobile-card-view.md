# 014-FEATURE-leaderboard-mobile-card-view

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: Medium
**Type**: FEATURE
**Estimated Effort**: Medium

---

## Context

The leaderboard renders as a 6-column table (Player, Points, WR, Wins, Losses, Flawless) that is cramped on mobile. There is no "Rank" column — rank is implied by sort order. MUI's `TableContainer` adds `overflow-x: auto` by default, so horizontal scroll is technically possible, but the UX is poor.

Rather than just hiding columns on mobile (lossy), this task proposes rendering the leaderboard as stacked cards on small screens while keeping the table on desktop.

---

## Acceptance Criteria

- [x] On `xs`/`sm` breakpoints, leaderboard renders as stacked cards instead of a table
- [x] Each card shows: rank badge, player name (prominent), points (large), and a compact stats row (W/L/Flawless/WR%)
- [x] On `md`+ breakpoints, existing table layout is preserved
- [x] Cards maintain the same sort order as the table (by points descending)
- [x] Visual hierarchy: rank and points are the most prominent, W/L stats are secondary
- [x] No horizontal scrolling on any viewport
- [x] `cd client && npm run build` passes
- [ ] Manual verification at 375px and 768px viewports

---

## Implementation Steps

### Frontend
- [ ] In `client/src/features/leagues/Leaderboard.tsx`:
  - Add responsive rendering. **No custom ThemeProvider exists**, so use one of:
    - `const theme = useTheme(); const isMobile = useMediaQuery(theme.breakpoints.down('md'));` (MUI's `useTheme()` returns the default theme even without a custom ThemeProvider)
    - `const isMobile = useMediaQuery('(max-width:899px)');` (plain CSS media query string, no theme needed)
  - Create `LeaderboardCard` sub-component for mobile:
    - Rank badge (circular with rank number)
    - Player name as card title
    - Points displayed prominently
    - Compact stats row: `W: {wins} | L: {losses} | F: {flawless} | {winRate}%`
  - Wrap in conditional: render cards on mobile, table on desktop
  - Apply same leaderboard data to both views
- [ ] Style cards to match app's visual language (use existing color scheme for table headers/rows)

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified — frontend display only
- [x] **Round-robin**: Match generation logic is not affected — no domain changes
- [x] **Statistics**: Points/flawless computation is not affected — display-only change
- [x] **Guest identity**: UserId FK references are preserved — no domain changes
- [x] **Authorization**: Route params match handler expectations — no auth handler changes

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None
- **Note**: 007-FEATURE-mobile-responsiveness-pass may include a basic table fix for the leaderboard. This task goes further with a dedicated card view alternative.

---

## Code References

```tsx
// Responsive rendering pattern:
import { useTheme, useMediaQuery } from '@mui/material';

const theme = useTheme(); // returns default MUI theme even without custom ThemeProvider
const isMobile = useMediaQuery(theme.breakpoints.down('md'));

return isMobile ? (
  <Stack spacing={1}>
    {leaderboard.map((entry, index) => (
      // Note: LeaderboardUser has no `userId` field — use `displayName` as key
      // (same as existing table which uses key={leaderboardUser.displayName})
      <LeaderboardCard key={entry.displayName} rank={index + 1} entry={entry} />
    ))}
  </Stack>
) : (
  <Table>...</Table>  // existing table
);

// IMPORTANT: Guard win rate division by zero (pre-existing bug, also in task 004):
// (entry.wins + entry.losses) === 0 ? 0 : Math.round((entry.wins * 100) / (entry.wins + entry.losses))
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — changes to Leaderboard.tsx only
- **Risk**: Low — additive rendering path, existing table preserved

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

**Changes**: Added LeaderboardCard sub-component and responsive conditional rendering to Leaderboard.tsx. Cards show rank badge, player name, points, and compact stats row. Desktop table preserved at md+. Removed now-unnecessary column-hiding from task 007.

**Verification**: `npm run build` passes.
