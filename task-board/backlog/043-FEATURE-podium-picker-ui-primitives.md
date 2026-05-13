# 043-FEATURE-podium-picker-ui-primitives

**Status**: Backlog
**Created**: 2026-05-12
**Updated**: 2026-05-13 (post-skeptical-review patches)
**Priority**: High
**Type**: FEATURE
**Estimated Effort**: Medium

---

## Context

UI primitives for N-player (N=2/3/4) matches across all three modes. Concept C ("Podium Picker") was selected after a design-subagent comparison. The podium picker captures 1st/2nd/3rd/4th placement via sequential tap-to-pick on mobile — one-thumb friendly, medal-styled, reuses `RANK_STYLES` from the existing leaderboard.

This is **sub-plan 2 of 5** in the N-player initiative (`task-board/n-player-support.md`). Depends on **task 042** (schema extension) being merged so the new optional types are available.

**Scope split**: this task ships **UI primitives only** — the headless hook, the dumb view, the RHF adapter, the PlayerCount toggle (league-only), the shared Zod refinement factory. **DTO/validator/persistence changes for `ChangeLeagueStatus.PlayerCount` are NOT in this task** — they collapse into 044 to avoid a silent no-op merge window (043 ships toggle + body field, 044 ships handler+persistence; in between, the API silently drops the field). Casual and tournament DTO changes live in 045 and 046a respectively.

### Internal shape — headless hook + dumb view (locked decision)

`PodiumPicker` is NOT a single stateful component with mode-specific prop flags. It is split into:

1. **`usePodiumState`** (headless React hook): owns tap/long-press state, active-rank tracking, assign/unassign logic, completeness checks. Returns `{ activeRank, assign(userId), unassign(rank), value, isComplete }`. Knows nothing about modes.
2. **`PodiumPicker`** (view component): pure renderer. Takes the hook's return value plus a `players` list. Knows nothing about mutations, validation, or modes.

Each mode (league/casual/tournament) builds a thin wrapper component owning its own mode-specific behavior. This prevents the "primitive" from accreting `mode="tournament"` / `allowSkip` / `lockPlacements` prop flags downstream.

### RHF adapter contract (locked decision)

The flat shape `{ winnerUserId, secondPlaceUserId, thirdPlaceUserId, fourthPlaceUserId }` lives in RHF form state. The `Map<rank, userId | null>` shape is **internal to `usePodiumState`** and never crosses the form boundary. `PodiumPickerField` (RHF adapter) bridges them inside a single `Controller`. Consequences:

- `form.reset(values)` works with the flat shape — never resets a Map.
- `isDirty` does not flip spuriously from referential inequality of an internal Map.
- Schema validation errors target flat field names (`secondPlaceUserId`, etc.) and propagate naturally to the picker via the Controller.

### Intent storage (locked decision)

The `PlayerCountToggle` in `CompetitionForm` is **session-only state during Planned** for leagues. The configured N travels in the **activation request** (`ChangeLeagueStatus`, persistence wiring lives in 044) and is written from there directly onto each generated `Match.PlayerCount`. **Known UX papercut**: the toggle resets to default 2 on page reload while the league is Planned. Acceptable in Phase 1.

`PlayerCountToggle` is **gated to league mode only** in this task. Tournament's per-heat selector lives in `TournamentForm` and is added in task 046a (it persists to `Tournament.PerHeatPlayerCount` — different storage model). Casual has no toggle in the create form; per-match N is captured inside `CasualMatchForm` (task 045).

---

## Acceptance Criteria

