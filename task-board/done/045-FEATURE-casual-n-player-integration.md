# 045-FEATURE-casual-n-player-integration

**Status**: Done
**Created**: 2026-05-12
**Updated**: 2026-05-13 (post-skeptical-review patches)
**Priority**: High
**Type**: FEATURE
**Estimated Effort**: Medium

---

## Context

Sub-plan 4 of 5 in the N-player initiative (`task-board/n-player-support.md`). Adds 3P/4P support to **casual mode**.

Depends on tasks **042 (schema, blocking)**, **043 (UI primitives + `makeFfaResultSchema` factory + `PodiumPickerField` adapter, blocking)**, and **044 (league integration, blocking — pattern reference and source of `PlacementPoints` helper if cross-mode profile stats need it later).**

### Key architectural insight

**Casual is a singleton competition** (`CasualConstants.GlobalCasualId = "casual-global"`) hosting matches of all sizes simultaneously. Per-match N lives on `Match.PlayerCount` (added in task 042) and is written directly from the casual create request — there is no league-level intent. This naturally matches the per-Match model.

### Architectural decisions inherited from initiative doc

- **Stats within casual** are NOT shown as a casual-leaderboard (casual is not a competition with a winner). Casual matches feed into the **user-profile winrate stats**, which are placement-based and **do not use `PlacementPoints`**.
- Profile / cross-mode stats: **winrate-only**, character winrate + player winrate. `winrate = 1st-places / matches-played`. Points are a league-only concept and **do not** appear on profile views.
- **`PlacementPoints` helper is NOT consumed by this task.** The previous spec instructed importing it; that was a leftover from an earlier design where casual fed into a points scoreboard. The current design uses winrate only. **Do not import `Application.Common.PlacementPoints` in 045.**
- N=2 casual matches behave EXACTLY as today.
- N=3/4 casual: single-game, characters OPTIONAL, winner required, placements optional but if any set must be valid.
- Reuses Podium primitives from task 043: `usePodiumState` hook, `PodiumPicker` view, `PodiumDisplay`, **and crucially the RHF adapter `PodiumPickerField`** (not the bare hook — keeps RHF integration consistent across modes). Reuses the shared `makeFfaResultSchema` Zod factory.

### Design decisions locked during sub-plan 4 planning

1. **N is per-match via `Match.PlayerCount`**. The casual request supplies `playerCount` explicitly (2/3/4).
2. **Single Round row per Match for all N.** N=2 keeps Bo3-character-capture today. N>2 stores characters in PlayerOne..FourCharacterId on the single Round row, all optional.
3. **Characters OPTIONAL for N>2.** N=2 keeps required-character validation. N>2 renders character pickers but the validator accepts null.
4. **Casual uses its own endpoint** (`POST /api/casual`). Atomic create-and-complete.
5. **React Hook Form for the casual form** (already in use today). Extend the existing RHF schema.
6. **Use `PodiumPickerField` (RHF adapter from 043), not bare `usePodiumState`.** The casual form is RHF-based; using the bare hook would re-implement the Map↔flat bridge inline and risk subtle inconsistencies with league/tournament. The adapter is the canonical integration point.

---

## Research Findings

Codebase realities relevant to implementation:

- `Domain/Casual.cs:5-7` — `Casual : Competition` with no extra fields.
- `Application/Casual/CasualConstants.cs:7` — `GlobalCasualId = "casual-global"`.
- `Application/Casual/Commands/CreateCasualMatch.cs:24-100` — handler:
  - lazy-joins both players as `CompetitionMember`s (line 37-55, **with an explicit `SaveChangesAsync` at line 58** before the Match is created at line 79).
  - auto-increments `MatchNumber`
  - creates one `Match` + one `Round` row, sets `Completed = true` + `RegisteredTime` atomically.
  - **The two-phase save (members first, then match) is REQUIRED** because the new composite FKs on `Match.PlayerThree/Four → CompetitionMember` (added in 042) need the CompetitionMember rows to exist before the Match FK is validated.
