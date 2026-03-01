# 008-FEATURE-loading-empty-state-system

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: High
**Type**: FEATURE
**Estimated Effort**: Medium

---

## Context

Every component in SYB2.0 uses bare `<Typography>Loading...</Typography>` for loading states and plain text for empty states. This creates a jarring, unpolished experience — content pops in after a flash of "Loading..." text, and empty pages offer no guidance on what to do next.

There are **13 instances** of "Loading..." across the app (some use `<Typography>`, others use bare `<div>`) and **13 empty/not-found states** that show nothing helpful — no CTAs, no guidance, no icons.

---

## Acceptance Criteria

- [x] `LoadingSkeleton` shared component created using MUI `<Skeleton />` with variants for:
  - List view (multiple rectangular skeleton rows)
  - Card view (card-shaped skeletons)
  - Detail view (mixed skeleton shapes)
  - Table view (table row skeletons)
- [x] `EmptyState` shared component created with:
  - Icon prop (MUI icon)
  - Message prop (descriptive text)
  - Optional CTA button (label + onClick/href)
- [x] All "Loading..." instances replaced with contextual `LoadingSkeleton` variants
- [x] All empty states replaced with `EmptyState` component with helpful messages:
  - No leagues: "No leagues yet — create one to get started!" with CTA
  - No matches: "No matches found for this league"
  - No stats: "Play some matches to see your stats!"
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [ ] Create `client/src/app/shared/components/LoadingSkeleton.tsx`:
  - Accept `variant` prop: `'list' | 'card' | 'detail' | 'table'`
  - Each variant renders appropriate MUI `<Skeleton>` shapes
  - Accept optional `count` prop for number of skeleton items
- [ ] Create `client/src/app/shared/components/EmptyState.tsx`:
  - Props: `icon` (React element), `message` (string), `action?` ({ label, onClick } or { label, href })
  - Centered layout with icon, message text, and optional button
- [ ] Replace loading states in **all 13 components** (listed by variant):
  - **List skeleton**: `client/src/features/leagues/LeagueList.tsx:18` (`<div>Loading ...</div>`)
  - **Table skeleton**: `client/src/features/leagues/Leaderboard.tsx:14`, `client/src/features/stats/LeagueStats.tsx:11` (`<div>Loading...</div>`)
  - **Card skeleton**: `client/src/features/matches/MatchesList.tsx:11`, `client/src/features/stats/UserStats.tsx:12`
  - **Detail skeleton**: `client/src/features/matches/MatchDetails.tsx:11`, `client/src/features/matches/MatchDetailsForm.tsx:35`, `client/src/features/matches/MatchDetailsView.tsx:12`
  - **Tab/page skeleton**: `client/src/features/leagues/LeagueTabs.tsx:27`, `client/src/features/leagues/Description.tsx:15`
  - **Form skeleton**: `client/src/features/leagues/LeagueForm.tsx:44` (only when editing existing league)
  - **Inline skeleton**: `client/src/features/matches/CharacterSelect.tsx:57` (`Loading characters...` — renders 6x per match, keep small/inline)
  - **Spinner (not skeleton)**: `client/src/app/router/RequireAuth.tsx:9` — auth check on every nav; use centered `<CircularProgress>` instead of skeleton (no content shape to mimic)
- [ ] Replace empty/not-found states with `EmptyState` component:
  - `LeagueList.tsx:19` — "No leagues yet — create one to get started!" with CTA (verify route: likely `/createLeague`)
  - `MatchesList.tsx:12,16` — "No matches in this split" (note: line 12 says "No leagues found" which is a copy-paste error)
  - `Leaderboard.tsx:15` — "No leaderboard data yet"
  - `UserStats.tsx:13` — "Play some matches to see your stats!"
  - `LeagueStats.tsx:12` — "No league stats yet" (`<div>No league stats</div>`)
  - `CharacterSelect.tsx:58` — "No characters found" (inline, not full-page)
  - **"Not found by ID" states** (different from "collection is empty" — use different messaging):
    - `LeagueTabs.tsx:28` — "Could not find league" → "League not found" with back-to-leagues link
    - `Description.tsx:16` — "No leagues found" → "League not found"
    - `MatchDetails.tsx:12` — "Match not found"
    - `MatchDetailsForm.tsx:36,37` — "Match/Rounds not found"
    - `MatchDetailsView.tsx:13` — "Match not found"

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified — new UI components only
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
// Current loading pattern (repeated 12+ times):
if (isLoading) return <Typography>Loading...</Typography>

// Proposed loading pattern:
if (isLoading) return <LoadingSkeleton variant="list" count={5} />

// Proposed empty state pattern:
if (data?.length === 0) return (
  <EmptyState
    icon={<SportsEsports />}
    message="No leagues yet — create one to get started!"
    action={{ label: "Create League", href: "/create-league" }}
  />
)
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — new shared components + modifications to feature components
- **Risk**: Low — additive change, existing functionality preserved

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

**New files**: LoadingSkeleton.tsx (4 variants), EmptyState.tsx (icon + message + optional CTA)
**Modified**: 13 components — all Loading... text replaced with skeletons, all empty/not-found states replaced with EmptyState component. Fixed copy-paste bug in MatchesList ("No leagues found" → "No matches in this split"). RequireAuth uses CircularProgress.

**Verification**: `npm run build` passes.
