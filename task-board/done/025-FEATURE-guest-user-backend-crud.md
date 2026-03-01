# 025-FEATURE-guest-user-backend-crud

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: High
**Type**: FEATURE
**Estimated Effort**: Medium

---

## Context

With `IsGuest` on the User entity (024), we need a backend endpoint to create guest users and expose the `IsGuest` flag on all relevant DTOs. Guest users are created with just a display name — no email, no password, synthetic UserName. They appear alongside registered users in the user list.

---

## Acceptance Criteria

- [ ] `POST /api/account/guest` with `{ "displayName": "John" }` creates a guest User
- [ ] Created user has `IsGuest = true`, `UserName = guest_{guid}`, `Email = null`
- [ ] `GET /api/account/users` returns all users with `isGuest` field
- [ ] Guest users appear in user list alongside registered users
- [ ] `LeagueMemberDto` includes `isGuest` field (mapped from User.IsGuest)
- [ ] Validation rejects empty display names
- [ ] `dotnet build --configuration Release` passes

---

## Implementation Steps

### Application
- [ ] Create `Application/Guests/Commands/CreateGuest.cs`:
  - Command: `{ DisplayName: string }`
  - Handler: Creates User with `IsGuest = true`, `UserName = $"guest_{Guid.NewGuid()}"`, `DisplayName` from input, `Email = null`. Uses `AppDbContext.Users.Add()` directly (bypasses UserManager since no password). Must set `NormalizedUserName = UserName.ToUpperInvariant()` manually. Returns `Result<UserDto>`.
- [ ] Create `Application/Guests/Validators/CreateGuestValidator.cs`:
  - DisplayName not empty, max 50 chars

### DTOs
- [ ] `Application/UserDto.cs` — Add `public bool IsGuest { get; set; }`
- [ ] `Application/Leagues/DTOs/LeagueMemberDto.cs` — Add `public bool IsGuest { get; set; }`

### Mapping
- [ ] `Application/Core/MappingProfiles.cs`:
  - `User → UserDto`: IsGuest maps by convention (no change needed)
  - `LeagueMember → LeagueMemberDto`: Add `.ForMember(x => x.IsGuest, o => o.MapFrom(s => s.User.IsGuest))`

### API
- [ ] `API/Controllers/AccountController.cs`:
  - Add `[HttpPost("guest")] [Authorize]` endpoint that sends `CreateGuest.Command`
  - Fix `GET /api/account/users` to return `UserDto` via AutoMapper (currently returns raw User entities)

---

## Design Notes

**Why bypass UserManager?** `Program.cs` has `opt.User.RequireUniqueEmail = true` which is an Identity validation rule checked by UserManager. Guests have no email. Bypassing UserManager avoids this validation. The SQL Server unique index on `NormalizedEmail` allows multiple NULLs, so direct insert is safe.

**Login prevention**: Guests have no password hash and no email. `SignInManager.PasswordSignInAsync` fails naturally — no additional guard needed.

**GetUsers fix**: Currently `/api/account/users` returns raw User entities via `UserManager.Users.ToListAsync()`. This leaks internal Identity fields. Fix to project through `UserDto` via AutoMapper, which also exposes the new `IsGuest` field.

---

## Domain Risk Checklist

- [ ] **Composite keys**: No composite key columns modified
- [ ] **Round-robin**: Match generation not affected
- [ ] **Statistics**: Points/flawless computation not affected
- [ ] **Guest identity**: New guest User records created — all FKs work identically
- [ ] **Authorization**: New endpoint uses `[Authorize]` — any authenticated user can create guests

---

## Dependencies

- **Blocked by**: 024-FEATURE-guest-user-domain
- **Blocks**: 026-FEATURE-guest-user-frontend, 027-FEATURE-guest-merge-backend

---

## Rollback Plan

- **Database**: No migration (uses existing Users table)
- **Code**: Git revert — new command + DTO changes
- **Risk**: Low
