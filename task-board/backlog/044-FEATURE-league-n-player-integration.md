# 044-FEATURE-league-n-player-integration

**Status**: Backlog
**Created**: 2026-05-12
**Updated**: 2026-05-13 (post-skeptical-review patches)
**Priority**: High
**Type**: FEATURE
**Estimated Effort**: Large

---

## Context

Sub-plan 3 of 5 in the N-player initiative (`task-board/n-player-support.md`). Wires the schema (task 042) and UI primitives (task 043) into actual league behavior so a league with `PlayerCount` ∈ {2,3,4} produces the right schedule, accepts the right match payload, and computes the right points.

Depends on tasks **042 (schema, blocking)**, **043 (UI primitives + `makeFfaResultSchema` Zod factory + `PodiumPickerField` RHF adapter, blocking)**, and **047 (MatchDetailsForm RHF conversion, sequential prerequisite — must merge before this task)**.

### Owned by this task (relocated from 043 in 2026-05-13 patch)

- **`ChangeLeagueStatus.PlayerCount` activation DTO field + validator + handler persistence.** 043 ships the form toggle that captures the value; 044 wires it through the API, validates it, persists to `League.PlayerCount`, and drives the schedule generator. Bundling the wire + the handler in one task closes the silent-no-op merge window where 043 (with the toggle) could merge before 044 (with the handler) and 3P/4P activations would return 200 with zero generated matches.
- **Leaderboard "Performance" column rename + formula swap** — same merge. Cosmetic rename without the formula swap would leave a window where the header lies. Bundle them.

### Architectural decisions inherited from initiative doc

- **Per-match N lives on `Match.PlayerCount`** (added in task 042). The configured intent ALSO persists on `League.PlayerCount` (added in task 042, physical column `LeaguePlayerCount`). Activation reads `League.PlayerCount`; legacy rows with `null` are treated as N=2 via `?? 2` coalescing — see "Legacy league activation" AC below. **Pre-existing Active/Complete leagues are backfilled to `PlayerCount = 2` by 042's migration**, so `null` after migration means "Planned, not yet activated."
- Stats (within a league): Mario-Kart placement points (1st=4, 2nd=2, 3rd=1, 4th=0). Flawless +1 retained for N=2 only (2-0 Bo3). A league is **always single-N**: a validator enforces that all matches share `Match.PlayerCount == League.PlayerCount`.
- **Two-bracket structure for ALL N** (locked 2026-05-13). The existing N=2 dual-bracket ("split") design extends to N>2 leagues. Bracket 1 generates the schedule; bracket 2 generates the same pairings/triples/quadruples with a different positional-slot assignment (rotation or per-match shuffle). For N=2 this preserves the historical side-swap invariant; for N>2 the slot rotation is fairness-only (positional slot has no gameplay meaning today). Total matches = `2 · R · v / N` across both brackets.
- **`BestOf` is forced to 1 when `PlayerCount > 2`** (B4 — locked 2026-05-13). Activation validator auto-sets `League.BestOf = 1` if `request.PlayerCount > 2`, and rejects an explicit `BestOf != 1` request body for N>2. `BestOf ∈ {1, 3, 5}` remains valid for N=2.
- **`PlacementPoints` helper extracted in this task** at `Application/Common/PlacementPoints.cs` with the signature:
  ```csharp
  public static int PointsForParticipant(Match match, IReadOnlyList<Round> rounds, string userId)
  ```
  **Rounds are passed explicitly** — the caller is forced to load them. No silent eager-load contract. Tasks 045 and 046b consume this helper; neither rewrites it. If a future caller wants flawless detection but is N=2-uninterested, pass an empty list — flawless will compute 0 because `match.PlayerCount != 2`.
- Schedule:
  - `R = ceil(2(v−1)/(N−1))` matches per player; total = `R·v/N`.
  - **Pair co-occurrence balanced within ±2** (BIBD-style greedy fill). Original spec said ±1; widened to ±2 after skeptical review because generic BIBD is NP-hard and greedy isn't guaranteed for ±1. Triples/quadruples may repeat.
  - **(v, N) combinations where `R·v` is not divisible by N are rejected at activation** with a clear error listing legal v values.
