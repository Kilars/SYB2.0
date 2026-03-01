# 026-FEATURE-guest-user-frontend

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: High
**Type**: FEATURE
**Estimated Effort**: Complex

---

## Context

With guest creation and IsGuest on all DTOs (025), the frontend needs: (1) inline guest creation in the league form member picker, (2) "(guest)" labels everywhere guests appear, and (3) a small backend fix to include IsGuest/UserId in leaderboard data.

---

## Acceptance Criteria

- [ ] League form has an "Add guest" input near the member picker
- [ ] Entering a name creates a guest user and adds them to the league members
- [ ] Guests appear in the member dropdown with "(guest)" suffix
- [ ] "(guest)" suffix appears on: UserChips, leaderboard table/cards, match lists, match details view, match details form
- [ ] Guest profile pages work at `/user/:userId` with full match history and stats
- [ ] Leaderboard groups stats by `UserId` (not `DisplayName`) — fixes latent duplicate-name bug
- [ ] `cd client && npm run build` passes
- [ ] `dotnet build --configuration Release` passes

---

## Implementation Steps

### Backend (small, bundled here)
- [ ] `Domain/LeaderboardUser.cs` — Add `public string? UserId { get; set; }` and `public bool IsGuest { get; set; }`
- [ ] `Application/Leagues/Queries/GetLeagueLeaderboard.cs`:
  - Include `UserId` and `IsGuest` in projection
  - **Fix bug**: Group by `UserId` instead of `DisplayName` (prevents stats merge if two users share a name)

### Frontend Types
- [ ] `client/src/lib/types/index.d.ts`:
  - Add `isGuest: boolean` to `User`, `LeagueMember`, `Player` types
  - Add `isGuest?: boolean` and `userId?: string` to `LeaderboardUser` type
  - Make `email` optional on `User` type (guests have no email)

### Frontend Hooks
- [ ] `client/src/lib/hooks/useUsers.ts`:
  - Add `createGuest` mutation → `POST /api/account/guest`
  - Invalidate `["users"]` cache on success

### Frontend Components — Guest Creation
- [ ] `client/src/features/leagues/LeagueForm.tsx` or `UserSelectInput.tsx`:
  - Add "Add guest" text input (TextField + button) below the Select dropdown
  - On submit: call `createGuest`, then auto-add returned guest to selected members
  - Show "(guest)" suffix on guest users in dropdown menu items and member chips

### Frontend Components — "(guest)" Display
- [ ] `client/src/app/shared/components/UserChip.tsx` — Accept optional `isGuest` prop, append " (guest)" to label
- [ ] `client/src/features/leagues/Leaderboard.tsx` — Show "(guest)" in leaderboard table/cards
- [ ] `client/src/features/matches/MatchesList.tsx` — Append "(guest)" to player display names where `isGuest`
- [ ] `client/src/features/matches/MatchDetailsView.tsx` — Append "(guest)" to player display names
- [ ] `client/src/features/matches/MatchDetailsForm.tsx` — Append "(guest)" to player names in toggle buttons

---

## Domain Risk Checklist

- [ ] **Composite keys**: No composite key columns modified
- [ ] **Round-robin**: Match generation not affected — guests are regular User records
- [ ] **Statistics**: LeaderboardUser grouping changed from DisplayName → UserId (correctness improvement)
- [ ] **Guest identity**: Guest UserId references work identically to registered users
- [ ] **Authorization**: No auth handler changes

---

## Dependencies

- **Blocked by**: 025-FEATURE-guest-user-backend-crud
- **Blocks**: None (027/028 merge tasks are independent)

---

## Rollback Plan

- **Database**: No migration
- **Code**: Git revert — frontend component changes + small LeaderboardUser backend change
- **Risk**: Medium — touches many display components
