# 006-FEATURE-match-registration-redesign

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: High
**Type**: FEATURE
**Estimated Effort**: Complex

---

## Context

The match registration flow is the most-used interaction in SYB2.0 and the user's primary pain point. Registering a Bo3 match currently requires 6+ interactions: for each of 3 rounds, select 2 characters and check a winner checkbox. The UI has several issues:

1. **Winner selection uses ambiguous checkboxes** — two independent checkboxes per round (one per player column at lines 62-80 and 97-115), with no mutual exclusion at the UI level — checking both is possible, last one checked wins silently
2. **Fixed 50/50 width split breaks on mobile** — `MatchDetailsForm.tsx:47,82` use `width: '50%'` with no responsive breakpoints
3. **No inline validation** — errors only appear as toasts on submit, requiring users to scroll back and guess what's wrong
4. **No match progress indicator** — no visual feedback about which rounds are complete or what the current score is
5. **Round 3 shows even when match is decided** — 2-0 victory still shows round 3 form fields with no indication they're optional

The schema already supports 2-0 submissions (round 3 can be empty). This task is about interaction quality.

---

## Acceptance Criteria

- [x] Winner selection uses **toggle buttons with player names** instead of checkboxes (tap player name to select winner)
- [x] Players stack **vertically on mobile** (`flexDirection: { xs: 'column', sm: 'row' }`)
- [x] **Inline validation per round**: green check when round is complete (both characters + winner), warning icon when partially filled
- [x] **Match score indicator** at top shows running score (e.g., "Player1 1 — 0 Player2") that updates as winners are selected
- [x] **Round 3 visual state**: when match is decided 2-0, round 3 is greyed out with "Match already decided" label (still expandable if user wants to change previous rounds)
- [x] Character select and winner toggle remain usable on screens as narrow as 320px
- [x] Existing match completion logic unchanged — same data is sent to the API
- [x] `cd client && npm run build` passes
- [ ] Manual browser verification on mobile viewport

---

## Implementation Steps

### Frontend
- [ ] **Winner toggle buttons** in `client/src/features/matches/MatchDetailsForm.tsx`:
  - Replace both `<Checkbox>` winner selections (lines 62-80 and 97-115) with a single `<ToggleButtonGroup exclusive>` per round containing two `<ToggleButton>` elements labeled with player names
  - Handle `null` deselection: `ToggleButtonGroup onChange` fires with `newValue = null` when the user clicks the already-selected button — use `winnerUserId: newValue ?? undefined`
  - Remove `Checkbox` import (becomes unused), add `ToggleButtonGroup, ToggleButton` imports
  - Toggle buttons with text children are inherently accessible (subsumes A1 fix)
- [ ] **Responsive layout** in `client/src/features/matches/MatchDetailsForm.tsx`:
  - Replace `width: '50%'` with `flexDirection: { xs: 'column', sm: 'row' }` for player columns
  - Ensure character selects take full width on mobile
- [ ] **Match score indicator**:
  - Add score computation from currently selected round winners
  - Display at top of form: `<Typography variant="h5">Player1 {score1} — {score2} Player2</Typography>`
- [ ] **Inline round validation**:
  - Add visual indicator per round header (green checkmark icon when complete, orange warning when partial)
  - A round is "complete" when both characters are selected and a winner is chosen
- [ ] **Round 3 conditional state**:
  - When score is 2-0, apply reduced opacity to round 3 and show "Match already decided" label
  - Round 3 fields remain interactive (not disabled) so users can adjust earlier rounds
- [ ] **CharacterSelect responsive**: `CharacterSelect.tsx` already has `fullWidth` on the Autocomplete (line 65) — the mobile issue is the parent `<Box sx={{ width: '50%' }}>` constraint, which is fixed by the responsive layout step above. No changes needed in CharacterSelect itself.

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified — frontend-only UI changes
- [x] **Round-robin**: Match generation logic is not affected — no domain changes
- [x] **Statistics**: Points/flawless computation is not affected — same data submitted to API
- [x] **Guest identity**: UserId FK references are preserved — no domain changes
- [x] **Authorization**: Route params match handler expectations — no auth handler changes

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None
- **Note**: This task subsumes 010-BUG-form-label-associations (A1) since the checkbox removal eliminates the accessibility issue. If A1 is done first as a quick fix, that's fine — H1 will replace the implementation anyway.

---

## Code References

```tsx
// Current winner selection — TWO independent checkboxes per round:
// Player One column (lines 62-80):
<Box>Winner: <Checkbox checked={round.winnerUserId === matchData.playerOne.userId} onChange={...} /></Box>
// Player Two column (lines 97-115):
<Box>Winner: <Checkbox checked={round.winnerUserId === matchData.playerTwo.userId} onChange={...} /></Box>

// Proposed — single ToggleButtonGroup per round replacing BOTH checkboxes:
<ToggleButtonGroup
  exclusive
  value={round.winnerUserId ?? null}
  onChange={(_, newValue) => {
    setRounds(prev => prev?.map((r, idx) =>
      idx === i ? { ...r, winnerUserId: newValue ?? undefined } : r
    ))
  }}
>
  <ToggleButton value={matchData.playerOne.userId}>{matchData.playerOne.displayName}</ToggleButton>
  <ToggleButton value={matchData.playerTwo.userId}>{matchData.playerTwo.displayName}</ToggleButton>
</ToggleButtonGroup>
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — affects MatchDetailsForm.tsx and CharacterSelect.tsx
- **Risk**: Medium — significant UI change to most-used interaction, thorough manual testing required

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

**Changes**:
- `client/src/features/matches/MatchDetailsForm.tsx`: Replaced checkboxes with ToggleButtonGroup for winner selection, added responsive flexDirection layout, added match score indicator, added inline round validation icons, added Round 3 "Match already decided" conditional state.

**Verification**: `npm run build` passes. Manual mobile viewport verification pending.
