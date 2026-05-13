# 046b-FEATURE-tournament-n-player-frontend

**Status**: Backlog
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
- [ ] `Application/Tournaments/SlotMapping.cs`:
  ```csharp
  public static (int nextMatchIndex, int[] slotIndices) For(int positionInRound, int perHeatPlayerCount)
  ```
  **`positionInRound` is 0-based throughout** (no 1-based variant). Used identically by `AdvanceAdvancers` and `ReopenTournamentMatch` so the same slots that get filled get cleared.
  - For N=2 / N=3 (top-1): returns `(positionInRound / advanceRatio, [positionInRound % advanceRatio])` — 1 slot. `advanceRatio = BracketSizing.AdvanceRatio(perHeatPlayerCount)`.
  - For N=4 (top-2 cross-pair): returns `(positionInRound / 2, [heatParity == 0 ? 0 : 1, heatParity == 0 ? 3 : 2])` where `heatParity = positionInRound % 2`. The two slot indices map `[winner, secondPlace]` to cross-pair positions.
- [ ] **Unit-test the round-trip** for every `(positionInRound, perHeatPlayerCount)` pair within legal bracket sizes: assert that `AdvanceAdvancers(...)` fills exactly the slots that a subsequent `ReopenTournamentMatch(...)` clears (i.e., calling SlotMapping twice with the same input returns the same `nextMatchIndex` and `slotIndices`).
- [ ] **Critical regression test for N=2**: positionInRound = 0, 1, 2, 3 with perHeatPlayerCount = 2 must produce the same `(nextMatchIndex, slotIndex)` pairs as the legacy 1-based formula did. If the legacy code computed `nextMatchIndex = (positionInRound - 1) / 2` with 1-based input, the 0-based version is `nextMatchIndex = positionInRound / 2`. Verify by computing a 4-heat round 1 → 2-heat round 2 advance against the existing N=2 tournament's expected behavior.
- [ ] **`SlotMapping` ↔ `BracketBuilder` topology invariant** (B7 from skeptical review — locked 2026-05-13). `SlotMapping` reads `positionInRound` (heat index within its bracket round) and assumes a deterministic ordering of heats produced by `BracketBuilder`. The invariant: `positionInRound = matchesInThisRound.OrderBy(m => m.MatchNumber).IndexOf(thisMatch)`. Restate this in code comments on BOTH `SlotMapping.cs` AND `BracketBuilder.cs`. Add an integration test that builds a 27-player N=3 bracket and 32-player N=4 bracket, completes round 1 heats in MatchNumber order, and asserts round 2's slots are filled in the expected topology. **If any future refactor of `BracketBuilder` changes MatchNumber assignment, `SlotMapping` MUST be re-validated against this test.**
- [ ] **Early-return when no next round exists**: `AdvanceAdvancers` MUST check `if (match.BracketNumber == BracketSizing.TotalRoundsFor(match.PlayerCount, tournament.BracketSize)) return;` before calling `SlotMapping`. This handles the final round (no next match to fill). The legacy N=2 code has this guard at line 101 — replicate it.

### Application — CompleteTournamentMatch (rewritten)
- [ ] **Placement fields live on `RoundDto`**, not on a wrapper request DTO (B8 from skeptical review — locked 2026-05-13). Rationale: the existing controller binds `List<RoundDto>` as the request body. Adding optional placement fields to `RoundDto` is a minimal-blast-radius extension; introducing a wrapper would break the controller signature and the legacy N=2 payload shape simultaneously. For N>2 (single-round) matches, placements travel on `Rounds[0]`.
- [ ] Extend `Application/Matches/DTOs/RoundDto.cs`:
  - `string? SecondPlaceUserId`
  - `string? ThirdPlaceUserId`
  - `string? FourthPlaceUserId`
  These are read by `CompleteTournamentMatch.Handler` from `request.Rounds[0]` when `match.PlayerCount > 2`. They are ignored for N=2.
- [ ] `Application/Tournaments/Commands/CompleteTournamentMatch.Command` does NOT add new top-level fields. It continues to carry `List<RoundDto> Rounds` as the body; the handler inspects `Rounds[0]` for the placement fields when applicable.
- [ ] Validator branches on `match.PlayerCount`:
  - **N=2**: existing rules. Reject any non-null `SecondPlaceUserId / ThirdPlaceUserId / FourthPlaceUserId` on any Round (defense against client error — N=2 must NOT supply placements).
  - **N=3**: single-round (validate `request.Rounds.Count == 1` and the round has a WinnerUserId set). Rounds[0].SecondPlaceUserId, ThirdPlaceUserId optional.
  - **N=4**: single-round. Rounds[0].SecondPlaceUserId **required** (advancement depends on top-2). Third/Fourth optional but if set must be valid.
  - For all N>2: placement IDs must be distinct and from `PlayerOne..PlayerN` of the match.