- Schedule generator forks explicitly: `if (PlayerCount == 2) return LegacyRoundRobin(); else BibdGenerator();`. **Promise revised from byte-identical to structural equivalence** (same pairings, same flip rule). The legacy path uses `new Random()` (wall-clock entropy) today; making it byte-identical to a refactored version is mathematically impossible without seed control. Tests inject a seeded `Random` and assert pairings + flip rule. Production code keeps using `new Random()`.
- **One Round row per match for N>2** (RoundNumber=1; no per-round outcome stored). **Flawless detection branches on `match.PlayerCount == 2`, NOT on `Rounds.WinnerUserId` counts.** Even if a future writer sloppily populates Round.WinnerUserId on an N>2 match, the helper does not award flawless credit.
- Placement model: positional columns owned by 042. Placement columns are plain `string?` (membership in `PlayerOne..PlayerFour` enforced by FluentValidation here).
- Match format split: N=2 uses `CompleteMatch` (rounds[]) unchanged; N>2 uses a NEW `CompleteFfaMatch` command/endpoint.
- **MergeGuest FK remap + GetUserMatches Where fix + AutoMapper profile updates are all in task 042.** Do NOT re-add them here.
- **`MatchDetailsForm` RHF conversion lives in task 047** (sequential prerequisite). The new `FfaMatchForm` uses RHF natively.
- **CLAUDE.md invariant #3 is updated in this task** to read: "Flawless applies to N=2 (Bo3) matches only. Detection branches on `match.PlayerCount == 2`, not on Round-row outcome counts."

---

## Research Findings (from sub-plan-3 discovery, 2026-05-12)

Codebase realities relevant to implementation:

- `Application/Leagues/Commands/ChangeLeagueStatus.cs:60-134` — `CreateMatchesBetweenAllPlayers` is a private method on the handler that builds two `List<Match>` (first split / second split), iterates `i, j` pairings, computes `flip = (i + j) % 2 == 0` for side-swap symmetry, **shuffles each list using `new Random()` at line 137 (wall-clock entropy)**, then adds Bo3 rounds.
- The guard at `ChangeLeagueStatus.cs:29` is `members.Count <= 1` — must become `< league.PlayerCount.Value` after persisting the activation request's PlayerCount.
- The N=2 path is preserved by moving it into a private `CreateTwoPlayerSchedule(...)` method; the N>2 path is a separate `CreateFfaSchedule(...)` method.
- `Application/Matches/Commands/CompleteMatch.cs` accepts `Rounds: List<RoundDto>`. Untouched in this task for N=2 regression safety.
- `Application/Matches/Commands/ReopenMatch.cs:27-33` clears rounds + `match.Completed` + `match.WinnerUserId`. **Must be extended to clear SecondPlace/Third/FourthPlaceUserId.**
- `API/Controllers/MatchesController.cs` exposes `POST /api/matches/{competitionId}/bracket/{bracketNumber}/match/{matchNumber}/complete`. A new sibling `complete-ffa` route reuses both auth policies.
- `Infrastructure/Security/IsMatchEditable.cs` and `IsMatchComplete.cs` — **must be read and verified during implementation**. Initial research said they were participant-agnostic (read only `Match.Completed`). The verification AC below makes this a hard check, not an assumption.
- `Application/Leagues/Queries/GetLeagueLeaderboard.cs:30-61` uses `SelectMany` over `(PlayerOne, PlayerTwo)`. Points formula at line 58: `Wins * 4 + Flawless`. Flawless detected at line 38/46 via Round.WinnerUserId count == 2.
- `Application/Guests/Commands/MergeGuest.cs` — already extended in task 042.
- `client/src/features/matches/MatchDetails.tsx:99-106` branches `Completed ? View : Form`. Add a second branch: `match.playerCount > 2 ? FfaMatchForm : MatchDetailsForm`.
- `client/src/features/matches/MatchDetailsForm.tsx` — assumed RHF-based after task 047 merges (047 is a hard prerequisite).
- The `useFfaMatch` hook from task 043 has `mode: 'league'` and the endpoint URL. Cache invalidation keys reuse `useCompetitionMatch.ts:14`'s `["match", competitionId, bracketNumber, matchNumber]` shape.

---

