# 016-FEATURE-match-details-view-improvements

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: Medium
**Type**: FEATURE
**Estimated Effort**: Medium

---

## Context

The completed match details view (`MatchDetailsView.tsx`) is sparse — it shows character names, 50x50 images, and checkmarks but lacks a clear match summary. The "Reopen match" button is a destructive action (it reopens a completed match for editing) but has no confirmation dialog, making accidental reopens likely.

**Note on view transition**: When a match is reopened, the parent `MatchDetails.tsx` automatically swaps from `MatchDetailsView` to `MatchDetailsForm` via conditional render (`if (matchData.completed)` at line 13-14). This happens automatically via React Query cache invalidation — no explicit navigation is needed.

---

## Acceptance Criteria

- [x] **Match score summary** displayed at top of the view (e.g., "Player1 2 — 1 Player2") with winner highlighted
- [x] **Character name labels** displayed below/beside images (images are already 50x50, no size change needed)
- [x] **Confirmation dialog** on "Reopen match" button:
  - Dialog title: "Reopen Match?"
  - Dialog message: "This will allow editing of match results. Are you sure?"
  - Confirm / Cancel buttons
- [x] Round layout is visually clear — each round as a distinct card/section
- [x] Winner of each round is clearly indicated (not just a checkmark)
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [ ] In `client/src/features/matches/MatchDetailsView.tsx`:
  - **Score summary**: Compute score from round winners, display as `<Typography variant="h5">` at top
  - **Character images**: Increase image size (from ~24px to ~48-64px), add character name label below
  - **Round cards**: Wrap each round in a `<Card>` or `<Paper>` for visual separation
  - **Winner indication**: Replace bare checkmarks with "Winner" badge or highlighted background
- [ ] **Reopen confirmation dialog**:
  - Add `<Dialog>` component for "Reopen match" confirmation
  - Gate the actual reopen API call behind dialog confirmation
  - Use MUI Dialog with `aria-labelledby` and `aria-describedby` for accessibility
  - Disable "Reopen" button in dialog while `reopenMatch.isPending` is true (prevent double-click)
  - Add error handling: `try/catch` around `mutateAsync()` or use mutation's `onError` for toast feedback
  - **Note**: After successful reopen, the parent `MatchDetails.tsx` automatically switches from `MatchDetailsView` to `MatchDetailsForm` via conditional render (`matchData.completed` check at line 13-14). No explicit navigation needed.

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
// Current reopen button — no confirmation
<Button onClick={handleReopen}>Reopen Match</Button>

// Proposed confirmation pattern:
const [confirmOpen, setConfirmOpen] = useState(false);

<Button onClick={() => setConfirmOpen(true)} color="warning">Reopen Match</Button>
<Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
  <DialogTitle>Reopen Match?</DialogTitle>
  <DialogContent>
    <DialogContentText>
      This will allow editing of match results. Are you sure?
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
    <Button onClick={handleReopen} color="warning">Reopen</Button>
  </DialogActions>
</Dialog>
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — single component change
- **Risk**: Low — visual improvements and confirmation dialog

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

**Changes**: MatchDetailsView.tsx — Added score summary with winner highlighting. Added character name labels. Wrapped rounds in Cards with headers. Enhanced winner indication with colored background + Chip. Added reopen confirmation dialog with accessibility attrs and pending-state guard.

**Verification**: `npm run build` passes.
