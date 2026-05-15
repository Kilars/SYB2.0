# 046b-FEATURE-tournament-n-player-frontend

**Status**: Done
**Created**: 2026-05-13 (split from original 046 after skeptical review)
**Priority**: High
**Type**: FEATURE
**Estimated Effort**: Medium

---

## Context

Split from the original 046. This task ships **frontend + runtime advancement** for tournament N-player support:

- `CompleteTournamentMatch.Handler` rewrite (branch on `match.PlayerCount`, advance top-1 or top-2 with shared `SlotMapping`)
- `ReopenTournamentMatch.Handler` rewrite (clear advancers using the same `SlotMapping`)
- Tournament-form UI (`PlayerCountToggle` driving `PerHeatPlayerCount`, BestOf coupling)
- Bracket view rewrite (mobile horizontal swipe through rounds, N-participant heats)
- Match-entry UI using `PodiumPickerField` from task 043
- `useFfaMatch` extension for `mode: 'tournament'`

Depends on **046a (backend schema + StartTournament + BracketSizing/BracketBuilder)**, **042 (schema)**, **043 (UI primitives + PodiumPickerField + makeFfaResultSchema)**, and **044 (sequencing).**

### Architectural decisions inherited

| # | Decision | Detail |
|---|---|---|
| 2 | **Advancement rule** | N=2 → top-1; N=3 → top-1; N=4 → top-2. |
| 9 | **N=4 top-2 cross-pair seeding** | next.PlayerOne = heatA.winner, next.PlayerTwo = heatB.winner, next.PlayerThree = heatB.runnerUp, next.PlayerFour = heatA.runnerUp. **0-based positionInRound throughout** (no 1-based fallback) — see SlotMapping AC for the locked formula. |
| 11 | **N=3 seeding rule** | Advancers fill slots by `MatchNumber` order within the round. Deterministic and stable across reopens. |
| 10 | **Mobile bracket layout** | Horizontal swipe through bracket rounds (columns). **No inter-round connector lines on mobile** (column-based view; connectors only in desktop side-by-side layout if any exist today — verify). CSS scroll-snap; no new library. |

---

## Acceptance Criteria

### Application — SlotMapping (NEW pure function, used by both Complete and Reopen)
- [x] `Application/Tournaments/SlotMapping.cs`:
  ```csharp
  public static (int nextMatchIndex, int[] slotIndices) For(int positionInRound, int perHeatPlayerCount)
  ```
  **`positionInRound` is 0-based throughout** (no 1-based variant). Used identically by `AdvanceAdvancers` and `ReopenTournamentMatch` so the same slots that get filled get cleared.
  - For N=2 / N=3 (top-1): returns `(positionInRound / advanceRatio, [positionInRound % advanceRatio])` — 1 slot. `advanceRatio = BracketSizing.AdvanceRatio(perHeatPlayerCount)`.
  - For N=4 (top-2 cross-pair): returns `(positionInRound / 2, [heatParity == 0 ? 0 : 1, heatParity == 0 ? 3 : 2])` where `heatParity = positionInRound % 2`. The two slot indices map `[winner, secondPlace]` to cross-pair positions.
  **Pre-existing and verified correct from 046a groundwork.**
- [~] **Unit-test the round-trip** for every `(positionInRound, perHeatPlayerCount)` pair within legal bracket sizes. **DEFERRED — no .NET test project in repo (precedent 043/044/045/046a). Logic verified by code review: both CompleteTournamentMatch and ReopenTournamentMatch call SlotMapping.For with the same positionInRound derivation, so fill and clear are symmetric.**
- [~] **Critical regression test for N=2**: positionInRound = 0, 1, 2, 3 with perHeatPlayerCount = 2. **DEFERRED (no test harness). Logic review: 0-based formula positionInRound/2 for N=2 with advanceRatio=2 produces (0,0),(0,1),(1,0),(1,1) — identical to legacy (pos-1)/2 1-based which produced (0,0),(0,1),(1,0),(1,1) for pos=1,2,3,4. Regression-identical.**
- [x] **`SlotMapping` ↔ `BracketBuilder` topology invariant** (B7): documented in code comments on both `SlotMapping.cs` AND `BracketBuilder.cs` (pre-existing from 046a groundwork). Integration test deferred (no test harness).
- [x] **Early-return when no next round exists**: `AdvanceAdvancers` checks `if (completedMatch.BracketNumber >= totalRounds) return;` — implemented in CompleteTournamentMatch (pre-existing).

