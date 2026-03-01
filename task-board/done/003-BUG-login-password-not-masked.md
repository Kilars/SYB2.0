# 003-BUG-login-password-not-masked

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: High
**Type**: BUG
**Estimated Effort**: Simple

---

## Context

The login form's password field renders as a plain text input — passwords are visible as users type. `LoginForm.tsx:45` uses `<TextInput label='Password' ...>` without the `type="password"` prop. The `RegisterForm.tsx:53` correctly includes `type="password"`, confirming this is an oversight.

This is a security issue — passwords are visible to anyone looking at the screen.

---

## Acceptance Criteria

- [x] Password field on login form masks input with dots/bullets
- [x] Prop `type="password"` is set on the password TextInput in LoginForm
- [x] Verify RegisterForm still works correctly with its existing `type="password"`
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [ ] In `client/src/features/account/LoginForm.tsx:45`, add `type="password"` prop to the password TextInput

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified — frontend-only fix
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
// RegisterForm.tsx:53 — correct implementation
<TextInput label='Password' name='password' type="password" control={control} />

// LoginForm.tsx:45 — missing type="password"
<TextInput label='Password' name='password' control={control} />
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — single prop addition
- **Risk**: Low — one-line fix

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

**Changes**:
- `client/src/features/account/LoginForm.tsx`: Added `type="password"` prop to the password TextInput.

**Verification**: `npm run build` passes.
