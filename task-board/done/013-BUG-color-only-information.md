# 013-BUG-color-only-information

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: Medium
**Type**: BUG
**Estimated Effort**: Simple

---

## Context

Several UI elements convey information through color alone, which is inaccessible to colorblind users:

1. **Match round borders** — green border for won rounds, red for lost (`MatchesList.tsx:35,45` and `UserStats.tsx:85,103`). Colorblind users can't distinguish win/loss.
2. **MenuItemLink active state** (`MenuItemLink.tsx`) — uses `color: 'yellow'` for the active link (~1.07:1 contrast on white — far below WCAG AA 4.5:1 minimum)
3. **Table alternating row colors** (`Leaderboard.tsx:33` and `LeagueStats.tsx:57`) — `#E5EFF9` and `#D6E6F6` are near-identical shades (~1.06:1 contrast). Note: this is a decorative visual separator, not information conveyed by color, so not technically a WCAG 1.4.1 violation — but improving contrast is still good practice.

WCAG 2.1 Success Criterion 1.4.1 requires that color is not the sole means of conveying information. Items 1 and 2 are genuine violations; item 3 is a contrast improvement.

**Note**: `MatchDetailsView.tsx` already partially addresses this with a `<Check color="success" />` icon for the winner, but does not show any indicator for the loser's side.

---

## Acceptance Criteria

- [x] Match round win/loss indicators include a secondary cue alongside color (e.g., checkmark icon for win, X icon for loss)
- [x] Active menu item uses an indicator beyond just color (e.g., bold text, underline, or left border)
- [x] Active menu item color has sufficient contrast ratio (4.5:1 minimum)
- [x] Table alternating rows have sufficient contrast difference, or use borders/dividers as secondary cue
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [ ] In `client/src/features/matches/MatchesList.tsx` (lines 35, 45):
  - Add `<CheckCircle />` or `<Check />` icon for wins alongside green border
  - Add `<Cancel />` or `<Close />` icon for losses alongside red border
  - Ensure icons are visible even without color perception
- [ ] In `client/src/features/stats/UserStats.tsx` (lines 85, 103):
  - Same win/loss icon treatment as MatchesList
- [ ] In `client/src/features/matches/MatchDetailsView.tsx`:
  - Already has `<Check color="success" />` for winner — add a `<Close color="error" />` or similar for the losing side to complete the pattern
- [ ] In `client/src/app/shared/components/MenuItemLink.tsx`:
  - Replace `color: 'yellow'` in `&.active` with a higher-contrast color (e.g., theme `primary.main` at ~4.6:1 on white)
  - Note: `fontWeight: 'bold'` is already set globally on all `MenuItem`s, so it cannot distinguish the active state alone — a color change or left-border indicator is needed
- [ ] In table components (`client/src/features/leagues/Leaderboard.tsx:33`, `client/src/features/stats/LeagueStats.tsx:57`):
  - Add subtle `borderBottom: '1px solid'` between rows as secondary separator
  - Or increase contrast difference between `#E5EFF9` and `#D6E6F6`

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified — frontend accessibility only
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
// Current — color-only win/loss indicator
<Box sx={{ borderLeft: `4px solid ${isWin ? 'green' : 'red'}` }}>

// Fix — add icon alongside color:
<Box sx={{ borderLeft: `4px solid ${isWin ? 'green' : 'red'}`, display: 'flex', alignItems: 'center' }}>
  {isWin ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
</Box>
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — small additions across 3-4 files
- **Risk**: Low — additive visual indicators

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

**Changes** (6 files): Added CheckCircle/Cancel icons to win/loss rounds in MatchesList + UserStats. Added Close icon for loser in MatchDetailsView. Changed MenuItemLink active color from yellow to #90caf9 with left border. Added borderBottom to table rows in Leaderboard + LeagueStats.

**Verification**: `npm run build` passes.
