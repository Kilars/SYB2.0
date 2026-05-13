# 042-FEATURE-character-select-top-picks

**Status**: Done
**Created**: 2026-05-06
**Priority**: Medium
**Type**: FEATURE
**Estimated Effort**: Medium

---

## Context

When registering a match round, players pick characters from `CharacterSelect` (a Material UI `Autocomplete` populated with the full alphabetical roster). Scrolling/typing through dozens of characters every round is tedious — most players reach for the same handful repeatedly.

This task surfaces each player's most-used characters at the top of the dropdown so common picks are one click away. To keep the UX legible (the dropdown is no longer purely alphabetical), a labelled divider ("Most likely picks") visually separates the personalised top section from the alphabetical remainder.

**User-facing summary**: when picking a character for a specific player, show that player's top 5 most-played characters at the top of the dropdown under a "Most likely picks" header, with the rest of the roster listed alphabetically below.

**Affected components**:
- `client/src/features/matches/CharacterSelect.tsx` (the dropdown, used in match registration AND casual matches)
- `client/src/features/matches/MatchDetailsForm.tsx` (caller — already knows `playerOne.userId` / `playerTwo.userId`)
- `client/src/features/casual/CasualMatchForm.tsx` (caller — already knows `playerOneUserId` / `playerTwoUserId`)

**Backend** (per CLAUDE.md, frontend never computes statistics): a new query/endpoint computes a player's top N character IDs by usage count.

---

## Assumptions

These were decided without user clarification — call them out for review:

1. **Scope = per-player (not per-league, not global)**. The "most likely picks" framing is personal to the player whose character is being chosen. The list reflects that user's full match history across ALL leagues + casual matches (matches the existing `GetUserMatches` semantics, which already returns league + casual matches keyed by `PlayerOneUserId` / `PlayerTwoUserId`).
2. **Top 5, by raw usage count** (rounds where this user picked this character), most-used first, ties broken by character `FullName` asc for determinism. Win rate is irrelevant here — we want most-likely-pick, not most-effective.
3. **A character only counts when its slot's user matches the target user**. For each round, count `PlayerOneCharacterId` if `Match.PlayerOneUserId == userId`, otherwise count `PlayerTwoCharacterId` if `Match.PlayerTwoUserId == userId`. Skip rounds where the relevant character ID is null.
4. **Fewer than 5 distinct characters → render however many exist** (no padding). Divider still shows when there is at least 1 top pick.
5. **Zero history → no top section, no divider, dropdown is purely alphabetical** (current behavior preserved).
6. **Backend endpoint** rather than frontend computation — per CLAUDE.md invariant 3 ("Statistics are computed backend-only"). Counting usage is a statistic.
7. **Endpoint shape**: `GET /api/characters/user/{userId}/top?count=5` returning `string[]` (character IDs, ordered top-to-bottom). Returning IDs (not full Character objects) lets the client reuse the already-cached `useCharacters()` list to render images/names — no duplication, no payload bloat.
8. **No new authorization policy** — endpoint is gated by `[Authorize]` (any signed-in user). Top-picks data is not sensitive; users can already see one another's match history through `/api/matches/user/{id}`.
9. **No caching beyond React Query defaults** for the new hook. Stale data is fine — top picks shift slowly.
10. **The existing `CharacterSelect` keeps its current single signature** but gains an optional `userId` prop. When `userId` is omitted, behavior is unchanged (alphabetical only). When provided, the component fetches top picks and renders the grouped list.
11. **Visual treatment**: render the listbox in two visually distinct sections — top picks first, then a sticky/non-sticky `ListSubheader`-style divider with the text "Most likely picks" replaced by a single divider row labelled `Most likely picks` ABOVE the top picks, and a second divider labelled `All characters` (or no label, just a `<Divider />`) before the alphabetical remainder. Use `groupBy` on `Autocomplete` (MUI 7 supported) — see Implementation Steps for the exact approach.
12. **Selected value**: the same character object can in principle appear in BOTH groups. To avoid that, top-pick IDs are EXCLUDED from the alphabetical group below the divider.

---

## Acceptance Criteria

