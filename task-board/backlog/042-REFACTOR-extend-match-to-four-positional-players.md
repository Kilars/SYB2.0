# 042-REFACTOR-extend-match-to-four-players-with-placement

**Status**: Backlog
**Created**: 2026-05-12
**Updated**: 2026-05-13 (post-skeptical-review patches)
**Priority**: High
**Type**: REFACTOR
**Estimated Effort**: Medium

---

## Context

Schema groundwork for upcoming N=2–4 player match support across all three modes (league, casual, tournament). This is **sub-plan 1 of 5** in the N-player initiative (`task-board/n-player-support.md`).

This task is **mostly schema-additive** with several behavior changes (guest-merge FK remap expansion, GetUserMatches read fix, AutoMapper profile updates, `Tournament.PlayerCount` rename):
- Adds two nullable FK columns to `Match` for **participants**: `PlayerThreeUserId`, `PlayerFourUserId` (mirror existing `PlayerOne/TwoUserId` pattern)
- Adds three nullable string columns to `Match` for **placement results**: `SecondPlaceUserId`, `ThirdPlaceUserId`, `FourthPlaceUserId` (existing `WinnerUserId` = 1st place — see "Placement columns are plain strings, not FKs" below)
- Adds **`Match.PlayerCount`** (int, NOT NULL, default 2) — per-match, not on Competition
- Adds **`League.PlayerCount`** (int?, nullable) — persisted on the League entity so the configured N survives status revert/reactivate cycles
- Adds nullable `Round.PlayerThreeCharacterId` + `PlayerFourCharacterId` columns (**`string?` FK to Character.Id**) so character capture works for 3P/4P matches
- Adds **DB CHECK constraints** enforcing that `PlayerCount ∈ {2,3,4}` and that participant/placement column population is consistent with `PlayerCount`
- **Renames `Tournament.PlayerCount` → `Tournament.BracketSize`** to kill the cognitive collision with `Match.PlayerCount` (per-heat). Bracket size is a Tournament-only concept; the rename makes intent explicit
- **Extends `MergeGuest.cs`** to remap the 5 new FK columns
- **Fixes `GetUserMatches`** Where-clause to read PlayerOne..PlayerFour (currently reads PlayerOne/Two only — a latent bug that becomes user-visible the moment N>2 matches exist)
- **Updates AutoMapper profiles** for `Match` and `Round` to map the new columns, with `.Condition` guards on the reverse maps to prevent silent null overwrites on partial updates
- Subsequent sub-plans (UI, league wiring, casual wiring, tournament wiring) consume these columns

Data model decisions (locked in initiative doc):
- Positional columns over `MatchParticipant` join table: smallest schema change, parity with existing pattern, capped at 4 players
- Explicit 1st/2nd/3rd/4th placement columns: clearest semantics, matches Mario-Kart-style placement points
- **Placement columns are plain `string?`, not foreign keys**: matches the existing `Match.WinnerUserId` pattern. Membership of a placer in the match's `PlayerOne..PlayerFour` participant set is enforced by FluentValidation in tasks 044/045/046, not by the DB
- **`PlayerCount` lives on `Match` (per-heat) AND `League` (configured intent)**
- **No CPU bracket fillers.** Tournaments require an exact-size roster matching a legal `(N, BracketSize)` combination. Locked decision after skeptical review (2026-05-13) removed the previous CPU-padding design — `User.IsCpu` is **not** added. Roster validation lives in task 046a
- **Ties are not supported.** Downstream validators reject duplicate placement userIds

### Why rename `Tournament.PlayerCount` → `Tournament.BracketSize`

Original schema had `Tournament.PlayerCount` meaning "total bracket size after CPU padding". Now that CPU fillers are removed and per-heat N lives on `Match.PlayerCount`, the field's only remaining job is to encode bracket size (4, 8, 16, 32 for N=2; etc.). The rename makes that explicit and removes a footgun where readers had to context-switch between "PlayerCount on Match means per-heat" vs "PlayerCount on Tournament means bracket size". Schema-touching rename → lives in this task.

### TPH column strategy (B1 — locked 2026-05-13)

`Competition` uses Table-Per-Hierarchy. The pre-existing migration places a shared, nullable `PlayerCount` column on the `Competitions` table — used today only by `Tournament`. With this task introducing `League.PlayerCount` (also int?, also a subclass column on the same TPH table), EF Core would by default map both subclass properties to that single shared column. **That collision is the bug.**

**Resolution**: explicitly disjoin via `HasColumnName`:
- `Tournament.BracketSize` → physical column `BracketSize` (new, NOT NULL)
- `League.PlayerCount` → physical column `LeaguePlayerCount` (new, nullable)
- The pre-existing shared `PlayerCount` column is **dropped** in this migration after Tournament's data is moved into `BracketSize`.