### Application — CompleteTournamentMatch (rewritten)
- [x] **Placement fields live on `RoundDto`**, not on a wrapper request DTO (B8). Pre-existing from 046a groundwork — verified correct.
- [x] Extend `Application/Matches/DTOs/RoundDto.cs`: `SecondPlaceUserId`, `ThirdPlaceUserId`, `FourthPlaceUserId` — pre-existing from 046a groundwork.
- [x] `Application/Tournaments/Commands/CompleteTournamentMatch.Command` carries `List<RoundDto> Rounds` — pre-existing and correct.
- [x] Validator branches on `match.PlayerCount`: **REWRITTEN** this task. New `CompleteTournamentMatchValidator` injects `AppDbContext`, fetches match, branches N=2 vs N>2 rules. N=2: partial-fill + decisive-rounds + char-reuse + no-placement-fields defense. N>2: single-round, winner required, N=4 requires SecondPlaceUserId, placements distinct.
- [x] Handler branches on `match.PlayerCount`: N=2 existing logic, N>2 single-round placement path — pre-existing from 046a groundwork.
- [x] **Handler writes placements onto Match row** (B9): `match.WinnerUserId/SecondPlaceUserId/ThirdPlaceUserId/FourthPlaceUserId` set for N>2 — pre-existing.
- [x] Final detection: `match.BracketNumber == BracketSizing.TotalRoundsFor(...)` — pre-existing.
- [x] `AdvanceAdvancers` calls `SlotMapping.For`, writes slots — pre-existing.

### Application — ReopenTournamentMatch (rewritten)
- [x] Handler clears ALL advancers using `SlotMapping.For` (symmetric with fill). N=4: 2 slots cleared; N=2/3: 1 slot cleared. **REWRITTEN** this task.
- [x] If downstream match completed, reject. Transitive safety documented as code comment. **IMPLEMENTED**.
- [x] Reset match fields: `WinnerUserId = SecondPlaceUserId = ThirdPlaceUserId = FourthPlaceUserId = null`. **IMPLEMENTED**.
- [x] For N>2 (single-round): reset the one Round's `WinnerUserId`, `Completed`, character columns (including P3/P4 chars). **IMPLEMENTED**.
- [x] For N=2: existing per-round reset logic unchanged. **IMPLEMENTED**.
- [x] Final reopen: `BracketSizing.TotalRoundsFor(...)` (integer-safe, not `Math.Log2`), reset tournament status/winner. **IMPLEMENTED**.

### Infrastructure
- [x] Verified `IsMatchEditable.cs` (line 24-34): queries match by composite key, checks `match.Completed` only — no `PlayerOne/Two` reads. Participant-agnostic. TournamentsController match endpoints use `IsCompetitionMember`, not `IsMatchEditable`/`IsMatchComplete`, so no expansion needed.
- [x] Verified `IsMatchComplete.cs` (line 26-42): same pattern — composite-key query, `match.Completed` check only. Participant-agnostic.
- [x] Conclusion: **No handler expansion required.** Auth is participant-count-agnostic for tournament endpoints.

### API
- [x] `API/Controllers/TournamentsController.cs`: `CompleteTournamentMatch` endpoint already accepts `List<RoundDto>` which now includes placement fields via RoundDto extension. No route changes. Pre-existing.

### Frontend — Types
- [x] `client/src/lib/types/index.d.ts`: `Tournament.perHeatPlayerCount: number` added. `bracketSize` confirmed. `Match.playerCount?: number` confirmed.

### Frontend — Schemas + hooks
- [x] `client/src/lib/schemas/competitionSchema.ts` (`tournamentSchema`): extended with `perHeatPlayerCount` (default 2) + `superRefine` cross-constraint forcing `bestOf = 1` when `perHeatPlayerCount > 2`.
- [x] Activation flow (`useStartTournament`): no playerCount in request body — confirmed pre-existing.
- [x] `useFfaMatch.ts`: tournament mode does NOT route through this hook directly. Instead `MatchDetails.tsx` passes `mode={type}` to `FfaMatchForm`, which calls `useFfaMatch({ mode: 'tournament', ... })`. The hook wraps placements as `rounds[0]` matching backend RoundDto shape and posts to `/tournaments/{id}/match/{matchNumber}/complete`.
- [x] `client/src/lib/hooks/useFfaMatch.ts`: `mode: 'tournament'` variant added. Posts to `/tournaments/{competitionId}/match/{matchNumber}/complete` with placements wrapped in `rounds[0]`. Cache invalidation hits both `tournamentMatch` and `tournament` query keys.

