# 028-FEATURE-guest-merge-frontend

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: Medium
**Type**: FEATURE
**Estimated Effort**: Medium

---

## Context

With the merge endpoint available (027), league admins need a UI to merge a guest into a registered user. This is accessible from the leaderboard/members view where admins can see guest members and trigger a merge dialog.

---

## Acceptance Criteria

- [ ] League admins see a "Merge" action on guest UserChips in the leaderboard Members section
- [ ] Clicking "Merge" opens a dialog showing available registered (non-guest) users
- [ ] Selecting a target user and confirming triggers `POST /api/account/merge-guest`
- [ ] On success: UI refreshes (league, leaderboard, users caches invalidated)
- [ ] Error cases (conflict, permission denied) show appropriate toast messages
- [ ] Non-admin users do not see the merge action
- [ ] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [ ] Create `client/src/features/leagues/MergeGuestDialog.tsx`:
  - Props: `guestUserId`, `guestDisplayName`, `open`, `onClose`
  - Fetches non-guest users from the users list
  - Dropdown to select target user
  - Confirmation button with warning text explaining the merge
  - Calls merge endpoint, handles success/error with toasts

- [ ] `client/src/lib/hooks/useUsers.ts` (or new `useGuests.ts`):
  - Add `mergeGuest` mutation → `POST /api/account/merge-guest`
  - On success: invalidate `["league"]`, `["leaderboard"]`, `["users"]`, `["userMatches"]` caches

- [ ] `client/src/features/leagues/Leaderboard.tsx`:
  - For admin users viewing a league: show merge icon button on guest UserChips in the Members section
  - Clicking opens `MergeGuestDialog` with the guest's userId and displayName
  - Determine admin status from `league.members` (current user's `isAdmin` flag)

- [ ] `client/src/app/shared/components/UserChip.tsx`:
  - Accept optional `onMerge` callback prop
  - When provided, render a small merge icon button on the chip

---

## Domain Risk Checklist

- [ ] **Composite keys**: No direct key modifications — calls backend merge endpoint
- [ ] **Round-robin**: Not affected
- [ ] **Statistics**: UI refreshes after merge to show correct stats
- [ ] **Guest identity**: Merge operation handled entirely by backend
- [ ] **Authorization**: Merge button only shown to admins; backend enforces authorization

---

## Dependencies

- **Blocked by**: 027-FEATURE-guest-merge-backend
- **Blocks**: None

---

## Rollback Plan

- **Database**: No changes
- **Code**: Git revert — new dialog component + minor changes to Leaderboard and UserChip
- **Risk**: Low — UI-only changes
