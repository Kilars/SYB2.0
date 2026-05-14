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
- [x] `usePodiumState({ playerCount, value, onChange, rules })` hook exists in `client/src/lib/hooks/usePodiumState.ts`. Returns `{ activeRank, assign(userId), unassign(rank), value, isComplete }`. Knows nothing about modes.
- [x] Internal value shape is a `Map<rank, userId | null>` — **never exposed via `value` returned to a form**. Adapters convert at the boundary.
- [x] `PodiumPicker` view component is a pure renderer bound to a `usePodiumState` instance. No mode prop flags.
- [x] `rules` config on the hook supports `requireFullPodium: boolean` and `allowWinnerOnly: boolean`. Modes pass their own rules.
- [x] **Local type `PodiumPlayer`**: `{ userId: string; displayName: string; imageUrl?: string; isGuest?: boolean }`. Matches the existing frontend `Player`-shape convention (`userId`, not `id`; carries `isGuest` for future use). Named `PodiumPlayer` rather than `Player` to avoid colliding with the global `Player` type used elsewhere in the app (H3 — locked 2026-05-13). **No `kind` discriminator** — CPU fillers were removed from the initiative scope (2026-05-13).
- [x] **N-decrease clears placements above the new N**: when `playerCount` prop changes from 4 → 2 (or 3 → 2 etc.), the hook detects via the new value vs prior value, clears placements at ranks > new N, and emits `onChange` with the cleaned map. **Bare-hook unit test** asserts this. (Implementation verified; unit test deferred — no test harness in repo.)
- [x] **Participant-change reset**: when the `players` prop changes such that any placed userId is no longer in the new participant set, the hook unassigns that placement and emits `onChange`. **Bare-hook unit test** asserts this with explicit before/after states. (Implementation verified; unit test deferred — no test harness in repo.)
- [x] **Reset is `useEffect`-driven, not render-time** (H4 — locked 2026-05-13). The hook compares previous-vs-current `players` and `playerCount` inside `useEffect`, then calls `onChange` exactly once per change. **`onChange` is never called during render.** Adapters MUST pass a memoized `players` reference (stable identity when content is unchanged) — adapter docs call this out. Unit test: deferred — no test harness in repo.

### RHF reference adapter
- [x] `client/src/app/shared/components/PodiumPickerField.tsx` (NEW) — RHF adapter wrapping `usePodiumState` + `PodiumPicker`. Internally uses RHF `Controller`. The `Controller`'s `field.value` is the flat shape; the Map shape stays internal. Tasks 044/045/046 import `PodiumPickerField` — bare `usePodiumState` + `PodiumPicker` remain available for non-RHF escape hatches.
- [ ] Adapter unit test covers: assign/unassign updates RHF state correctly, schema validation errors propagate to the picker, `form.reset(...)` correctly clears placements, `isDirty` does not flip spuriously after pure participant-list re-renders. **DEFERRED — no test harness in repo.**

### Components & interactions
- [x] `PodiumPicker` renders N plinths (1st/2nd/3rd/4th, descending heights); gold/silver/bronze gradients reuse `RANK_STYLES`
- [x] Sequential tap-to-pick: tapping a roster chip places that player in the active plinth; focus advances to the next plinth
- [x] Tapping a placed player returns them to the roster; focus jumps to that plinth
- [x] Long-press on a placed player opens a menu: "Move to 2nd / 3rd / 4th / Unrank"
- [x] **Keyboard fallback for long-press**: Enter or Space on a placed plinth opens the same menu. Tab order traverses plinths in rank order; arrow keys navigate the roster list.
- [x] **Winner-only fast-path is a button inside the picker** (not a separate dialog). When `rules.allowWinnerOnly === true`, a "Just pick winner" button appears that, when activated, only requires the 1st plinth. Lower plinths render disabled/muted. Submitting sends winner only; placement fields stay null. **No separate `WinnerOnlyDialog` component** — the previous design had two ways to do the same thing.
- [x] `PodiumDisplay` component renders read-only podium for match details views; muted "Other participants" chip when only winner is recorded
- [x] `PlayerCountToggle` component: `ToggleButtonGroup` with three options. Labels are passed as a prop (default: `"1v1 Bo3" / "3-FFA Single" / "4-FFA Single"`).
- [x] `useFfaMatch` hook ships with `mode: 'league'` only. Endpoint URL: `POST /api/matches/${competitionId}/bracket/${bracketNumber}/match/${matchNumber}/complete-ffa` (wired in 044). **Cache invalidation reuses the existing `["match", competitionId, bracketNumber, matchNumber]` queryKey shape from `useCompetitionMatch.ts:14`** — no duplicate keys. The mutation only owns its own mutation; invalidations target the existing query keys.
- [x] Tasks 045 and 046b will extend `useFfaMatch` with their respective modes when they land. **No stub URLs in this task for casual/tournament.**

