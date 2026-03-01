# 005-BUG-registerform-wrong-function-name

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: High
**Type**: BUG
**Estimated Effort**: Simple

---

## Context

`RegisterForm.tsx:10` exports `function LoginForm()` instead of `function RegisterForm()`. The component was likely copy-pasted from LoginForm and the function name was never updated. While this doesn't cause a runtime error (the default export works regardless of the function name), it causes confusion in React DevTools (shows "LoginForm" for the register component) and is misleading for developers.

---

## Acceptance Criteria

- [x] Function name in RegisterForm.tsx is `RegisterForm`, not `LoginForm`
- [x] Component still exports and renders correctly
- [x] React DevTools shows "RegisterForm" for the register page component
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [ ] In `client/src/features/account/RegisterForm.tsx:10`, rename `function LoginForm()` to `function RegisterForm()`

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified — frontend-only rename
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
// RegisterForm.tsx:10 — current (wrong)
export default function LoginForm() {

// Should be:
export default function RegisterForm() {
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — single function rename
- **Risk**: Low — cosmetic fix

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

**Changes**:
- `client/src/features/account/RegisterForm.tsx`: Renamed `function LoginForm()` to `function RegisterForm()`.

**Verification**: `npm run build` passes.
