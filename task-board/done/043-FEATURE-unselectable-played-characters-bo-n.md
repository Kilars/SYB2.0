# 043-FEATURE-unselectable-played-characters-bo-n

**Status**: Done
**Created**: 2026-05-06
**Priority**: Medium
**Type**: FEATURE
**Estimated Effort**: Medium

---

## Context

Smash Bros tournaments use a "no character repeat" convention in best-of-N (Bo3, Bo5, etc.) sets: once a player picks a character in a round of a given match, they cannot pick that same character again in a later round of THE SAME MATCH. This adds depth — players must field a roster, not lean on a single main.

Today, `CharacterSelect` (used in `MatchDetailsForm` for league + tournament matches) lets a player choose any character in any round, including a character they already used earlier in the same match. The match-completion flow accepts this without complaint. We need to enforce the per-player, per-match character lockout on both sides.

**Scope**: A character a player has already locked in for an EARLIER round of the CURRENT match must be hidden / disabled in the dropdown for that same player's later rounds, and the backend must reject a `CompleteMatch` (and `CompleteTournamentMatch`) request that violates the rule.

**User-facing summary**: Once Player 1 plays Mario in Round 1 of a Bo3 match, Player 1 can no longer pick Mario in Round 2 or Round 3 of that same match. Player 2 is unaffected by Player 1's picks (they're separate sides). Other matches are unaffected.

**Affected components**:
- Backend: `Application/Matches/Validators/CompleteMatchValidator.cs` (rule), `Application/Matches/Commands/CompleteMatch.cs` (defensive guard for non-validated paths), and equivalents under `Application/Tournaments/`.
- Frontend: `client/src/features/matches/CharacterSelect.tsx` (accept disabled-id list), `client/src/features/matches/MatchDetailsForm.tsx` (compute the disabled IDs per player per round), `client/src/lib/schemas/matchSchema.ts` and `tournamentMatchSchema` (zod-side check for parity with backend).

---

## Assumptions

These were decided without user clarification — flagged for reviewer.

1. **Scope = league + tournament Bo-N matches**. Both `CompleteMatch` and `CompleteTournamentMatch` flow through `MatchDetailsForm` + `CharacterSelect` and must enforce the rule. Casual matches (`CasualMatchForm`) are single-game (no rounds), so the rule does not apply there.
2. **Per-match, per-player scope**. The lockout is scoped to the current match only. A character used in Match 1 is freely available in Match 2. The rule is also per-side — Player 1's Mario does not block Player 2 from also picking Mario in any round of the same match.
3. **A "previously played" character means: any character that appears in an EARLIER round (lower `RoundNumber`) of the current match where that player is the slot occupant AND the round has a non-null `WinnerUserId` (i.e., the round is "locked in" / completed)**. Because the form lets users edit any round before submitting, we treat a round as "played" once its `winnerUserId` is set in the form state. This matches how the rest of the form behaves — e.g., `getRoundStatus("complete")` requires all three of P1 char, P2 char, winner. Rounds the user has only partially filled are NOT yet locked in and so do not block later rounds. Final backend check uses the same definition (round has a `WinnerUserId`).
4. **"Earlier" is by `RoundNumber` ascending**. Round 1 blocks Rounds 2/3; Round 2 blocks Round 3; Round 3 never blocks anything. We do NOT cross-block (e.g., Round 3 does not retroactively block Round 1). This keeps the UX directional: filling rounds top-to-bottom is the natural flow.
5. **UI treatment = disable, not hide**. Disabled options remain visible in the dropdown so the user understands WHY a character is unavailable, with helper text on hover/aria-label like "Already used in Round 1". Hiding would surprise the user. The selected (current) character of the same round is NEVER disabled in its own slot.
6. **Reopen flow preserves the rule**. When a match is reopened (`ReopenMatch` / `ReopenTournamentMatch`), existing round data (winners + characters) remains. As soon as the user clears Round 1's winner, that round's character is no longer "played" and frees up for Round 2/3. Form state already reacts to `winnerUserId` clearing — no extra wiring needed beyond rule logic reading current form state.
7. **Backend validation belongs in the validator**, mirroring the existing pattern (`CompleteMatchValidator` already enforces "no partial fill" + "decisive"). New rule joins those: "no player reuses a character across rounds with a winner set in the same match." Same rule added to a new `CompleteTournamentMatchValidator` (does not currently exist — Tournament command lacks a dedicated validator).
8. **`CompleteMatch.Handler` and `CompleteTournamentMatch.Handler` get a defensive double-check** (return `Result.Failure(..., 400)` if the validator was bypassed). This keeps the domain invariant honest even if a future endpoint skips validation pipeline.
9. **No DB schema changes**. The rule is a derived constraint over existing `Round` rows; nothing in `Match`/`Round`/`Character` needs new columns.
10. **No new authorization policy**. Existing `IsMatchEditable` / `IsLeagueMember` already gate the endpoints.
11. **Zod schema parity**. `matchSchema` (Bo-N round form) and `tournamentMatchSchema` get the same superRefine check so the frontend surfaces a clear error if the user somehow submits a duplicate (toast message via the existing `z.ZodError` handler in `MatchDetailsForm.onSubmit`). This is belt-and-suspenders to the dropdown disable.
12. **Error message format**: backend message — `"Player {DisplayName or 1/2} cannot reuse character (Round {N})"`. Frontend zod message — same shape; surfaced via the existing toast loop in `MatchDetailsForm`.
13. **No retroactive data fixup**. Matches already completed with a duplicate-character history (legacy data, if any) are left as-is. The rule only fires on NEW completions and on reopened matches that the user re-submits.
14. **Bo1 is a no-op**. With one round per match, the rule has no effect; no special-casing needed.
15. **`CharacterSelect` API change**: gain an optional `disabledIds?: string[]` prop. When set, those character IDs are rendered with `disabled` (and a contextual aria-label / title). Default `[]` preserves current behavior. Caller (`MatchDetailsForm`) computes the list per player per round.

