# 018-FEATURE-form-submission-feedback

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: Medium
**Type**: FEATURE
**Estimated Effort**: Simple

---

## Context

Forms across the app have **no visual loading indicator** during async submissions — the UI appears frozen until the response arrives or a toast appears. This creates uncertainty about whether the action was registered.

**Clarification**: LoginForm, RegisterForm, and LeagueForm already destructure `isSubmitting` from React Hook Form and use it to disable the submit button. The missing piece is a **visual spinner** (no `CircularProgress` is shown anywhere). MatchDetailsForm is the only form that has neither disable protection nor a spinner.

Affected forms:
- `LoginForm.tsx` — button already disables, but no visual spinner while authenticating
- `RegisterForm.tsx` — button already disables, but no visual spinner while registering
- `LeagueForm.tsx` — button already disables, but no visual spinner while creating/updating
- `MatchDetailsForm.tsx` — NO disable protection AND no spinner (uses local `useState`, not RHF)

---

## Acceptance Criteria

- [x] Submit buttons show `<CircularProgress size={20} />` spinner when form is submitting
- [x] Submit buttons are disabled during submission (already done for RHF forms — verify MatchDetailsForm)
- [x] Form inputs are visually disabled during submission (readonly or reduced opacity)
- [x] RHF forms: use existing `isSubmitting` from `formState` (already destructured)
- [x] MatchDetailsForm: add local `isSubmitting` state (no RHF available)
- [x] `CircularProgress` imported from `@mui/material` in each form file (not currently imported anywhere)
- [x] Existing toast notifications continue to work for success/error feedback
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [ ] In `client/src/features/account/LoginForm.tsx`:
  - `isSubmitting` is already destructured and button is already `disabled={isSubmitting}`
  - **Only add**: `startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}` to submit button
  - Add `import { CircularProgress } from '@mui/material'`
  - Optionally set `disabled` on TextInput fields during submission
- [ ] In `client/src/features/account/RegisterForm.tsx`:
  - Same as LoginForm — `isSubmitting` already exists, only add spinner icon
- [ ] In `client/src/features/leagues/LeagueForm.tsx`:
  - Same pattern — `isSubmitting` already exists, only add spinner icon
- [ ] In `client/src/features/matches/MatchDetailsForm.tsx`:
  - This form uses local `useState` instead of React Hook Form for state management
  - Add a local `isSubmitting` state if not using RHF, set it before/after the API call
  - Same button loading pattern

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified — frontend UI feedback only
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
// React Hook Form pattern (LoginForm, RegisterForm, LeagueForm):
const { handleSubmit, formState: { isSubmitting } } = useForm();

<Button
  type="submit"
  disabled={isSubmitting}
  startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
>
  {isSubmitting ? 'Submitting...' : 'Submit'}
</Button>

// Local state pattern (MatchDetailsForm):
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  setIsSubmitting(true);
  try { await submitMatch(); }
  finally { setIsSubmitting(false); }
};
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — small changes across 4 form files
- **Risk**: Low — additive loading indicators

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

**Changes**: Added CircularProgress spinners and dynamic button text to LoginForm ("Signing in..."), RegisterForm ("Registering..."), LeagueForm ("Saving..."), MatchDetailsForm ("Completing..." + local isSubmitting state).

**Verification**: `npm run build` passes.
