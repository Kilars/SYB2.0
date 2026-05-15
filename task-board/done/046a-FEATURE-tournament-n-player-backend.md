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
- [x] `Domain/Tournament.cs`: ADD `public int PerHeatPlayerCount { get; set; } = 2;` (NOT NULL DEFAULT 2 at the DB level). Validator enforces 2..4. `Tournament.BracketSize` (already renamed in 042) keeps its meaning.
- [x] **No new field for CPU tracking.**

### Application — Shared bracket helpers
- [x] `Application/Tournaments/BracketSizing.cs` (NEW):
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
- [x] **`TotalRoundsFor` MUST be integer-safe** (B6 from skeptical review — locked 2026-05-13). Do NOT use `Math.Log(bracketSize, N)` — base-conversion precision loss (e.g. `Math.Log(27, 3) ≈ 2.9999…`) silently produces wrong round counts. Implementation is a switch table over the legal `(perHeatN, bracketSize)` pairs declared in `ValidBracketSizesFor`:
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
- [~] Unit tests for all helpers covering each `(perHeatN, bracketSize)` combination. **DEFERRED — no .NET test project exists in the repo (same precedent as tasks 043/044/045). See Resolution.**

### Application — Bracket builder
- [x] `Application/Tournaments/BracketBuilder.cs` (NEW):
  ```csharp
  public static void BuildBracket(AppDbContext context, Tournament tournament, List<CompetitionMember> members, int perHeatPlayerCount)
  ```
  Internal logic:
  1. Assert `members.Count == tournament.BracketSize` (caller's responsibility — defense-in-depth).
  2. Assign `Seed = i+1` to each shuffled member.
  3. Round 1: chunk members into groups of `perHeatPlayerCount` using **round-robin distribution** (heat `h` gets seeds `(h, h+heatsInRound1, h+2*heatsInRound1, …)` where `heatsInRound1 = bracketSize / perHeatPlayerCount`). Each Match has PlayerOneUserId..PlayerNUserId filled and `Match.PlayerCount = perHeatPlayerCount`. **Within each heat, the order in which seeds fill positional slots (PlayerOne..PlayerN) is randomized** so no player is permanently "slot 1" across heats (locked 2026-05-13 — tournament heat slot fairness).
  4. Rounds 2..totalRounds: placeholder matches (no participants) with `Match.PlayerCount = perHeatPlayerCount`, using `matchesInRound = previousRoundMatchCount / advanceRatio`.
  5. For each match, create exactly 1 Round row when `perHeatPlayerCount > 2`, or `tournament.BestOf` Round rows when `perHeatPlayerCount == 2`.
- [x] **`MatchNumber` is globally monotonically increasing within a tournament, in iteration order through `(BracketNumber, heatIndex)`** (B7 from skeptical review — locked 2026-05-13). Documented in the `BracketBuilder` class XML comment (the running `matchNumber` counter spans all rounds). Unit-test assertion deferred (no test project — see Resolution).
- [x] `StartTournament.Handler` and `ShuffleBracket.Handler` both refactored to call `BracketBuilder.BuildBracket` — no duplicated logic.

### Application — CreateTournament
- [x] `Application/Tournaments/DTOs/CreateTournamentDto.cs`: add `int PerHeatPlayerCount` (required, 2..4) — persisted to `Tournament.PerHeatPlayerCount`.
- [x] `Application/Tournaments/DTOs/TournamentDto.cs`: add `int PerHeatPlayerCount` field for read responses. AutoMapper member-matching covers the new field automatically; verified the existing `Tournament → TournamentDto` profile (`MappingProfiles.cs:19`) is a bare `CreateMap` with no `ForMember` exclusions.
- [x] `Application/Tournaments/Validators/CreateTournamentValidator.cs`: validate `PerHeatPlayerCount ∈ {2, 3, 4}`. If `PerHeatPlayerCount > 2`, validate `BestOf == 1`.
- [x] `Application/Tournaments/Commands/CreateTournament.cs`: drop the hardcoded `validCounts = {4,8,16,32}` member count check (moved to StartTournament where the exact-size requirement is enforced). Set `tournament.PerHeatPlayerCount = dto.PerHeatPlayerCount`.
- [x] **Critical**: do NOT leave `tournament.BracketSize = 0` during Planned status. Initialize `BracketSize` at Create time to `PerHeatPlayerCount` (the minimum legal size — `PerHeatPlayerCount` is always in `ValidBracketSizesFor(PerHeatPlayerCount)` because every set starts with N). This prevents `log2(0) = -Infinity` and similar pathologies in any read path that surfaces a Planned tournament. The actual final `BracketSize` is locked at StartTournament once the host has invited the exact roster.

### Application — StartTournament
- [x] `Application/Tournaments/Commands/StartTournament.Command` (DTO): **no `PlayerCount` in the request body** — per-heat N is read from `tournament.PerHeatPlayerCount`.
- [x] `Application/Tournaments/Commands/StartTournament.Handler`:
  1. Load tournament with members.
  2. Validate `Status == Planned`.
  3. Read `perHeatPlayerCount = tournament.PerHeatPlayerCount`.
  4. **Validate exact-size roster**: assert `BracketSizing.IsLegalRosterCount(perHeatPlayerCount, tournament.Members.Count)`. If not, return `Result.Failure` with message: "N={N}-player tournament requires exactly one of these member counts: {ValidBracketSizesFor(N) joined}. Currently {Members.Count} members invited."
  5. Set `tournament.BracketSize = tournament.Members.Count` (now guaranteed legal).
  6. Defense-in-depth: re-validate BestOf vs PerHeatPlayerCount.
  7. Call `BracketBuilder.BuildBracket(context, tournament, shuffledMembers, perHeatPlayerCount)`. Each generated Match has `Match.PlayerCount = perHeatPlayerCount`.
  8. Set `tournament.Status = Active`.
  9. SaveAsync (single transaction).
- [x] Regression: existing N=2 tournament test (if any) with 8 members produces structurally equivalent bracket structure after this refactor. **Manual review: for N=2, BracketSizing.TotalRoundsFor/AdvanceRatio/heatsInRound1 reduce to log2/2/half — same structure as the old inline GenerateBracket. No automated test harness to run e2e (see Resolution).**

### Application — ShuffleBracket
- [x] `Application/Tournaments/Commands/ShuffleBracket.Handler`: existing pre-checks unchanged. **N-source**: read `perHeatPlayerCount = tournament.PerHeatPlayerCount` (persisted, not from soon-to-be-deleted Match rows). Replace inline bracket-generation logic with a call to `BracketBuilder.BuildBracket(context, tournament, tournament.Members.ToList(), tournament.PerHeatPlayerCount)`.
- [x] **Member loading**: `.Include(x => x.Members)` retained; no `.ThenInclude(m => m.User)` needed (CPU concept removed).

### Application — CompleteTournamentMatch + ReopenTournamentMatch
- [ ] **Owned by task 046b.** Out of scope here.

### Application — DeleteTournament
- [x] **No CPU cleanup required** (no CPU users exist). Existing delete logic stands. **Verified — DeleteTournament.cs not touched.**

### Persistence
- [x] Migration `AddTournamentPerHeatPlayerCount`: adds `Tournament.PerHeatPlayerCount` (int NOT NULL DEFAULT 2). Existing rows backfill to 2. **Hand-written (dotnet/ef unavailable) following the 042 migration pattern; Designer + ModelSnapshot updated in lockstep.**
- [x] AppDbContext: configure the new column (`HasDefaultValue(2)`, mirroring the Match.PlayerCount pattern).

### Infrastructure
- [x] No new auth handlers. **Verified**: `TournamentsController` uses only `IsCompetitionAdmin` (start/shuffle/delete) and `IsCompetitionMember` (match endpoints); no participant-column checks. CompleteTournamentMatch/ReopenTournamentMatch logic untouched (046b scope).

### API
- [x] `API/Controllers/TournamentsController.cs`: `CreateTournament` endpoint accepts `PerHeatPlayerCount` via `CreateTournamentDto` (no controller change needed). `StartTournament` endpoint signature unchanged. `CompleteTournamentMatch` and `ReopenTournamentMatch` left for 046b.

### Frontend
- [x] **Out of scope.** No frontend changes made. Frontend changes (TournamentForm, BracketView, useTournament) all live in 046b. This task is backend only.

### Regression / verification
- [~] Manual: create N=2 tournament with 8 members → bracket renders as today. **Deferred: no runtime env (no dotnet); logic-reviewed equivalent.**
- [x] Manual (logic review): N=4 with 6 members → StartTournament returns Failure "N=4-player tournament requires exactly one of these member counts: 4, 8, 16, 32, 64. Currently 6 members invited."
- [x] Manual (logic review): N=4 with 8 members → BracketSize=8, heatsInRound1=8/4=2, 2 first-round heats of 4. Correct.
- [x] Manual (logic review): N=3 with 9 members → BracketSize=9, heatsInRound1=9/3=3, 3 first-round heats of 3, totalRounds=2. Correct.
- [x] Manual (logic review): shuffle Planned/Active N=4 8-member → BuildBracket re-runs, 2 heats of 4. Correct.
- [~] `dotnet build --configuration Release` passes. **DEFERRED — dotnet not installed (precedent 043/044/045). Manual compile-correctness review performed; see Resolution.**
- [~] e2e: existing N=2 tournament tests still pass. **DEFERRED — no test harness in repo.**

---

## Implementation Steps

### Domain
- [x] `Domain/Tournament.cs`: add `PerHeatPlayerCount`. (Pre-existing from earlier 042/046 groundwork — verified correct.)

### Application
- [x] `Application/Tournaments/BracketSizing.cs` (NEW): static helpers. (Pre-existing — verified matches spec verbatim.)
- [x] `Application/Tournaments/BracketBuilder.cs` (NEW): bracket generation, round-robin seed distribution. (Pre-existing — verified matches spec.)
- [x] `Application/Tournaments/DTOs/CreateTournamentDto.cs`: add `PerHeatPlayerCount`. (Pre-existing.)
- [x] `Application/Tournaments/Validators/CreateTournamentValidator.cs`: N-aware rules. (Pre-existing.)
- [x] `Application/Tournaments/Commands/CreateTournament.cs`: drop hardcoded validCounts check; set `PerHeatPlayerCount`; initialize `BracketSize = PerHeatPlayerCount`. (Pre-existing.)
- [x] `Application/Tournaments/Commands/StartTournament.cs`: exact-roster validation; delegate to BracketBuilder. **(Implemented this task — replaced inline GenerateBracket.)**
- [x] `Application/Tournaments/Commands/ShuffleBracket.cs`: delegate to BracketBuilder. **(Implemented this task — replaced inline logic.)**

### Persistence
- [x] Migration `AddTournamentPerHeatPlayerCount` adds the column. **(Implemented this task — hand-written.)**
- [x] AppDbContext: register. **(Implemented this task.)**

### Tests
- [~] Backend unit: `BracketSizing` (all helpers, all N). **DEFERRED — no .NET test project in repo (precedent 043/044/045).**
- [~] Backend integration: create + start an N=3 tournament with 9 members. **DEFERRED — no test harness.**
- [~] Backend integration: create N=4 tournament with non-legal member count → rejected. **DEFERRED — no test harness.**
- [~] Regression: existing N=2 tournament integration test. **DEFERRED — no test harness.**

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

- 2026-05-15: Surveyed existing state. Found Domain (`Tournament.PerHeatPlayerCount`), `BracketSizing.cs`, `BracketBuilder.cs`, `CreateTournamentDto`, `TournamentDto`, `CreateTournamentValidator`, and the `CreateTournament` handler were ALREADY implemented per spec by earlier 042/046 groundwork. Verified each against the locked spec — all correct (BracketSizing switch table integer-safe, BracketBuilder round-robin distribution + randomized in-heat slot fill + monotonic MatchNumber comment).
- 2026-05-15: Refactored `StartTournament.Handler` — removed inline `GenerateBracket`/`Shuffle`; added exact-roster validation via `BracketSizing.IsLegalRosterCount` with the spec'd failure message; locks `BracketSize = Members.Count`; defense-in-depth BestOf re-check; delegates to `BracketBuilder.BuildBracket`. Command DTO unchanged (no PlayerCount in body).
- 2026-05-15: Refactored `ShuffleBracket.Handler` — removed inline generation/shuffle; kept the delete-then-separate-SaveChanges step (avoids composite-key collision when BuildBracket re-inserts), then delegates to `BracketBuilder.BuildBracket` reading `tournament.PerHeatPlayerCount`. `.Include(x => x.Members)` retained (no ThenInclude needed — CPU concept removed).
- 2026-05-15: AppDbContext — added `Tournament.PerHeatPlayerCount` `HasDefaultValue(2)` mirroring the Match.PlayerCount pattern (prevents EF PendingModelChangesWarning).
- 2026-05-15: Hand-wrote migration `20260515000000_AddTournamentPerHeatPlayerCount` (dotnet/ef unavailable) + Designer + updated `AppDbContextModelSnapshot` — adds int NOT NULL DEFAULT 2 column to `Competitions` (TPH); DEFAULT backfills existing tournament rows to 2 (all pre-existing tournaments were N=2).
- 2026-05-15: Verified TournamentsController auth attributes (IsCompetitionAdmin / IsCompetitionMember only — no participant-column checks) and AutoMapper profile (bare CreateMap, no ForMember exclusions blocking PerHeatPlayerCount).
- 2026-05-15: `/simplify` pass (3 parallel review agents — reuse/quality/efficiency). Applied: removed 3 WHAT-narrating comments + trimmed a historical "CPU concept removed" aside (aligns with CLAUDE.md no-comment policy). Skipped with rationale: (a) consolidating the triplicated `Shuffle<T>` would require editing the critical `ChangeLeagueStatus.cs` (round-robin invariant #1), out of task scope — BracketBuilder's private copy matches existing codebase convention; (b) ShuffleBracket's separate delete+SaveChanges is a deliberate composite-key collision safeguard (invariant #2) — not traded away for one DB round-trip on a rare admin action; (c) redundant `PerHeatPlayerCount` assignment in CreateTournament mirrors the adjacent pre-existing `BestOf` line, kept for local consistency.

---

## Resolution

**Completed.** Backend N-player tournament groundwork is in place.

**Files modified this task:**
- `Application/Tournaments/Commands/StartTournament.cs` — exact-roster validation + delegate to BracketBuilder (replaced inline GenerateBracket).
- `Application/Tournaments/Commands/ShuffleBracket.cs` — delegate to BracketBuilder (replaced inline logic).
- `Persistence/AppDbContext.cs` — `PerHeatPlayerCount` HasDefaultValue(2).
- `Persistence/Migrations/AppDbContextModelSnapshot.cs` — added PerHeatPlayerCount to Tournament entity.

**Files created this task:**
- `Persistence/Migrations/20260515000000_AddTournamentPerHeatPlayerCount.cs`
- `Persistence/Migrations/20260515000000_AddTournamentPerHeatPlayerCount.Designer.cs`

**Files verified pre-existing & spec-conformant (no change needed):**
- `Domain/Tournament.cs`, `Application/Tournaments/BracketSizing.cs`, `Application/Tournaments/BracketBuilder.cs`, `Application/Tournaments/DTOs/CreateTournamentDto.cs`, `Application/Tournaments/DTOs/TournamentDto.cs`, `Application/Tournaments/Validators/CreateTournamentValidator.cs`, `Application/Tournaments/Commands/CreateTournament.cs`, `API/Controllers/TournamentsController.cs`.

**Build verification:** DEFERRED — `dotnet` is not installed in this environment (`which dotnet` → not found), and no .NET test project exists in the repo. Same explicit precedent as tasks 043/044/045. Performed a manual compile-correctness review: all usings/types/namespaces resolve (BracketSizing/BracketBuilder live in `Application.Tournaments`, visible from the `Application.Tournaments.Commands` handlers via parent-namespace scope); `tournament.Members.ToList()` yields `List<CompetitionMember>` matching `BuildBracket`'s signature; `Result<Unit>` failure paths follow existing conventions; migration follows the verbatim shape of `20260513000000_ExtendMatchToFourPlayersWithPlacement`; Designer + ModelSnapshot kept in lockstep. No `TreatWarningsAsErrors` in the csprojs, so any residual unused-using warnings are non-fatal.

**Tests:** DEFERRED — repo has no test project (only Domain/Application/Persistence/Infrastructure/API csprojs; no `*test*.csproj`). Fabricating a test project is out of scope and explicitly disallowed by the task instructions; documented here per the 043/044/045 precedent. The BracketSizing/BracketBuilder unit tests and N=3/N=4 integration tests should be added when a test harness is introduced.

**Deviations / notes:**
- Most of the Application/Domain surface was already implemented (earlier 042/046 groundwork). This task's net new code was the StartTournament/ShuffleBracket refactor to delegate to BracketBuilder, plus the persistence migration/registration. No spec deviations.
- `CompleteTournamentMatch`/`ReopenTournamentMatch` still contain `(int)Math.Log2(tournament.BracketSize)` — intentionally left untouched (owned by 046b, explicitly out of scope here).
- The redundant `tournament.PerHeatPlayerCount = dto.PerHeatPlayerCount` in CreateTournament (AutoMapper already maps it) was left as-is — pre-existing, not in scope to refactor, and harmless.

**Risk:** LOW. Composite keys untouched. No statistics/round-robin/guest-merge logic touched. Migration is additive NOT NULL DEFAULT 2 (safe drop on rollback).