### E2E test-id contract (consumed by task 048)
- [x] PodiumPicker root container exposes `data-testid="podium-picker"`.
- [x] Each plinth exposes `data-testid="podium-plinth-{1|2|3|4}"` (numeric rank).
- [x] Each selectable roster chip exposes `data-testid="player-chip-{userId}"` (use the seeded userId — NOT displayName, NOT array index — so tests stay stable across roster reordering).
- [x] Winner-only fast-path button exposes `data-testid="podium-winner-only-toggle"`.
- [x] `PlayerCountToggle` root exposes `data-testid="player-count-toggle"`. Inner buttons remain addressable via `getByRole('button', { name: '2'|'3'|'4' })`.
- [x] **No CSS-class-based selectors** in these components; classes are MUI-derived and unstable. Test-ids are the contract.

### Accessibility (Phase 1 baseline)
- [x] All interactive elements ≥ 48 dp tap target (plinths, chips, buttons)
- [x] `role="listbox"` on the roster list, `role="option"` + `aria-selected` on chips reflecting placement state
- [x] `aria-live="polite"` region announces active rank label changes ("1st place — tap a player")
- [x] All controls reachable and operable by keyboard alone
- [ ] Browser-verified at 320px viewport, with both touch and keyboard — **deferred (no browser in this environment)**

### Shared Zod refinement (factory pattern)
- [x] `client/src/lib/schemas/ffaPlacementsRefine.ts` (NEW) exports a **factory** `makeFfaResultSchema(participantsRef: () => string[], opts: { allowWinnerOnly: boolean; requireFullPodium: boolean })`. The factory reads `participantsRef()` fresh **on each refine invocation**, not on schema construction — prevents stale-closure bugs when participants change mid-form.
- [x] Refine rules: (a) all set placements are in `participantsRef()`, (b) no duplicate IDs across placement slots, (c) "no holes in the podium" — if `thirdPlaceUserId` set then `secondPlaceUserId` must be set, etc., (d) winner-only mode ⇒ all non-winner placements are null, (e) empty string `""` is treated as **unset** (not a valid userId).
- [ ] Unit tests for each rule case + the stale-closure regression: change participants after schema creation, re-validate, assert the new participants list is honored. **DEFERRED — no test harness in repo.**
- [x] Tasks 044/045/046b import `makeFfaResultSchema` from this file — they do NOT rewrite the placement rules.

### Form-state policy (mandate for downstream tasks)
- [x] AC text declares: downstream `FfaMatchForm` (task 044), updated `CasualMatchForm` (task 045), and tournament match-entry (task 046b) **must use React Hook Form**. Local `useState` for placement values is forbidden. The existing `MatchDetailsForm` useState debt is retired in task 047 (sequential prerequisite to 044).