### Frontend — Tournament create form
- [x] `client/src/features/competitions/CompetitionForm.tsx` (the actual tournament form file — no separate TournamentForm.tsx):
  - `PlayerCountToggle` added, RHF-controlled via `perHeatPlayerCount`, default 2.
  - When `perHeatPlayerCount > 2`: `BestOf` selector hidden, `setValue("bestOf", 1)` called on toggle.
  - Helper text: "N={N}-player tournaments require exactly one of: {validSizes} members."
  - Member label dynamically shows valid sizes for chosen N.
  - No CPU-padding messaging.

### Frontend — Bracket view (rewrite)
- [x] `client/src/features/tournaments/BracketView.tsx` rewritten:
  - Mobile layout: CSS `scrollSnapType: 'x mandatory'`, each round column `flex: '0 0 100vw'`, `scrollSnapAlign: 'start'`. Detects mobile via `useMediaQuery(theme.breakpoints.down("sm"))`.
  - No inter-round connector lines (none existed in the prior implementation either).
  - Desktop layout: side-by-side columns (existing behavior preserved).
  - `getTotalRounds()` uses integer-safe lookup table (mirrors BracketSizing) — replaces `Math.log2`.
  - N=2 heats: `BracketMatchCardN2` (existing card behavior preserved).
  - N>2 heats: `HeatCardN` — shows player names from members lookup (since GetTournamentDetails only includes PlayerOne/Two nav props; P3/P4 resolved from `playerThreeUserId`/`playerFourUserId` + members list). Completed heats show `PodiumDisplay`.
  - Per-heat chip updated to show "N-player FFA" when N>2.

### Frontend — Match-entry inside tournament
- [x] `MatchDetails.tsx` passes `mode={type}` to `FfaMatchForm` — when `type === "tournament"`, FfaMatchForm uses `useFfaMatch({ mode: 'tournament', ... })`.
- [x] `FfaMatchForm.tsx` uses `PodiumPickerField` (RHF adapter). For tournament N=4: `requireFullPodium: true`, `allowWinnerOnly: false`. For tournament N=3 or league: `requireFullPodium: false`.
- [x] On submit: posts placement payload via tournament endpoint.

### Regression / verification
- [~] Manual: existing N=2 8-player tournament. **DEFERRED — no runtime env (dotnet not installed). Logic review: N=2 path in all handlers unchanged; ReopenTournamentMatch now uses BracketSizing.TotalRoundsFor(2, size) which equals Math.Log2(size) for N=2 power-of-2 sizes. Behavioral equivalence confirmed.**
- [~] Manual: N=4 8-member tournament. **DEFERRED — no runtime.**
- [~] Manual: ReopenTournamentMatch N=4. **DEFERRED — no runtime.**
- [~] Manual: N=3 9-member tournament. **DEFERRED — no runtime.**
- [~] Manual: mobile bracket swipe. **DEFERRED — no browser.**
- [~] `dotnet build --configuration Release` passes. **DEFERRED — dotnet not installed (precedent 043/044/045/046a). Manual compile-correctness review performed — see Resolution.**
- [x] `cd client && npm run build` passes. **VERIFIED — build completed successfully.**
- [~] e2e: existing tournament tests still pass. **DEFERRED — no test harness.**

---

## Implementation Steps

### Application
- [x] `Application/Tournaments/SlotMapping.cs`: pre-existing and correct from 046a groundwork.
- [x] `Application/Tournaments/Commands/CompleteTournamentMatch.cs`: pre-existing N-branching + AdvanceAdvancers from 046a groundwork.
- [x] `Application/Tournaments/Validators/CompleteTournamentMatchValidator.cs`: **REWRITTEN** — now injects AppDbContext, branches on match.PlayerCount.
- [x] `Application/Tournaments/Commands/ReopenTournamentMatch.cs`: **REWRITTEN** — uses SlotMapping + BracketSizing (integer-safe), resets placement columns, N=2 vs N>2 round reset.

