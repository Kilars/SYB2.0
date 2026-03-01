# 002-BUG-userstats-character-guids

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: High
**Type**: BUG
**Estimated Effort**: Simple

---

## Context

`UserStats.tsx` displays character GUIDs instead of character names in the "Top Characters" section. The `charStats` object uses `charId` (a GUID) as keys, and the component renders `entry[0]` directly — showing raw GUIDs like `3f2504e0-4f89-11d3-9a0c-0305e82c3301` instead of character names like "Mario".

The characters list is already available in the component (fetched via `useCharacters`). The fix is to resolve the GUID to a character name using a lookup.

---

## Acceptance Criteria

- [x] Character names display instead of GUIDs in the "Top Characters" section
- [x] Graceful fallback if a charId doesn't match any character (show "Unknown" instead of GUID)
- [x] Guard against `undefined` charId entries (rounds with no character selected produce `undefined` keys via `as string` cast)
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [ ] In `client/src/features/stats/UserStats.tsx:54`, replace `entry[0]` with a character name lookup
- [ ] Add lookup: `characters.find(c => c.id === entry[0])?.fullName ?? 'Unknown'`
- [ ] Guard against `undefined` charId: the accumulation loop (lines 27-41) uses `charId` which can be `undefined` via `as string` cast — add `if (!charId) continue` before accumulating
- [ ] Note: `key={entry[0]}` using the GUID as React key is correct and should remain as-is

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified — frontend-only display fix
- [x] **Round-robin**: Match generation logic is not affected — no domain changes
- [x] **Statistics**: Points/flawless computation is not affected — no domain changes
- [x] **Guest identity**: UserId FK references are preserved — no domain changes
- [x] **Authorization**: Route params match handler expectations — no auth handler changes

---

## Dependencies

- **Blocked by**: None
- **Blocks**: 019-FEATURE-userstats-top-characters (fix GUIDs before enhancing the section)

---

## Code References

```tsx
// Current broken code — UserStats.tsx:54
// entry[0] is a GUID string, entry[1] is { wins, total, wr }
<Typography fontWeight="bold" variant="h5">{entry[0]}</Typography>  // renders GUID

// Fix — replace entry[0] with character name:
const character = characters.find(c => c.id === entry[0]);
<Typography fontWeight="bold" variant="h5">{character?.fullName ?? 'Unknown'}</Typography>
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — single file change
- **Risk**: Low — isolated display fix

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

**Changes**:
- `client/src/features/stats/UserStats.tsx`: Added `if (!charId) continue` guard in accumulation loop to filter undefined character IDs. Replaced `entry[0]` (GUID) with `characters.find(c => c.id === entry[0])?.fullName ?? 'Unknown'` for character name display.

**Verification**: `npm run build` passes.
