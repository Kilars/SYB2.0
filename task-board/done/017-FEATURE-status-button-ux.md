# 017-FEATURE-status-button-ux

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: Medium
**Type**: FEATURE
**Estimated Effort**: Simple

---

## Context

The StatusButton component handles league status transitions but has several issues:

1. **Color differentiation is absent** — all buttons use `variant="contained"` with default primary blue regardless of direction
2. **Icons already exist** (`PlayArrow` for case 0, `ArrowBack` for cases 1 and 2) — but they're not differentiated by forward/backward intent
3. **Label "Set league to planning phase"** (case 1 backward) is long and unclear
4. **"Start league"** (case 0) and **"Reopen league"** (case 2) are already reasonable labels
5. **Missing transition**: There is NO button for Active → Complete ("Finish League") — the switch case for status 1 only handles the backward transition to Planned
6. **Confirmation dialog** only covers the backward transition when `changeStatusTo === 0` (reverting to Planned). "Reopen" (Complete → Active) fires `onSubmit()` directly with no confirmation.

---

## Acceptance Criteria

- [x] **Forward transitions** (Start League, Finish League) use `color="success"` with forward icon
- [x] **Backward/destructive transitions** (Revert to Draft, Reopen) use `color="warning"` with back-arrow icon
- [x] **Shorter labels**:
  - Case 0 (Planned → Active): Keep "Start league" (already good) — add `color="success"`
  - Case 1 backward (Active → Planned): "Set league to planning phase" → "Revert to Draft" — keep `color="warning"` + `ArrowBack` icon
  - **NEW: Case 1 forward (Active → Complete)**: Add "Finish League" button with `color="success"` + `CheckCircle` icon — this transition does not exist yet and must be added
  - Case 2 (Complete → Active): Keep "Reopen league" or shorten to "Reopen" — add `color="warning"`
- [x] **For Active status (case 1)**: Component needs to render TWO buttons (forward: "Finish League", backward: "Revert to Draft") or use a split button / dropdown
- [x] Assess whether "Reopen" (Complete → Active) should also have a confirmation dialog (currently fires directly)
- [x] Button size and placement remain consistent
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [ ] In `client/src/features/leagues/StatusButton.tsx`:
  - **Case 0** (Planned → Active): Add `color="success"` to button. Icon `PlayArrow` already exists. Label "Start league" already good.
  - **Case 1** — currently only handles backward transition. Must be split:
    - **Forward (Active → Complete)**: NEW — add button with `color="success"`, `startIcon={<CheckCircle />}`, label "Finish League", `changeStatusTo = 2`
    - **Backward (Active → Planned)**: Change label from "Set league to planning phase" to "Revert to Draft". Add `color="warning"`. Icon `ArrowBack` already exists. Existing confirmation dialog is preserved.
  - **Case 2** (Complete → Active): Add `color="warning"`. Icon `ArrowBack` already exists. Label "Reopen league" or shortened to "Reopen".
  - Import `CheckCircle` from `@mui/icons-material` (other icons already imported)
  - Consider adding confirmation dialog for "Reopen" transition (currently has none)

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified — frontend display only
- [x] **Round-robin**: Match generation logic is not affected — no domain changes (status API call unchanged)
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
// Current structure — switch statement with let assignments:
// case 0: label = "Start league", icon = <PlayArrow />, changeStatusTo = 1
// case 1: label = "Set league to planning phase", icon = <ArrowBack />, changeStatusTo = 0
// case 2: label = "Reopen league", icon = <ArrowBack />, changeStatusTo = 1
// All use variant="contained" with default primary blue

// Proposed — add color prop and split case 1:
// case 0: color="success", icon = <PlayArrow />, label = "Start League"
// case 1 forward: color="success", icon = <CheckCircle />, label = "Finish League", changeStatusTo = 2 (NEW)
// case 1 backward: color="warning", icon = <ArrowBack />, label = "Revert to Draft", changeStatusTo = 0
// case 2: color="warning", icon = <ArrowBack />, label = "Reopen"
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — single component change
- **Risk**: Low — visual/label changes only

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

**Changes**: StatusButton.tsx — Added color="success" for forward transitions, color="warning" for backward. Added "Finish League" button (Active→Complete) with CheckCircle icon. Shortened labels. Added confirmation dialog for Reopen transition. Active status now shows two buttons in a Stack.

**Verification**: `npm run build` passes.