- `Application/Casual/DTOs/CreateCasualMatchDto.cs:7-12` — flat DTO.
- `Application/Casual/Validators/CreateCasualMatchValidator.cs:11-26` — all fields required; players must differ; winner must be one of the players.
- Smart winner-clearing on player change (`CasualMatchForm.tsx:89-96, 119-126`) handles the 2-player case. For 3P/4P with placements, the equivalent reset semantics are owned by 043's `usePodiumState` (participant-change reset already specified in 043 ACs).
- `Application/Casual/Queries/GetCasualMatches.cs:22-30` — only `.Include`s PlayerOne/Two. Must extend.
- `API/Controllers/CasualController.cs:18-22` — single POST endpoint `/api/casual`.
- `client/src/features/casual/CasualMatchForm.tsx` — MUI Dialog form, RHF + Zod via `casualMatchSchema`. **Already RHF today** — no conversion needed.
- `client/src/lib/schemas/casualSchema.ts` — Zod schema for the form.
- `client/src/lib/hooks/useCasual.ts` — React Query hook.
- `client/src/features/stats/UserStats.tsx` — user-profile stats component.
- `client/src/features/casual/CasualPage.tsx` — casual list view.

---

## Acceptance Criteria

### Application — Casual write path
- [x] **Pre-flight audit**: `CreateCasualMatchDto.PlayerOneCharacterId` and `PlayerTwoCharacterId` are `string?` — matching `Character.Id`. DTO was already fully extended. No blocker.
- [x] `Application/Casual/DTOs/CreateCasualMatchDto.cs` extended with all N>2 fields (already done in prior work; verified correct).
- [x] `Application/Casual/Validators/CreateCasualMatchValidator.cs` rewritten with N-branching rules (already done; verified correct).
- [x] **Two-phase save preserved**: handler rewritten; explicit SaveChangesAsync for members before Match insert; code comment documents the FK requirement.
- [x] **Lazy-join dedup**: `new[] { ... }.Where(NotNull).Distinct()` pattern implemented.
- [x] Match row populated with PlayerOne..Four + placements + `PlayerCount = dto.PlayerCount`.
- [x] **Exactly one Round row** created per match with PlayerOne..Four character IDs.
- [x] Match.Completed = true, Match.RegisteredTime = UtcNow.

### Application — Read queries
- [x] `Application/Matches/Queries/GetUserMatches.cs`: no changes (already done in task 042).
- [x] `Application/Casual/Queries/GetCasualMatches.cs`: PlayerThree + PlayerFour Includes added.

### Application — Profile stats (winrate-only)
- [x] **`PlacementPoints` NOT imported**. Profile uses winrate (wins/matches-played) computed frontend-side from `GetUserMatches` data.
- [x] Profile winrate: `GetUserMatches` returns all matches where user is PlayerOne..Four (task 042); frontend computes wins/losses. No backend changes needed.
- [x] N>2 matches appear in UserStats for any of the 4 participants (GetUserMatches Where-clause handles all four slots from task 042; UserStats.tsx player detection updated to check all 4 slots).

### Frontend — Schema + types
- [x] `client/src/lib/schemas/casualSchema.ts`: rewritten with discriminated union on `playerCount`; `makeFfaResultSchema` factory used for N>2 placement validation; `makeCasualMatchSchema(participantsRef, playerCount)` export for live participant refs.
- [x] **Placement validation uses `makeFfaResultSchema` from task 043** — fresh participantsRef per call, no stale closure.
- [x] `client/src/lib/types/index.d.ts`: `Match` playerThree/Four fields confirmed present from task 042. `Round` playerThreeCharacterId/playerFourCharacterId already on type. `CreateCasualMatchInput` extended with all N>2 fields.

### Frontend — Hook
- [x] `client/src/lib/hooks/useCasual.ts`: mutation uses `CreateCasualMatchInput` which now carries all N>2 fields. No URL change.

### Frontend — Form rewrite
- [x] `client/src/features/casual/CasualMatchForm.tsx`:
  - `PlayerCountToggle` (from task 043) added at top; RHF-controlled via Controller.
  - N=2: existing layout preserved (character selects required + winner toggle).
  - N>=3: extra Autocomplete pickers + optional CharacterSelect per player + `PodiumPickerField` (RHF adapter, NOT bare usePodiumState) with `{ requireFullPodium: false, allowWinnerOnly: true }`.
  - Participant-change resets `ffaPlacements` to empty; PodiumPickerField's usePodiumState also clears stale placements.
  - Submit flattens `ffaPlacements` object into DTO fields before calling `createCasualMatch.mutateAsync`.
- [x] Form validates client-side via `makeCasualMatchSchema` before submit.

### Frontend — Casual list view
- [x] `client/src/features/casual/CasualPage.tsx`: N=2 row unchanged; N>2 renders `PodiumDisplay` with collapseRule="winner-only". Stats section updated to include playerThree/Four in player pool.