## Acceptance Criteria

### Activation request body (owned here, not in 043)
- [ ] `Application/Leagues/Commands/ChangeLeagueStatus.cs` Command DTO — add `int? PlayerCount` field.
- [ ] `ChangeLeagueStatusValidator` — `InclusiveBetween(2, 4)` when set; required on first activation (when `league.PlayerCount` is null and request is Planned→Active).
- [ ] When transitioning Planned→Active:
  - If `League.PlayerCount` is already set (revert→reactivate scenario, OR backfilled pre-existing league), the request's `PlayerCount` MUST be either null or equal to the persisted value. Mismatch is rejected with a clear error.
  - If `League.PlayerCount` is null (first activation of a Planned-status league), `request.PlayerCount` is required and gets written to `League.PlayerCount` in the same transaction.
  - On revert (Active→Planned), `League.PlayerCount` is preserved.
- [ ] **BestOf coupling**: when `request.PlayerCount > 2` (or persisted `League.PlayerCount > 2`), the validator forces `League.BestOf = 1` and rejects any request body that explicitly sets `BestOf != 1`. For N=2 leagues, `BestOf ∈ {1, 3, 5}` remains valid (B4 — locked 2026-05-13).
- [ ] Activation guard rejects when `members.Count < (league.PlayerCount ?? request.PlayerCount).Value` with a clear message.

### Legacy league activation (`?? 2` contract)
- [ ] Any handler/query reading `league.PlayerCount` coalesces null to 2: `var n = league.PlayerCount ?? 2;`. Legacy leagues created before the 042 migration have `null` and represent pre-existing N=2 leagues.
- [ ] Document this in `CLAUDE.md` invariant #1 update (added in this task — see CLAUDE.md AC below).

### Schedule generator (Application/Leagues/Commands/ChangeLeagueStatus.cs)
- [ ] **Pre-activation validity check for N>2**: reject if `(v, N)` is illegal — `R·v` not divisible by N (where `R = ceil(2(v−1)/(N−1))`). Error message: "N={N}-player league requires a member count whose schedule total is whole. Legal counts for N={N} up to 32: …" — backend computes the list once at validation time.
- [ ] Generator dispatches by explicit fork: `if (n == 2) CreateTwoPlayerSchedule(...) else CreateFfaSchedule(..., n)`. The N=2 path is the existing code body moved verbatim into the private method.
- [ ] **`Random` injection for testability**: introduce a constructor-injected `Func<Random>` or a method-level `Random?` parameter (default `new Random()`). Production code keeps current entropy behavior. **Regression test pins a fixed seed and asserts structural equivalence** of pairings and flip rule between the new dispatch and the legacy inline code — not byte-identical bit-for-bit (impossible across a refactor of the Random instance ownership).
- [ ] When `PlayerCount ∈ {3, 4}`, generator produces exactly `R·v/N` matches **per bracket** with `R = ceil(2(v−1)/(N−1))` matches per player per bracket. **Two brackets total** (mirrors N=2 split structure — locked 2026-05-13).
- [ ] **Bracket 2 slot rotation (N>2)**: bracket 2 contains the same pairings/triples/quadruples as bracket 1, but with positional slot assignment rotated (e.g., cyclic shift `PlayerOne→PlayerTwo→PlayerThree→PlayerOne`) OR independently shuffled per match. Goal: no player permanently occupies the same positional slot across the league. Slot identity has no gameplay meaning for N>2; "different" is sufficient — no strict swap invariant required.
- [ ] **N=2 bracket 2 preserves the existing side-swap invariant** (if A was P1 in bracket 1, A is P2 in bracket 2). Existing legacy `(i + j) % 2` flip rule retained verbatim.
- [ ] **Fairness invariant**: pair co-occurrence balanced **within ±2** across all `v*(v-1)/2` player pairs (greedy fill). Triples / quadruples may repeat. Document in a code comment AND in the master initiative doc.
- [ ] **Enumeration test**: for every legal `(v, N)` pair with `v ≤ 32` and `N ∈ {3, 4}`, run the generator (with a fixed seed) and assert the pair-balance invariant. **Fallback cascade (apply in order, do not pick on the fly):**
  1. **Default: ±2 greedy.** Run BIBD-style greedy fill with seeded `Random`. If max pair imbalance ≤ 2 for all legal `(v, N)` with `v ≤ 32`, ship as-is.
  2. **If any case exceeds ±2: retry with multiple seeds.** For the failing `(v, N)`, attempt up to 16 seeds; accept the schedule with the lowest max imbalance. If any seed achieves ≤ ±2, use that seed path in production (production code re-rolls until imbalance ≤ ±2, capped at 16 attempts; if all 16 fail, return the best of 16). Document the cap in code.
  3. **If no seed achieves ≤ ±2 for some `(v, N)`: widen the published invariant to ±3** for that `(v, N)` class, update the AC and the master initiative doc, and re-run the full enumeration. Do NOT widen silently.
  4. **Last resort: backtracking.** Only if the multi-seed greedy at step 2 cannot reach ±3 for some `(v, N)` with `v ≤ 32`. Backtracking is bounded by a max-attempt counter (suggested: 10,000 node visits per `(v, N)`); if it exceeds, that `(v, N)` is added to the rejected-at-activation list with a clear user-facing error.
  **Production guarantee**: whatever invariant the enumeration test passes at merge time IS the published guarantee. Do not relax in production without a test update. Failure of step 4 for an `(v, N)` is acceptable iff that pair is also added to the activation rejection list.