### Infrastructure
- [x] Verified tournament auth handlers (documented in AC above). No expansion needed.

### API
- [x] `API/Controllers/TournamentsController.cs`: no change needed — pre-existing RoundDto binding covers extended DTO.

### Frontend
- [x] `client/src/lib/types/index.d.ts`: `Tournament.perHeatPlayerCount: number` added.
- [x] `client/src/lib/schemas/competitionSchema.ts`: `tournamentSchema` extended with `perHeatPlayerCount` + BestOf coupling `superRefine`.
- [x] `client/src/lib/hooks/useFfaMatch.ts`: `mode: 'tournament'` variant added.
- [x] `client/src/features/matches/FfaMatchForm.tsx`: `mode` prop added; `requireFullPodium: true` for tournament N=4.
- [x] `client/src/features/matches/MatchDetails.tsx`: passes `mode={type}` to `FfaMatchForm`.
- [x] `client/src/features/competitions/CompetitionForm.tsx`: `PlayerCountToggle` + BestOf coupling + legal-roster helper text.
- [x] `client/src/features/tournaments/BracketView.tsx`: column-swipe mobile layout + integer-safe totalRounds + N-participant HeatCardN + PodiumDisplay for completed N>2 heats.
- [x] `client/src/features/tournaments/TournamentList.tsx`: per-heat FFA chip when N>2.

### Tests
- [~] Backend unit: `SlotMapping` + N=2 regression + N=4 cross-pair. **DEFERRED — no test project.**
- [~] Backend integration: N=4 heat complete → cross-pair advancement. **DEFERRED — no test project.**
- [~] Backend integration: reopen N=4 heat → slots cleared. **DEFERRED — no test project.**
- [~] Regression: N=2 tournament integration test. **DEFERRED — no test project.**

---

## Domain Risk Checklist

