# 040-FEATURE-userstats-player-name-title

**Status**: Backlog
**Created**: 2026-03-04
**Priority**: Medium
**Type**: FEATURE
**Estimated Effort**: Simple

---

## Context

The player statistics page (`/user/:userId`) has no heading identifying whose stats are being displayed. Each section has its own subtitle ("Top characters", "Character Usage", etc.) but there's no top-level page title with the player's name. When viewing another player's profile from the leaderboard, it's unclear whose stats you're looking at.

---

## Acceptance Criteria

- [x] Player's display name is shown as a page heading at the top of the stats page
- [x] Heading renders correctly for both regular users and guest players
- [x] Heading is visible before any section content (above "Top characters")
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend

**File**: `client/src/features/stats/UserStats.tsx`

#### Step 1: Derive player display name
- [x] After the empty state check (line 48), resolve the current player from match data:
  ```tsx
  const player = userMatches[0].playerOne?.userId === userId
    ? userMatches[0].playerOne
    : userMatches[0].playerTwo;
  const displayName = player?.displayName ?? "Player";
  ```

#### Step 2: Add page title heading
- [x] Add a `Typography` heading at the top of the return JSX (before "Top characters" section):
  ```tsx
  <Typography variant="h4" fontWeight="bold" mb={3}>
    {displayName}'s Stats
  </Typography>
  ```
- [x] Follows existing heading pattern (other sections use `variant="h4"` / `variant="h5"` with `fontWeight="bold"`)

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified
- [x] **Round-robin**: Match generation logic is not affected
- [x] **Statistics**: Points/flawless computation is not affected
- [x] **Guest identity**: UserId FK references are preserved
- [x] **Authorization**: Route params match handler expectations

**No domain risks** — read-only display of existing data.

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None

---

## Code References

Existing pattern for resolving current player from match data:
```tsx
// File: client/src/features/stats/UserStats.tsx (line 54-55)
match.playerOne?.userId === userId
  ? (round.playerOneCharacterId as string)
  : (round.playerTwoCharacterId as string);
```

Existing section heading pattern:
```tsx
// Same file — "Top characters" heading uses:
<Typography variant="h4" fontWeight="bold" mb={2}>
  Top characters
</Typography>
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — two additions to a single file (variable + JSX heading)
- **Risk**: Low — purely additive change

---

## Progress Log

[Updated during implementation]

---

## Resolution

[Filled when complete]
