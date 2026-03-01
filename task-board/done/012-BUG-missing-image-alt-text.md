# 012-BUG-missing-image-alt-text

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: Medium
**Type**: BUG
**Estimated Effort**: Simple

---

## Context

Character images throughout the app lack `alt` attributes. This affects:

1. `MatchDetailsView.tsx:28,47` — character images in completed match view
2. `MatchesList.tsx:36,48` — character images in match list cards
3. `UserStats.tsx:90,108` — character images in stats section

Without `alt` text, screen readers announce these as unlabeled images, and the images provide no information if they fail to load.

---

## Acceptance Criteria

- [x] All character `<img>` tags have `alt={character.fullName}` or equivalent descriptive text
- [x] Images that fail to load show the character name as alt text
- [x] No `<img>` elements without `alt` attributes remain in the codebase
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [ ] In `client/src/features/matches/MatchDetailsView.tsx:28,47`, add `alt` attribute to character images:
  - Use the character name from the round data
- [ ] In `client/src/features/matches/MatchesList.tsx:36,48`, add `alt` attribute to character images:
  - Use the character name from the match/round data
- [ ] In `client/src/features/stats/UserStats.tsx:90,108`, add `alt` attribute to character images
- [ ] Run a grep across `client/src/` for `<img` without `alt` to catch any other instances

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
// Current — missing alt text
<img src={character.imageUrl} style={{...}} />

// Fix:
<img src={character.imageUrl} alt={character.fullName} style={{...}} />
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — small prop additions
- **Risk**: Low — purely additive accessibility attributes

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

**Changes**: Added alt attributes to 6 `<img>` tags across MatchDetailsView.tsx, MatchesList.tsx, UserStats.tsx. All use character fullName with 'Character' fallback.

**Verification**: `npm run build` passes. Grep confirms no `<img>` without `alt` remaining.
