# 015-FEATURE-match-list-visual-polish

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: Medium
**Type**: FEATURE
**Estimated Effort**: Medium

---

## Context

The match list has several visual issues:

1. **No visual distinction between completed and incomplete matches** — all match cards look identical regardless of status
2. **Broken images when no character selected** — rounds without character selections produce `<img>` tags with `undefined` src, causing broken image icons
3. **Dual click targets** — the entire card is clickable AND there's a button inside the card, creating confusing interaction

---

## Acceptance Criteria

- [x] **Completed matches** have a visual indicator distinguishing them from incomplete ones (e.g., subtle green left border, checkmark badge, or reduced opacity with "Completed" label)
- [x] **Incomplete matches** are visually prominent (primary visual weight, encouraging action)
- [x] **No broken images**: character images are conditionally rendered — only show `<img>` when a character has been selected and `imageUrl` is defined
- [x] **Single click target**: either the card is clickable (remove internal button) or the button is the only CTA (remove card click handler). Pick one interaction model.
- [x] Match cards show the match result for completed matches (e.g., "Player1 2 — 1 Player2")
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [ ] In `client/src/features/matches/MatchesList.tsx`:
  - **Status indicator**: Add conditional styling based on match completion status:
    - Completed: subtle left border or badge, winner name shown
    - Incomplete: standard card appearance with "Register result" CTA
  - **Image guard**: Wrap character image rendering in conditional. **Note**: `Round` type has `playerOneCharacterId?: string` and `playerTwoCharacterId?: string` — there is no `characterImageUrl` or `characterName` field on Round. Images are resolved via `characters.find()`:
    ```tsx
    {round.playerOneCharacterId && (
      <img
        src={characters.find(c => c.id === round.playerOneCharacterId)?.imageUrl}
        alt={characters.find(c => c.id === round.playerOneCharacterId)?.fullName ?? ''}
        width='50' height='50'
      />
    )}
    ```
    Also handle round 3 of 2-0 matches: `CompleteMatch.cs` sets `playerOneCharacterId = null` and `playerTwoCharacterId = null` for unused rounds, producing empty bordered boxes after the image guard. Decide: hide the empty round box entirely, or show a placeholder.
  - **Click target cleanup**: Choose one interaction model:
    - Option A (recommended): Card is clickable via `onClick` → remove internal `<Button>` (currently has no `onClick` of its own — it only navigates because it's inside the card's `onClick`)
    - Option B: Button is the CTA → remove card `onClick` and `cursor: pointer` → **must add `onClick` to the Button** (it currently has no handler)
  - **Match result display**: For completed matches, show score derived from round winners: `rounds.filter(r => r.winnerUserId === match.playerOne.userId).length` vs player two

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified — frontend display only
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
// Current card — MatchesList.tsx:25
// Card has onClick (line 25), Button (line 61) has NO onClick — it navigates via card
<Box onClick={() => navigate(...)} sx={{ cursor: 'pointer' }}>
  ...
  <Button variant="contained">{match.completed ? 'Change' : 'Register'}</Button>
</Box>

// Image guard pattern — use playerOneCharacterId, NOT round.characterImageUrl:
{round.playerOneCharacterId ? (
  <img
    src={characters.find(c => c.id === round.playerOneCharacterId)?.imageUrl}
    alt={characters.find(c => c.id === round.playerOneCharacterId)?.fullName ?? ''}
    width='50' height='50'
  />
) : null}
// Or show a placeholder: <Box sx={{ width: 50, height: 50, bgcolor: 'grey.200', borderRadius: 1 }} />
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — single file change
- **Risk**: Low — visual polish only

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

**Changes**: MatchesList.tsx — Added green left border + reduced opacity for completed matches. Added score display (2—1). Removed internal Button (single click target). Added image guards for missing character IDs. Added "Winner: name" for completed, "Register result" CTA for incomplete.

**Verification**: `npm run build` passes.
