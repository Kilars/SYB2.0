# 030-FEATURE-match-history-card-sizing

**Status**: Done
**Created**: 2026-03-02
**Priority**: Medium
**Type**: FEATURE
**Estimated Effort**: Simple

---

## Context

Match history cards in MatchesList.tsx feel too compact. Player names get truncated due to `noWrap`, character images are small, and the scroll container's `maxHeight: "60vh"` limits visibility. The cards need more breathing room to display names fully and make rounds section more prominent.

---

## Acceptance Criteria

- [x] Card padding increases on larger screens
- [x] Player names are more readable (larger font, less aggressive truncation)
- [x] Character images are slightly larger
- [x] Scroll container allows more matches to be visible
- [x] Cards remain responsive and usable on mobile
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [x] **`client/src/features/matches/MatchesList.tsx` line 70** — Increase card padding: `p={2}` → `p={{ xs: 2, sm: 3 }}`
- [x] **`client/src/features/matches/MatchesList.tsx` lines 117, 171** — Increase name font sizes: `xs: "0.9rem"` → `xs: "1rem"`, `sm: "1.5rem"` → `sm: "1.75rem"`
- [x] **`client/src/features/matches/MatchesList.tsx` lines 216, 261** — Increase character image sizes: `clamp(40px, 10vw, 56px)` → `clamp(48px, 12vw, 64px)` (both playerOne and playerTwo round images)
- [x] **`client/src/features/matches/MatchesList.tsx` line 39** — Increase or remove scroll container max height: `maxHeight: "60vh"` → `maxHeight: "75vh"`
- [x] **`client/src/features/matches/MatchesList.tsx` lines 115, 169** — Consider removing `noWrap` or switching to 2-line truncation using `-webkit-line-clamp: 2` with `overflow: hidden`

---

## Domain Risk Checklist

**Every task MUST complete this checklist before implementation:**

- [x] **Composite keys**: No composite key columns are being modified
- [x] **Round-robin**: Match generation logic is not affected
- [x] **Statistics**: Points/flawless computation is not affected
- [x] **Guest identity**: UserId FK references are preserved
- [x] **Authorization**: Route params match handler expectations

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None

---

## Code References

Current card padding (line 70):
```tsx
p={2}
```

Current name font sizes (line 117):
```tsx
fontSize: { xs: "0.9rem", sm: "1.5rem", md: "2.125rem" },
```

Current character image sizes (line 216):
```tsx
style={{
  width: "clamp(40px, 10vw, 56px)",
  height: "clamp(40px, 10vw, 56px)",
}}
```

Current scroll container (line 39):
```tsx
maxHeight: "60vh",
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — single file change
- **Risk**: Low — isolated CSS/layout change

---

## Progress Log

[Updated during implementation]

---

## Resolution

All sizing improvements applied to `MatchesList.tsx`:
- Card padding now responsive: `p={{ xs: 2, sm: 3 }}` (was `p={2}`)
- Player name font sizes increased: xs `0.9rem` -> `1rem`, sm `1.5rem` -> `1.75rem`
- Replaced `noWrap` with 2-line `-webkit-line-clamp` truncation on both player name Typography elements
- Character images enlarged: `clamp(48px, 12vw, 64px)` (was `clamp(40px, 10vw, 56px)`) for both player round sections
- Scroll container expanded: `maxHeight: "75vh"` (was `"60vh"`)
- Mobile responsiveness preserved via responsive padding breakpoints, `clamp()` on images, and `xs` font size breakpoints
- `cd client && npm run build` passes with 0 errors
