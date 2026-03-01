# 027-FEATURE-guest-merge-backend

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: High
**Type**: FEATURE
**Estimated Effort**: Complex

---

## Context

League admins need to merge a guest user into a registered user when that person eventually creates an account. This is the most dangerous operation in the system — it migrates all FK references (LeagueMember, Match, Round) from one UserId to another across composite keys, then deletes the guest record. Must be fully transactional.

---

## Acceptance Criteria

- [ ] `MergeGuest.Command` with valid guestId and targetId merges all data
- [ ] After merge: all Match.PlayerOneUserId/PlayerTwoUserId records reference the target user
- [ ] After merge: all Match.WinnerUserId records reference the target user
- [ ] After merge: all Round.WinnerUserId records reference the target user
- [ ] After merge: LeagueMember records exist for target user in all guest's former leagues (preserving IsAdmin, DateJoined)
- [ ] After merge: guest User record is deleted
- [ ] Conflict check: merge fails if target user already belongs to any league the guest is in
- [ ] Validation: merge fails if guestId user has `IsGuest = false`
- [ ] Authorization: caller must be admin of at least 1 league containing the guest
- [ ] Operation is fully transactional (rollback on any failure)
- [ ] `dotnet build --configuration Release` passes

---

## Implementation Steps

### Application
- [ ] Create `Application/Guests/Commands/MergeGuest.cs`:
  - Command: `{ GuestUserId: string, TargetUserId: string }`
  - Handler injects: `AppDbContext`, `IUserAccessor`
  - **Transaction logic** (explicit `BeginTransactionAsync`):
    1. Load guest User (verify `IsGuest == true`) and target User (verify `IsGuest == false`)
    2. Load all guest's LeagueMember records
    3. **Auth check**: verify caller (`IUserAccessor.GetUserId()`) is admin of at least 1 league containing the guest
    4. **Conflict check**: verify target user is not already a member of any league the guest belongs to
    5. **Insert** new LeagueMember records for target user (preserving IsAdmin, DateJoined) then `SaveChangesAsync` (flush so FKs are satisfiable)
    6. **Update** `Match.PlayerOneUserId` where = guestId to targetId via `ExecuteUpdateAsync`
    7. **Update** `Match.PlayerTwoUserId` where = guestId to targetId
    8. **Update** `Match.WinnerUserId` where = guestId to targetId
    9. **Update** `Round.WinnerUserId` where = guestId to targetId
    10. **Delete** old guest LeagueMember records via `RemoveRange`
    11. **Delete** guest User record via `Remove`
    12. `SaveChangesAsync` + `CommitAsync`

- [ ] Create `Application/Guests/Validators/MergeGuestValidator.cs`:
  - Both IDs non-empty and different

- [ ] Create `Application/Guests/DTOs/MergeGuestDto.cs`:
  - `GuestUserId: string`, `TargetUserId: string`

### API
- [ ] `API/Controllers/AccountController.cs`:
  - Add `[HttpPost("merge-guest")] [Authorize]` endpoint

---

## Critical Ordering

The Match table has composite FKs `{PlayerOneUserId, LeagueId} → LeagueMember`. When updating `PlayerOneUserId` from guestId to targetId, the new FK `{targetId, LeagueId}` must point to a valid LeagueMember. **Step 5 (insert new LeagueMembers) MUST complete before step 6 (update Match FKs).**

`ExecuteUpdateAsync` executes immediately outside the EF change tracker, so an explicit `IDbContextTransaction` is required to wrap everything atomically.

---

## Domain Risk Checklist

- [ ] **Composite keys**: LeagueMember PK columns change (delete old + insert new). Match FK columns updated via ExecuteUpdateAsync. This is the highest-risk operation in the system — transaction is mandatory.
- [ ] **Round-robin**: Existing match structure preserved — only player references change
- [ ] **Statistics**: After merge, leaderboard/stats compute correctly for the target user
- [ ] **Guest identity**: Guest record fully removed — no orphaned references
- [ ] **Authorization**: Auth check inside handler (not route-based) because current auth handlers read route params, not request body

---

## Dependencies

- **Blocked by**: 025-FEATURE-guest-user-backend-crud
- **Blocks**: 028-FEATURE-guest-merge-frontend

---

## Rollback Plan

- **Database**: Transaction rollback on failure. No schema changes.
- **Code**: Git revert — new command files only
- **Risk**: High — FK migration across composite keys. Must be tested thoroughly with real data.