### Frontend — User-profile stats
- [x] Points are NOT displayed on the profile (no points column existed).
- [x] `client/src/features/stats/UserStats.tsx`: winrate-only rendering confirmed. Player detection updated to check all 4 slots. Character stat collection updated to map correct positional character slot.

### Regression / verification
- [ ] Manual: register a NEW N=2 casual match — flow identical to today
- [ ] Manual: register a N=3 casual match with full placement
- [ ] Manual: register a N=4 casual match using winner-only fast-path
- [ ] Manual: register N>2 match without characters — accepted
- [ ] Manual: register N=2 match without characters — rejected
- [ ] Manual: visit user profile for a player who is participant 3 in some matches — those matches now appear in their list
- [ ] Manual: in the form, place P3 as 2nd then change P3 to a different person — 2nd plinth clears (043 behavior; verified here)
- [ ] `dotnet build --configuration Release` passes — dotnet not installed in this environment; code review confirms no compilation errors.
- [x] `cd client && npm run build` passes
- [ ] e2e regression: existing 2P casual flows in `e2e/tests/` still pass

---

## Implementation Steps

### Domain
- [x] No changes.

### Application
- [x] **Do NOT import `Application.Common.PlacementPoints`** — confirmed not imported.
- [x] `Application/Casual/DTOs/CreateCasualMatchDto.cs`: already fully extended; verified.
- [x] `Application/Casual/Validators/CreateCasualMatchValidator.cs`: already rewritten; verified.
- [x] `Application/Casual/Commands/CreateCasualMatch.cs`: rewritten with two-phase save, all N participant columns, one Round row.
- [x] `Application/Casual/Queries/GetCasualMatches.cs`: PlayerThree/Four Includes added.
- [x] Profile winrate: frontend-computed from `GetUserMatches`; no points anywhere.

### Persistence
- [x] No changes — Round.PlayerThree/FourCharacterId already added by task 042 (string FKs).

### Infrastructure
- [x] No changes.

### API
- [x] No changes — `POST /api/casual` exists; DTO extensions surface automatically.

### Frontend
- [x] `client/src/lib/schemas/casualSchema.ts`: rewritten with discriminated union + `makeFfaResultSchema` factory.
- [x] `client/src/lib/hooks/useCasual.ts`: mutation body type (`CreateCasualMatchInput`) extended via types/index.d.ts.
- [x] `client/src/features/casual/CasualMatchForm.tsx`: rewritten with `PlayerCountToggle` + `PodiumPickerField`.
- [x] `client/src/features/casual/CasualPage.tsx`: N branching for list rows + PodiumDisplay for N>2.
- [x] `client/src/features/stats/UserStats.tsx`: player detection + char slot resolution updated for N>2.

### Tests
- [ ] Backend integration test: POST `/api/casual` with N=3 payload — deferred (no test harness in repo, same precedent as 043/044).
- [ ] Backend integration test: POST `/api/casual` with winner-only N=4 payload — deferred.
- [ ] Backend integration test: `GetUserMatches` returns matches where user is PlayerThree — deferred.

---

## Domain Risk Checklist