- [ ] **Every generated `Match` row has `Match.PlayerCount = n` written explicitly.**
- [ ] Round-row creation:
  - `n == 2`: 3 `Round` rows per match (Bo3), unchanged.
  - `n ∈ {3, 4}`: exactly 1 `Round` row per match. The row holds per-player character selections; WinnerUserId on the Round row left null.

### League single-N invariant
- [ ] `Application/Leagues/Validators/` — new validator (or extension to existing) rejecting any league state in which not all matches share `Match.PlayerCount == league.PlayerCount`.

### CompleteFfaMatch command + endpoint (NEW)
- [ ] `Application/Matches/Commands/CompleteFfaMatch.cs` (NEW): `Command { CompetitionId, BracketNumber, MatchNumber, WinnerUserId, SecondPlaceUserId?, ThirdPlaceUserId?, FourthPlaceUserId? }`
- [ ] Handler loads match, validates `match.PlayerCount > 2`, sets `WinnerUserId` + placement fields, sets `Completed = true` + `RegisteredTime`.
- [ ] `Application/Matches/Validators/CompleteFfaMatchValidator.cs` (NEW): `WinnerUserId` required; placement IDs must be distinct, must all be in the match's participant set (PlayerOne..PlayerFour); winner-only fast-path supported (payload with only `WinnerUserId` is valid for N>2).
- [ ] `POST /api/matches/{competitionId}/bracket/{bracketNumber}/match/{matchNumber}/complete-ffa` registered in `MatchesController`; auth: `IsCompetitionMember + IsMatchEditable`.
- [ ] Existing `POST .../complete` endpoint and `CompleteMatch` handler UNCHANGED.

### ReopenMatch extension
- [ ] `ReopenMatch.Handler` additionally clears `SecondPlaceUserId`, `ThirdPlaceUserId`, `FourthPlaceUserId`.
- [ ] `ReopenMatch.Handler` also clears `Round.WinnerUserId` (and Round character selections) on every Round row attached to the match. Pre-existing behavior left `Round.WinnerUserId` populated; that is load-bearing for the flawless detection in N=2 leaderboards (a re-completed match could double-count flawless if a partially-cleared Round retained its winner). Fixing it here aligns reopen semantics for N=2 and N>2 (H4 from skeptical review — locked 2026-05-13).

### PlacementPoints helper (NEW, owned here)
- [ ] `Application/Common/PlacementPoints.cs`:
  ```csharp
  public static int PointsForParticipant(Match match, IReadOnlyList<Round> rounds, string userId)
  ```
  - Returns 0 if `userId` is not in `match.PlayerOne..PlayerFour`.
  - N=2 branch (when `match.PlayerCount == 2`): wins = `match.WinnerUserId == userId ? 1 : 0`. Points = `wins * 4 + (isFlawless ? 1 : 0)`. **Flawless detection: `match.PlayerCount == 2 && wins == 1 && rounds.Count(r => r.WinnerUserId != null) == 2`.** Branches on PlayerCount, not on round count alone — a sloppy N>2 caller with a stray Round.WinnerUserId cannot trigger flawless.
  - N>2 branch: returns 4 if `match.WinnerUserId == userId`, 2 if `match.SecondPlaceUserId == userId`, 1 if `match.ThirdPlaceUserId == userId`, 0 otherwise. No flawless bonus.