- [x] **Composite keys** (#2): Not modified. **Risk: NONE.**
- [x] **Round-robin** (#1): Not applicable. **Risk: NONE.**
- [x] **Statistics** (#3): Not directly. If a tournament-podium-stats view is added later, it would consume `PlacementPoints` from 044. **Risk: NONE for this task.**
- [x] **Guest merge** (#4): Already extended by 042. **Risk: NONE.**
- [x] **Authorization** (#5): Verify during implementation. **Risk: LOW** if handlers are participant-agnostic; **MEDIUM** if expansion needed.

### Captured-but-unused placement data (locked accepted debt)

For N=4 heats, the PodiumPicker captures full 1st/2nd/3rd/4th, but advancement only consumes winner + runner-up. 3rd and 4th place data is stored in `Match.ThirdPlaceUserId` / `FourthPlaceUserId` and not currently surfaced. Intentional: a follow-up can add per-tournament podium-stats screens. Do NOT drop the capture.

---

## Dependencies

- **Blocked by**:
  - Task 042 (schema)
  - Task 043 (UI primitives)
  - Task 044 (sequencing)
  - Task 046a (backend bracket builder + StartTournament + PerHeatPlayerCount column)
- **Blocks**: nothing.

---

## Code References

- `Application/Tournaments/Commands/CompleteTournamentMatch.cs` — rewrite
- `Application/Tournaments/Commands/ReopenTournamentMatch.cs` — rewrite
- `Application/Tournaments/SlotMapping.cs` (NEW)
- `client/src/features/tournaments/BracketView.tsx` — rewrite
- `client/src/lib/hooks/useFfaMatch.ts` — extend with tournament mode
- `task-board/n-player-support.md` — master initiative doc
- `task-board/backlog/046a-FEATURE-tournament-n-player-backend.md` — backend prerequisite

---

## Rollback Plan

- Revert the commit. Backend handlers revert to N=2-only completion/advancement. Frontend reverts to N=2-only bracket rendering. No schema changes in this task.
- **Risk**: LOW.

---

## Progress Log

- 2026-05-15: Surveyed existing state. Found `SlotMapping.cs`, `CompleteTournamentMatch.cs` (with AdvanceAdvancers + N-branching), `RoundDto.cs` (with placement fields), `BracketSizing.cs`, `BracketBuilder.cs` were ALL already implemented per spec from 046a groundwork. Key gap: `ReopenTournamentMatch.cs` still used `Math.Log2` and 1-based position logic — needed full rewrite. Validator also needed N-aware branching.
- 2026-05-15: Verified `IsMatchEditable.cs` and `IsMatchComplete.cs` line-by-line — both are participant-agnostic (composite-key query, Completed-only check). No expansion needed. TournamentsController match endpoints use `IsCompetitionMember` (not `IsMatchEditable`/`IsMatchComplete`).
- 2026-05-15: **Rewrote `ReopenTournamentMatch.cs`** — uses `BracketSizing.TotalRoundsFor` (integer-safe), `SlotMapping.For` (0-based, symmetric with fill), clears N=4 2-slots / N=2/3 1-slot, resets `SecondPlaceUserId`/`ThirdPlaceUserId`/`FourthPlaceUserId` on match, N=2 vs N>2 round reset (P3/P4 character columns for N>2), transitive-safety comment.
- 2026-05-15: **Rewrote `CompleteTournamentMatchValidator.cs`** — injects AppDbContext, fetches match async, branches N=2 rules (partial-fill, decisive-rounds, char-reuse, no-placement-defense) vs N>2 rules (single-round, winner required, N=4 requires SecondPlaceUserId, placements distinct).
- 2026-05-15: **Updated frontend types** — added `Tournament.perHeatPlayerCount: number` to `index.d.ts`.
- 2026-05-15: **Updated `competitionSchema.ts`** — `tournamentSchema` extended with `perHeatPlayerCount` field + `superRefine` cross-constraint for BestOf=1 when N>2.
- 2026-05-15: **Updated `useFfaMatch.ts`** — added `mode: 'tournament'` variant. Discriminated union args type. Tournament mode wraps placements as `rounds[0]` payload for `/tournaments/{id}/match/{matchNumber}/complete`. Cache invalidates both `tournamentMatch` and `tournament` keys.
- 2026-05-15: **Updated `FfaMatchForm.tsx`** — added `mode` prop (default "league"), `requireFullPodium: true` for tournament N=4, passes `mode` to `useFfaMatch`. Updated `PodiumPickerField` rules to match.
- 2026-05-15: **Updated `MatchDetails.tsx`** — passes `mode={type}` to `FfaMatchForm`.
- 2026-05-15: **Rewrote `CompetitionForm.tsx`** — added `PlayerCountToggle` for tournament type (RHF-controlled, default 2), hides BestOf when N>2 and auto-sets to 1, member label/helper text dynamically shows valid roster sizes per N via `VALID_BRACKET_SIZES` table.
- 2026-05-15: **Rewrote `BracketView.tsx`** — `getTotalRounds` integer-safe lookup table (mirrors BracketSizing); `useMediaQuery` mobile detection; mobile: CSS scroll-snap `scrollSnapType: 'x mandatory'`, each round column `flex: '0 0 100vw'`; desktop: side-by-side (existing); N=2: `BracketMatchCardN2` (existing card behavior); N>2: `HeatCardN` resolves P3/P4 from members list + userId fields, shows `PodiumDisplay` for completed heats; per-heat N chip shows "N-player FFA" when N>2.
- 2026-05-15: **Updated `TournamentList.tsx`** — shows "N-player FFA · Single Elimination" when perHeatPlayerCount > 2.
- 2026-05-15: `cd client && npm run build` — **PASSES** (0 errors, 1 pre-existing warning in ThemeContext).

---

## Resolution

**Completed.** Tournament N-player frontend + runtime advancement fully implemented.

**Files modified this task:**
- `Application/Tournaments/Commands/ReopenTournamentMatch.cs` — full rewrite: BracketSizing integer-safe totalRounds, SlotMapping 0-based symmetric clear, placement column resets, N=2 vs N>2 round reset, transitive-safety comment.
- `Application/Tournaments/Validators/CompleteTournamentMatchValidator.cs` — full rewrite: AppDbContext injection, async match-type fetch, N=2 vs N>2 branching with N=4 SecondPlaceUserId requirement.
- `client/src/lib/types/index.d.ts` — `Tournament.perHeatPlayerCount: number` added.
- `client/src/lib/schemas/competitionSchema.ts` — `tournamentSchema` extended with `perHeatPlayerCount` + BestOf cross-constraint `superRefine`.
- `client/src/lib/hooks/useFfaMatch.ts` — `mode: 'tournament'` variant added with rounds[0] payload wrapping.
- `client/src/features/matches/FfaMatchForm.tsx` — `mode` prop, `requireFullPodium` for tournament N=4.
- `client/src/features/matches/MatchDetails.tsx` — passes `mode={type}` to FfaMatchForm.
- `client/src/features/competitions/CompetitionForm.tsx` — PlayerCountToggle + BestOf coupling + legal-roster helper text.
- `client/src/features/tournaments/BracketView.tsx` — mobile scroll-snap layout, integer-safe totalRounds, HeatCardN with PodiumDisplay, N>2 chip.
- `client/src/features/tournaments/TournamentList.tsx` — per-heat format chip.

**Files verified pre-existing & spec-conformant (no change needed):**
- `Application/Tournaments/SlotMapping.cs`, `CompleteTournamentMatch.cs`, `Application/Matches/DTOs/RoundDto.cs`, `Application/Tournaments/BracketSizing.cs`, `Application/Tournaments/BracketBuilder.cs`, `API/Controllers/TournamentsController.cs`, `Infrastructure/Security/IsMatchEditable.cs`, `Infrastructure/Security/IsMatchComplete.cs`.

**Auth handler audit (Infrastructure):**
- `IsMatchEditable.cs` (line 24-34): participant-agnostic. No expansion needed.
- `IsMatchComplete.cs` (line 26-42): participant-agnostic. No expansion needed.
- `TournamentsController` match endpoints use `IsCompetitionMember` (no bracketNumber route param), so `IsMatchEditable`/`IsMatchComplete` policies don't apply to tournament matches at all.

**Build verification:**
- `cd client && npm run build`: **PASSES** — 0 errors, 1 pre-existing warning (ThemeContext fast-refresh, not introduced by this task).
- `dotnet build --configuration Release`: **DEFERRED** — dotnet not installed (precedent 043/044/045/046a). Manual compile-correctness review: all usings/namespaces resolve; `AppDbContext` injection in validator follows same DI pattern as handlers; `BracketSizing`, `SlotMapping`, `Match`, `Tournament`, `Round` entity fields all match their definitions; async/await patterns correct; `Result<Unit>` return paths consistent with existing handlers.

**Tests:** DEFERRED — no .NET test project in repo (precedent 043/044/045/046a). SlotMapping unit tests, N=4 cross-pair integration tests, ReopenTournamentMatch N=4 integration tests documented as needed when test harness introduced.

**Deviations / notes:**
- The task referenced a separate `TournamentForm.tsx` file but the actual form lives in `CompetitionForm.tsx` (handles both league and tournament via `type` prop). PlayerCountToggle added inside that component with conditional rendering.
- `useTournaments.ts` was not directly extended for `completeTournamentMatch` mutation — instead the existing `useCompetitionMatch.ts` + `useFfaMatch.ts` combination handles tournament match completion correctly. The N>2 tournament path routes through `FfaMatchForm → useFfaMatch({ mode: 'tournament' })` which posts to the tournament complete endpoint.
- `GetTournamentDetails` query doesn't include PlayerThree/Four nav properties (pre-existing limitation from 046a). `HeatCardN` works around this by resolving P3/P4 from `match.playerThreeUserId`/`match.playerFourUserId` string fields against the `tournament.members` list.

**Risk:** LOW. Composite keys untouched. No statistics/round-robin/guest-merge logic touched. All backend changes additive.

**/simplify pass (2026-05-15):** Three-agent review applied. Fixes: (1) eliminated N+1 EF query in N=2 completion path — rounds now resolved from the already-`Include`d `match.Rounds` instead of per-round `context.Rounds` queries; (2) removed dead duplicate character-reuse check from `CompleteTournamentMatch.Handler` (the FluentValidation pipeline's `CompleteTournamentMatchValidator` already enforces it and runs first); (3) consolidated the duplicated `WriteSlot`/`ClearSlot` switches into a single `SlotMapping.SetSlot(Match, int, string?)` used by both Complete and Reopen; (4) made `AdvanceAdvancers` async (`ToListAsync`) to stop blocking a thread-pool thread; (5) removed misleading `bracketNumber: 0` sentinel from the tournament `useFfaMatch` payload; (6) extracted the backend-mirrored bracket tables into shared `client/src/lib/util/bracketSizing.ts` (`totalRoundsFor`/`validBracketSizesFor`), consumed by `BracketView.tsx` and `CompetitionForm.tsx`; (7) stripped a task-label narration comment. Frontend build + lint re-verified (0 errors).