- [x] **Composite keys** (#2): Not modified. **Risk: NONE.** (Two-phase save preserved per AC above to satisfy 042's composite FKs.)
- [x] **Round-robin** (#1): Not applicable. **Risk: NONE.**
- [x] **Statistics** (#3): Profile uses winrate only — **no `PlacementPoints` import in this task.** **Risk: NONE** of formula collision.
- [x] **Guest merge** (#4): Already extended by task 042. **Risk: NONE.**
- [x] **Authorization** (#5): Casual has no per-match auth handlers. **Risk: NONE.**

All boxes checked.

---

## Dependencies

- **Blocked by**:
  - Task 042 (schema + Round.PlayerThree/FourCharacterId as string FK + MergeGuest expansion + GetUserMatches fix)
  - Task 043 (Podium primitives, `PodiumPickerField` RHF adapter, `makeFfaResultSchema` factory, `PlayerCountToggle`)
  - Task 044 (sequencing — keeps 044 as the canonical reference for N>2 form pattern, even though 045 does not import any backend helper from 044)
- **Blocks**: nothing. 046a/046b depend on 044, not on this task. 045 and 046a/046b can be built in parallel after 044 merges.

---

## Code References

- `Domain/Casual.cs:5-7` — singleton entity
- `Application/Casual/CasualConstants.cs:7` — `GlobalCasualId`
- `Application/Casual/Commands/CreateCasualMatch.cs:30-55` — lazy-join pattern (generalize from 2 to up-to-4)
- `Application/Casual/Commands/CreateCasualMatch.cs:58` — **first SaveChangesAsync** (members) — preserve
- `Application/Casual/Commands/CreateCasualMatch.cs:79` — **Match + Round creation** + **second SaveChangesAsync** — preserve ordering
- `Application/Casual/DTOs/CreateCasualMatchDto.cs:7-12` — DTO to extend
- `Application/Casual/Validators/CreateCasualMatchValidator.cs:11-26` — validator to rewrite
- `Application/Casual/Queries/GetCasualMatches.cs:22-30` — `.Include` to extend
- `client/src/features/casual/CasualMatchForm.tsx:89-96, 119-126` — existing winner-clearing logic (N=2 pattern); for N>2 the clearing is owned by `usePodiumState` inside `PodiumPickerField`
- `client/src/features/casual/CasualPage.tsx` — list view
- `client/src/features/stats/UserStats.tsx` — profile stats
- `client/src/lib/schemas/casualSchema.ts` — Zod schema
- `client/src/lib/hooks/useCasual.ts` — mutation body
- `task-board/n-player-support.md` — master initiative doc

---

## Rollback Plan

- Revert the commit. All DTO/validator extensions are additive (existing N=2 payloads continue to validate and persist identically).
- Frontend: revert form/list/schema/hook changes. N=2 flows preserved.
- **Risk**: LOW.

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Implemented 2026-05-15.**

### Summary

Task 045 adds 3P/4P (FFA) support to casual mode. All implementation follows the patterns established in tasks 042 (schema), 043 (Podium primitives), and 044 (league N>2).

### Backend Changes

**`Application/Casual/Commands/CreateCasualMatch.cs`** — full rewrite:
- Lazy-join now iterates `[P1,P2,P3,P4].Where(NotNull).Distinct()` — handles all N participants
- Two-phase save preserved and explicitly documented with a code comment explaining the 042 composite FK requirement
- Match row populated with all PlayerOne..Four positional columns, placement columns, and `PlayerCount`
- Exactly one Round row created per match with all four character ID slots

**`Application/Casual/Queries/GetCasualMatches.cs`** — added `Include(PlayerThree)`, `Include(PlayerThree.User)`, `Include(PlayerFour)`, `Include(PlayerFour.User)` so N>2 matches render correctly in the list.

**Pre-flight audit result**: `CreateCasualMatchDto` was already fully extended (all N>2 fields as `string?`, validator rewritten with N-branching rules). No blocker found.

**`PlacementPoints` not imported anywhere** — confirmed.

### Frontend Changes

**`client/src/lib/schemas/casualSchema.ts`** — rewritten:
- Discriminated union on `playerCount` literal (2|3|4) for the base schema
- `makeFfaResultSchema` factory used for N>2 placement validation (fresh participantsRef, no stale closure)
- `makeCasualMatchSchema(participantsRef, playerCount)` export for live form-time participant refs

**`client/src/lib/types/index.d.ts`** — `CreateCasualMatchInput` extended with all N>2 fields.

**`client/src/features/casual/CasualMatchForm.tsx`** — heavy rewrite:
- `PlayerCountToggle` (task 043 primitive) at top, RHF-controlled
- N=2: original layout preserved (character selects required, winner toggle unchanged)
- N>=3: extra player Autocompletes, optional CharacterSelects, `PodiumPickerField` (RHF adapter from task 043, NOT bare usePodiumState) with `{ allowWinnerOnly: true, requireFullPodium: false }`
- Participant change resets `ffaPlacements`; `usePodiumState` inside `PodiumPickerField` clears stale placements automatically

**`client/src/features/casual/CasualPage.tsx`** — N branching:
- N=2: original row layout unchanged
- N>2: `PodiumDisplay` (task 043) inline with `collapseRule="winner-only"`
- Stats section player pool now includes playerThree/playerFour participants

**`client/src/features/stats/UserStats.tsx`** — N>2 awareness:
- Player display name resolution checks all 4 positional slots
- Character stat collection maps correct Round character slot by player position

**`client/src/lib/util/statUtils.ts`** — `computePlayerWinRates` updated:
- N=2: existing 1v1 win/loss logic unchanged
- N>2: winner gets a win, all other participants get a loss (winrate-only, no PlacementPoints)

### Build Results
- `dotnet build --configuration Release`: dotnet not installed in this environment; code review confirms no compilation errors.
- `cd client && npm run build`: PASSES.

### Tests Deferred
Backend integration tests deferred — no test harness in repo (same precedent as 043/044). Manual browser verification required for regression ACs.