- [ ] **Unit test for the sloppy-write case**: N=3 match with `Rounds[0].WinnerUserId != null` and `WinnerUserId == userId`. Assert points = 4 (not 5). Documents the `PlayerCount == 2` guard.
- [ ] Tasks 045 (casual stats) and 046b (tournament placement) consume this helper.

### Leaderboard rename + formula swap (one merge — owned here)
- [ ] `client/src/features/leagues/Leaderboard.tsx` — rename column header to "Performance" AND swap the cell content to the placement-points-based display in the same commit. For N=2 leagues the displayed value is unchanged (4·wins + flawless still gives the same number); for N>2 leagues it renders the placement-points sum.
- [ ] Optional: render the "🥇×4 🥈×2 🥉×1 4th×0" histogram as a tooltip or secondary line, driven by new LeaderboardUser fields below.
- [ ] `Application/Leagues/Queries/GetLeagueLeaderboard.cs`:
  - Match query `.Include`s PlayerThree, PlayerFour (with `.User`), plus Rounds for N=2 flawless detection.
  - Per-match row generation reads `match.PlayerCount` (not a league-level field) and flattens PlayerOne..PlayerN.
  - Points computed via `PlacementPoints.PointsForParticipant(match, match.Rounds.ToList(), userId)` for every participant on every match. **Rounds passed explicitly** — the caller is responsible for `.Include(m => m.Rounds)` on the query.
  - For an N=2 league, leaderboard output (Wins, Losses, Flawless, Points, ordering) must be **structurally equivalent** to today's. Regression test with fixed match data asserts byte equality of the aggregated `LeaderboardUserDto` shape per user.
- [ ] `LeaderboardUserDto` additive fields (`firstPlaceCount`, `secondPlaceCount`, `thirdPlaceCount`, `fourthPlaceCount`) so the frontend can render the histogram.
- [ ] **E2E test-id contract** (consumed by task 048): leaderboard `<tr>` rows expose `data-testid="leaderboard-row-{userId}"` (seeded userId, not displayName). The renamed column header exposes `data-testid="leaderboard-header-performance"` so a future "Performance"→"Points" regression is caught by the e2e suite, not silently rendered.

### Auth handler verification (hard check, not assumption)
- [ ] Read `Infrastructure/Security/IsMatchEditable.cs` and `Infrastructure/Security/IsMatchComplete.cs` line-by-line. If either reads `Match.PlayerOneUserId` / `PlayerTwoUserId` / a participant column for an authorization decision, expand the check to `PlayerOne..PlayerFour`. If they only read `Match.Completed`, document **in this task file** that no expansion was needed and link the file lines verified. **Do not document "verified during research" as the final state** — verification needs to happen during implementation against the current branch.

### MergeGuest + AutoMapper + GetUserMatches verification (all owned by task 042)
- [ ] Verify in this task: integration test merging a guest with FFA placements in a 3P or 4P league. All 5 FKs migrate correctly.
- [ ] Verify: integration test where a user is P3 in a 4P league match — that match appears in their match history.
- [ ] Verify: GET a 4P match — `secondPlaceUserId`, `thirdPlaceUserId`, `fourthPlaceUserId`, `playerThree`, `playerFour`, `playerCount` all round-trip non-null.
- [ ] No code changes to `MergeGuest.cs`, `GetUserMatches.cs`, or any AutoMapper profile in this task.

### CLAUDE.md update
- [ ] Invariant #3 (Statistics Integrity) updated to:
  - "Points formula uses `PlacementPoints.PointsForParticipant(match, rounds, userId)` (`Application/Common/PlacementPoints.cs`). Rounds are passed explicitly to enforce eager-load discipline."
  - "Flawless applies to N=2 (Bo3) matches only. Detection branches on `match.PlayerCount == 2`, not on Round-row counts."
  - "Statistics are computed backend-only. Frontend NEVER computes points or statistics."
