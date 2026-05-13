# 045-FEATURE-casual-n-player-integration

**Status**: Backlog
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
- [ ] **Pre-flight audit**: verify the existing `PlayerOneCharacterId` and `PlayerTwoCharacterId` fields on `CreateCasualMatchDto` are already `string` (matching `Character.Id`). If they are `int` anywhere in the chain (DTO, schema, frontend type), surface as a blocker and fix before extending — adding `string?` Three/Four fields beside `int` One/Two would be a silent contract drift (H3 from skeptical review — locked 2026-05-13).
- [ ] `Application/Casual/DTOs/CreateCasualMatchDto.cs` extended with:
  - `int PlayerCount` (required, 2..4)
  - `string? PlayerThreeUserId`, `string? PlayerFourUserId` (optional participants)
  - `string? SecondPlaceUserId`, `string? ThirdPlaceUserId`, `string? FourthPlaceUserId` (optional placements)
  - `string? PlayerThreeCharacterId`, `string? PlayerFourCharacterId` (optional characters; **string**, matching Character.Id type)
  - Existing `PlayerOneCharacterId` / `PlayerTwoCharacterId` change from required to conditionally required (required when `PlayerCount == 2`)
- [ ] `Application/Casual/Validators/CreateCasualMatchValidator.cs` rewritten:
  - `PlayerCount ∈ {2, 3, 4}` required
  - Number of non-null `PlayerXUserId` must equal `PlayerCount` exactly
  - Placement rules: no duplicates, all in PlayerOne..PlayerN participant set, no holes in podium, winner-only mode supported
  - When `PlayerCount == 2`: PlayerOneCharacterId AND PlayerTwoCharacterId required (preserve existing rule); PlayerThree/Four character fields must be null
  - When `PlayerCount > 2`: ALL character fields optional
- [ ] **Two-phase save preserved**: `Application/Casual/Commands/CreateCasualMatch.Handler` keeps the existing pattern of (1) lazy-join CompetitionMember inserts + `SaveChangesAsync`, then (2) Match + Round inserts + `SaveChangesAsync`. **Composite FKs added in 042 (`Match.PlayerThree/Four → CompetitionMember`) require this ordering** — collapsing to a single save risks FK violation on the Match insert. Document this in a code comment.
- [ ] **Lazy-join dedup**: iterate `[PlayerOneUserId, PlayerTwoUserId, PlayerThreeUserId, PlayerFourUserId].Where(NotNull).Distinct()`. Distinct guards against accidental duplicates (also rejected by validator above).
- [ ] Match row populated with PlayerOne..PlayerN columns + WinnerUserId + SecondPlace/Third/FourthPlaceUserId + **`PlayerCount = dto.PlayerCount`**.
- [ ] **Exactly one Round row** is created per Match (single-game pattern, same for all N).
- [ ] Match.Completed = true, Match.RegisteredTime = UtcNow (unchanged).

### Application — Read queries
- [ ] `Application/Matches/Queries/GetUserMatches.cs`: **no changes** — moved to task 042.
- [ ] `Application/Casual/Queries/GetCasualMatches.cs`: add `.Include`s for PlayerThree, PlayerFour (each with `.User`) so N>2 casual matches render correctly in the list view.

### Application — Profile stats (winrate-only)
- [ ] **Do NOT import `PlacementPoints`**. Profile winrate = `1st-places / matches-played` per character and per player.
- [ ] Add or extend a backend query that returns `wins` (count where `winnerUserId == user`) and `matches` (count where user is in PlayerOne..Four). Backend computation only — frontend renders.
- [ ] Verify a 3P or 4P match appears in `UserStats.tsx` for any of the 4 participants (regression on the `GetUserMatches` Where-clause expansion in 042).

### Frontend — Schema + types
- [ ] `client/src/lib/schemas/casualSchema.ts`: extend `casualMatchSchema` with `playerCount: z.union([z.literal(2), z.literal(3), z.literal(4)])` and optional `playerThreeUserId`, `playerFourUserId`, `secondPlaceUserId`, `thirdPlaceUserId`, `fourthPlaceUserId`, `playerThreeCharacterId` (string), `playerFourCharacterId` (string).
- [ ] **Placement validation uses `makeFfaResultSchema` from task 043** — factory pattern, participantsRef read fresh on each refine. The casual schema only adds the character-required-when-N=2 rule on top.
- [ ] `client/src/lib/types/index.d.ts`: confirm `playerThree?: Player; playerFour?: Player; playerCount?: number;` already on `Match` from task 042. Add `playerThreeCharacterId?: string; playerFourCharacterId?: string;` to `Round` if surfaced.

