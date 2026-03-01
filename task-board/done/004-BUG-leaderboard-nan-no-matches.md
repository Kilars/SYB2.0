# 004-BUG-leaderboard-nan-no-matches

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: High
**Type**: BUG
**Estimated Effort**: Simple

---

## Context

The leaderboard displays "NaN%" for win rate when a player has no completed matches. At `Leaderboard.tsx:36`, the calculation `Math.round((wins * 100) / (wins + losses))` divides by zero when both `wins` and `losses` are 0, producing `NaN`.

This affects any newly created league or any player who hasn't completed matches yet.

---

## Acceptance Criteria

- [x] Win rate shows "0%" (or "—") when a player has 0 wins and 0 losses
- [x] Win rate calculates correctly when player has matches (existing behavior preserved)
- [x] No "NaN" appears anywhere in the leaderboard
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [ ] In `client/src/features/leagues/Leaderboard.tsx:36`, add zero-division guard:
  - `(wins + losses) === 0 ? 0 : Math.round((wins * 100) / (wins + losses))`

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified — frontend-only display fix
- [x] **Round-robin**: Match generation logic is not affected — no domain changes
- [x] **Statistics**: Points/flawless computation is not affected — frontend display guard only
- [x] **Guest identity**: UserId FK references are preserved — no domain changes
- [x] **Authorization**: Route params match handler expectations — no auth handler changes

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None

---

## Code References

```tsx
// Leaderboard.tsx:36 — current broken calculation
Math.round((wins * 100) / (wins + losses))

// Fix:
(wins + losses) === 0 ? 0 : Math.round((wins * 100) / (wins + losses))
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — single expression change
- **Risk**: Low — isolated calculation guard

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

**Changes**:
- `client/src/features/leagues/Leaderboard.tsx`: Added zero-division guard — ternary returns 0 when wins + losses === 0.

**Verification**: `npm run build` passes.
