# 023-REFACTOR-clean-up-unused-files

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: Low
**Type**: REFACTOR
**Estimated Effort**: Simple

---

## Context

Two files appear to be unused:

1. **`client/src/app/layout/App.css`** — contains Vite boilerplate CSS (spinning logo animation, `.logo`, `.card`, `.read-the-docs` classes) that is not imported or used by any component
2. **`client/src/app/layout/CreateLeague.tsx`** — unused navigation link component (its functionality is handled inline in `NavBar.tsx:47` via a `MenuItem`/`NavLink`)

Dead files add confusion for developers navigating the codebase.

---

## Acceptance Criteria

- [x] Verify `client/src/app/layout/App.css` is not imported anywhere (grep for `App.css` import)
- [x] Verify `client/src/app/layout/CreateLeague.tsx` is not imported/referenced anywhere
- [x] Delete confirmed unused files
- [x] App builds and runs without errors after deletion
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [ ] Grep for `App.css` imports across the client codebase
  - If no imports found, delete `client/src/app/layout/App.css`
  - If imported somewhere, remove the import and then delete the file
- [ ] Grep for `CreateLeague` imports from the layout directory
  - If not imported, delete `client/src/app/layout/CreateLeague.tsx`
  - If imported, investigate whether it's actually used or if the import is dead code
- [ ] Run `npm run build` to verify no breakage

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified — file cleanup only
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

```bash
# Verification commands:
grep -r "App.css" client/src/
grep -r "layout/CreateLeague" client/src/
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: `git checkout -- client/src/app/layout/App.css client/src/app/layout/CreateLeague.tsx`
- **Risk**: Low — deleting unused files (verified by grep + build)

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

**Changes**: Deleted `client/src/app/layout/App.css` (Vite boilerplate, no imports) and `client/src/app/layout/CreateLeague.tsx` (dead component, no imports). Verified via grep — zero references in codebase.

**Verification**: `npm run build` passes.