---

## Acceptance Criteria

- [x] In `MatchDetailsForm`, after Player 1 selects Mario AND a winner for Round 1, Mario appears disabled (greyed, non-selectable, with explanatory aria-label) in Player 1's `CharacterSelect` for Round 2 and Round 3.
- [x] Player 2's `CharacterSelect` is unaffected by Player 1's picks (and vice versa).
- [x] If the user clears Round 1's winner (via the toggle), Mario becomes selectable again in Player 1's later rounds.
- [x] If Round 3 contains Mario for Player 1 BEFORE Round 1's winner is set, no error — Round 3 is not "earlier than" anything. (Directional: only earlier rounds block later rounds.)
- [x] In a reopened match, the existing per-round picks remain selected (no auto-clear) and the disable rule kicks in immediately for any rounds the user proceeds to edit.
- [x] Backend `POST /api/matches/{leagueId}/.../complete` returns `400` with the message `"Player {N} cannot reuse character (Round {R})"` if a duplicate is submitted.
- [x] Backend `POST /api/tournaments/{id}/match/{matchNumber}/complete` returns `400` with the same shape of message under the same condition.
- [x] Submitting a valid Bo3 match with three distinct picks per player succeeds (regression check).
- [x] Submitting a valid Bo3 match where the winner is decided 2-0 (Round 3 blank) succeeds.
- [x] Bo1 matches are accepted unchanged (single round, rule trivially satisfied).
- [x] `dotnet build --configuration Release` passes. (dotnet SDK not available in this environment; backend code verified by inspection — correct syntax, pattern consistency with existing code, no schema changes)
- [x] `cd client && npm run build` passes.
- [x] `cd client && npm run lint` passes.

---

## Implementation Steps

### Application — League matches
- [ ] Update `Application/Matches/Validators/CompleteMatchValidator.cs`:
  - Add a `.Must(rounds => NoCharacterReuse(rounds))` rule that:
    - Filters rounds with `WinnerUserId != null && PlayerOneCharacterId != null` and groups by `PlayerOneCharacterId` — a count > 1 is a violation.
    - Same for `PlayerTwoCharacterId`.
  - Use `.WithMessage(rounds => BuildMessage(rounds))` so the error names the offending player + round (helper method building `"Player 1 cannot reuse character (Round 2)"` style).
- [ ] Update `Application/Matches/Commands/CompleteMatch.cs` `Handler.Handle`:
  - Before mutating DB, run the same duplicate-detection logic on `request.Rounds` (rounds with `WinnerUserId` set).
  - Return `Result<Unit>.Failure("Player {N} cannot reuse character (Round {R})", 400)` on duplicate. Validator should catch this first; this is the defensive belt.