### Headless hook + view split
- [ ] `usePodiumState({ playerCount, value, onChange, rules })` hook exists in `client/src/lib/hooks/usePodiumState.ts`. Returns `{ activeRank, assign(userId), unassign(rank), value, isComplete }`. Knows nothing about modes.
- [ ] Internal value shape is a `Map<rank, userId | null>` — **never exposed via `value` returned to a form**. Adapters convert at the boundary.
- [ ] `PodiumPicker` view component is a pure renderer bound to a `usePodiumState` instance. No mode prop flags.
- [ ] `rules` config on the hook supports `requireFullPodium: boolean` and `allowWinnerOnly: boolean`. Modes pass their own rules.
- [ ] **Local type `PodiumPlayer`**: `{ userId: string; displayName: string; imageUrl?: string; isGuest?: boolean }`. Matches the existing frontend `Player`-shape convention (`userId`, not `id`; carries `isGuest` for future use). Named `PodiumPlayer` rather than `Player` to avoid colliding with the global `Player` type used elsewhere in the app (H3 — locked 2026-05-13). **No `kind` discriminator** — CPU fillers were removed from the initiative scope (2026-05-13).
- [ ] **N-decrease clears placements above the new N**: when `playerCount` prop changes from 4 → 2 (or 3 → 2 etc.), the hook detects via the new value vs prior value, clears placements at ranks > new N, and emits `onChange` with the cleaned map. **Bare-hook unit test** asserts this.
- [ ] **Participant-change reset**: when the `players` prop changes such that any placed userId is no longer in the new participant set, the hook unassigns that placement and emits `onChange`. **Bare-hook unit test** asserts this with explicit before/after states.
- [ ] **Reset is `useEffect`-driven, not render-time** (H4 — locked 2026-05-13). The hook compares previous-vs-current `players` and `playerCount` inside `useEffect`, then calls `onChange` exactly once per change. **`onChange` is never called during render.** Adapters MUST pass a memoized `players` reference (stable identity when content is unchanged) — adapter docs call this out. Unit test: re-render the hook with a fresh `players` array literal of identical content; assert `onChange` is NOT called.

### RHF reference adapter
- [ ] `client/src/app/shared/components/PodiumPickerField.tsx` (NEW) — RHF adapter wrapping `usePodiumState` + `PodiumPicker`. Signature:
  ```tsx
  <PodiumPickerField
    control={form.control}
    name="placements"  // flat name; bridges to winnerUserId/secondPlaceUserId/...
    playerCount={watch('playerCount')}
    players={participants}
    rules={{ requireFullPodium: false, allowWinnerOnly: true }}
  />
  ```
  Internally uses RHF `Controller`. The `Controller`'s `field.value` is the flat shape; the Map shape stays internal. Tasks 044/045/046 import `PodiumPickerField` — bare `usePodiumState` + `PodiumPicker` remain available for non-RHF escape hatches.
- [ ] Adapter unit test covers: assign/unassign updates RHF state correctly, schema validation errors propagate to the picker, `form.reset(...)` correctly clears placements, `isDirty` does not flip spuriously after pure participant-list re-renders.

### Components & interactions
- [ ] `PodiumPicker` renders N plinths (1st/2nd/3rd/4th, descending heights); gold/silver/bronze gradients reuse `RANK_STYLES`
- [ ] Sequential tap-to-pick: tapping a roster chip places that player in the active plinth; focus advances to the next plinth
- [ ] Tapping a placed player returns them to the roster; focus jumps to that plinth
- [ ] Long-press on a placed player opens a menu: "Move to 2nd / 3rd / 4th / Unrank"
- [ ] **Keyboard fallback for long-press**: Enter or Space on a placed plinth opens the same menu. Tab order traverses plinths in rank order; arrow keys navigate the roster list.
- [ ] **Winner-only fast-path is a button inside the picker** (not a separate dialog). When `rules.allowWinnerOnly === true`, a "Just pick winner" button appears that, when activated, only requires the 1st plinth. Lower plinths render disabled/muted. Submitting sends winner only; placement fields stay null. **No separate `WinnerOnlyDialog` component** — the previous design had two ways to do the same thing.
- [ ] `PodiumDisplay` component renders read-only podium for match details views; muted "Other participants" chip when only winner is recorded
- [ ] `PlayerCountToggle` component: `ToggleButtonGroup` with three options. Labels are passed as a prop (default: `"1v1 Bo3" / "3-FFA Single" / "4-FFA Single"`).
- [ ] `useFfaMatch` hook ships with `mode: 'league'` only. Endpoint URL: `POST /api/matches/${competitionId}/bracket/${bracketNumber}/match/${matchNumber}/complete-ffa` (wired in 044). **Cache invalidation reuses the existing `["match", competitionId, bracketNumber, matchNumber]` queryKey shape from `useCompetitionMatch.ts:14`** — no duplicate keys. The mutation only owns its own mutation; invalidations target the existing query keys.
- [ ] Tasks 045 and 046b will extend `useFfaMatch` with their respective modes when they land. **No stub URLs in this task for casual/tournament.**