### Frontend — Hook
- [ ] `client/src/lib/hooks/useCasual.ts`: `createCasualMatch` mutation body type extended; no URL change.

### Frontend — Form rewrite
- [ ] `client/src/features/casual/CasualMatchForm.tsx`:
  - Add `PlayerCountToggle` (from task 043) at the top of the Dialog content, RHF-controlled, default 2.
  - When N=2: render existing 2-player form layout (unchanged — character requirement preserved).
  - When N=3 or N=4: render N Autocomplete pickers for participants + N optional `CharacterSelect`s + **`PodiumPickerField` (RHF adapter from 043, NOT bare `usePodiumState`)** with rules `{ requireFullPodium: false, allowWinnerOnly: true }`.
  - **Participant-change reset semantics**: when the user changes a participant via the Autocomplete, `usePodiumState` (consumed inside `PodiumPickerField`) clears placements referencing the removed userId. **Verification AC**: manually test "place P3 second, then change P3 to a different person → 2nd plinth clears, podium re-prompts." This behavior lives in 043 — 045 confirms it works in the casual integration context.
  - Submit serializes the extended DTO into the existing `createCasualMatch.mutateAsync`.
- [ ] Form validates client-side via the extended Zod schema before submit.

### Frontend — Casual list view
- [ ] `client/src/features/casual/CasualPage.tsx`: for each match row, branch on N:
  - N=2: existing 2-player row layout (unchanged)
  - N>2: render `PodiumDisplay` (from task 043) inline, OR a compact "🥇 Lars · 🥈 Per · 🥉 Mia · 4 Ola" line

### Frontend — User-profile stats
- [ ] Points are NOT displayed on the profile.
- [ ] `client/src/features/stats/UserStats.tsx`: render winrates only (per-character and per-player). If a Points column exists today, remove it from profile views.

### Regression / verification
- [ ] Manual: register a NEW N=2 casual match — flow identical to today
- [ ] Manual: register a N=3 casual match with full placement
- [ ] Manual: register a N=4 casual match using winner-only fast-path
- [ ] Manual: register N>2 match without characters — accepted
- [ ] Manual: register N=2 match without characters — rejected
- [ ] Manual: visit user profile for a player who is participant 3 in some matches — those matches now appear in their list
- [ ] Manual: in the form, place P3 as 2nd then change P3 to a different person — 2nd plinth clears (043 behavior; verified here)
- [ ] `dotnet build --configuration Release` passes
- [ ] `cd client && npm run build` passes
- [ ] e2e regression: existing 2P casual flows in `e2e/tests/` still pass

---

## Implementation Steps

### Domain
- [ ] No changes.

### Application
- [ ] **Do NOT import `Application.Common.PlacementPoints`** in this task — profile uses winrate only.
- [ ] `Application/Casual/DTOs/CreateCasualMatchDto.cs`: add `PlayerCount` and the optional N>2 fields per AC. Character ID fields are `string?`, not `int?`.
- [ ] `Application/Casual/Validators/CreateCasualMatchValidator.cs`: rewrite with N-branching rules.
- [ ] `Application/Casual/Commands/CreateCasualMatch.cs`: rewrite handler. Preserve two-phase save (members first, then match). Loop over participants for lazy-join; populate `Match.PlayerOne..PlayerFourUserId` + placements + `Match.PlayerCount`; create exactly one Round.
- [ ] `Application/Casual/Queries/GetCasualMatches.cs`: extend Includes.
- [ ] Profile winrate query: ensure backend computes winrate (1st-places / matches), not points.

### Persistence
- [ ] No changes — Round.PlayerThree/FourCharacterId already added by task 042 (string FKs).

### Infrastructure
- [ ] No changes.

### API
- [ ] No changes — `POST /api/casual` exists; DTO extensions surface automatically.

### Frontend
- [ ] `client/src/lib/schemas/casualSchema.ts`: extend; use `makeFfaResultSchema` factory.
- [ ] `client/src/lib/hooks/useCasual.ts`: extend mutation body type.
- [ ] `client/src/features/casual/CasualMatchForm.tsx`: heavy rewrite using `PodiumPickerField`.
- [ ] `client/src/features/casual/CasualPage.tsx`: branch on N for list row rendering.
- [ ] `client/src/features/stats/UserStats.tsx`: winrate-only rendering.

### Tests
- [ ] Backend integration test: POST `/api/casual` with N=3 payload creates correct Match + Round rows
- [ ] Backend integration test: POST `/api/casual` with winner-only N=4 payload creates Match with WinnerUserId set, placement columns null
- [ ] Backend integration test: `GetUserMatches` returns matches where user is PlayerThree (regression — fix is in 042; test stays here as cross-mode verification)

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

[Filled when complete]
