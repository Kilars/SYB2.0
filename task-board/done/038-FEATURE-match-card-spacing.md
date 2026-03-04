# 038-FEATURE-match-card-spacing

**Status**: Backlog
**Created**: 2026-03-04
**Priority**: Medium
**Type**: FEATURE
**Estimated Effort**: Simple

---

## Context

Match cards in the split match list (`MatchesList.tsx`) have insufficient internal height. The three content sections (player names, character icons, match info) are stacked with zero vertical gap inside each card, making the card content feel cramped and clipped. The space between cards is fine — the problem is within each card.

---

## Acceptance Criteria

- [x] Each card has more internal vertical space between its three sections (names, characters, match info)
- [x] Character icons have adequate breathing room within the card
- [x] Content is not clipped or overlapping on mobile (xs) breakpoint
- [x] No visual regressions on completed vs pending card styling
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend

**File**: `client/src/features/matches/MatchesList.tsx`

#### Step 1: Increase internal card padding
- [x] Increase card padding from `p: { xs: 2, sm: 3 }` (line 70) to `p: { xs: 2.5, sm: 3.5 }` or similar

#### Step 2: Add vertical gaps between inner card sections
- [x] The outer content Box (line 103) wraps names row + character icons. Add `display: "flex", flexDirection: "column", gap: { xs: 1.5, sm: 2 }` to space out names and character icons
- [x] Add `mt: { xs: 1.5, sm: 2 }` to the match info row (line 285) to separate it from the character icons above

#### Step 3: Increase character icon internal spacing
- [x] Increase character icon box margin from `m: 0.5` to `m: { xs: 0.75, sm: 1 }` (lines 211, 256 — both P1 and P2 icon boxes)

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified
- [x] **Round-robin**: Match generation logic is not affected
- [x] **Statistics**: Points/flawless computation is not affected
- [x] **Guest identity**: UserId FK references are preserved
- [x] **Authorization**: Route params match handler expectations

**No domain risks** — pure frontend spacing change within a single component.

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None

---

## Code References

Current card internal layout with no vertical gaps:
```tsx
// File: client/src/features/matches/MatchesList.tsx

// Card padding (line 70):
p={{ xs: 2, sm: 3 }}  // Needs increase

// Inner content (lines 103-284) — NO gap between sections:
<Box>                              {/* Line 103: wraps names + characters — no flexDirection, no gap */}
  <Box display="flex" ...>         {/* Lines 104-191: Names + score badge */}
  <Box display="flex" ...>         {/* Lines 192-283: Character icons */}
</Box>

// Match info (lines 285-317) — directly after, no margin:
<Box display="flex" ...>           {/* Match # + status */}

// Character icon margin (lines 211, 256):
m: 0.5  // 4px — too tight
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — single file padding/margin changes
- **Risk**: Low — isolated CSS change in one component

---

## Progress Log

[Updated during implementation]

---

## Resolution

[Filled when complete]
