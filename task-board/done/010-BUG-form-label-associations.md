# 010-BUG-form-label-associations

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: Medium
**Type**: BUG
**Estimated Effort**: Simple

---

## Context

Winner checkboxes in `MatchDetailsForm.tsx` have no proper label association. There are **two instances** — one per player column:
- **Player One**: lines 62-80 — `<Box>Winner: <Checkbox /></Box>`
- **Player Two**: lines 97-115 — `<Box>Winner: <Checkbox /></Box>`

The text "Winner" is just adjacent text, not programmatically linked to the checkbox control. Screen readers cannot associate the label with the checkbox, making the form inaccessible.

**Note**: If 006-FEATURE-match-registration-redesign is implemented first, this task becomes moot since the checkboxes will be replaced with toggle buttons. This task exists as a quick independent accessibility fix.

---

## Acceptance Criteria

- [x] Winner checkboxes use `<FormControlLabel label="Winner" control={<Checkbox />} />` instead of bare `<Box>` wrappers — **SUPERSEDED by 006**: checkboxes replaced with ToggleButtonGroup
- [x] Screen reader announces "Winner" when focusing the checkbox — **SUPERSEDED**: toggle buttons have text labels
- [x] Visual appearance is preserved or improved — **SUPERSEDED**
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [ ] In `client/src/features/matches/MatchDetailsForm.tsx`, replace **both** instances:
  - **Lines 62-80** (Player One column): replace `<Box>Winner: <Checkbox .../></Box>` with `<FormControlLabel label="Winner" control={<Checkbox .../>} />`
  - **Lines 97-115** (Player Two column): same replacement
- [ ] Import `FormControlLabel` from `@mui/material` (add to existing import on line 3)

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified — frontend accessibility fix
- [x] **Round-robin**: Match generation logic is not affected — no domain changes
- [x] **Statistics**: Points/flawless computation is not affected — no domain changes
- [x] **Guest identity**: UserId FK references are preserved — no domain changes
- [x] **Authorization**: Route params match handler expectations — no auth handler changes

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None
- **Note**: May be superseded by 006-FEATURE-match-registration-redesign which replaces checkboxes entirely

---

## Code References

```tsx
// Current — TWO instances in MatchDetailsForm.tsx:
// Player One (lines 62-80):
<Box>Winner: <Checkbox checked={round.winnerUserId === matchData.playerOne.userId} onChange={...} /></Box>
// Player Two (lines 97-115):
<Box>Winner: <Checkbox checked={round.winnerUserId === matchData.playerTwo.userId} onChange={...} /></Box>

// MUI accessible pattern (apply to BOTH):
<FormControlLabel label="Winner" control={<Checkbox checked={...} onChange={...} />} />
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — single component change
- **Risk**: Low — isolated accessibility improvement

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28
**Status**: SUPERSEDED by 006-FEATURE-match-registration-redesign

Task 006 replaced the winner checkboxes with `<ToggleButtonGroup>` containing `<ToggleButton>` elements with player names as text labels. This inherently fixes the accessibility issue since toggle buttons with text children are programmatically labeled. No additional changes needed.
