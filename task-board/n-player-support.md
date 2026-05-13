# N-Player Support Initiative (N = 2–4)

**Status**: in progress
**Created**: 2026-05-12
**Owner**: Lars

Adds support for 3-player and 4-player matches across **all three modes** (league, casual, tournament) in SYB2.0. UI is mobile-first. Backend captures full 1st/2nd/3rd/4th placement and computes leaderboard via placement points (Mario-Kart style).

---

## Why this exists

Today the app only supports 2-player matches. The user wants 3P/4P games in casual play, league play, and tournaments. The hard problem isn't UI or schema — it's **fair statistics across mixed player counts**.

The fairness problem is solved in **two separate scopes** to avoid a single formula doing two jobs poorly:

- **Inside a league**: Mario-Kart placement points (1st=4, 2nd=2, 3rd=1, 4th=0; flawless +1 for N=2 Bo3 only). A league is **always single-N**, so there is no cross-N comparison to worry about. Within a league this collapses to today's "Win = 4" for N=2 and reads correctly for 3P/4P.
- **Cross-mode (user profile, character winrates, player winrates)**: points are not used at all. Profile aggregates **winrates only** — `1st place / matches played` — grouped by character and by player. This is already-normalized by being placement-based rather than score-based: a 1st place is a win regardless of N. Points are a league-context concept and do not appear on profile views.

This split is intentional: it removes the "loser of 4P scored higher than loser of 2P" pathology that arises when raw placement points are summed across modes.

---

## Locked decisions (cross-cutting)

These apply across all five sub-plans. Do not re-debate.