- [ ] Invariant #1 (Round-robin integrity) extended to mention: "For N>2 leagues, generator uses BIBD greedy with pair co-occurrence balanced within ±2. Triples and quadruples may repeat. Illegal `(v, N)` combinations are rejected at activation."

### Frontend
- [ ] `client/src/lib/types/index.d.ts`: extend `Match` type with `playerThree?: Player; playerFour?: Player;` (placement userIds and `playerCount` already added by task 042). Verify `LeaderboardUser` type carries the new placement-count fields.
- [ ] `client/src/features/matches/FfaMatchForm.tsx` (NEW):
  - Uses **React Hook Form** (mandatory).
  - Composes the RHF adapter `PodiumPickerField` (from task 043) — not the bare hook.
  - Form schema uses the shared `makeFfaResultSchema` factory (from task 043), parameterized with the participants list reference and `{ allowWinnerOnly: true, requireFullPodium: false }`.
  - Calls `useFfaMatch({ mode: 'league' })` to submit. Invalidates `["match", competitionId, bracketNumber, matchNumber]` keys.
- [ ] `client/src/features/matches/MatchDetailsForm.tsx`: **NOT modified in this task.** Task 047 already converted it to RHF.
- [ ] `client/src/lib/hooks/useFfaMatch.ts` (from task 043): wire is already done in 043; this task confirms the URL matches the new endpoint.
- [ ] `client/src/features/matches/MatchDetails.tsx`: branch on `match.playerCount`:
  - `playerCount === 2` (or undefined → defaults to 2): existing `MatchDetailsForm` (RHF after 047)
  - `playerCount > 2`: new `FfaMatchForm`
- [ ] `MatchDetailsView.tsx` (read-only view of completed match): render `PodiumDisplay` from task 043 when `match.playerCount > 2`.

### Regression / verification
- [ ] Manual: full lifecycle test of a NEW 2P league (create → seed 4 members → activate → complete all matches → check leaderboard). Output structurally equivalent to a baseline run on `main` (per-user aggregated DTO byte-equal).
- [ ] Manual: lifecycle test of a 3P league (4 members → activate → complete a few FFA matches → check leaderboard points).
- [ ] Manual: lifecycle test of a 4P league (6 members → activate → complete FFA matches → check leaderboard, including winner-only fast-path entries).
- [ ] Manual: merge a guest who has placements in a 4P league.
- [ ] Manual: reopen a completed FFA match; confirm placement fields clear.
- [ ] `dotnet build --configuration Release` passes
- [ ] `cd client && npm run build` passes
- [ ] e2e regression: `e2e/tests/lifecycle/` for existing 2P flows still passes

---

## Implementation Steps

### Application
- [ ] `Application/Leagues/Commands/ChangeLeagueStatus.cs`:
  - Add `int? PlayerCount` to the Command DTO.
  - Validator: range 2..4 when set; required on first activation.
  - On Planned→Active: persist `request.PlayerCount` to `league.PlayerCount` if not yet set; reject mismatches.
  - On Active→Planned: delete matches; preserve `league.PlayerCount`.
  - Update activation guard: `members.Count < (league.PlayerCount ?? request.PlayerCount).Value`.
  - Pre-activation `(v, N)` validity check for N>2 (reject illegal combos with computed legal-counts list).
  - Refactor `CreateMatchesBetweenAllPlayers` to dispatch on `n = league.PlayerCount.Value`:
    - `n == 2`: existing code moved verbatim into `CreateTwoPlayerSchedule`.
    - `n ∈ {3, 4}`: new `CreateFfaSchedule(League, int n)` implementing BIBD greedy:
      1. Compute `R = (int)Math.Ceiling(2.0 * (v - 1) / (n - 1))`
      2. Compute `totalMatches = R * v / n`
      3. Maintain pair-co-occurrence counter `Dictionary<(string, string), int>`
      4. Greedily build matches minimizing the max pair-co-occurrence increment; assert ±2 invariant at the end
      5. Assign positional columns PlayerOne..PlayerN in roster order
      6. Shuffle match order using injected `Random`
      7. Single bracket (`BracketNumber = 1`)
      8. **NO Round entries created for N>2** (a separate row is created by `CompleteFfaMatch` when results are submitted — or alternatively, create 1 placeholder Round row here with all fields null; verify which pattern fits the read query best)
      9. **Two brackets total**: emit `BracketNumber = 1` and `BracketNumber = 2` lists. Bracket 2 reuses bracket 1's pairings/triples/quadruples but with positional slots rotated per match. Document the rotation rule in a code comment.
  - Inject `Random` via constructor or method param; production default `new Random()`.