### E2E test-id contract (consumed by task 048)
- [ ] PodiumPicker root container exposes `data-testid="podium-picker"`.
- [ ] Each plinth exposes `data-testid="podium-plinth-{1|2|3|4}"` (numeric rank).
- [ ] Each selectable roster chip exposes `data-testid="player-chip-{userId}"` (use the seeded userId — NOT displayName, NOT array index — so tests stay stable across roster reordering).
- [ ] Winner-only fast-path button exposes `data-testid="podium-winner-only-toggle"`.
- [ ] `PlayerCountToggle` root exposes `data-testid="player-count-toggle"`. Inner buttons remain addressable via `getByRole('button', { name: '2'|'3'|'4' })`.
- [ ] **No CSS-class-based selectors** in these components; classes are MUI-derived and unstable. Test-ids are the contract.

### Accessibility (Phase 1 baseline)
- [ ] All interactive elements ≥ 48 dp tap target (plinths, chips, buttons)
- [ ] `role="listbox"` on the roster list, `role="option"` + `aria-selected` on chips reflecting placement state
- [ ] `aria-live="polite"` region announces active rank label changes ("1st place — tap a player")
- [ ] All controls reachable and operable by keyboard alone
- [ ] Browser-verified at 320px viewport, with both touch and keyboard

### Shared Zod refinement (factory pattern)
- [ ] `client/src/lib/schemas/ffaPlacementsRefine.ts` (NEW) exports a **factory** `makeFfaResultSchema(participantsRef: () => string[], opts: { allowWinnerOnly: boolean; requireFullPodium: boolean })`. The factory reads `participantsRef()` fresh **on each refine invocation**, not on schema construction — prevents stale-closure bugs when participants change mid-form.
- [ ] Refine rules: (a) all set placements are in `participantsRef()`, (b) no duplicate IDs across placement slots, (c) "no holes in the podium" — if `thirdPlaceUserId` set then `secondPlaceUserId` must be set, etc., (d) winner-only mode ⇒ all non-winner placements are null, (e) empty string `""` is treated as **unset** (not a valid userId).
- [ ] Unit tests for each rule case + the stale-closure regression: change participants after schema creation, re-validate, assert the new participants list is honored.
- [ ] Tasks 044/045/046b import `makeFfaResultSchema` from this file — they do NOT rewrite the placement rules.

### Form-state policy (mandate for downstream tasks)
- [ ] AC text declares: downstream `FfaMatchForm` (task 044), updated `CasualMatchForm` (task 045), and tournament match-entry (task 046b) **must use React Hook Form**. Local `useState` for placement values is forbidden. The existing `MatchDetailsForm` useState debt is retired in task 047 (sequential prerequisite to 044).