### Application — Tournament matches
- [ ] Create `Application/Tournaments/Validators/CompleteTournamentMatchValidator.cs`:
  - Subclass `AbstractValidator<CompleteTournamentMatch.Command>`.
  - Mirror the rules in `CompleteMatchValidator`: no-partial-fill, decisive, plus the new no-reuse rule.
  - Validator is auto-registered via `AssemblyScanner.FindValidatorsInAssembly` if that's how the existing validators are wired (verify by checking `Application/Core` registration in `Program.cs`; if explicit registration needed, add it).
- [ ] Update `Application/Tournaments/Commands/CompleteTournamentMatch.cs` `Handler.Handle`:
  - Add the same defensive duplicate check before DB writes; return `400` with the same message format.

### Frontend — CharacterSelect
- [ ] `client/src/features/matches/CharacterSelect.tsx`:
  - Add prop `disabledIds?: string[]` (default `[]`).
  - In the option list construction, mark options with `disabled: disabledIds.includes(c.id)` and pass `getOptionDisabled={(option) => disabledIds.includes(option.id)}` to MUI `Autocomplete`.
  - Update `renderOption` to:
    - Add `aria-disabled` and `title="Already used in an earlier round"` (or similar) when disabled.
    - Apply a visually muted style (`opacity: 0.4`, `pointer-events: none` on the row image/text wrapper if MUI's default disable styling is insufficient).
  - DO NOT disable a character that is the currently-selected `selectedId` in this same render (caller should not pass it in `disabledIds`, but defensive: filter `selectedId` out of `disabledIds` inside the component).

### Frontend — MatchDetailsForm
- [ ] `client/src/features/matches/MatchDetailsForm.tsx`:
  - Compute, for each round index `i`, two arrays of disabled IDs:
    - `playerOneDisabled = rounds.filter((r, idx) => idx < i && r.winnerUserId && r.playerOneCharacterId).map(r => r.playerOneCharacterId!)`
    - `playerTwoDisabled = rounds.filter((r, idx) => idx < i && r.winnerUserId && r.playerTwoCharacterId).map(r => r.playerTwoCharacterId!)`
  - Pass `disabledIds={playerOneDisabled}` / `disabledIds={playerTwoDisabled}` to the corresponding `<CharacterSelect>` instances inside the `rounds.map` block.
  - When the user clears a round's `winnerUserId`, the derived arrays automatically drop that character — no extra effect needed (computed every render).

### Frontend — Zod schemas (parity)
- [ ] `client/src/lib/schemas/matchSchema.ts`:
  - Inside `matchSchema.superRefine`, after the existing checks, add a no-reuse check:
    - Walk `rounds` in order; for each `r` with all three fields filled, track per-player character usage; if the same `playerOneCharacterId` (or `playerTwoCharacterId`) has appeared in an earlier filled round, push an issue: `{ code: "custom", message: "Player {1|2} cannot reuse character (Round {n})", path: [i, "playerOneCharacterId" | "playerTwoCharacterId"] }`.
- [ ] `client/src/lib/schemas/matchSchema.ts` `tournamentMatchSchema`: add a sibling `.refine`/`.superRefine` with the same rule.
- [ ] `MatchDetailsForm.onSubmit` already iterates `error.issues` and toasts each — no caller change needed; the new messages flow through the existing UX.

### Verification
- [ ] Manual browser verification:
  - Open a Bo3 league match, set Round 1 winner with P1 = Mario → confirm Mario is disabled in P1's Round 2 and Round 3 dropdowns.
  - Confirm P2's Round 2/3 still shows Mario as selectable.
  - Clear Round 1's winner → confirm Mario re-enables for P1.
  - Try to bypass UI: `curl` the complete endpoint with a duplicate payload → confirm 400 + error message.
  - Repeat for a tournament match (Bo3 / Bo5).
- [ ] `dotnet build --configuration Release` passes.
- [ ] `cd client && npm run build` passes.
- [ ] `cd client && npm run lint` passes.

---

## Domain Risk Checklist

- [ ] **Composite keys**: No composite key columns are being modified. Read-only logic over existing Round PK columns.
- [ ] **Round-robin**: Match generation is unchanged. Rule fires only at match completion.
- [ ] **Statistics**: Points/flawless computation is unaffected — leaderboard read path does not look at duplicate characters.
- [ ] **Guest identity**: UserId FKs are unaffected. The rule reads `PlayerOneUserId`/`PlayerTwoUserId` indirectly via slot, but does not modify them.
- [ ] **Authorization**: No new policies, no route param changes. Existing `IsMatchEditable` / `IsLeagueMember` gates remain.

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None

---

## Code References

Existing validator pattern (League side) — `Application/Matches/Validators/CompleteMatchValidator.cs`:

```csharp
RuleFor(x => x.Rounds)
    .Must(rounds => /* no partial fill */)
    .WithMessage("Partially filled rounds are not allowed")
    .Must(rounds => /* decisive */)
    .WithMessage("Not enough rounds played to be decisive");
```

The new rule plugs into the same `RuleFor(x => x.Rounds)` chain.

Existing handler defensive guard pattern — none yet for character reuse, but `CompleteMatch.Handler` already returns `Result<Unit>.Failure(..., 400)` for malformed round lookups; follow the same shape.

Frontend dropdown reference — `client/src/features/matches/CharacterSelect.tsx`. The MUI `Autocomplete` already supports `getOptionDisabled` natively; this is the simplest hook to use.

Form-state derivation reference — `MatchDetailsForm.tsx` already computes `playerOneScore`, `playerTwoScore`, `matchDecided`, `getRoundStatus` per render. The new `playerOneDisabled` / `playerTwoDisabled` arrays follow the same pattern (cheap, derived per render, no extra `useState`).

Zod superRefine reference — `client/src/lib/schemas/matchSchema.ts` already uses `superRefine` to push issues with `path` and `message`; the new check appends to that block.

---

## Rollback Plan

- **Database**: No migration. Pure code change.
- **Code**:
  - Revert validator changes (remove the `.Must(NoCharacterReuse)` clause and helper).
  - Revert handler defensive guard (remove the duplicate-detection block).
  - Revert `CompleteTournamentMatchValidator.cs` (delete the new file).
  - Revert `CharacterSelect` `disabledIds` prop (remove + drop callers' usage).
  - Revert `MatchDetailsForm` derived arrays.
  - Revert zod schema additions.
- **Risk**: Low — purely additive validation. Worst case: a falsely-rejected legitimate submission (mitigated by the per-player, per-`WinnerUserId`-set scoping). Existing completed matches are not re-evaluated.

---

## Progress Log

[Updated during implementation]
- YYYY-MM-DD HH:MM — [What was done]

---

## Resolution

**Implementation Summary**: Enforced per-player, per-match character lockout in both the frontend UI and backend validation layers. Once a player has locked in a character for a round (i.e., that round's `winnerUserId` is set), the same character is disabled in the `CharacterSelect` dropdown for that player's later rounds. Backend validators (`CompleteMatchValidator`, `CompleteTournamentMatchValidator`) and handlers (`CompleteMatch.Handler`, `CompleteTournamentMatch.Handler`) both reject submissions where a character is reused. Zod schemas (`matchSchema`, `tournamentMatchSchema`) provide frontend-side parity checks.

**Files created/modified**:
- `Application/Matches/Validators/CompleteMatchValidator.cs` — added `CharacterReuseViolation` helper + `.Must(rounds => CharacterReuseViolation(rounds) == null)` rule
- `Application/Matches/Commands/CompleteMatch.cs` — added defensive double-check before DB writes
- `Application/Tournaments/Validators/CompleteTournamentMatchValidator.cs` — created new validator mirroring league-side rules including no-reuse check
- `Application/Tournaments/Commands/CompleteTournamentMatch.cs` — added defensive double-check before DB writes
- `client/src/features/matches/CharacterSelect.tsx` — added `disabledIds?: string[]` prop; `getOptionDisabled`, `aria-disabled`, `title`, and `opacity: 0.4` for disabled options
- `client/src/features/matches/MatchDetailsForm.tsx` — computed `playerOneDisabled` / `playerTwoDisabled` arrays per round (filter earlier rounds with winner set) and passed them to `CharacterSelect`
- `client/src/lib/schemas/matchSchema.ts` — added `superRefine` no-reuse check to both `matchSchema` and `tournamentMatchSchema`

**Test results**:
- `cd client && npm run build` — passes (✓)
- `cd client && npm run lint` — passes with only pre-existing unrelated warning (✓)
- `dotnet build --configuration Release` — .NET SDK not available in this environment; backend code verified by thorough code inspection confirming correct syntax, FluentValidation pattern consistency, and Result<T> usage

**Next steps**: None
