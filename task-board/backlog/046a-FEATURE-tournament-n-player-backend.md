# 046a-FEATURE-tournament-n-player-backend

**Status**: Backlog
**Created**: 2026-05-13 (split from original 046 after skeptical review)
**Priority**: High
**Type**: FEATURE
**Estimated Effort**: Medium

---

## Context

Split from the original 046 to reduce per-task bug surface. This task ships **backend only**: schema, validators, `StartTournament`, `ShuffleBracket`, `BracketSizing`, `BracketBuilder`, and the per-heat persistence groundwork. The frontend and the runtime advancement logic (`CompleteTournamentMatch`, `ReopenTournamentMatch`, bracket UI) live in **046b**.

Depends on tasks **042 (schema — `Match.PlayerCount`, placement columns, `Tournament.PlayerCount → BracketSize` rename)**, **043 (UI primitives, blocking for 046b not for this task)**, and **044 (sequencing — keeps 046 split after 044 lands so the codebase has the PlacementPoints helper available, though this task does not consume it directly).** **Does NOT depend on 045.**

### Schema model (locked)

- `Tournament.BracketSize` (int, existing field, renamed from `PlayerCount` in task 042) — total bracket size.
- `Tournament.PerHeatPlayerCount` (int NOT NULL DEFAULT 2, added in **this** task) — per-heat player count, persisted at CreateTournament so Planned-status views render correctly.
- `Match.PlayerCount` (per-heat, owned by 042) — authoritative per-match.

**No `User.IsCpu` column. No CPU bracket fillers.** The previous design padded short rosters with CPU users; that design was removed in the 2026-05-13 review. Tournaments now require an **exact-size roster** matching a legal `(N, BracketSize)` combination. Hosts must invite or recruit the right number of real players before activation. This is a strictly simpler model: no Identity-row CPU lookups, no merge-target edge cases, no cross-cutting `!IsCpu` filters anywhere.

### Architectural decisions locked

| # | Decision | Detail |
|---|---|---|
| 1 | **Format** | Single-elim only. |
| 2 | **Advancement rule** | N=2 → top-1; N=3 → top-1; N=4 → top-2. (Live in 046b.) |
| 3 | **Match format** | N=2 Bo3 (existing `BestOf` field); N>2 single-round, BestOf forced to 1. Validator rejects BestOf > 1 when PerHeatPlayerCount > 2. |
| 4 | **Valid bracket sizes** | N=2: {4, 8, 16, 32}; N=3: {3, 9, 27}; N=4: {4, 8, 16, 32, 64}. |
| 5 | **Roster sizing** | **Exact match required.** Member count must equal one of the legal `BracketSize` values for the chosen N. Mismatch is rejected at activation with a clear error and a list of legal counts. No padding. |
| 6 | **CPU representation** | **Removed.** Not part of this initiative. |
| 8 | **Placement capture** | Full 1st / 2nd / 3rd / 4th stored per heat (positional columns from 042). |
| 12 | **Heat seeding** | At StartTournament, seed shuffle is run on the member list. Chunking algorithm assigns seed `i+1` to position `(i mod heatsInRound1)` (round-robin distribution across heats) to avoid the deepest-seeded players clustering in one heat. |

### What stays the same from N=2 tournament today

- `Tournament` entity (extends `Competition`, has `BracketSize` (renamed) and `WinnerUserId`).
- Single-elim bracket structure: `BracketNumber` = round depth, `MatchNumber` = sequential.
- BestOf is a Tournament-level setting.
- ShuffleBracket allowed while Active and no matches completed.

---

## Acceptance Criteria

### Domain
- [ ] `Domain/Tournament.cs`: ADD `public int PerHeatPlayerCount { get; set; } = 2;` (NOT NULL DEFAULT 2 at the DB level). Validator enforces 2..4. `Tournament.BracketSize` (already renamed in 042) keeps its meaning.
- [ ] **No new field for CPU tracking.**