### Form & schema wiring
- [ ] `RANK_STYLES` lifted from `client/src/features/leagues/Leaderboard.tsx` to `client/src/app/shared/components/rankStyles.ts`; leaderboard imports the lifted version.
- [ ] `client/src/features/competitions/CompetitionForm.tsx` includes `PlayerCountToggle`, **gated to `type === "league"`** (the form's existing `type` prop union is `"league" | "tournament"`; the toggle only renders for league). Wired via React Hook Form, default 2; disabled when competition status ≠ Planned. **The value is form-state only — not persisted to any backend column in this task.**
- [ ] **No backend DTO/validator/handler changes in this task.** All of: `ChangeLeagueStatus.PlayerCount` field, validator, persistence, and the activation request body wiring are owned by **task 044**. The frontend toggle posts the value via 044's activation hook once 044 lands.
- [ ] Tournament's per-heat selector (`PerHeatPlayerCount`) lives in `TournamentForm.tsx` and is added in **task 046a** — different persistence model (persisted on `Tournament` entity, not session-only).
- [ ] **Leaderboard "Performance" column rename + formula swap are bundled in task 044** (not split across 043 cosmetic + 044 logic — keeps the header and the cell content in sync inside one merge).

### Dev demo & build
- [ ] Dev-only demo route or Storybook-style page mounts `PodiumPicker`, `PodiumPickerField`, `PodiumDisplay`, `PlayerCountToggle` with mock data for visual QA
- [ ] All components verified mobile-responsive at 320px viewport in a browser
- [ ] `dotnet build --configuration Release` passes
- [ ] `cd client && npm run build` passes
- [ ] Existing 2P league creation + casual match flow regressions: still works

---

## Implementation Steps

### Application
- [ ] **No application changes in this task.** All DTO/validator/handler work for activation-request `PlayerCount` lives in task 044 (league), task 045 (casual create), task 046a (tournament create).

### Persistence
- [ ] No changes.

### API
- [ ] No controller changes.

### Frontend — Headless hook
- [ ] `client/src/lib/hooks/usePodiumState.ts` (NEW) — headless hook owning placement state. Signature:
  ```ts
  function usePodiumState(args: {
    playerCount: 2 | 3 | 4;
    value: Map<1 | 2 | 3 | 4, string | null>;
    onChange: (next: Map<1 | 2 | 3 | 4, string | null>) => void;
    rules: { requireFullPodium: boolean; allowWinnerOnly: boolean };
    players: PodiumPlayer[];  // memoized by caller; used by participant-change reset detection inside useEffect
  }): {
    activeRank: 1 | 2 | 3 | 4 | null;
    assign: (userId: string) => void;
    unassign: (rank: 1 | 2 | 3 | 4) => void;
    isComplete: boolean;
  };
  ```

### Frontend — Shared components (dumb views)
- [ ] `client/src/app/shared/components/rankStyles.ts` (NEW) — lift `RANK_STYLES` from `client/src/features/leagues/Leaderboard.tsx`; export `getRankStyle(rank: 1 | 2 | 3 | 4)` returning `{ bg, border, color, medalEmoji }`
- [ ] `client/src/features/leagues/Leaderboard.tsx` — import lifted `rankStyles`; remove local copy
- [ ] `client/src/app/shared/components/PlayerCountToggle.tsx` (NEW) — `ToggleButtonGroup` (exclusive) with 2/3/4 options; RHF-controlled via `Controller`; props: `value`, `onChange`, `disabled`, `labels?: { two?: string; three?: string; four?: string }`
- [ ] `client/src/app/shared/components/PodiumPlinth.tsx` (NEW) — single rank slot; props: `rank: 1|2|3|4`, `assigned?: Player`, `isActive`, `onAssign`, `onClear`; uses `getRankStyle(rank)` for gradient; ≥48dp tap target
- [ ] `client/src/app/shared/components/PodiumPicker.tsx` (NEW) — pure renderer bound to a `usePodiumState` instance. Props: `state`, `players`. Renders N `PodiumPlinth`s + roster chip row + "Just pick winner" button when `rules.allowWinnerOnly`. Long-press handler delegates to a Menu; Enter/Space provides keyboard-equivalent menu opening. NO mode prop flags. **No separate WinnerOnlyDialog.**
- [ ] `client/src/app/shared/components/PodiumDisplay.tsx` (NEW) — read-only podium; props: `placements: { winner?, second?, third?, fourth? }`, `participants: Player[]`, `collapseRule: 'winner-only' | 'never'`; muted "Other participants: …" chip when collapsed
- [ ] `client/src/app/shared/components/PodiumPickerField.tsx` (NEW) — RHF adapter wrapping `usePodiumState` + `PodiumPicker` via `Controller`. Internal Map shape; emits flat shape into RHF.

### Frontend — Form wiring
- [ ] `client/src/features/competitions/CompetitionForm.tsx` — add `PlayerCountToggle` directly under title/description, **conditional on `type === "league"`**; wire via React Hook Form `Controller`; default `2`; disable when `competition?.status && competition.status !== "Planned"` (helper text: "Locked once league is activated"). Tournament path renders nothing here — its toggle lives in TournamentForm (task 046a).

### Frontend — Schemas + types
- [ ] `client/src/lib/schemas/ffaPlacementsRefine.ts` (NEW) — `makeFfaResultSchema(participantsRef, opts)` factory.
- [ ] `client/src/lib/schemas/matchSchema.ts` — expose a factory that downstream forms compose with their participants list.
- [ ] `client/src/lib/types/index.d.ts` — types already extended in task 042; verify nothing missing for hook signatures.

### Frontend — Hook
- [ ] `client/src/lib/hooks/useFfaMatch.ts` (NEW) — `useMutation` posting to `/api/matches/${competitionId}/bracket/${bracketNumber}/match/${matchNumber}/complete-ffa`. **`mode: 'league'` only in this task.** Cache invalidation reuses `useCompetitionMatch`'s queryKey shape. Hook is exported; consumed by 044 (the endpoint itself is registered in 044). 045 and 046b extend the mode union.

### Frontend — Leaderboard column
- [ ] **No leaderboard changes in this task.** Header rename + formula swap are owned by task 044 to keep them in one merge.

### Frontend — Dev demo
- [ ] Add a dev-only route at `/_dev/podium` that mounts all new components with mock players, mock placements, both editable + read-only modes, at desktop and mobile viewports.

### Verification
- [ ] Browser test desktop + iPhone-sized viewport (320px width); thumb hits all 4 plinths on mobile
- [ ] Keyboard-only walkthrough (Tab through plinths, Enter to open menu, Esc to close)
- [ ] Screen-reader smoke test
- [ ] Existing 2P league/tournament creation still works
- [ ] e2e regression: existing tests in `e2e/tests/lifecycle/` still pass

---

## Domain Risk Checklist

- [x] **Composite keys**: Not modified. **Risk: NONE.**
- [x] **Round-robin**: `ChangeLeagueStatus.cs` not touched. **Risk: NONE.**
- [x] **Statistics**: Leaderboard formula not changed. **Risk: NONE.**
- [x] **Guest identity**: Not touched. **Risk: NONE.**
- [x] **Authorization**: No changes to auth handlers. **Risk: NONE.**

All boxes checked. No domain-change-proposal required.

---

## Dependencies

- **Blocked by**: 042 (schema must be merged so types/DTOs/columns exist)
- **Blocks**:
  - 047 (MatchDetailsForm RHF conversion — uses no 043 component directly, but RHF idioms should match between forms)
  - 044 (sub-plan 3 — consumes `PodiumPickerField` + `useFfaMatch` + `makeFfaResultSchema`; owns the activation DTO + leaderboard rename/swap)
  - 045 (sub-plan 4 — consumes `PodiumPickerField` + `makeFfaResultSchema`)
  - 046a + 046b (sub-plan 5 split — consume same primitives)

---

## Code References

**Existing patterns to follow**:
- `client/src/features/leagues/Leaderboard.tsx` — `RANK_STYLES` (lift this)
- `client/src/features/competitions/CompetitionForm.tsx:34` — `type: "league" | "tournament"` union the toggle gates on
- `client/src/features/competitions/CompetitionForm.tsx:91` — `form.reset(...)` pattern that the adapter must not break
- `client/src/features/casual/CasualMatchForm.tsx` — current match form (NOT modified here)
- `client/src/lib/hooks/useCompetitionMatch.ts:14` — existing queryKey shape `["match", competitionId, bracketNumber, matchNumber]` for invalidation reuse

**MUI components used**: `ToggleButtonGroup`, `ToggleButton`, `Card`, `CardActionArea`, `Avatar`, `Chip`, `ListItemButton`, `Menu`, `Stack`, `Grid`.

---

## Rollback Plan

- **Database**: No migration in this task.
- **Code**: Git revert the commit. Components are net-new; the leaderboard `RANK_STYLES` lift can be reverted by moving the constant back.
- **Risk**: **LOW** — additive UI change. No data migration. No DTO changes. Existing 2P flows untouched.

---

## Progress Log

[Updated during implementation]

---

## Resolution

[Filled when complete]