- [ ] Handler branches on `match.PlayerCount`:
  - **N=2**: existing logic. `AdvanceAdvancers` called with a 1-element advancer list.
  - **N=3**: `AdvanceAdvancers` with 1-element advancer (winner only).
  - **N=4**: `AdvanceAdvancers` with 2-element advancer list `[winner, secondPlace]`.
- [ ] **Handler MUST write placements onto the `Match` row** (B9 from skeptical review — locked 2026-05-13). For N>2, after validating the request, set:
  ```csharp
  match.WinnerUserId      = request.Rounds[0].WinnerUserId;
  match.SecondPlaceUserId = request.Rounds[0].SecondPlaceUserId;
  match.ThirdPlaceUserId  = request.Rounds[0].ThirdPlaceUserId;
  match.FourthPlaceUserId = request.Rounds[0].FourthPlaceUserId;
  ```
  Without this, captured placement data is dropped — the data lives only on the Round row and never persists onto the Match columns 042 added. Captured-but-unused debt depends on these columns being populated.
- [ ] Final detection: `match.BracketNumber == BracketSizing.TotalRoundsFor(match.PlayerCount, tournament.BracketSize)`. (Note: `tournament.BracketSize`, renamed from `PlayerCount` in 042.)
- [ ] `AdvanceAdvancers(tournament, completedMatch, List<(string userId, int placement)> advancers)`:
  - Calls `SlotMapping.For` to get target `(nextMatchIndex, slotIndices)`.
  - For each advancer paired with its slot index, write `next.PlayerXUserId` accordingly (X derived from slot index: 0→PlayerOne, 1→PlayerTwo, 2→PlayerThree, 3→PlayerFour).

### Application — ReopenTournamentMatch (rewritten)
- [ ] Handler clears ALL advancers from this match using `SlotMapping.For` (same function as fill). For N=4, 2 slots cleared in the next match; for N=2/3, 1 slot cleared.
- [ ] If ANY downstream match has been completed, reject with the existing error message. **Transitive safety**: blocking the immediate-next match's completion is sufficient — a next-next match cannot be completed unless next is Complete first. Document this as a code comment.
- [ ] Reset match fields: `WinnerUserId = SecondPlaceUserId = ThirdPlaceUserId = FourthPlaceUserId = null`.
- [ ] For N>2 (single-round): reset the one Round's `WinnerUserId`, `Completed`, character columns.
- [ ] For N=2: existing per-round reset logic unchanged.
- [ ] Final reopen: if `match.BracketNumber == TotalRoundsFor(...)`, reset `tournament.WinnerUserId = null`, `tournament.Status = Active`, `tournament.EndDate = null`.

### Infrastructure
- [ ] Verify tournament auth handlers (`IsMatchEditable`, `IsMatchComplete`, any tournament-specific) cover N>2 participants. Read the files line-by-line during implementation and document the result. If any handler reads `PlayerOne/Two` for an authorization decision, expand to `PlayerOne..PlayerFour`.

### API
- [ ] `API/Controllers/TournamentsController.cs`: `CompleteTournamentMatch` endpoint accepts the extended DTO. No route changes.

### Frontend — Types
- [ ] `client/src/lib/types/index.d.ts`:
  - `Tournament.bracketSize` confirmed (renamed in 042).
  - `Tournament.perHeatPlayerCount: number` added.
  - `Match.playerCount?: number` confirmed (042).