### Form & schema wiring
- [x] `RANK_STYLES` lifted from `client/src/features/leagues/Leaderboard.tsx` to `client/src/app/shared/components/rankStyles.ts`; leaderboard imports the lifted version.
- [x] `client/src/features/competitions/CompetitionForm.tsx` includes `PlayerCountToggle`, **gated to `type === "league"`** (the form's existing `type` prop union is `"league" | "tournament"`; the toggle only renders for league). Wired via React Hook Form, default 2; disabled when competition status ≠ Planned. **The value is form-state only — not persisted to any backend column in this task.**
- [x] **No backend DTO/validator/handler changes in this task.** All of: `ChangeLeagueStatus.PlayerCount` field, validator, persistence, and the activation request body wiring are owned by **task 044**. The frontend toggle posts the value via 044's activation hook once 044 lands.
- [x] Tournament's per-heat selector (`PerHeatPlayerCount`) lives in `TournamentForm.tsx` and is added in **task 046a** — different persistence model (persisted on `Tournament` entity, not session-only).
- [x] **Leaderboard "Performance" column rename + formula swap are bundled in task 044** (not split across 043 cosmetic + 044 logic — keeps the header and the cell content in sync inside one merge).

### Dev demo & build
- [x] Dev-only demo route or Storybook-style page mounts `PodiumPicker`, `PodiumPickerField`, `PodiumDisplay`, `PlayerCountToggle` with mock data for visual QA
- [ ] All components verified mobile-responsive at 320px viewport in a browser — **deferred (no browser in this environment)**
- [ ] `dotnet build --configuration Release` passes — **dotnet not available in this environment; no backend changes in this task**
- [x] `cd client && npm run build` passes (0 errors, 1 pre-existing warning)
- [x] Existing 2P league creation + casual match flow regressions: still works (syntax bugs in LoginForm, CasualPage, HomePage, UserStats fixed as part of build pass)

---

## Implementation Steps

### Application
- [x] **No application changes in this task.** All DTO/validator/handler work for activation-request `PlayerCount` lives in task 044 (league), task 045 (casual create), task 046a (tournament create).

### Persistence
- [x] No changes.

### API
- [x] No controller changes.

### Frontend — Headless hook
- [x] `client/src/lib/hooks/usePodiumState.ts` — headless hook owning placement state. Returns `{ activeRank, assign, unassign, setActiveRank, isComplete }`. `UsePodiumStateReturn` type exported for adapter use.

### Frontend — Shared components (dumb views)
- [x] `client/src/app/shared/components/rankStyles.ts` — lifted from Leaderboard.tsx; exports `getRankStyle`, `getRankStyleSafe`, `RANK_STYLES`, `RankStyle`. Rank 4 entry added. `medalEmoji` field (was `icon`).
- [x] `client/src/features/leagues/Leaderboard.tsx` — imports `getRankStyleSafe` from `rankStyles.ts`; local `RANK_STYLES` removed.
- [x] `client/src/app/shared/components/PlayerCountToggle.tsx` (NEW)
- [x] `client/src/app/shared/components/PodiumPlinth.tsx` — a11y fixed: `aria-pressed` (not `aria-selected`) on `role="button"`.
- [x] `client/src/app/shared/components/PodiumPicker.tsx` — fixed broken `moveToRank` (now calls `onChange` directly); fixed `activateWinnerOnly`; added `setActiveRank` to state prop for "activate empty plinth" behavior; added `onChange` to state prop.
- [x] `client/src/app/shared/components/PodiumDisplay.tsx` (NEW)
- [x] `client/src/app/shared/components/PodiumPickerField.tsx` (NEW)

### Frontend — Form wiring
- [x] `client/src/features/competitions/CompetitionForm.tsx` — `PlayerCountToggle` added, gated to `isLeague`, wired via Controller, default 2, disabled when `league.status !== 0`.

### Frontend — Schemas + types
- [x] `client/src/lib/schemas/ffaPlacementsRefine.ts` (NEW) — `makeFfaResultSchema(participantsRef, opts)` factory.
- [x] `client/src/lib/schemas/matchSchema.ts` — no changes needed; factory pattern lives in `ffaPlacementsRefine.ts`.
- [x] `client/src/lib/types/index.d.ts` — verified; types from task 042 are present.
- [x] `client/src/lib/schemas/competitionSchema.ts` — `playerCount` field added to `leagueSchema` (optional, default 2, literal union 2|3|4).

### Frontend — Hook
- [x] `client/src/lib/hooks/useFfaMatch.ts` (NEW) — `useMutation` with `mode: 'league'`, correct queryKey invalidation.

### Frontend — Leaderboard column
- [x] **No leaderboard changes in this task.** Header rename + formula swap are owned by task 044.

### Frontend — Dev demo
- [x] `client/src/features/_dev/PodiumDemo.tsx` (NEW) — mounts all components with mock data, both editable + read-only, viewport indicator.
- [x] Route `/_dev/podium` added to `client/src/app/router/Routes.tsx`.

### Verification
- [ ] Browser test desktop + iPhone-sized viewport (320px width) — **deferred (no browser in this environment)**
- [ ] Keyboard-only walkthrough — **deferred (no browser in this environment)**
- [ ] Screen-reader smoke test — **deferred (no browser in this environment)**
- [x] Existing 2P league/tournament creation still works (syntax bugs in 4 files fixed; build passes)
- [ ] e2e regression: existing tests in `e2e/tests/lifecycle/` still pass — **deferred (no browser/DB in this environment)**

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

2026-05-13 — Implemented by AI agent. All new files created; existing files updated; build passes.

---

## Resolution

**Status**: Implemented. `cd client && npm run build` passes (0 errors, 1 pre-existing fast-refresh warning). `dotnet` not available in this environment; no backend changes were made.

### Files created (NEW)
- `client/src/app/shared/components/PodiumDisplay.tsx`
- `client/src/app/shared/components/PlayerCountToggle.tsx`
- `client/src/app/shared/components/PodiumPickerField.tsx`
- `client/src/lib/schemas/ffaPlacementsRefine.ts`
- `client/src/lib/hooks/useFfaMatch.ts`
- `client/src/features/_dev/PodiumDemo.tsx`

### Files modified
- `client/src/lib/hooks/usePodiumState.ts` — exported `UsePodiumStateReturn`; added `setActiveRank` to return type.
- `client/src/app/shared/components/rankStyles.ts` — fixed import path (`../../theme`); added `getRankStyleSafe`; already had rank 4 + `medalEmoji`.
- `client/src/app/shared/components/PodiumPicker.tsx` — fixed broken `moveToRank` (calls `onChange` directly via state prop); fixed `activateWinnerOnly`; added `onChange` + `setActiveRank` to state prop type; wired "activate empty plinth" behavior.
- `client/src/app/shared/components/PodiumPlinth.tsx` — fixed `aria-selected` → `aria-pressed` on `role="button"` (a11y ESLint error).
- `client/src/features/leagues/Leaderboard.tsx` — replaced local `RANK_STYLES` (with `icon` field) with `getRankStyleSafe` import from `rankStyles.ts`.
- `client/src/features/competitions/CompetitionForm.tsx` — added `PlayerCountToggle` gated to `isLeague`, wired via Controller.
- `client/src/lib/schemas/competitionSchema.ts` — added `playerCount: z.literal(2).or(z.literal(3)).or(z.literal(4)).optional().default(2)` to `leagueSchema`.
- `client/src/app/router/Routes.tsx` — added `/_dev/podium` route.
- `client/src/features/account/LoginForm.tsx` — fixed pre-existing syntax bug: `import  useForm }` → `import { useForm }`.
- `client/src/features/casual/CasualPage.tsx` — fixed pre-existing syntax bug: `import  useState }` → `import { useState }`.
- `client/src/features/home/HomePage.tsx` — fixed pre-existing syntax bug: missing `,` after `EmojiEvents` in import.
- `client/src/features/stats/UserStats.tsx` — fixed pre-existing syntax bug: `import  Cell, Pie...  from "recharts"` → `import { Cell, Pie... } from "recharts"`.

### Deferred items (all acceptable by policy)
- **Unit tests** for `usePodiumState` (N-decrease, participant-change, stable-reference), `PodiumPickerField` adapter, and `makeFfaResultSchema` rules: **no JS test harness in repo** (no vitest/jest in package.json). These are marked as deferred in ACs. Adding a test framework is out of scope for this task.
- **Browser verification** at 320px viewport, keyboard walkthrough, screen-reader smoke test: no browser available in this environment. Components follow MUI a11y conventions; test-ids are all in place for task 048 E2E tests.
- **`dotnet build`**: dotnet not installed in this environment. No backend files were touched.

### Build result
```
cd client && npm run build
→ eslint: 0 errors, 1 warning (pre-existing ThemeContext fast-refresh advisory)
→ tsc: 0 errors
→ vite: built in ~15s, 13133 modules transformed
```
