# 024-FEATURE-guest-user-domain

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: High
**Type**: FEATURE
**Estimated Effort**: Small

---

## Context

SYB2.0 currently requires all league members to be registered users (IdentityUser with email/password). Leagues are often created before all participants have registered. This task introduces the domain foundation for "guest" users — lightweight User records created with just a display name, no credentials.

---

## Acceptance Criteria

- [ ] `User.cs` has `public bool IsGuest { get; set; } = false;`
- [ ] Migration adds `IsGuest` column with default `false` to `AspNetUsers` table
- [ ] Existing users all have `IsGuest = false` after migration
- [ ] CLAUDE.md Domain Invariant #4 updated to describe merge approach (FK migration, not identity enrichment)
- [ ] `dotnet build --configuration Release` passes
- [ ] `dotnet ef database update` applies cleanly

---

## Implementation Steps

### Domain
- [ ] `Domain/User.cs` — Add `public bool IsGuest { get; set; } = false;`

### Persistence
- [ ] Generate migration: `dotnet ef migrations add AddIsGuestToUser --project Persistence --startup-project API`
- [ ] Verify migration only adds a bool column with default value

### Documentation
- [ ] `CLAUDE.md` Domain Invariant #4 — Rewrite to:
  > **Guest Merge Safety**: When merging a guest into a registered user, all FK references (LeagueMember, Match.PlayerOneUserId, Match.PlayerTwoUserId, Match.WinnerUserId, Round.WinnerUserId) are migrated from the guest's UserId to the target user's UserId in a single transaction. The guest User record is deleted after migration. Conflict check: target user must not already be a member of any league the guest belongs to.

---

## Domain Risk Checklist

- [ ] **Composite keys**: No composite key columns modified — new bool property only
- [ ] **Round-robin**: Match generation logic not affected
- [ ] **Statistics**: Points/flawless computation not affected
- [ ] **Guest identity**: This task establishes the foundation — no FK changes yet
- [ ] **Authorization**: No auth handler changes

---

## Dependencies

- **Blocked by**: None
- **Blocks**: 025-FEATURE-guest-user-backend-crud

---

## Rollback Plan

- **Database**: Reverse migration removes `IsGuest` column
- **Code**: Git revert — single property addition
- **Risk**: Low