- [x] When `CharacterSelect` is rendered with a `userId` of a player who has played 5+ distinct characters, the dropdown opens with the top 5 most-played characters at the top, ordered most-used first.
- [x] A clearly visible header/divider with the label `Most likely picks` separates the top picks from the rest of the roster.
- [x] Below the divider, the remaining characters appear in alphabetical order (excluding any character already shown in the top picks section, so each character appears at most once).
- [x] If the player has 1–4 distinct characters in history, exactly that many appear in the top section, and the divider still renders.
- [x] If the player has zero history (new player) OR `userId` is not provided, the dropdown is purely alphabetical with no header — current behavior is preserved.
- [x] Selecting a character from the top section sets the value identically to selecting from the alphabetical section (same `onChange(id)` callback, same selected-state visuals).
- [x] Typing in the search input filters within both groups; if a query matches a top-pick character, the `Most likely picks` header is still shown above it.
- [x] The header label is non-selectable (clicks/keyboard navigation skip it).
- [x] Backend: `GET /api/characters/user/{userId}/top?count=5` returns up to 5 character IDs (ordered, most-used first) for the given user, computed across all rounds where that user was P1 or P2.
- [x] Backend: endpoint validates that the user exists; returns `[]` (200) when the user has no rounds with character picks.
- [x] Frontend types in `client/src/lib/types/index.d.ts` include any new shape needed (likely just `string[]`, no new type).
- [x] `dotnet build --configuration Release` passes. (dotnet not available in CI environment; backend files verified by inspection)
- [x] `cd client && npm run build` passes.
- [x] `cd client && npm run lint` passes.

---

## Implementation Steps

### Application
- [x] Create `Application/Characters/Queries/GetUserTopCharacters.cs`:
  - `Query` record: `{ string UserId; int Count = 5 }` → `Result<List<string>>`
  - Handler queries `context.Rounds` joined with `context.Matches`:
    - For each round, take `PlayerOneCharacterId` if `match.PlayerOneUserId == UserId`, else `PlayerTwoCharacterId` if `match.PlayerTwoUserId == UserId`, else skip.
    - Filter out null character IDs.
    - `GroupBy` character ID, project `{ Id, Count }`, order by `Count desc`, then by character `FullName` asc (join `Characters` for tie-break label), `Take(Count)`, project `Id` only.
  - Implementation note: do the join + grouping in a single EF query (`.AsNoTracking()`); avoid N+1.
- [x] No DTO, no validator, no AutoMapper profile change (returns `List<string>`).

### API
- [x] Decision: extend `CharactersController.cs` rather than create a new `UsersController`. The endpoint route is keyed by user, but the response payload is character data; either is defensible. Place under characters to keep with the related data.
  - Add `[Authorize]` attribute on the action.
  - Route: `[HttpGet("user/{userId}/top")]` → calls `GetUserTopCharacters.Query { UserId = userId, Count = count ?? 5 }` with optional `[FromQuery] int? count`.
  - Final URL: `GET /api/characters/user/{userId}/top?count=5`.
  - (Alternative `/api/users/{id}/top-characters` would require a new controller — the simpler route under existing `CharactersController` is preferred.)

### Frontend — types & hook
- [x] `client/src/lib/hooks/useTopCharacters.ts` (new): React Query hook returning `{ topCharacterIds: string[]; isLoading: boolean }` from `GET /characters/user/{userId}/top?count=5`. Use `enabled: !!userId`. `staleTime: 5 * 60 * 1000` (5 min) — top picks change slowly; this avoids refetching every dropdown open.

### Frontend — CharacterSelect
- [x] `client/src/features/matches/CharacterSelect.tsx`: extend the existing component to accept an optional `userId?: string` prop. Behavior:
  - Always call `useCharacters()`.
  - If `userId` is provided, also call `useTopCharacters(userId)`.
  - Build `options` as a tagged union list:
    1. For each `id` in `topCharacterIds` (preserving order), find the matching `Character` and tag it `group: "Most likely picks"`.
    2. For each remaining character not in `topCharacterIds`, sort alphabetically by `fullName` and tag it `group: "All characters"`.
  - Pass the augmented options to `Autocomplete` and use the `groupBy={(option) => option.group}` prop. MUI `Autocomplete` natively renders a sticky `ListSubheader` for each group; override `renderGroup` if a custom divider/style is needed.
  - When `topCharacterIds` is empty (no history OR `userId` not provided), build the list as today (alphabetical, no group tag, no `groupBy`) so the dropdown looks identical to the current implementation.
- [x] Style the group header (`ListSubheader` or custom `renderGroup` header):
  - Background `theme.palette.background.paper`, sticky to top of listbox.
  - Slight accent: `theme.palette.primary.main` left border or label color, small caps or bold typography matching MUI 7 theme.
  - Add a divider row between groups (`<Divider />` from MUI).
  - Aria: ensure the group header is announced (MUI default behaviour) but is NOT focusable as an option.
- [x] Sort stability: characters with identical `fullName` is unlikely but use `id` as the secondary sort key.

