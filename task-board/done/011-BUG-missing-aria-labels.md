# 011-BUG-missing-aria-labels

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: Medium
**Type**: BUG
**Estimated Effort**: Simple

---

## Context

Several interactive elements lack ARIA labels, making them inaccessible to screen reader users:

1. **NavBar hamburger button** (`NavBar.tsx:31`) — icon-only `<Button>` (not IconButton) wrapping `<MenuIcon />` with no `aria-label`
2. **CharacterSelect autocomplete** (`CharacterSelect.tsx`) — no `aria-label` on the autocomplete input
3. **StatusButton dialog** (`StatusButton.tsx`) — Dialog lacks `aria-labelledby`/`aria-describedby`; uses raw `<Typography>` instead of `<DialogTitle>`/`<DialogContentText>`; missing `onClose` handler (Escape doesn't dismiss)
4. **DeleteButton** (`app/shared/components/DeleteButton.tsx`) — icon-only `<Button>` with `<DeleteOutline />`/`<Delete />` icons, no `aria-label`
5. **StarButton** (`app/shared/components/StarButton.tsx`) — icon-only `<Button>` with `<StarBorder />`/`<Star />` icons, no `aria-label` and no `aria-pressed` for toggle state

These are straightforward accessibility fixes that don't change any visual behavior.

---

## Acceptance Criteria

- [x] NavBar hamburger `<Button>` has `aria-label="Open navigation menu"`
- [x] CharacterSelect autocomplete has `aria-label="Select character"` (via `renderInput` TextField props)
- [x] StatusButton Dialog has `aria-labelledby` and `aria-describedby` pointing to title/content ids
- [x] StatusButton Dialog has `onClose` handler so Escape key dismisses it
- [x] DeleteButton has `aria-label="Delete"` (or contextual label like "Remove member")
- [x] StarButton has `aria-label="Toggle admin"` and `aria-pressed={selected}` for toggle state
- [x] All icon-only buttons across the app have descriptive `aria-label` props
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [ ] In `client/src/app/layout/NavBar.tsx:31`, add `aria-label="Open navigation menu"` to the `<Button>` wrapping `<MenuIcon />`
- [ ] In `client/src/features/matches/CharacterSelect.tsx`, add `aria-label` to the Autocomplete via `renderInput` TextField `inputProps`
- [ ] In `client/src/features/leagues/StatusButton.tsx`:
  - Add `id` attributes to the title and description `<Typography>` elements (or refactor to use `<DialogTitle>`/`<DialogContentText>`)
  - Add `aria-labelledby` and `aria-describedby` to the `<Dialog>` pointing to those ids
  - Add `onClose={() => setOpen(false)}` to the `<Dialog>` so Escape key dismisses it
- [ ] In `client/src/app/shared/components/DeleteButton.tsx`, add `aria-label="Delete"` to the `<Button>`
- [ ] In `client/src/app/shared/components/StarButton.tsx`, add `aria-label="Toggle admin"` and `aria-pressed={selected}` to the `<Button>`

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
// NavBar.tsx:31 — current (missing aria-label)
<Button onClick={handleClick} sx={{ color: 'white' }}> <MenuIcon /> </Button>

// Fix:
<Button onClick={handleClick} sx={{ color: 'white' }} aria-label="Open navigation menu"> <MenuIcon /> </Button>

// StatusButton.tsx — Dialog accessibility pattern:
// Option A: Add ids to existing Typography elements
<Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="status-dialog-title" aria-describedby="status-dialog-desc">
  <Typography id="status-dialog-title" variant="h5">...</Typography>
  <Typography id="status-dialog-desc">...</Typography>
</Dialog>

// Option B: Refactor to use proper Dialog sub-components
<Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="status-dialog-title">
  <DialogTitle id="status-dialog-title">Confirm Status Change</DialogTitle>
  <DialogContent><DialogContentText>...</DialogContentText></DialogContent>
</Dialog>

// DeleteButton.tsx / StarButton.tsx:
<Button aria-label="Delete">...</Button>
<Button aria-label="Toggle admin" aria-pressed={selected}>...</Button>
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — small prop additions across 3 files
- **Risk**: Low — purely additive accessibility attributes

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

**Changes**: Added ARIA labels to NavBar hamburger, CharacterSelect autocomplete, StatusButton dialog (refactored to DialogTitle/DialogContentText + onClose), DeleteButton, StarButton (aria-pressed). 5 files modified.

**Verification**: `npm run build` passes.
