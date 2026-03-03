# 035-BUG-tournament-delete-404

**Status**: Done
**Created**: 2026-03-02
**Priority**: High
**Type**: BUG
**Estimated Effort**: Simple

---

## Context

When deleting a tournament from BracketView, the user sees a "Not found" toast error even though the deletion actually succeeds. The tournament IS deleted, but a confusing 404 error appears.

**Root cause** — Race condition between query cache cleanup and React Query refetch:

1. `deleteTournament.mutateAsync()` sends `DELETE /api/tournaments/${id}` → succeeds (200)
2. Mutation `onSuccess` in `useTournaments.ts` (line 56) calls `queryClient.removeQueries({ queryKey: ["tournament", id] })` — removes the cache entry
3. BracketView is still mounted with `useTournaments(competitionId)` which has an active `useQuery(["tournament", id], enabled: !!id)`
4. React Query sees the cache entry was removed but the query is still `enabled` → triggers automatic refetch
5. Refetch hits `GET /api/tournaments/${id}` for the now-deleted tournament → backend returns 404
6. Axios interceptor (`agent.ts` line 34-35) catches 404 and shows `toast.error("Not found")`
7. Only AFTER `onSuccess` completes does `handleDelete` in BracketView (line 242) call `navigate("/tournaments")`

The navigation happens too late — the refetch fires during the `onSuccess` window while the component is still mounted.

---

## Acceptance Criteria

- [x] Deleting a tournament shows only the success toast ("Tournament deleted successfully"), no 404 error toast
- [x] Tournament is actually deleted from the database
- [x] User is navigated to `/tournaments` list after successful deletion
- [x] Tournament list refreshes correctly (deleted tournament no longer appears)
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend

**Option A (Recommended)**: Cancel the query before removing it to prevent refetch

- [x] **`client/src/lib/hooks/useTournaments.ts` lines 55-62** — Add `cancelQueries` before `removeQueries`:
  ```tsx
  onSuccess: async () => {
    await queryClient.cancelQueries({ queryKey: ["tournament", id] });
    queryClient.removeQueries({ queryKey: ["tournament", id] });
    queryClient.setQueryData<Tournament[]>(["tournaments"], (old) =>
      old?.filter((t) => t.id !== id),
    );
    await queryClient.invalidateQueries({ queryKey: ["tournaments"] });
  },
  ```

**Option B (Alternative)**: Move navigation into the mutation's `onSuccess` so the component unmounts before cleanup

- [ ] Restructure so `navigate` is called from the hook or passed as a callback, ensuring unmount happens before cache removal

---

## Domain Risk Checklist

**Every task MUST complete this checklist before implementation:**

- [x] **Composite keys**: No composite key columns are being modified
- [x] **Round-robin**: Match generation logic is not affected
- [x] **Statistics**: Points/flawless computation is not affected
- [x] **Guest identity**: UserId FK references are preserved
- [x] **Authorization**: Route params match handler expectations

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None

---

## Code References

Mutation onSuccess (`client/src/lib/hooks/useTournaments.ts` lines 52-63):
```tsx
const deleteTournament = useMutation({
  mutationFn: async () => {
    await agent.delete(`/tournaments/${id}`);
  },
  onSuccess: async () => {
    queryClient.removeQueries({ queryKey: ["tournament", id] });  // ← triggers refetch race
    queryClient.setQueryData<Tournament[]>(["tournaments"], (old) =>
      old?.filter((t) => t.id !== id),
    );
    await queryClient.invalidateQueries({ queryKey: ["tournaments"] });
  },
});
```

BracketView handler (`client/src/features/tournaments/BracketView.tsx` lines 237-248):
```tsx
const handleDelete = async () => {
  setIsDeleting(true);
  try {
    await deleteTournament.mutateAsync();         // onSuccess runs here
    toast("Tournament deleted successfully", { type: "success" });
    navigate("/tournaments");                      // ← too late, refetch already fired
  } catch {
    toast("Failed to delete tournament", { type: "error" });
  }
};
```

Axios interceptor (`client/src/lib/api/agent.ts` line 34-35):
```tsx
case 404:
  toast.error("Not found");  // ← the confusing toast
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — single file change in useTournaments.ts
- **Risk**: Low — isolated query cache management fix

---

## Progress Log

- Added `await queryClient.cancelQueries({ queryKey: ["tournament", id] })` before `removeQueries` in the `deleteTournament` mutation's `onSuccess` handler
- `cd client && npm run build` passes (0 errors, 1 pre-existing warning)

---

## Resolution

**Option A implemented**: Added `cancelQueries` before `removeQueries` in `useTournaments.ts` line 57. This cancels any in-flight or pending refetch for the deleted tournament's query key before the cache entry is removed, preventing React Query from triggering an automatic refetch that would hit the now-deleted resource and produce a 404 toast.