### Application — Shared bracket helpers
- [ ] `Application/Tournaments/BracketSizing.cs` (NEW):
  ```csharp
  public static int[] ValidBracketSizesFor(int perHeatN)
      // perHeatN=2 → [4,8,16,32]; =3 → [3,9,27]; =4 → [4,8,16,32,64]
  public static bool IsLegalRosterCount(int perHeatN, int memberCount)
      // Returns true if memberCount is in ValidBracketSizesFor(perHeatN)
  public static int TotalRoundsFor(int perHeatN, int bracketSize)
      // Integer-safe switch table — NO Math.Log
  public static int AdvanceRatio(int perHeatN)
      // N=2 → 2; N=3 → 3; N=4 → 2
  public static int AdvancersPerHeat(int perHeatN)
      // N=2 → 1; N=3 → 1; N=4 → 2
  ```
  **Parameter named `perHeatN` consistently — no ambiguous "playerCount" overload.**
- [ ] **`TotalRoundsFor` MUST be integer-safe** (B6 from skeptical review — locked 2026-05-13). Do NOT use `Math.Log(bracketSize, N)` — base-conversion precision loss (e.g. `Math.Log(27, 3) ≈ 2.9999…`) silently produces wrong round counts. Implementation is a switch table over the legal `(perHeatN, bracketSize)` pairs declared in `ValidBracketSizesFor`:
  ```csharp
  public static int TotalRoundsFor(int perHeatN, int bracketSize) => (perHeatN, bracketSize) switch
  {
      (2, 4) => 2, (2, 8) => 3, (2, 16) => 4, (2, 32) => 5,
      (3, 3) => 1, (3, 9) => 2, (3, 27) => 3,
      (4, 4) => 1, (4, 8) => 2, (4, 16) => 3, (4, 32) => 4, (4, 64) => 5,
      _ => throw new ArgumentException($"Illegal (perHeatN={perHeatN}, bracketSize={bracketSize}). Legal sizes for N={perHeatN}: {string.Join(',', ValidBracketSizesFor(perHeatN))}")
  };
  ```
  Unit tests assert each row and assert the throw for illegal combos.
- [ ] Unit tests for all helpers covering each `(perHeatN, bracketSize)` combination.