EF config in `AppDbContext.cs`:
```csharp
builder.Entity<Tournament>()
    .Property(t => t.BracketSize)
    .HasColumnName("BracketSize");
builder.Entity<League>()
    .Property(l => l.PlayerCount)
    .HasColumnName("LeaguePlayerCount");
```

The migration body is therefore not a `RenameColumn` — it is:
1. `AddColumn` `BracketSize` (int NOT NULL DEFAULT 0)
2. `Sql("UPDATE Competitions SET BracketSize = PlayerCount WHERE CompetitionType = 'Tournament'")`
3. `AddColumn` `LeaguePlayerCount` (int NULL)
4. **Backfill**: `Sql("UPDATE Competitions SET LeaguePlayerCount = 2 WHERE CompetitionType = 'League' AND Status <> 0")` — pre-existing Active/Complete leagues are pinned to N=2 so the leaderboard formula swap in 044 reads them correctly (B5 — locked 2026-05-13). **Column name is `CompetitionType` (not `Discriminator`) — verified at `AppDbContext.cs:26` via `HasDiscriminator<string>("CompetitionType")`. `Status` is stored as `int` (CompetitionStatus enum), so `Planned = 0`.**
5. `DropColumn` `PlayerCount` (after data migrated).

### DB-level invariants (CHECK constraints in the migration)

To prevent malformed rows from any of three downstream handlers (044/045/046) silently producing inconsistent state, the migration adds CHECK constraints on `Match`. SQL Server has no boolean type, so paired-implication form is used (not predicate-equality):

- `CK_Match_PlayerCount_Range` — `PlayerCount BETWEEN 2 AND 4`
- `CK_Match_Participants_Consistent` —
  ```sql
  ((PlayerCount >= 3 AND PlayerThreeUserId IS NOT NULL) OR (PlayerCount < 3 AND PlayerThreeUserId IS NULL))
  AND
  ((PlayerCount = 4 AND PlayerFourUserId IS NOT NULL) OR (PlayerCount < 4 AND PlayerFourUserId IS NULL))
  ```
- `CK_Match_PlacementsBounded` —
  ```sql
  (PlayerCount >= 3 OR ThirdPlaceUserId IS NULL)
  AND
  (PlayerCount = 4 OR FourthPlaceUserId IS NULL)
  ```
- `CK_Match_Participants_Distinct` (B3 — added 2026-05-13) — pairwise-distinct participant userIds when non-null. SQL Server-friendly form:
  ```sql
  (PlayerOneUserId IS NULL OR PlayerTwoUserId IS NULL OR PlayerOneUserId <> PlayerTwoUserId)
  AND (PlayerOneUserId IS NULL OR PlayerThreeUserId IS NULL OR PlayerOneUserId <> PlayerThreeUserId)
  AND (PlayerOneUserId IS NULL OR PlayerFourUserId IS NULL OR PlayerOneUserId <> PlayerFourUserId)
  AND (PlayerTwoUserId IS NULL OR PlayerThreeUserId IS NULL OR PlayerTwoUserId <> PlayerThreeUserId)
  AND (PlayerTwoUserId IS NULL OR PlayerFourUserId IS NULL OR PlayerTwoUserId <> PlayerFourUserId)
  AND (PlayerThreeUserId IS NULL OR PlayerFourUserId IS NULL OR PlayerThreeUserId <> PlayerFourUserId)
  ```
  Closes the `ExecuteUpdateAsync` bypass surfaced during MergeGuest review — FluentValidation only fires on CQRS write paths; this constraint catches the bare-EF path too.
- `CK_Match_Placements_InParticipantSet` (B3 — added 2026-05-13) — each non-null placement userId must appear in the participant set:
  ```sql
  (SecondPlaceUserId IS NULL OR SecondPlaceUserId IN (PlayerOneUserId, PlayerTwoUserId, PlayerThreeUserId, PlayerFourUserId))
  AND (ThirdPlaceUserId IS NULL OR ThirdPlaceUserId IN (PlayerOneUserId, PlayerTwoUserId, PlayerThreeUserId, PlayerFourUserId))
  AND (FourthPlaceUserId IS NULL OR FourthPlaceUserId IN (PlayerOneUserId, PlayerTwoUserId, PlayerThreeUserId, PlayerFourUserId))
  ```
  Placement columns are plain strings (not FKs), so without this constraint a stray userId could be persisted that points at no participant.

These make defensive reads downstream unnecessary — handlers fail loud at the DB boundary instead of silently coercing.

---

## Acceptance Criteria