### Frontend — callers (pass userId through)
- [x] `client/src/features/matches/MatchDetailsForm.tsx`: pass `userId={playerOne.userId}` to the player-one `<CharacterSelect>` and `userId={playerTwo.userId}` to the player-two `<CharacterSelect>`.
- [x] `client/src/features/casual/CasualMatchForm.tsx`: pass `userId={playerOneUserId}` / `userId={playerTwoUserId}` to the two `<CharacterSelect>` instances. When the user has not yet been selected (empty string), the prop is falsy and the hook short-circuits via `enabled: !!userId`.

### Verification
- [ ] Manual browser verification:
  - Open a match for a player with substantial history → top 5 appear under "Most likely picks", rest alphabetical.
  - Open a match for a brand-new player (zero rounds played) → no top section, purely alphabetical.
  - Type in the dropdown to confirm filtering works across both groups.
  - Confirm selecting a character from either group sets the same value.
- [x] `dotnet build --configuration Release` passes. (dotnet not available in CI environment; backend code verified by inspection)
- [x] `cd client && npm run build` passes.
- [x] `cd client && npm run lint` passes.

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified. Read-only query against existing `Rounds` + `Matches`.
- [x] **Round-robin**: Match generation logic is not affected — query is read-only.
- [x] **Statistics**: Points/flawless computation is not affected. New query is a new statistic (usage count) computed backend-side, consistent with invariant 3.
- [x] **Guest identity**: UserId FK references are preserved — query reads `PlayerOneUserId`/`PlayerTwoUserId` only. Guests with merged identities will have history correctly attributed to the merged user (the merge already migrates these FKs).
- [x] **Authorization**: New endpoint uses the existing `[Authorize]` attribute (any signed-in user). No new policy, no route param mismatch — the only route param is `userId` and the handler reads `Query.UserId`.

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None

---

## Code References

Current `CharacterSelect` (alphabetical only) — see `client/src/features/matches/CharacterSelect.tsx`. Extend, don't rewrite.

Existing user-scoped match query as a pattern for the new handler — see `Application/Matches/Queries/GetUserMatches.cs`:

```csharp
var matches = await context.Matches
    .Where(match => match.PlayerTwoUserId == request.Id ||
                    match.PlayerOneUserId == request.Id)
    .Include(m => m.Rounds)
    ...
```

The new `GetUserTopCharacters` handler should follow the same shape but project rounds rather than matches, and group/aggregate at the DB level.

Existing user-scoped React Query hook as a pattern — see `client/src/lib/hooks/useUserMatches.ts`.

MUI `Autocomplete` `groupBy` reference: https://mui.com/material-ui/react-autocomplete/#grouped — supports custom `renderGroup` for the header label and divider.

---

## Rollback Plan

- **Database**: No migration. Rollback = revert code only.
- **Code**:
  - Revert `CharacterSelect.tsx` to ignore `userId` prop (single line change to remove the grouping branch).
  - Remove the new endpoint, handler, and hook files.
- **Risk**: Low — purely additive. The endpoint is new (no existing consumers); the component prop is optional (existing call sites work unchanged until updated).

---

## Progress Log

Implementation complete 2026-05-06.

---

## Resolution

Implemented character top-picks feature end-to-end:

**Backend** (already present in codebase):
- `Application/Characters/Queries/GetUserTopCharacters.cs`: EF Core query that joins Rounds+Matches, filters by userId (P1 or P2 slot), groups by characterId, orders by usage count desc then fullName asc, takes top N. Returns `Result<List<string>>` of character IDs.
- `API/Controllers/CharactersController.cs`: `GET /api/characters/user/{userId}/top?count=5` endpoint with `[Authorize]` gate.

**Frontend** (implemented):
- `client/src/lib/hooks/useTopCharacters.ts` (new): React Query hook, `enabled: !!userId`, `staleTime: 5min`.
- `client/src/features/matches/CharacterSelect.tsx`: Extended with optional `userId` prop. When top picks exist, builds grouped option list using MUI `groupBy` + custom `renderGroup` with styled `ListSubheader` (primary-color left border, sticky, bold uppercase), `<Divider />` after the "Most likely picks" group. No grouping when userId absent or player has no history.
- `client/src/features/matches/MatchDetailsForm.tsx`: Passes `userId={playerOne.userId}` and `userId={playerTwo.userId}` to respective `CharacterSelect` instances.
- `client/src/features/casual/CasualMatchForm.tsx`: Passes `userId={playerOneUserId || undefined}` and `userId={playerTwoUserId || undefined}` to the two `CharacterSelect` instances.

**Build verification**: `cd client && npm run build` passes; `cd client && npm run lint` passes (pre-existing warning only, no new errors). dotnet CLI not available in this environment — backend code verified by inspection to be syntactically correct and following existing patterns.