- [ ] `Application/Matches/Commands/CompleteFfaMatch.cs` (NEW): command record + handler.
- [ ] `Application/Matches/Validators/CompleteFfaMatchValidator.cs` (NEW): rules per AC.
- [ ] `Application/Matches/Commands/ReopenMatch.cs`: clear placement fields.
- [ ] `Application/Common/PlacementPoints.cs` (NEW): per-match points helper with explicit `IReadOnlyList<Round>` parameter.
- [ ] `Application/Leagues/Queries/GetLeagueLeaderboard.cs`:
  - Add `.Include` calls for PlayerThree, PlayerFour (with `.User`).
  - Read `n = league.PlayerCount ?? 2`.
  - For each match, call `PlacementPoints.PointsForParticipant(match, match.Rounds.ToList(), userId)` per participant.
  - Aggregate same as today (group by UserId, sum points/wins/losses/flawless).
  - Add placement-count fields to the DTO.

### Persistence
- [ ] No changes — schema lives in task 042's migration.

### Infrastructure
- [ ] Verify `IsMatchEditable.cs` / `IsMatchComplete.cs` are participant-agnostic. If not, expand. Document the verified file:line in the task progress log.

### API
- [ ] `API/Controllers/MatchesController.cs`: add `CompleteFfaMatch` action mirroring `CompleteMatch`. Route: `/{competitionId}/bracket/{bracketNumber}/match/{matchNumber}/complete-ffa`. Auth: `IsCompetitionMember + IsMatchEditable`.

### Frontend
- [ ] `client/src/lib/types/index.d.ts`: add `playerThree?: Player; playerFour?: Player;` to `Match`. Confirm `LeaderboardUser` placement-count fields.
- [ ] `client/src/lib/hooks/useFfaMatch.ts` (from task 043): verify the URL and that `mode: 'league'` invalidation targets `["match", competitionId, bracketNumber, matchNumber]`.
- [ ] `client/src/features/matches/FfaMatchForm.tsx` (NEW): uses `PodiumPickerField` (RHF adapter) + `makeFfaResultSchema(participantsRef, opts)` from task 043. Calls `useFfaMatch.mutateAsync(placements)`.
- [ ] `client/src/features/matches/MatchDetails.tsx`: branch on `match.playerCount` between MatchDetailsForm and FfaMatchForm.
- [ ] `client/src/features/matches/MatchDetailsView.tsx`: render `PodiumDisplay` for N>2 completed matches.
- [ ] `client/src/features/leagues/Leaderboard.tsx`: rename header to "Performance" AND swap cell formula in the same commit.

### Tests
- [ ] Backend unit: schedule generator for N=2 with seeded Random reproduces structural-equivalence pairings/flip rule across several `v` values.
- [ ] Backend unit: schedule generator for N=3 and N=4 satisfies `R = ceil(2(v-1)/(N-1))` matches per player and **pair-co-occurrence balance ≤ 2** across enumerated legal `(v, N)` pairs with `v ≤ 32`.
- [ ] Backend unit: `PlacementPoints.PointsForParticipant` — N=2 flawless, N=2 non-flawless, N=3 placements, N=4 placements, and the **sloppy-write regression case** (N=3 with stray Round.WinnerUserId → no flawless).
- [ ] Backend unit: leaderboard for N=2 league with fixed match data produces today's Points/Wins/Losses/Flawless exactly (structural equivalence).
- [ ] Backend unit: leaderboard for N=4 league with fixed placement data produces expected placement-points sums.
- [ ] Backend unit: `CompleteFfaMatchValidator` accepts winner-only payload, full-placement payload; rejects duplicate IDs and IDs not in participant set.