### Schema — Match
- [ ] `Match.PlayerCount` exists as `int NOT NULL` with default `2`, validated 2–4 wherever it's written. **Per-match, not on `Competition`.** All existing Match rows backfill to `2` via the migration's `AddColumn(defaultValue: 2)`.
- [ ] `Match.PlayerThreeUserId` (nullable string) + `PlayerThree` nav property exist, mirror `PlayerOne` participant FK shape (composite `{PlayerThreeUserId, CompetitionId}` → CompetitionMember)
- [ ] `Match.PlayerFourUserId` (nullable string) + `PlayerFour` nav property exist, mirror `PlayerOne` participant FK shape
- [ ] `Match.SecondPlaceUserId` (nullable `string`, **NOT a foreign key** — matches existing `WinnerUserId` shape, which is also a plain string without EF FK configuration). No nav property.
- [ ] `Match.ThirdPlaceUserId` (nullable `string`, plain — same as SecondPlaceUserId)
- [ ] `Match.FourthPlaceUserId` (nullable `string`, plain — same as SecondPlaceUserId)
- [ ] `CompetitionMember.MatchesAsPlayerThree` + `MatchesAsPlayerFour` collections exist (mirror `MatchesAsPlayerOne` field pattern — note these are public **fields**, not properties, matching the existing convention in `CompetitionMember.cs`). **No inverse collections for SecondPlace/ThirdPlace/FourthPlace** (they aren't FKs).
- [ ] AppDbContext configures `PlayerThree` + `PlayerFour` participant FKs with `IsRequired(false)` and `OnDelete: NoAction`, mirroring the PlayerOne/Two pattern. Placement columns get no FK config (plain strings).
- [ ] **DB CHECK constraints added** in the migration (paired-implication SQL, not predicate-equality): `CK_Match_PlayerCount_Range`, `CK_Match_Participants_Consistent`, `CK_Match_PlacementsBounded`, **`CK_Match_Participants_Distinct`**, **`CK_Match_Placements_InParticipantSet`**. Exact predicates listed above.
- [ ] **Single-round contract for N>2 documented in this task, enforced in 044/046**: when `Match.PlayerCount > 2`, exactly one `Round` row is created regardless of the value of `Competition.BestOf`. The schema itself does not enforce this (no CHECK); the AC pins it as a load-bearing assumption for 044's schedule generator and 046a's `BracketBuilder`. 044 additionally forces `League.BestOf = 1` at activation when `PlayerCount > 2` (B4 — locked 2026-05-13).
- [ ] EF Core auto-generates indexes on the new composite participant FKs (`{PlayerThreeUserId, CompetitionId}`, `{PlayerFourUserId, CompetitionId}`). Verify in the generated migration output; if not auto-created, add explicit `HasIndex` calls.
- [ ] `Competition` base class is **not** modified.

### Schema — Tournament rename
- [ ] **`Tournament.PlayerCount` renamed to `Tournament.BracketSize`** (`int NOT NULL`). Because `Competition` is TPH, this is **not** a `RenameColumn` — see "TPH column strategy" above. Migration adds a new `BracketSize` column, copies values from the shared `PlayerCount` column for `CompetitionType = 'Tournament'` rows, and drops the old shared column after `League.LeaguePlayerCount` is also added.
- [ ] Domain entity property renamed.
- [ ] AppDbContext config updated with explicit `HasColumnName("BracketSize")` on `Tournament.BracketSize`.
- [ ] `Application/Core/MappingProfiles.cs` `CreateMap<Tournament, TournamentDto>()` updated.
- [ ] `client/src/lib/types/index.d.ts` `Tournament` interface: `playerCount` renamed to `bracketSize`.
- [ ] Every backend handler reading `tournament.PlayerCount` updated (`StartTournament`, `ShuffleBracket`, `CompleteTournamentMatch`, etc.) — mechanical rename. Audit via grep before submitting.
- [ ] Every frontend reference to `tournament.playerCount` updated — mechanical rename.

### Schema — League
- [ ] `League.PlayerCount` (nullable `int`) added. **Persists to physical column `LeaguePlayerCount`** (explicit `HasColumnName("LeaguePlayerCount")` to disjoin from the shared TPH column — see "TPH column strategy"). Null until first activation; written by `ChangeLeagueStatus` (task 044) on Planned→Active transition; preserved on Active→Planned revert and any subsequent reactivation. Stores configured intent only — authoritative per-match value still lives on `Match.PlayerCount`.
- [ ] No CHECK constraint on `League.PlayerCount` (range validated at FluentValidation; nullable).
- [ ] **Migration backfills `LeaguePlayerCount = 2` for any `League` row whose `Status <> 0` (i.e., not Planned)** at migration time. Reason: pre-existing Active/Complete leagues never re-enter the activation flow, so their PlayerCount would otherwise stay null forever and the leaderboard rename in 044 would lie about the formula in use. Planned-status leagues keep `null` and pick up the value on their first activation (B5 — locked 2026-05-13).
- [ ] **Read contract for downstream consumers**: any handler/query reading `league.PlayerCount` MUST coalesce a null to 2 (`league.PlayerCount ?? 2`). After the backfill above, the only `null` rows are Planned-status leagues pending activation. Document this in the implementation steps and in `CLAUDE.md` once 044 lands.

### Schema — Round
- [ ] `Round.PlayerThreeCharacterId` (nullable `string`, FK to `Character.Id` which is `string`) + nav property exist, mirroring the existing `PlayerOneCharacterId` shape. **NOT `int?`** — Character.Id is `string` in the current codebase.
- [ ] `Round.PlayerFourCharacterId` (nullable `string`, FK to `Character.Id`) + nav property exist.
- [ ] AppDbContext configures the two new FKs with `IsRequired(false)` and `OnDelete: NoAction`.
- [ ] Round PK `{CompetitionId, BracketNumber, MatchNumber, RoundNumber}` is **unchanged** (composite key safety).
- [ ] Doc comment on Round added explaining: for N=2 matches there are 3 Round rows (RoundNumber 1..3, Bo3); for N>2 matches there is exactly 1 Round row (RoundNumber=1, no Bo3) — actual enforcement lives in handlers (tasks 044/045/046).

### Migration
- [ ] EF migration generated containing: `AddColumn` for the 5 new Match columns + 2 new Round columns (both `string?`) + `League.PlayerCount`, `RenameColumn` for `Tournament.PlayerCount → BracketSize`, 2 new participant FK constraints on `Match`, 2 new character FK constraints on `Round`, and the 3 CHECK constraints with paired-implication SQL.
- [ ] Migration applies cleanly to an existing dev DB; all existing `Match` rows have new placement columns `= NULL`, `PlayerCount = 2`; all existing `Round` rows have new character columns `= NULL`; all existing `League` rows have `PlayerCount = NULL`; all existing `Tournament` rows have their old `PlayerCount` value moved into `BracketSize`.
- [ ] No data manipulation in the migration `Up()` beyond the default-value backfills implicit in `AddColumn(defaultValue: ...)`.
- [ ] Rollback (`Down()`) reverses each operation: drop the CHECK constraints, drop the new FKs, drop the new columns, and `RenameColumn` `BracketSize → PlayerCount`.

### MergeGuest expansion (behavior change)
- [ ] `Application/Guests/Commands/MergeGuest.cs` FK remap covers all 5 new `Match` columns: `PlayerThreeUserId`, `PlayerFourUserId`, `SecondPlaceUserId`, `ThirdPlaceUserId`, `FourthPlaceUserId`.
- [ ] Existing remap of `PlayerOneUserId`, `PlayerTwoUserId`, `WinnerUserId`, `Round.WinnerUserId` continues to work unchanged.
- [ ] All 9 column updates happen in a single transaction (existing pattern). **Add explicit comment**: the transaction now contains 9 `ExecuteUpdate` round-trips. If contention grows under load, consider `IsolationLevel.Serializable` on the surrounding transaction — currently not changed.
- [ ] Conflict check: target user must not already be a member of any competition the guest belongs to (existing rule, unchanged).
- [ ] **NEW conflict check — same-match participant collision**: before remapping, reject the merge if any `Match` exists where the guest occupies one participant slot AND the target user occupies a *different* participant slot (PlayerOne/Two/Three/Four). Remapping would collapse two distinct participants into one userId and violate `CK_Match_Participants_Distinct` at `SaveChanges`. Detect with a single query: `Matches.Any(m => (m.PlayerOneUserId == guestId || m.PlayerTwoUserId == guestId || m.PlayerThreeUserId == guestId || m.PlayerFourUserId == guestId) && (m.PlayerOneUserId == targetId || m.PlayerTwoUserId == targetId || m.PlayerThreeUserId == targetId || m.PlayerFourUserId == targetId))`. Return a `Result.Failure` listing the offending `(CompetitionId, BracketNumber, MatchNumber)` triples so the operator can resolve manually. No placement-column check needed — `CK_Match_Placements_InParticipantSet` ensures a placement userId is always also a participant, so any placement collision is caught transitively.
- [ ] Unit test or manual verification: merge a guest who has rows referencing PlayerThree/Four + 2nd/3rd/4th place; all FK references update correctly. **Add a regression test for the same-match collision case**: guest is PlayerThree, target is PlayerOne in the same Match — merge must be rejected before any `ExecuteUpdate` runs.

### GetUserMatches read-contract fix (sequenced here, not in 045)
- [ ] `Application/Matches/Queries/GetUserMatches.cs` Where-clause expanded from `m.PlayerOneUserId == id || m.PlayerTwoUserId == id` to also include `m.PlayerThreeUserId == id || m.PlayerFourUserId == id`. Includes also expanded for PlayerThree/PlayerFour (each with `.User`).
- [ ] Rationale: any task that *writes* PlayerThree/Four (044/045/046) requires this read to be expanded simultaneously, otherwise users participating as P3/P4 vanish from their own match history.

### AutoMapper profile updates (sequenced here)
- [ ] `Application/Core/MappingProfiles.cs` is the **only** AutoMapper profile in the codebase. `CreateMap<Match, MatchDto>()` (around line 24) and `CreateMap<Round, RoundDto>()` (around line 26) are the only two mappings affected. **Imaginary `Application/Tournaments/Tournament*MatchDto.cs` files do not exist** — do not search for them.
- [ ] Add new fields to `MatchDto` (`PlayerThreeUserId`, `PlayerFourUserId`, `SecondPlaceUserId`, `ThirdPlaceUserId`, `FourthPlaceUserId`, `PlayerCount`) and `RoundDto` (`PlayerThreeCharacterId`, `PlayerFourCharacterId`). Default member-matching covers forward map — no `ForMember` needed on `Match → MatchDto` or `Round → RoundDto`.
- [ ] **`RoundDto → Round` reverse map requires `.Condition` guards on the NEW fields ONLY** to prevent silent null overwrites on partial updates. The existing `PlayerOneCharacterId` / `PlayerTwoCharacterId` mappings stay UNGUARDED so the existing form can still clear a character selection by setting it to null:
  ```csharp
  CreateMap<RoundDto, Round>()
      .ForMember(d => d.PlayerThreeCharacterId, o => o.Condition(s => s.PlayerThreeCharacterId != null))
      .ForMember(d => d.PlayerFourCharacterId, o => o.Condition(s => s.PlayerFourCharacterId != null));
  ```
  Without this guard scope, every `CompleteMatch`/`CompleteTournamentMatch`/`CreateCasualMatch` call that omits the new fields would overwrite stored values with null. Data-loss bug.
- [ ] **No `MatchDto → Match` reverse map exists today** (verify by reading `Application/Core/MappingProfiles.cs:24-26` — only `Match → MatchDto` is registered, not the reverse). If 044/045/046 introduce a reverse map for `MatchDto → Match` during their integration work, those tasks own adding `.Condition` guards on the new participant/placement fields with the same pattern. Do NOT add a reverse map in this task — it would have no callers.
- [ ] Integration test: seed a 4P match with all placement fields set, GET it through the API, assert all 5 placement/participant fields round-trip non-null in the DTO.

### Types & DTOs
- [ ] DTOs that surface Match shape expose the new optional fields (participants AND placements + `playerCount`).
- [ ] `client/src/lib/types/index.d.ts` exposes new optional fields (`playerThreeUserId?`, `playerFourUserId?`, `secondPlaceUserId?`, `thirdPlaceUserId?`, `fourthPlaceUserId?`, `playerCount?`) on `Match`. `League` type gains `playerCount?: number`. `Tournament` interface: `playerCount` renamed to `bracketSize`. `Round` type gains `playerThreeCharacterId?: string; playerFourCharacterId?: string;`.
- [ ] AutoMapper rules above already cover the backend side.
- [ ] No other handler, query, controller, auth handler, or UI component is changed to *read* the new columns beyond the GetUserMatches fix above — out of scope.

### Build & regression
- [ ] `dotnet build --configuration Release` passes
- [ ] `cd client && npm run build` passes
- [ ] Existing 2P league flow (create league → activate → complete a Bo3 match → leaderboard) behaves identically before and after migration
- [ ] Existing tournament flow with N=2 brackets behaves identically after the `BracketSize` rename
- [ ] Existing guest-merge flow with 2P-only data behaves identically before and after

---

## Implementation Steps

### Domain
- [ ] `Domain/Match.cs` — add `public int PlayerCount { get; set; } = 2;`.
- [ ] `Domain/Match.cs` — add `PlayerThreeUserId` (string?) + `PlayerThree` (CompetitionMember?) nav; same for `PlayerFour`.
- [ ] `Domain/Match.cs` — add `SecondPlaceUserId`, `ThirdPlaceUserId`, `FourthPlaceUserId` (all `string?`, no nav). Existing `WinnerUserId` continues to represent 1st place.
- [ ] `Domain/Round.cs` — add `PlayerThreeCharacterId` (`string?`, nullable FK to `Character.Id`) + nav; same for `PlayerFourCharacterId`. **String, not int — `Character.Id` is `string`.**
- [ ] `Domain/CompetitionMember.cs` — add inverse collections for participants: `MatchesAsPlayerThree`, `MatchesAsPlayerFour`. **Public fields**, not properties, matching the existing convention (`MatchesAsPlayerOne` is `public ICollection<Match> MatchesAsPlayerOne = [];`).
- [ ] `Domain/League.cs` — add `public int? PlayerCount { get; set; }`.
- [ ] `Domain/Tournament.cs` — **rename `PlayerCount` to `BracketSize`** (`int`, existing default behavior preserved).
- [ ] `Domain/Competition.cs` — **no change.**

### Application
- [ ] Search for DTOs that mirror Match shape; add optional `PlayerThreeUserId` / `PlayerFourUserId` / `SecondPlaceUserId` / `ThirdPlaceUserId` / `FourthPlaceUserId` / `PlayerCount` fields:
  - `Application/Casual/DTOs/CreateCasualMatchDto.cs`
  - Any `Match*Dto.cs` in `Application/Matches/`
- [ ] DTOs that surface Round shape: add optional `PlayerThreeCharacterId` / `PlayerFourCharacterId` (`string?`) fields.
- [ ] `Application/Core/MappingProfiles.cs` — update `CreateMap<Match, MatchDto>()` and `CreateMap<Round, RoundDto>()`. Add `.ForMember(..., opt => opt.Condition(s => s.X != null))` guards on every reverse map for the new fields. **Do NOT search for `Application/Tournaments/Tournament*MatchDto.cs` — no such files exist.**
- [ ] `Application/Core/MappingProfiles.cs` — update `CreateMap<Tournament, TournamentDto>()` for the `BracketSize` rename (mechanical).
- [ ] Do NOT modify validators yet — only add Three/Four/placement/PlayerCount fields to DTOs as optional shape carriers.
- [ ] Do NOT modify handler logic for `CreateLeague`, `CompleteMatch`, etc. except for the Tournament rename audit.

### Application — Tournament rename audit
- [ ] Grep for `tournament.PlayerCount` / `Tournament.PlayerCount` / `\.PlayerCount` references on `Tournament` entity instances. Rename every site to `BracketSize`. Affected handlers (verify list during implementation): `StartTournament`, `ShuffleBracket`, `CompleteTournamentMatch`, `ReopenTournamentMatch`, `CreateTournament`, `DeleteTournament`, any query in `Application/Tournaments/Queries/`, plus the `TournamentDto` field.

### Application — MergeGuest (behavior change, in scope here)
- [ ] `Application/Guests/Commands/MergeGuest.cs` — extend FK remap to include `PlayerThreeUserId`, `PlayerFourUserId`, `SecondPlaceUserId`, `ThirdPlaceUserId`, `FourthPlaceUserId` on `Match`.
- [ ] **Add same-match participant collision pre-check** (see AC above) before opening the transaction. Reject with `Result.Failure` listing offending match keys when guest and target occupy different participant slots in the same Match. Without this guard, the subsequent `ExecuteUpdate` would create a row with two equal participant columns and fail at `SaveChanges` via `CK_Match_Participants_Distinct` — caught, but with an unhelpful constraint-violation error mid-transaction. The guard converts this into a clean upfront rejection.
- [ ] Wrap all 9 column-update operations in the existing transaction. Order rule unchanged: CompetitionMember inserts before Match FK updates (composite FK constraint).
- [ ] Add a comment noting the transaction now does 9 `ExecuteUpdate` round-trips and that elevating to `Serializable` isolation is a future option if contention surfaces. **Do not change isolation in this task.**

### Application — GetUserMatches read fix (sequenced here)
- [ ] `Application/Matches/Queries/GetUserMatches.cs` — change `.Where(...)`:
  ```csharp
  .Where(m => m.PlayerOneUserId == request.Id
           || m.PlayerTwoUserId == request.Id
           || m.PlayerThreeUserId == request.Id
           || m.PlayerFourUserId == request.Id)
  ```
- [ ] Add `.Include`s for `PlayerThree` and `PlayerFour` (each with `.User`) so the projection has the data.

### Persistence
- [ ] `Persistence/AppDbContext.cs` — add FK config for `PlayerThree`:
  ```csharp
  builder.Entity<Match>()
      .HasOne(x => x.PlayerThree)
      .WithMany(x => x.MatchesAsPlayerThree)
      .HasForeignKey(x => new { x.PlayerThreeUserId, x.CompetitionId })
      .IsRequired(false)
      .OnDelete(DeleteBehavior.NoAction);
  ```
- [ ] Same pattern for `PlayerFour`.
- [ ] **No FK config for SecondPlace/ThirdPlace/FourthPlace.**
- [ ] FK config for `Round.PlayerThreeCharacter` and `Round.PlayerFourCharacter` mirroring existing `PlayerOneCharacter` (single-column FK to `Character`, `IsRequired(false)`, `OnDelete: NoAction`).
- [ ] Tournament entity config: rename property reference (`b.Property(t => t.BracketSize).HasColumnName("BracketSize")` etc.). League entity config: `b.Property(l => l.PlayerCount).HasColumnName("LeaguePlayerCount")`.
- [ ] Migration: `dotnet ef migrations add ExtendMatchToFourPlayersWithPlacement --project Persistence --startup-project API`.
- [ ] Add CHECK constraints via `migrationBuilder.Sql(...)` in `Up()` (and matching `DROP` in `Down()`), using paired-implication SQL:
  ```csharp
  migrationBuilder.Sql(@"
      ALTER TABLE Matches ADD CONSTRAINT CK_Match_PlayerCount_Range
        CHECK (PlayerCount BETWEEN 2 AND 4)");
  migrationBuilder.Sql(@"
      ALTER TABLE Matches ADD CONSTRAINT CK_Match_Participants_Consistent
        CHECK (
          ((PlayerCount >= 3 AND PlayerThreeUserId IS NOT NULL) OR (PlayerCount < 3 AND PlayerThreeUserId IS NULL))
          AND
          ((PlayerCount = 4 AND PlayerFourUserId IS NOT NULL) OR (PlayerCount < 4 AND PlayerFourUserId IS NULL))
        )");
  migrationBuilder.Sql(@"
      ALTER TABLE Matches ADD CONSTRAINT CK_Match_PlacementsBounded
        CHECK (
          (PlayerCount >= 3 OR ThirdPlaceUserId IS NULL)
          AND
          (PlayerCount = 4 OR FourthPlaceUserId IS NULL)
        )");
  migrationBuilder.Sql(@"
      ALTER TABLE Matches ADD CONSTRAINT CK_Match_Participants_Distinct
        CHECK (
          (PlayerOneUserId IS NULL OR PlayerTwoUserId IS NULL OR PlayerOneUserId <> PlayerTwoUserId)
          AND (PlayerOneUserId IS NULL OR PlayerThreeUserId IS NULL OR PlayerOneUserId <> PlayerThreeUserId)
          AND (PlayerOneUserId IS NULL OR PlayerFourUserId IS NULL OR PlayerOneUserId <> PlayerFourUserId)
          AND (PlayerTwoUserId IS NULL OR PlayerThreeUserId IS NULL OR PlayerTwoUserId <> PlayerThreeUserId)
          AND (PlayerTwoUserId IS NULL OR PlayerFourUserId IS NULL OR PlayerTwoUserId <> PlayerFourUserId)
          AND (PlayerThreeUserId IS NULL OR PlayerFourUserId IS NULL OR PlayerThreeUserId <> PlayerFourUserId)
        )");
  migrationBuilder.Sql(@"
      ALTER TABLE Matches ADD CONSTRAINT CK_Match_Placements_InParticipantSet
        CHECK (
          (SecondPlaceUserId IS NULL OR SecondPlaceUserId IN (PlayerOneUserId, PlayerTwoUserId, PlayerThreeUserId, PlayerFourUserId))
          AND (ThirdPlaceUserId IS NULL OR ThirdPlaceUserId IN (PlayerOneUserId, PlayerTwoUserId, PlayerThreeUserId, PlayerFourUserId))
          AND (FourthPlaceUserId IS NULL OR FourthPlaceUserId IN (PlayerOneUserId, PlayerTwoUserId, PlayerThreeUserId, PlayerFourUserId))
        )");
  ```
- [ ] **TPH column disjunction in migration body** (replaces a naive `RenameColumn`):
  ```csharp
  migrationBuilder.AddColumn<int>("BracketSize", "Competitions", nullable: false, defaultValue: 0);
  migrationBuilder.Sql("UPDATE Competitions SET BracketSize = PlayerCount WHERE CompetitionType = 'Tournament'");
  migrationBuilder.AddColumn<int>("LeaguePlayerCount", "Competitions", nullable: true);
  // Status is stored as int (CompetitionStatus enum). Planned = 0; Active = 1; Complete = 2.
  migrationBuilder.Sql("UPDATE Competitions SET LeaguePlayerCount = 2 WHERE CompetitionType = 'League' AND Status <> 0");
  migrationBuilder.DropColumn("PlayerCount", "Competitions");
  ```
  `Down()` reverses: re-add `PlayerCount`, copy from `BracketSize` for Tournament rows, drop `BracketSize` and `LeaguePlayerCount`.
- [ ] Inspect generated migration: `AddColumn` for `Match.PlayerCount` (default 2, NOT NULL), 5 new Match columns, `Round.PlayerThreeCharacterId` + `PlayerFourCharacterId` (both `string`), `League.PlayerCount` (nullable), `RenameColumn` for `Tournament.PlayerCount` → `BracketSize`, 2 new Match participant FK constraints + auto-indexes, 2 new Round character FK constraints + auto-indexes, and the 3 CHECK constraints. **Verify auto-generated indexes exist on the new composite FKs; if not, add explicit `HasIndex(...)` calls before regenerating.**
- [ ] `dotnet ef database update --project Persistence --startup-project API`.

### API
- [ ] No controller changes. DTO field additions surface through existing endpoints automatically.

### Frontend
- [ ] `client/src/lib/types/index.d.ts` — extend `Match` type with `playerThreeUserId?: string; playerFourUserId?: string; secondPlaceUserId?: string; thirdPlaceUserId?: string; fourthPlaceUserId?: string; playerCount?: number;`. Extend `League` type with `playerCount?: number`. **Rename `Tournament.playerCount` → `Tournament.bracketSize`.**
- [ ] Extend `Round` type with `playerThreeCharacterId?: string; playerFourCharacterId?: string;` (strings, not numbers).
- [ ] `Competition` / `Casual` types: no change.
- [ ] Grep the frontend for `tournament.playerCount` / `.playerCount` on tournament objects and rename each site to `bracketSize`. Affected files (verify): `client/src/features/tournaments/*`, `client/src/lib/hooks/useTournament.ts`, anything referencing tournament size.

---

## Domain Risk Checklist

- [x] **Composite keys**: Match PK `{CompetitionId, BracketNumber, MatchNumber}` is **not** modified. Two new composite FKs on `Match` for participants mirror the existing PlayerOne/Two pattern exactly. Placement columns are plain `string?`. Two new single-column FKs on `Round` (string, not int). Round PK unchanged. Three new CHECK constraints on `Match`. **Risk: MEDIUM** — review migration before applying.
- [x] **Round-robin**: `ChangeLeagueStatus.cs` is untouched. Existing 2P round-robin output is unchanged. **Risk: LOW.**
- [x] **Statistics**: `GetLeagueLeaderboard.cs` is untouched. New columns are null on all existing rows. **Risk: LOW.**
- [x] **Guest identity**: `MergeGuest.cs` is modified. FK remap extended to cover the 5 new placement/participant columns. Additive remap, follows existing transaction pattern. **Risk: LOW.**
- [x] **Authorization**: `IsMatchEditable` / `IsMatchComplete` route params unchanged. Auth handlers don't read participant columns directly today — verify during implementation. **Risk: LOW.**

All boxes checked. No domain-change-proposal required.

---

## Dependencies

- **Blocked by**: None
- **Blocks**:
  - Sub-plan 2 (UI for N-player matches)
  - Sub-plan 3 (League N-player integration)
  - Sub-plan 4 (Casual N-player integration)
  - Sub-plan 5 (Tournament N-player integration — both 046a and 046b)

---

## Code References

`Domain/Match.cs:16-19` — positional FK fields + nav properties pattern to mirror.

`Domain/CompetitionMember.cs:17-18` — inverse collections (note: public fields):
```csharp
public ICollection<Match> MatchesAsPlayerOne = [];
public ICollection<Match> MatchesAsPlayerTwo = [];
```

`Persistence/AppDbContext.cs:55-68` — composite FK configuration to mirror.

`Application/Core/MappingProfiles.cs:24-26` — the single AutoMapper profile in the codebase. `CreateMap<Match, MatchDto>()` and `CreateMap<Round, RoundDto>()` are the only mappings affected.

`Domain/Character.cs:8` — `Id` is `string`, not `int`. Confirms Round character FK type.

---

## Rollback Plan

- **Database**: Revert migration with `dotnet ef database update <PreviousMigrationName>`. The migration is `AddColumn` + FK constraints + `RenameColumn` only; rollback is safe and lossless.
- **Code**: Git revert the commit. Behavior changes (MergeGuest expansion + GetUserMatches fix + Tournament rename audit) all revert cleanly because no handler writes the new columns yet.
- **Risk**: **LOW** — additive schema change + one mechanical rename + scoped MergeGuest/GetUserMatches behavior changes. Rollback at any point is safe.

---

## Progress Log

[Updated during implementation]

---

## Resolution

[Filled when complete]