### Frontend — Schemas + hooks
- [ ] `client/src/lib/schemas/tournamentSchema.ts`: form-level schema for the create flow captures `perHeatPlayerCount`. Refine: if `perHeatPlayerCount > 2`, force `bestOf = 1`.
- [ ] Activation flow (`useStartTournament`) request body **does NOT include** `playerCount` — per-heat N is read from the persisted `tournament.PerHeatPlayerCount` server-side (per 046a's StartTournament AC).
- [ ] `client/src/lib/hooks/useTournament.ts` (verify exact filename — may be `useTournaments.ts` plural per `BracketView.tsx:29`): extend `completeTournamentMatch` mutation body so placement fields ride along on `rounds[0]` (matching the backend's RoundDto extension). Placement validation uses `makeFfaResultSchema` (factory from 043) with `{ allowWinnerOnly: false, requireFullPodium: true }` (tournaments require full podium for N=4 top-2 advancement).
- [ ] `client/src/lib/hooks/useFfaMatch.ts` (extended from 043): add `mode: 'tournament'` variant pointing at the tournament complete-match endpoint. Cache invalidation reuses the existing tournament-match queryKey shape.

### Frontend — Tournament create form
- [ ] `client/src/features/tournaments/TournamentForm.tsx` (verify exact file name during implementation):
  - Add `PlayerCountToggle` (from task 043) at the top of the form, RHF-controlled, default 2 — **persisted as `PerHeatPlayerCount` on Tournament** (different from league's session-only toggle).
  - When `perHeatPlayerCount > 2`: hide/disable `BestOf` selector, force value to 1.
  - Member count input validates against legal exact-roster sizes for the chosen N (per `BracketSizing.ValidBracketSizesFor`).
  - Helper text: "N={N}-player tournaments require exactly one of: {ValidBracketSizesFor(N)} members."
  - **No CPU-padding messaging.** Hosts must invite the exact number of players.

### Frontend — Bracket view (rewrite)
- [ ] `client/src/features/tournaments/BracketView.tsx`:
  - **Mobile layout**: render each bracket round as a horizontal column. CSS `scroll-snap` on a horizontal flexbox container (no library). Each column = `width: 100vw`, `scroll-snap-align: start`.
  - **No inter-round connector lines on mobile** — the column-swipe model intentionally drops them. If the existing desktop layout draws connectors, preserve that for desktop only.
  - **Desktop layout**: render all columns side-by-side (existing behavior). Use `useMediaQuery` to branch.
  - Per-column: stack heats vertically. Each heat shows N participant rows (player name, character if set, placement medal if completed).
  - For completed N>2 heats: render `PodiumDisplay` (from task 043) inline.
  - For active in-progress heats: "Awaiting result" CTA → opens `PodiumPickerField` dialog/inline form.

### Frontend — Match-entry inside tournament
- [ ] When opening an in-progress N>2 tournament match for result entry, render `PodiumPickerField` (RHF adapter from 043) — **not** bare `usePodiumState`. Rules: `{ allowWinnerOnly: false, requireFullPodium: true }`.
- [ ] On submit, post the extended `CompleteTournamentMatch` payload with placement fields via `useFfaMatch({ mode: 'tournament' })`.

### Regression / verification
- [ ] Manual: existing N=2 8-player tournament — flow identical to today
- [ ] Manual: create N=4 tournament with exactly 8 members → 2 first-round heats of 4 → complete one heat via PodiumPickerField → top-2 advancers seed into the final heat in cross-pair positions
- [ ] Manual: ReopenTournamentMatch on an N=4 first-round heat → both top-2 slots cleared from final; rejected if final has been played
- [ ] Manual: N=3 tournament with exactly 9 members → 3 first-round heats → 3 winners → final heat of 3
- [ ] Manual: mobile bracket view — swipe left through rounds
- [ ] `dotnet build --configuration Release` passes
- [ ] `cd client && npm run build` passes
- [ ] e2e: existing tournament tests still pass

---

## Implementation Steps

### Application
- [ ] `Application/Tournaments/SlotMapping.cs` (NEW): pure function + unit tests (round-trip + N=2 regression).
- [ ] `Application/Tournaments/Commands/CompleteTournamentMatch.cs`: rewrite for N branching + `AdvanceAdvancers`.
- [ ] `Application/Tournaments/Commands/ReopenTournamentMatch.cs`: clear advancers via SlotMapping; reset placement columns.

### Infrastructure
- [ ] Verify tournament auth handlers (document file:line in progress log).

### API
- [ ] `API/Controllers/TournamentsController.cs`: extend CompleteTournamentMatch DTO.

### Frontend
- [ ] `client/src/lib/types/index.d.ts`: `Tournament.perHeatPlayerCount` added.
- [ ] `client/src/lib/schemas/tournamentSchema.ts`: PerHeatPlayerCount + BestOf coupling.
- [ ] `client/src/lib/hooks/useTournament.ts`: completeTournamentMatch body extension.
- [ ] `client/src/lib/hooks/useFfaMatch.ts`: add `mode: 'tournament'` variant.
- [ ] `client/src/features/tournaments/TournamentForm.tsx`: PlayerCountToggle + BestOf coupling + legal-roster helper text.
- [ ] `client/src/features/tournaments/BracketView.tsx`: column-swipe mobile layout + N-participant heat cards + PodiumDisplay/PodiumPickerField integration.
- [ ] `client/src/features/tournaments/TournamentList.tsx`: minor — show per-heat player count chip.

### Tests
- [ ] Backend unit: `SlotMapping` round-trip + N=2 regression + N=4 cross-pair correctness.
- [ ] Backend integration: complete an N=4 heat → next heat slots populated cross-paired.
- [ ] Backend integration: reopen an N=4 heat → next heat slots cleared.
- [ ] Regression: existing N=2 tournament integration test produces same advancement behavior.

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

[Updated during implementation]

---

## Resolution

[Filled when complete]
