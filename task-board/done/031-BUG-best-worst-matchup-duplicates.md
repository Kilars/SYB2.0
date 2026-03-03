# 031-BUG-best-worst-matchup-duplicates

**Status**: Done
**Created**: 2026-03-02
**Priority**: High
**Type**: BUG
**Estimated Effort**: Simple

---

## Context

In UserStats.tsx, the "Best Against" and "Worst Against" character matchup sections can show the same characters in both lists. This happens when a player has few qualifying matchups (characters with ≥3 rounds). For example, if only 3 characters qualify, all 3 appear in "best" AND all 3 appear in "worst".

**Root cause** (lines 314-315): `best` and `worst` are computed independently from the same `matchups` array with no exclusion logic:
```tsx
const best = [...matchups].sort((a, b) => b.wr - a.wr || b.total - a.total).slice(0, 3);
const worst = [...matchups].sort((a, b) => a.wr - b.wr || b.total - a.total).slice(0, 3);
```

---

## Acceptance Criteria

- [x] Characters appearing in "Best Against" do NOT appear in "Worst Against"
- [x] If fewer than 4 qualifying matchups exist, the "Character Matchups" section is hidden entirely (not enough data for meaningful best/worst split)
- [x] When exactly 4-5 matchups qualify, best gets top entries and worst gets remaining bottom entries (no overlap)
- [x] Section still renders correctly with 6+ qualifying matchups
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [x] **`client/src/features/stats/UserStats.tsx` line 317** — Change minimum matchup guard: `if (matchups.length === 0)` → `if (matchups.length < 4)` to require at least 4 distinct character matchups before showing the section
- [x] **`client/src/features/stats/UserStats.tsx` lines 314-315** — Filter best entries out before computing worst:
  ```tsx
  const best = [...matchups].sort((a, b) => b.wr - a.wr || b.total - a.total).slice(0, 3);
  const worst = [...matchups]
    .filter(m => !best.includes(m))
    .sort((a, b) => a.wr - b.wr || b.total - a.total)
    .slice(0, 3);
  ```

---

## Domain Risk Checklist

**Every task MUST complete this checklist before implementation:**

- [x] **Composite keys**: No composite key columns are being modified
- [x] **Round-robin**: Match generation logic is not affected
- [x] **Statistics**: Points/flawless computation is not affected — this is frontend display only, no backend stat changes
- [x] **Guest identity**: UserId FK references are preserved
- [x] **Authorization**: Route params match handler expectations

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None

---

## Code References

Current bug location (lines 314-317):
```tsx
const best = [...matchups].sort((a, b) => b.wr - a.wr || b.total - a.total).slice(0, 3);
const worst = [...matchups].sort((a, b) => a.wr - b.wr || b.total - a.total).slice(0, 3);

if (matchups.length === 0) return null;
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — single file change
- **Risk**: Low — isolated frontend display logic fix

---

## Progress Log

- Moved the guard `if (matchups.length < 4) return null;` before best/worst computation (was previously `=== 0` and placed after)
- Added `.filter((m) => !best.includes(m))` to worst computation to exclude entries already in best
- Build passes with zero errors

---

## Resolution

Fixed by two changes in `client/src/features/stats/UserStats.tsx`:
1. Changed the minimum matchup guard from `matchups.length === 0` to `matchups.length < 4` and moved it before the best/worst computation so the section is hidden when there aren't enough matchups for a meaningful split.
2. Added a filter on the worst computation to exclude entries already present in best, preventing duplicate characters from appearing in both lists.