| Decision | Value |
|---|---|
| **Stats (within a league)** | Mario-Kart placement points: 1st=4, 2nd=2, 3rd=1, 4th=0. Sum across matches in the league. Flawless +1 applies to N=2 (Bo3) only. League is always single-N so cross-N mixing does not occur inside any one league. |
| **Stats (cross-mode / user profile)** | Winrates only (character winrate, player winrate). `winrate = 1st-places / matches-played`. Same formula across all N — naturally normalized by being placement-based. **Points are not shown on profile views.** |
| **Placement capture** | N>2 matches capture full 1st/2nd/3rd/4th. N=2 uses only `WinnerUserId` as today. Tournament N=4 captures 3rd/4th even though advancement only uses 1st/2nd; the extra data is accepted-debt for a future tournament-podium-stats feature. |
| **Ties** | **Not supported.** Real-life simultaneous-KO situations are resolved by the participants picking an order before submitting. No `tied` flag on placements; downstream validators reject duplicate placement userIds. |
| **Schedule (league only)** | `R = ceil(2(v−1)/(N−1))` matches per player **per bracket**. Total = `2 · R · v / N` across **two brackets** (mirrors N=2 split structure). Pair co-occurrence balanced within ±2 (BIBD-style greedy generator). **Triples and quadruples may repeat** (formal pair-balance only). **Illegal (v, N) combinations** — where `R·v` is not divisible by N — are **rejected at activation** with a clear error; no padding, no tolerance. For N=2 the schedule generator forks: `if (PlayerCount == 2) return LegacyRoundRobin(); else BibdGenerator();` — N=2 bracket structure is preserved via structural-equivalence regression test (not byte-identical, given Random instance ownership refactor). |
| **League slot fairness (N>2)** | Both brackets emit the same pairings/triples/quadruples; bracket 2 rotates/shuffles positional slot assignment so no player permanently occupies the same `PlayerOne..PlayerN` slot across the league. No strict swap invariant required for N>2 (slot identity has no gameplay meaning). N=2 preserves the existing side-swap symmetry exactly. |
| **Tournament heat slot fairness** | At `BracketBuilder` time, within each heat the order in which seeds fill positional slots (PlayerOne..PlayerN) is **randomized**. No player is permanently "slot 1" across heats. |
| **Match format** | N=2 keeps Bo3 + flawless (3 Round rows per match, unchanged) with `BestOf ∈ {1,3,5}`. N=3/4 is **single Round row** per match, no flawless, winner stored on Match. **`BestOf` is forced to 1 when `PlayerCount > 2`** (League activation validator auto-sets and rejects mismatched request bodies). |
| **League composition** | A league is always single-N. `League.PlayerCount` (nullable int, added in task 042, physical column `LeaguePlayerCount`) persists the configured N so revert→reactivate cycles preserve it; `Match.PlayerCount` is the per-match record. A validator enforces all matches share the league's `PlayerCount`. **042's migration backfills `LeaguePlayerCount = 2` for pre-existing Active/Complete leagues** so the leaderboard rename in 044 doesn't lie about formula choice. Casual and tournament may vary N per match. |
| **Tournament composition** | `Tournament.BracketSize` (renamed from `PlayerCount` in task 042, on its own physical column) holds total bracket size. `Tournament.PerHeatPlayerCount` (int NOT NULL, added in task 046a) persists per-heat intent from CreateTournament onward so Planned-status views render correctly. **Tournaments require an exact-size roster** matching one of the legal `BracketSize` values for the chosen N — no padding, no auto-fill. **`BracketSizing.TotalRoundsFor` uses a switch table over legal `(perHeatN, bracketSize)` pairs**, NOT `Math.Log` (precision-loss avoidance). **`MatchNumber` is globally monotonically increasing within a tournament in `(BracketNumber, heatIndex)` order** — load-bearing invariant for `SlotMapping`. Tournament `CompleteTournamentMatch` carries placements on `Rounds[0]` (not a wrapper DTO) and the handler writes them onto the Match row. |
| **CPU users** | **Not part of this initiative.** Tournaments do not auto-pad rosters; hosts must invite the exact legal number of real players. Removes a large surface area (Identity rows for synthetic users, cross-cutting filters, cleanup logic). |
| **Data model** | Positional columns (no `MatchParticipant` join table). Participants: `Match.PlayerOneUserId` … `PlayerFourUserId` (Three/Four nullable, composite FK to CompetitionMember). Placements: `WinnerUserId` = 1st, plus `SecondPlaceUserId`, `ThirdPlaceUserId`, `FourthPlaceUserId` — **all plain `string?` columns, NOT FKs** (matches existing `WinnerUserId` shape). FluentValidation AND a DB CHECK constraint (`CK_Match_Placements_InParticipantSet`) enforce placement userIds belong to PlayerOne..PlayerFour. **`Match.PlayerCount` (int NOT NULL DEFAULT 2)** — per-match, with DB CHECK constraints enforcing 2..4, consistency with participant/placement columns, and pairwise-distinct participants. `Round` gains nullable `PlayerThreeCharacterId` + `PlayerFourCharacterId` columns for character capture in 3P/4P single-round matches. **TPH column disjunction**: `Tournament.BracketSize` and `League.PlayerCount` map to distinct physical columns (`BracketSize` and `LeaguePlayerCount` respectively) via explicit `HasColumnName`, not the shared TPH `PlayerCount` column (which is dropped). |
| **UI concept** | **Concept C — Podium Picker**, split into **headless `usePodiumState` hook + dumb `PodiumPicker` view + RHF adapter `PodiumPickerField`**. The adapter (task 043) is the canonical entry point for all mode wrappers (044/045/046b); it bridges the hook's `Map` shape (internal) to the flat DTO shape (RHF-facing) via `Controller`. Bare hook is an escape hatch only. **Hook reset semantics are `useEffect`-driven** (never render-time `onChange`); adapters must pass memoized `players` references. Local type is `PodiumPlayer` (`userId`, `displayName`, `imageUrl?`, `isGuest?`) — not `Player` (avoids colliding with the global `Player` type). Sequential tap-to-pick on mobile; medal-styled plinths reuse `RANK_STYLES` from `Leaderboard.tsx`. Winner-only fast-path is a button inside the picker, not a separate dialog. |
| **Form state** | `FfaMatchForm` (and the new league N>2 form) uses **React Hook Form**, mandatory. `MatchDetailsForm` RHF conversion is **extracted to a dedicated prerequisite task 047** (out of 044's scope) to avoid bundling untested tech-debt retirement into the critical-path feature work. **RHF idiom: parent owns `useForm` + resolver**; forms accept `control` / `FormProvider` and are resolver-agnostic (locked 2026-05-13 — applies to both `MatchDetailsForm` after 047 and `FfaMatchForm` in 044). |
| **Shared utilities** | `Application/Common/PlacementPoints.cs` is extracted in **task 044** with the signature `PointsForParticipant(Match match, IReadOnlyList<Round> rounds, string userId)`. Rounds are passed explicitly to enforce eager-load discipline at the type level. Task 046b consumes it (045 does not — profile uses winrate only, not points). `makeFfaResultSchema(participantsRef, opts)` Zod factory is extracted in **task 043**; tasks 044/045/046b import it for placement validation. Flawless detection branches on `match.PlayerCount == 2`, not on Round-row outcome counts. |
| **Guest merge** | FK remap for `PlayerThree/FourUserId` + `Second/Third/FourthPlaceUserId` lands in **task 042**. **No CPU-merge guard** (no CPU users exist). Cross-cutting `GetUserMatches` 4-way Where-clause fix and AutoMapper profile updates also in 042 (read-contract changes are owned by the schema task). AutoMapper reverse maps gain `.Condition(...)` guards to prevent silent null overwrites on partial updates. |

### Scheduling formula examples

| Players (v) | N | R per player | Total matches |
|---|---|---|---|
| 8 | 2 | 14 | 56 (matches today) |
| 8 | 3 | 7 | ~19 |
| 8 | 4 | 5 | 10 |
| 6 | 4 | 4 | 6 |

### Why positional columns over a join table

Considered `MatchParticipant { CompetitionId, BracketNumber, MatchNumber, UserId, Seat }` as the alternative. Rejected because:
- N is capped at 4 — schema-level limit is acceptable
- Mirrors the existing PlayerOne/Two pattern exactly — smallest cognitive shift
- Smaller migration (additive columns, no data backfill required for Match rows)
- The "order matters" concern (side-swap invariant, controller ports) is preserved via column positions

Trade-off accepted: future N>4 would require another schema migration. User decided this is fine.

**Known debt accepted with this choice** (logged here, not in scope to fix):
- `GetUserMatches` becomes a 4-way `OR` filter across `PlayerOne..PlayerFour` — won't index-seek well at scale. Revisit if it becomes a hotspot or if N>4 is ever requested.
- AutoMapper profiles for `Match → DTO` mappings must be updated for the 5 new fields × every DTO (silent null mappings otherwise).
- Placement FK columns reference `CompetitionMember` but nothing enforces that a placer is also a participant (one of `PlayerOne..Four`). A FluentValidation rule covers this at the application layer.

### Why Concept C (Podium Picker) over A or B

Three concepts were designed by parallel subagents:

- **A "More Slots, Same Shape"** — minimal extension, ToggleButtonGroup picker, 3 new components. Lowest risk, blandest visual, doesn't capture placement.
- **B "Card Grid"** — 2×2 tappable cards, crown badge, gamified, 5 new components. Thumb-perfect on mobile but only captures winner.
- **C "Podium Picker"** — medal podium with sequential tap-to-pick, captures full placement, 6 new components. **Chosen** because the user realized partway through that 2nd/3rd place capture was needed — Concept C was designed for exactly this.

Full mockups for all three are in the design-subagent outputs (chat transcript). Concept C mockups are also embedded in this doc below.

---

## Sub-plan status

| # | Title | Task file | Status |
|---|---|---|---|
| 1 | Schema extension (4 players + placement + League.PlayerCount + Tournament.PlayerCount→BracketSize rename + read-contract fixes) | `task-board/backlog/042-REFACTOR-extend-match-to-four-positional-players.md` | **Patched 2026-05-13, in backlog** |
| 2 | Podium Picker UI primitives + RHF adapter | `task-board/backlog/043-FEATURE-podium-picker-ui-primitives.md` | **Patched 2026-05-13, in backlog** |
| 2.5 | MatchDetailsForm RHF conversion (prerequisite tech-debt retirement) | `task-board/backlog/047-REFACTOR-matchdetailsform-rhf-conversion.md` | **Patched 2026-05-13, in backlog** |
| 3 | League N-player integration (schedule + stats + match-entry + ChangeLeagueStatus.PlayerCount DTO) | `task-board/backlog/044-FEATURE-league-n-player-integration.md` | **Patched 2026-05-13, in backlog** |
| 4 | Casual N-player integration | `task-board/backlog/045-FEATURE-casual-n-player-integration.md` | **Patched 2026-05-13, in backlog** |
| 5a | Tournament N-player backend (schema + StartTournament + BracketSizing/Builder) | `task-board/backlog/046a-FEATURE-tournament-n-player-backend.md` | **Created 2026-05-13 (split from 046), in backlog** |
| 5b | Tournament N-player frontend (Complete/Reopen + bracket UI + SlotMapping) | `task-board/backlog/046b-FEATURE-tournament-n-player-frontend.md` | **Created 2026-05-13 (split from 046), in backlog** |

### Dependency order

```
042 (schema + guest-merge + GetUserMatches fix + AutoMapper + League.PlayerCount + Tournament.PlayerCount→BracketSize)
   │
   └─→ 043 (UI primitives: hook + view + RHF adapter + Zod factory; no backend DTOs)
            │
            └─→ 047 (MatchDetailsForm RHF conversion — tech-debt prerequisite)
                     │
                     └─→ 044 (league integration; owns ChangeLeagueStatus.PlayerCount DTO; extracts PlacementPoints; renames Leaderboard column + swaps formula in one merge)
                              │
                              ├─→ 045 (casual; does NOT consume PlacementPoints — winrate-only stats)
                              └─→ 046a (tournament backend: schema + StartTournament + BracketSizing/Builder)
                                       │
                                       └─→ 046b (tournament frontend: Complete/Reopen + bracket UI + SlotMapping)
```

`PlacementPoints` is extracted in 044 (first consumer). 045 does **not** consume it (profile uses winrate only). 046b consumes it if podium-stats views are added. 045, 046a, and 046b can be built in parallel relative to each other once 044 merges — 046b is sequenced after 046a within the tournament track. **047 must merge before 044** so that the N-player feature work doesn't bundle an untested tech-debt rewrite of the Bo3 form.

---

## Feature-planning prompts (ready to paste into `/feature-planning`)

> **Note (stale)**: the prompt bodies below pre-date the 2026-05-13 skeptical-review patches. They still reference `competition.PlayerCount`, `±1` BIBD balance (now ±2), byte-identical N=2 (now structural equivalence), CPU bracket fillers (removed), `Tournament.PlayerCount` (renamed to `BracketSize`), and a single task 046 (now split into 046a + 046b). **Prefer the patched task files (042/043/044/045/046a/046b/047) over these prompts.** The locked-decisions table above is authoritative.

### Sub-plan 3 — League N-Player Integration

```
Wire league mode to actually use N-player matches in SYB2.0. Depends on tasks 042 (schema) and 043 (UI primitives) being merged.

Scope:
- ChangeLeagueStatus.Handler: replace round-robin with N-player schedule generator
  - R = ceil(2(v−1)/(N−1)) matches per player, total = R·v/N
  - Greedy assignment minimizing pair co-occurrence variance, balanced within ±1
  - For N=2 the output must be identical to today's 2-split round-robin (regression test required)
- CompleteMatch.Handler: branch on PlayerCount
  - N=2 keeps Bo3+flawless logic unchanged
  - N=3 or 4: single-round, populates WinnerUserId + SecondPlaceUserId + ThirdPlaceUserId (+ FourthPlaceUserId for N=4) from request payload
- GetLeagueLeaderboard.Handler: implement Mario-Kart placement points formula
  - Per match: 1st=4, 2nd=2, 3rd=1, 4th=0 — sum across matches
  - Flawless +1 retained for N=2 matches only (2-0 Bo3 wins)
  - For N=2 leagues the total must match today's points within a regression test
- CreateLeague validator (in task 043): activation requires ≥ N members
- IsMatchEditable / IsMatchComplete auth handlers: expand membership check to PlayerOne..PlayerFour (verify if needed)
- MergeGuest.cs: extend FK remapping to cover PlayerThree/FourUserId + SecondPlace/ThirdPlace/FourthPlaceUserId (the TODO from task 042)
- Frontend: wire PodiumPicker (from task 043) into the league match-entry flow — likely MatchDetailsForm.tsx branches on competition.PlayerCount
- useFfaMatch (from task 043) gets its real endpoint URL wired here

Out of scope:
- Casual mode integration (sub-plan 4)
- Tournament mode integration (sub-plan 5)

Verify all 5 domain invariants in CLAUDE.md. Side-swap symmetry for N=2 must still hold.
Reference: /home/lars.skifjeld/Claude/SYB2.0/task-board/n-player-support.md (this initiative doc)
```

### Sub-plan 4 — Casual N-Player Integration

```
Add N-player (N=2-4) support to casual mode in SYB2.0. Depends on tasks 042, 043, 044 being merged.

First: confirm casual mode's current implementation. Application/Casual/Commands/CreateCasualMatch.cs is the entry point for creating ad-hoc casual matches. Frontend: client/src/features/casual/CasualMatchForm.tsx.

Scope:
- CasualMatchForm.tsx: branch on selected player count
  - N=2: existing Bo3 form, unchanged
  - N=3 or 4: render PodiumPicker (from task 043) for single-round result entry; offer WinnerOnlyDialog as fast-path
- CreateCasualMatchDto + Validator + Handler: accept new optional fields (PlayerThree/FourUserId, SecondPlace/ThirdPlace/FourthPlaceUserId, PlayerCount)
- Validator: when PlayerCount > 2, require placement fields to be set if not using winner-only mode
- User-profile stats aggregate casual + league matches using the placement-points formula from sub-plan 3 (extract to a shared utility if not already done)
- No schedule generator (casual is ad-hoc)

Out of scope:
- League changes (already shipped in sub-plan 3)
- Tournament (sub-plan 5)

Reuse PlayerThree/Four + placement columns from task 042, Podium Picker primitives from task 043, placement-points helper from sub-plan 3.
Reference: /home/lars.skifjeld/Claude/SYB2.0/task-board/n-player-support.md
```

### Sub-plan 5 — Tournament N-Player Integration

```
Add N-player (N=2-4) support to tournament mode in SYB2.0. Depends on tasks 042, 043, 044 being merged.

First: discover tournament mode's current implementation. Application/Tournaments/Commands/ contains ShuffleBracket, StartTournament, CompleteTournamentMatch, ReopenTournamentMatch — read these to understand bracket format (single-elim, double-elim, etc.) and entity shape. Tournament with N>2 fundamentally changes the bracket node from "pair" to "heat" where top placer advances.

Scope (assumes single-elim, top-1 advances per node — verify during research):
- Bracket nodes hold N participants (use PlayerOne..PlayerFour positional columns)
- StartTournament.Handler: when PlayerCount > 2, seed N players per node
- CompleteTournamentMatch.Handler: branch on PlayerCount
  - N=2: existing behavior
  - N>2: read placement fields, advance the WinnerUserId (1st place) to the next bracket node
- Optional: store full placement (Second/Third/FourthPlaceUserId) per heat for podium stats
- Frontend: tournament bracket view renders N-participant heats; mobile-friendly bracket layout for N>2 nodes (visual challenge — consider stacking heat participants vertically per node on mobile)
- Match-entry within a tournament uses PodiumPicker (from task 043)

Out of scope:
- Multi-format brackets (double-elim, swiss) unless already supported and trivially extensible
- League/casual changes (already shipped)

Reuse all infrastructure from tasks 042, 043, sub-plan 3.
Reference: /home/lars.skifjeld/Claude/SYB2.0/task-board/n-player-support.md
```

---

## Concept C — Podium Picker mockups

### PlayerCount selector (mobile, in competition creation form)

```
+------------------------------+
| Format                       |
| [ 1v1 ] [ 3-FFA ] [ 4-FFA ]  |
|  Bo3    Single    Single     |
+------------------------------+
```

### 4-player match-entry (mobile, sequential tap-to-pick)

```
+------------------------------+
| 4-FFA · tap to place         |
|                              |
|   🥇 1st                     |
|  +------------------------+  |  <- 96px tall
|  | ◉ Lars   · Fox         |  |     gold gradient
|  +------------------------+  |
|   🥈 2nd                     |
|  +------------------------+  |  <- 80px
|  | ◉ Per    · Pikachu     |  |     silver
|  +------------------------+  |
|   🥉 3rd                     |
|  +------------------------+  |  <- 72px
|  | ◉ Mia    · Mario       |  |     bronze
|  +------------------------+  |
|   4th                        |
|  +------------------------+  |  <- 64px
|  | ◯ tap a player         |  |     muted (active pulse)
|  +------------------------+  |
|                              |
| -- Roster --                 |
| [Ola]  [+ guest]             |
|                              |
| +==========================+ |
| |    Complete Match        | |  <- sticky bottom
| +==========================+ |
| [ Just pick winner v ]       |
+------------------------------+
```

### 4-player match-entry (desktop)

```
+----------------------------------------------------------------------+
| Register Match Result · 4-player FFA                                 |
|                                                                      |
|        +-----+                                                       |
|        | 🥇  |   +-----+                                             |
|        | Lar |   | 🥈  |    +-----+                                  |
|        | Fox |   | Per |    | 🥉  |    +-----+                       |
|        | ███ |   | Pik |    | Mia |    |  4  |                       |
|        |     |   |     |    | Mar |    | Ola |                       |
|        +-----+   +-----+    +-----+    +-----+                       |
|                                                                      |
| -- Roster --   (all placed)                                          |
|                                                                      |
| [ Winner-only ]                            [   Complete Match   ]    |
+----------------------------------------------------------------------+
```

### Match details (read-only, mobile)

```
+------------------------------+
| Match #5  4-Player  Complete |
| +--------------------------+ |
| | 🥇 Lars                  | |  <- Avatar 56
| |    Fox · 1st             | |
| +--------------------------+ |
| | 🥈 Per  · Pikachu        | |  <- Avatar 44
| +--------------------------+ |
| | 🥉 Mia  · Mario          | |  <- Avatar 36
| +--------------------------+ |
| |  4  Ola · Donkey         | |  <- Avatar 32, muted
| +--------------------------+ |
+------------------------------+
```

If only winner is recorded, silver/bronze/4th rows collapse to a muted "Other participants: Per, Mia, Ola" chip.

### Leaderboard "Performance" column (mobile)

```
Performance:  🥇×4   🥈×2   🥉×1   4th×0
```

Hidden when league has no FFA matches.

### Interaction model

- Top empty plinth is **active** (subtle pulse). Tap a roster chip → snaps into plinth; focus jumps to next plinth down.
- Tap a placed player → returns to roster; focus jumps to that plinth.
- Long-press a placed player → menu: "Move to 2nd / 3rd / 4th / Unrank".
- Desktop also supports HTML5 `draggable` (no dnd library).
- Winner-only fast-path: `Button` opens compact `Dialog` with N chips; tap winner → submit. Submits `winnerUserId` only; placement fields stay null.

### Component inventory (task 043 builds these)

| Component | Path |
|---|---|
| `PodiumPicker` | `client/src/app/shared/components/PodiumPicker.tsx` |
| `PodiumPlinth` | `client/src/app/shared/components/PodiumPlinth.tsx` |
| `PodiumDisplay` | `client/src/app/shared/components/PodiumDisplay.tsx` |
| `PlayerCountToggle` | `client/src/app/shared/components/PlayerCountToggle.tsx` |
| `WinnerOnlyDialog` | `client/src/app/shared/components/WinnerOnlyDialog.tsx` |
| `useFfaMatch` (hook) | `client/src/lib/hooks/useFfaMatch.ts` |
| `rankStyles.ts` (lifted from Leaderboard.tsx) | `client/src/app/shared/components/rankStyles.ts` |

---

## Critical files (touched across sub-plans)

| File | Sub-plan(s) | Purpose |
|---|---|---|
| `Domain/Match.cs` | 1 | New positional + placement columns + `PlayerCount` |
| `Domain/Round.cs` | 1 | New nullable `PlayerThreeCharacterId` + `PlayerFourCharacterId` |
| `Domain/CompetitionMember.cs` | 1 | New inverse collections (×5) |
| `Persistence/AppDbContext.cs` | 1 | FK configurations (×5 new) |
| `Persistence/Migrations/` | 1 | `ExtendMatchToFourPlayersWithPlacement` migration |
| `Application/Guests/Commands/MergeGuest.cs` | 1 | FK remap expansion (Player3/4 + placements) — lands here, not 044 |
| `Application/Leagues/Commands/ChangeLeagueStatus.cs` | 3 | Schedule generator forks: legacy round-robin for N=2, BIBD generator for N>2 |
| `Application/Leagues/Queries/GetLeagueLeaderboard.cs` | 3 | Uses `PlacementPoints` helper |
| `Application/Common/PlacementPoints.cs` | 3 | NEW — per-Match helper, extracted in this task |
| `Application/Matches/Commands/CompleteMatch.cs` | 3 | Branch on `match.PlayerCount` |
| `Application/Leagues/Validators/` | 3 | "All matches in a league share the same `PlayerCount`" validator |
| `Application/Casual/Commands/CreateCasualMatch.cs` | 4 | Branch on `match.PlayerCount`; consume `PlacementPoints` |
| `Application/Tournaments/Commands/{Start,Complete}Tournament*.cs` | 5 | N-player bracket nodes; consume `PlacementPoints` |
| `client/src/lib/hooks/usePodiumState.ts` | 2 | NEW — headless state hook |
| `client/src/app/shared/components/PodiumPicker.tsx` | 2 | Dumb view bound to `usePodiumState` |
| `client/src/lib/schemas/ffaPlacementsRefine.ts` | 2 | NEW — shared Zod refinement factory `makeFfaResultSchema(participantsRef, opts)` |
| `client/src/features/competitions/CompetitionForm.tsx` | 2 | PlayerCountToggle wired in (league-only) |
| `client/src/features/matches/MatchDetailsForm.tsx` | 3 | Branch on PlayerCount → PodiumPicker; **convert to RHF** |
| `client/src/features/casual/CasualMatchForm.tsx` | 4 | Branch on PlayerCount → PodiumPicker |
| `client/src/features/tournaments/` | 5 | N-participant bracket rendering |
| `client/src/features/leagues/Leaderboard.tsx` | 2, 3 | Column rename (2), formula swap (3) |
| `client/src/lib/types/index.d.ts` | 1, 2 | New optional fields (incl. `Match.playerCount`) |
| `CLAUDE.md` | 1, 3 | Update invariant #3 (flawless = N=2 only) + #4 (guest merge column list) |

---

## Domain invariants — touch-point summary

| Invariant | Sub-plan touching it | Notes |
|---|---|---|
| #1 Round-robin integrity | 3 | Schedule generator forks: `if (N==2) LegacyRoundRobin() else BibdGenerator()`. N=2 output is byte-identical (preserved by code path, not by algorithm equivalence). Side-swap symmetry is league-only and applies to N=2. |
| #2 Composite key safety | 1 | 5 new composite FKs on Match — review migration carefully |
| #3 Statistics integrity | 3 | Points formula uses `PlacementPoints` helper. **Flawless applies to N=2 only** — update CLAUDE.md invariant #3 text in task 044. |
| #4 Guest merge safety | 1 | Real fix lands in 042 (not deferred). Expand FK remap to cover the 5 new columns. |
| #5 Authorization consistency | 3 | Verify IsMatchEditable / IsMatchComplete handle N>2 participants |

---

## Open questions for sub-plan author(s)

All open questions are resolved by sub-plan task definitions:

1. ~~**Where PlayerCount lives**~~ — Resolved: **`Match.PlayerCount`** (per-match). League validates all matches share a value; casual and tournament allow per-match variation. The old `Tournament.PlayerCount` is renamed to `Tournament.BracketSize` in task 042 to kill the cognitive collision.
2. ~~**Tournament bracket format**~~ — Resolved by tasks 046a/046b: single-elim only. N=2/3 use top-1 advancement; N=4 uses top-2 with cross-pair seeding. Valid bracket sizes by N: {2:[4,8,16,32], 3:[3,9,27], 4:[4,8,16,32,64]}. **Exact-size roster required** — no CPU padding.
3. ~~**Mobile bracket rendering for N>2 heats**~~ — Resolved by task 046b: horizontal swipe through bracket rounds (columns); each column has heats stacked vertically; no inter-round connector lines on mobile. Desktop renders columns side-by-side as today.
4. ~~**Schedule generator algorithm**~~ — Resolved by task 044. Explicit `if (N==2)` fork preserves byte-identical legacy output.
5. ~~**Where placement-points utility lives**~~ — Resolved: `Application/Common/PlacementPoints.cs`, extracted in **task 044**. Signature: `PointsForParticipant(Match match, IReadOnlyList<Round> rounds, string userId) → int`. Rounds passed explicitly (compiler-enforced eager-load). 045 does NOT consume it (profile uses winrate only). 046b consumes it for any future podium-stats view.
6. ~~**Cross-mode profile stats fairness**~~ — Resolved: profile shows **winrates only** (character + player), not points. `winrate = 1st-places / matches-played`. Same formula across all N. Points are a league-only concept.
7. ~~**Round entity for N>2**~~ — Resolved: **one Round row per match for N>2** (vs. 3 Round rows for N=2 Bo3). For N>2 the row stores no per-round outcome; the winner is on Match. `Round.PlayerThreeCharacterId` + `PlayerFourCharacterId` nullable columns are added in task 042 for character capture.
8. ~~**Flawless for N>2**~~ — Resolved: not applicable. Flawless is N=2 (Bo3) only. CLAUDE.md invariant #3 is updated in task 044 to scope it explicitly.

---

## How to resume this initiative

In a fresh session:

1. Read this file: `task-board/n-player-support.md`
2. Check status of tasks 042 and 043 in `task-board/backlog/` (or `done/` if implemented)
3. To plan the next sub-plan, invoke `/feature-planning` with the prompt from the relevant section above
4. To start implementing the next ready task, invoke `/start-working`

Original conversation plan file (interview transcript, design exploration): `/home/lars.skifjeld/.claude/plans/let-s-discuss-the-option-goofy-bee.md`

Design subagent outputs (full Concept A / B / C mockups, ~700 words each) live in the original chat transcript — not persisted to disk. Concept C is the one we're building; A and B were rejected and their details aren't needed unless we revisit the choice.