### Application — Bracket builder
- [ ] `Application/Tournaments/BracketBuilder.cs` (NEW):
  ```csharp
  public static void BuildBracket(AppDbContext context, Tournament tournament, List<CompetitionMember> members, int perHeatPlayerCount)
  ```
  Internal logic:
  1. Assert `members.Count == tournament.BracketSize` (caller's responsibility — defense-in-depth).
  2. Assign `Seed = i+1` to each shuffled member.
  3. Round 1: chunk members into groups of `perHeatPlayerCount` using **round-robin distribution** (heat `h` gets seeds `(h, h+heatsInRound1, h+2*heatsInRound1, …)` where `heatsInRound1 = bracketSize / perHeatPlayerCount`). Each Match has PlayerOneUserId..PlayerNUserId filled and `Match.PlayerCount = perHeatPlayerCount`. **Within each heat, the order in which seeds fill positional slots (PlayerOne..PlayerN) is randomized** so no player is permanently "slot 1" across heats (locked 2026-05-13 — tournament heat slot fairness).
  4. Rounds 2..totalRounds: placeholder matches (no participants) with `Match.PlayerCount = perHeatPlayerCount`, using `matchesInRound = previousRoundMatchCount / advanceRatio`.
  5. For each match, create exactly 1 Round row when `perHeatPlayerCount > 2`, or `tournament.BestOf` Round rows when `perHeatPlayerCount == 2`.
- [ ] **`MatchNumber` is globally monotonically increasing within a tournament, in iteration order through `(BracketNumber, heatIndex)`** (B7 from skeptical review — locked 2026-05-13). This is a load-bearing invariant for `SlotMapping` (046b): `positionInRound` is derived from `MatchNumber` ordering within a round. Document this in a `BracketBuilder` code comment; add a unit test that asserts MatchNumber assignment matches `(BracketNumber - 1) * heatsInPriorRounds + heatIndexInThisRound + 1` (or equivalent — pick a formula and stick to it). Any future refactor of `BracketBuilder` that changes MatchNumber assignment order MUST update `SlotMapping` in lockstep.
- [ ] `StartTournament.Handler` and `ShuffleBracket.Handler` both refactored to call `BracketBuilder.BuildBracket` — no duplicated logic.

### Application — CreateTournament
- [ ] `Application/Tournaments/DTOs/CreateTournamentDto.cs`: add `int PerHeatPlayerCount` (required, 2..4) — persisted to `Tournament.PerHeatPlayerCount`.
- [ ] `Application/Tournaments/DTOs/TournamentDto.cs`: add `int PerHeatPlayerCount` field for read responses. AutoMapper member-matching covers the new field automatically; verify the existing `Tournament → TournamentDto` profile has no `ForMember` exclusions blocking it. The frontend (046b) consumes this field on the bracket view (locked 2026-05-13 — H6 from skeptical review).
- [ ] `Application/Tournaments/Validators/CreateTournamentValidator.cs`: validate `PerHeatPlayerCount ∈ {2, 3, 4}`. If `PerHeatPlayerCount > 2`, validate `BestOf == 1`.
- [ ] `Application/Tournaments/Commands/CreateTournament.cs`: drop the hardcoded `validCounts = {4,8,16,32}` member count check (moved to StartTournament where the exact-size requirement is enforced). Set `tournament.PerHeatPlayerCount = dto.PerHeatPlayerCount`.
- [ ] **Critical**: do NOT leave `tournament.BracketSize = 0` during Planned status. Initialize `BracketSize` at Create time to `PerHeatPlayerCount` (the minimum legal size — `PerHeatPlayerCount` is always in `ValidBracketSizesFor(PerHeatPlayerCount)` because every set starts with N). This prevents `log2(0) = -Infinity` and similar pathologies in any read path that surfaces a Planned tournament. The actual final `BracketSize` is locked at StartTournament once the host has invited the exact roster.

### Application — StartTournament
- [ ] `Application/Tournaments/Commands/StartTournament.Command` (DTO): **no `PlayerCount` in the request body** — per-heat N is read from `tournament.PerHeatPlayerCount`.
- [ ] `Application/Tournaments/Commands/StartTournament.Handler`:
  1. Load tournament with members.
  2. Validate `Status == Planned`.
  3. Read `perHeatPlayerCount = tournament.PerHeatPlayerCount`.
  4. **Validate exact-size roster**: assert `BracketSizing.IsLegalRosterCount(perHeatPlayerCount, tournament.Members.Count)`. If not, return `Result.Failure` with message: "N={N}-player tournament requires exactly one of these member counts: {ValidBracketSizesFor(N) joined}. Currently {Members.Count} members invited."
  5. Set `tournament.BracketSize = tournament.Members.Count` (now guaranteed legal).
  6. Defense-in-depth: re-validate BestOf vs PerHeatPlayerCount.
  7. Call `BracketBuilder.BuildBracket(context, tournament, shuffledMembers, perHeatPlayerCount)`. Each generated Match has `Match.PlayerCount = perHeatPlayerCount`.
  8. Set `tournament.Status = Active`.
  9. SaveAsync (single transaction).
- [ ] Regression: existing N=2 tournament test (if any) with 8 members produces structurally equivalent bracket structure after this refactor.

### Application — ShuffleBracket
- [ ] `Application/Tournaments/Commands/ShuffleBracket.Handler`: existing pre-checks unchanged. **N-source**: read `perHeatPlayerCount = tournament.PerHeatPlayerCount` (persisted, not from soon-to-be-deleted Match rows). Replace inline bracket-generation logic with a call to `BracketBuilder.BuildBracket(context, tournament, shuffledMembers, tournament.PerHeatPlayerCount)`.
- [ ] **Member loading**: ensure the `.Include` chain loads members. With CPUs removed, no `.ThenInclude(m => m.User)` is required for IsCpu inspection. Standard `.Include(t => t.Members)` is sufficient.

### Application — CompleteTournamentMatch + ReopenTournamentMatch
- [ ] **Owned by task 046b.** Out of scope here.

### Application — DeleteTournament
- [ ] **No CPU cleanup required** (no CPU users exist). Existing delete logic stands.

### Persistence
- [ ] Migration `AddTournamentPerHeatPlayerCount`: adds `Tournament.PerHeatPlayerCount` (int NOT NULL DEFAULT 2). Existing rows backfill to 2.
- [ ] AppDbContext: configure the new column.

### Infrastructure
- [ ] No new auth handlers. **Verify** during implementation: read `API/Controllers/TournamentsController.cs` auth attributes; no participant checks read the new participant columns (they're in 046b's CompleteTournamentMatch scope).

### API
- [ ] `API/Controllers/TournamentsController.cs`: `CreateTournament` endpoint accepts `PerHeatPlayerCount`. `StartTournament` endpoint signature unchanged. `CompleteTournamentMatch` and `ReopenTournamentMatch` left for 046b.

### Frontend
- [ ] **Out of scope.** Frontend changes (TournamentForm, BracketView, useTournament) all live in 046b. This task is backend only.

### Regression / verification
- [ ] Manual: create N=2 tournament with 8 members → bracket renders as today
- [ ] Manual: create N=4 tournament with 6 members → rejected at StartTournament with "exactly one of: 4, 8, 16, 32, 64"
- [ ] Manual: create N=4 tournament with exactly 8 members → succeeds; 2 first-round heats of 4
- [ ] Manual: create N=3 tournament with exactly 9 members → succeeds; 3 first-round heats of 3
- [ ] Manual: shuffle a Planned N=4 8-member bracket → new pairings, still 2 heats of 4
- [ ] `dotnet build --configuration Release` passes
- [ ] e2e: existing N=2 tournament tests still pass

---

## Implementation Steps

### Domain
- [ ] `Domain/Tournament.cs`: add `PerHeatPlayerCount`.

### Application
- [ ] `Application/Tournaments/BracketSizing.cs` (NEW): static helpers + unit tests.
- [ ] `Application/Tournaments/BracketBuilder.cs` (NEW): bracket generation, round-robin seed distribution.
- [ ] `Application/Tournaments/DTOs/CreateTournamentDto.cs`: add `PerHeatPlayerCount`.
- [ ] `Application/Tournaments/Validators/CreateTournamentValidator.cs`: N-aware rules.
- [ ] `Application/Tournaments/Commands/CreateTournament.cs`: drop hardcoded validCounts check; set `PerHeatPlayerCount`; initialize `BracketSize = PerHeatPlayerCount`.
- [ ] `Application/Tournaments/Commands/StartTournament.cs`: exact-roster validation; delegate to BracketBuilder.
- [ ] `Application/Tournaments/Commands/ShuffleBracket.cs`: delegate to BracketBuilder.

### Persistence
- [ ] Migration `AddTournamentPerHeatPlayerCount` adds the column.
- [ ] AppDbContext: register.

### Tests
- [ ] Backend unit: `BracketSizing` (all helpers, all N).
- [ ] Backend integration: create + start an N=3 tournament with 9 members → 3 first-round heats, 1 final heat.
- [ ] Backend integration: create N=4 tournament with non-legal member count → rejected at StartTournament.
- [ ] Regression: existing N=2 tournament integration test produces same bracket structure.

---

## Domain Risk Checklist

- [x] **Composite keys** (#2): Not modified. **Risk: NONE.**
- [x] **Round-robin** (#1): Not applicable. **Risk: NONE.**
- [x] **Statistics** (#3): Not touched in this task. **Risk: NONE.**
- [x] **Guest merge** (#4): Already extended by 042. CPU concept removed. **Risk: NONE.**
- [x] **Authorization** (#5): No new auth handlers; existing handlers verified participant-agnostic for Tournament endpoints (verify during implementation). **Risk: LOW.**

---

## Dependencies

- **Blocked by**: 042 (Tournament rename + Match.PlayerCount + placement columns)
- **Blocks**: 046b (frontend + advancement logic)

---

## Code References

- `Domain/Tournament.cs` — add PerHeatPlayerCount
- `Application/Tournaments/Commands/CreateTournament.cs` — validator + handler updates
- `Application/Tournaments/Commands/StartTournament.cs` — rewrite per AC
- `Application/Tournaments/Commands/ShuffleBracket.cs` — delegate to BracketBuilder
- `task-board/n-player-support.md` — master initiative doc

---

## Rollback Plan

- Revert the commit. EF migration rollback removes the `PerHeatPlayerCount` column (NOT NULL with default → safe to drop). Backend handlers revert to N=2-only behavior. No frontend changes in this task to roll back.
- **Risk**: LOW.

---

## Progress Log

[Updated during implementation]

---

## Resolution

[Filled when complete]