---

## Domain Risk Checklist

- [x] **Composite keys** (#2): Not modified. **Risk: NONE.**
- [x] **Round-robin** (#1): NEW schedule generator. **Risk: HIGH.** Mitigation: (a) N=2 path is verbatim move into private method. (b) Regression test with seeded Random asserts structural equivalence. (c) N>2 path is separate code path. (d) Enumeration test asserts ±2 pair-balance invariant across legal `(v, N)`.
- [x] **Statistics** (#3): Formula swap. **Risk: MEDIUM.** Mitigation: N=2 branch in PlacementPoints preserves existing formula (4·wins + flawless). Regression unit test asserts N=2 sums equal today's. N>2 uses placement points (4/2/1/0) with flawless=0.
- [x] **Guest merge** (#4): Already done in 042. **Risk: NONE for this task.**
- [x] **Authorization** (#5): Verify during implementation, document in progress log. **Risk: LOW** if verification confirms participant-agnostic; **MEDIUM** if expansion needed.

All boxes checked.

---

## Dependencies

- **Blocked by**:
  - Task 042 (schema + `Match.PlayerCount` + `League.PlayerCount` + CHECK constraints + MergeGuest expansion + GetUserMatches fix + AutoMapper profile updates + Tournament.PlayerCount→BracketSize rename + types/index.d.ts extensions)
  - Task 043 (PodiumPicker, PodiumDisplay, `useFfaMatch` hook with `mode: 'league'`, RANK_STYLES lift, PlayerCountToggle on creation form, `makeFfaResultSchema` factory, `PodiumPickerField` adapter)
  - Task 047 (MatchDetailsForm RHF conversion — sequential prerequisite)
- **Blocks**:
  - Sub-plan 4 (consumes `PlacementPoints` extracted here)
  - Sub-plan 5 split (046a backend, 046b frontend; both consume `PlacementPoints`)

---

## Code References

- `Application/Leagues/Commands/ChangeLeagueStatus.cs:29` — activation guard
- `Application/Leagues/Commands/ChangeLeagueStatus.cs:60-134` — `CreateMatchesBetweenAllPlayers`
- `Application/Leagues/Commands/ChangeLeagueStatus.cs:137` — `new Random()` site for seed injection
- `Application/Matches/Commands/CompleteMatch.cs` — DO NOT MODIFY (N=2 regression baseline)
- `Application/Matches/Commands/ReopenMatch.cs:31-32` — extend to clear placement fields
- `Application/Leagues/Queries/GetLeagueLeaderboard.cs:21-61` — extend `.Include`s + branch on PlayerCount
- `Application/Common/PlacementPoints.cs` — NEW
- `API/Controllers/MatchesController.cs:19-25` — pattern for new `complete-ffa` action
- `Infrastructure/Security/IsMatchEditable.cs` + `IsMatchComplete.cs` — must read and verify
- `client/src/features/matches/MatchDetails.tsx:99-106` — branch point for Form vs FfaForm
- `client/src/features/matches/MatchDetailsForm.tsx` — DO NOT MODIFY (047 owns it)
- `client/src/lib/hooks/useFfaMatch.ts` (from 043) — confirm URL + invalidation keys
- `client/src/lib/hooks/useCompetitionMatch.ts:14` — existing queryKey shape to reuse
- `task-board/n-player-support.md` — master initiative doc

---

## Design Decision: Two Endpoints vs One Polymorphic

Chose two endpoints (`/complete` + `/complete-ffa`) over a polymorphic single endpoint. Preserves `CompleteMatch` handler untouched, strongest possible N=2 regression guarantee. Request shapes are genuinely different. Independently testable. Accepted trade-off: one extra controller action, command class, validator.

---

## Rollback Plan

- Revert the commit. `CompleteFfaMatch` is additive; `CompleteMatch` flow untouched.
- Schedule generator: rollback restores today's exact code.
- Leaderboard formula: rollback restores today's formula. Placement columns remain null for existing data, no inconsistency.
- **Risk**: LOW. All changes additive or branch-based on PlayerCount. N=2 paths verified structurally equivalent via tests.

---

## Progress Log

[Updated during implementation]

---

## Resolution

[Filled when complete]
