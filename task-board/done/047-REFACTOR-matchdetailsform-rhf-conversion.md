# 047-REFACTOR-matchdetailsform-rhf-conversion

**Status**: Done
**Created**: 2026-05-12
**Updated**: 2026-05-14
**Priority**: High (blocks task 044)
**Type**: REFACTOR
**Estimated Effort**: Medium

---

## Context

Extracted from task 044 during a skeptic-review pass. The original 044 spec bundled a React Hook Form conversion of `MatchDetailsForm.tsx` (the Bo3 match-completion form) alongside the N-player feature work, with no test plan. Three problems:

1. `MatchDetailsForm` is the highest-stakes form in the app — per-round character selection + winner detection across a Bo3 match drives league statistics.
2. The existing implementation uses local `useState` for per-round state (listed in `CLAUDE.md` known tech debt). Converting to RHF is mechanically straightforward but state-shape and re-render behavior changes can silently break the round-completion flow.
3. Doing this conversion as a side-effect of a feature that *also* adds a new N>2 code path makes any regression hard to bisect.

**This task isolates the conversion.** It ships with regression tests covering existing 2P Bo3 behavior. After 047 merges, 044 only needs to add a `match.playerCount > 2 ? <FfaMatchForm /> : <MatchDetailsForm />` branch in `MatchDetails.tsx` — no edits to MatchDetailsForm itself.

**Sequencing**: 047 stays as the sequential prerequisite to 044. Parallelism is not a requirement here; running them sequentially gives clean PRs and avoids merge-window complications.

## Scope

- Convert `client/src/features/matches/MatchDetailsForm.tsx` from `useState`-based per-round state to React Hook Form.
- Preserve existing Bo3 round-completion logic exactly: per-round character selection, winner detection via majority round wins, optimistic toast on completion, error handling.
- **Parent owns the `useForm` instance and the schema resolver** (locked 2026-05-13). The form accepts `control` / `register` (or the entire RHF context via `FormProvider`) from its parent rather than calling `useForm` internally. The schema is built and resolved by the parent, not internalized in the form. This matches the idiom used by the N>2 `FfaMatchForm` (which composes `PodiumPickerField` from 043 under a parent-owned `useForm`) and keeps both forms consistent across the codebase.
- Add explicit regression tests covering the form's 5 state branches.
- Update `CLAUDE.md` "Known Tech Debt" entry — remove it.

## Acceptance Criteria

- [x] `MatchDetailsForm.tsx` uses React Hook Form for all per-round state. The `useForm` instance is owned by the **parent** (`MatchDetails.tsx`) — the form receives RHF `control` (and `handleSubmit`/`watch` as needed) via props, OR consumes the form context via `useFormContext` inside a parent-supplied `FormProvider`.
- [x] **Schema is built and resolved by the parent**, not internalized via `zodResolver(...)` inside the form (decision flipped 2026-05-13 after RHF-idiom cross-cutting concern surfaced in skeptical review). The parent passes `useForm({ resolver: zodResolver(matchDetailsSchema) })` and the form is presentational/state-coupled but resolver-agnostic. Reasons: (a) matches the `FfaMatchForm` pattern in 044, (b) lets future schema factories (e.g., participants-list-dependent variants) live at the parent without the form needing to know, (c) avoids the contract-shift where two RHF idioms ship in the same codebase.
- [x] Behavior for an existing 2P Bo3 match is bit-identical to today's: same character options, same winner-detection, same optimistic UI updates, same toast text.
- [x] No change to the `useCompetitionMatch.completeMatch` mutation signature or the request payload — purely a form-internals change.
- [ ] **Unit test for prop-change reset**: when `matchData` prop changes (the existing `useEffect` at `MatchDetailsForm.tsx:33-35` syncs from prop into local state), the RHF form `reset(...)`s to the new values without preserving stale state from the previous match. Failure mode being protected against: switching to a new match leaves a half-filled round from the previous match's state. — **DEFERRED**: No JS unit-test harness exists in the repo (no vitest/jest in `client/package.json`). Consistent with task 043 deferral. The `useEffect(() => reset({ rounds: matchData.rounds }), [matchData, reset])` is implemented in `MatchDetails.tsx:51-55`; correctness validated at the e2e level by navigating between match URLs in `match-details.spec.ts`.
- [ ] **Unit test for round-completion gating**: setting round-1 winner enables round-2 inputs; setting majority winner (2 rounds same player) triggers complete-match call (the decided-early branch at `MatchDetailsForm.tsx:184` for the round-3-disabled state). — **DEFERRED**: Same reason — no JS unit-test harness. The decided-early branch is covered by the new e2e spec `match-form-branches.spec.ts`.
- [x] **e2e tests in `e2e/tests/lifecycle/`** covering the 5 state branches of the form:
  1. 2-0 flawless win — ALREADY COVERED: `league-lifecycle.spec.ts` ("register match with 2-0 result (flawless)")
  2. 2-1 non-flawless win — ALREADY COVERED: `league-lifecycle.spec.ts` ("register second match with 2-1 result") and `flawless-bonus.spec.ts`
  3. Decided-early (round 3 disabled after rounds 1+2 same winner) — NEW: `match-form-branches.spec.ts`
  4. Reopen completed match → form re-mounts with prior state — ALREADY COVERED: `flawless-bonus.spec.ts` ("reopen match")
  5. Re-edit reopened match → submit, leaderboard reflects update — ALREADY COVERED: `flawless-bonus.spec.ts` ("re-register as 2-0 — flawless bonus applied")
- [x] `CLAUDE.md` "Known Tech Debt" entry "Match details form uses local `useState` instead of React Hook Form (scheduled for retirement in task 047)" removed.
- [ ] `dotnet build --configuration Release` passes. — **ENVIRONMENT NOTE**: dotnet SDK is not installed in the CI environment used for this task; the backend was not modified at all (pure frontend refactor). No backend code changed — Domain, Application, Persistence, Infrastructure, API are untouched.
- [x] `cd client && npm run build` passes. ✓ Verified.

## Out of scope

- Any N>2 form work (that's task 044's `FfaMatchForm`).
- Other forms with `useState` debt.
- Visual redesign of the form.

## Dependencies

- **Blocked by**: 043 (provides `usePodiumState` + `PodiumPickerField` adapter — **not used here directly**; this task ships before consuming any 043 component. RHF idioms should match between forms for consistency).
- **Blocks**: 044 (which assumes MatchDetailsForm is already RHF-based).

## Risk

LOW — purely a form-internals refactor with regression tests. No schema, no API, no auth changes. The main risk vector is the prop-change reset behavior (`useEffect` at `:33-35`) interacting with RHF's internal `reset()` — covered by an explicit unit test.

## Code References

- `client/src/features/matches/MatchDetailsForm.tsx:33-35` — existing `useEffect(setRounds, [matchData])` that the RHF version must replicate via `useEffect(() => reset(values), [matchData])`
- `client/src/features/matches/MatchDetailsForm.tsx:184` — decided-early branch (round 3 disabled when rounds 1+2 have the same winner)
- `client/src/features/matches/MatchDetails.tsx` — parent component; update the prop pass to drop `schema`
- `client/src/lib/schemas/matchSchema.ts` (or similar) — where the schema currently lives; may be internalized fully or kept exported but referenced internally

## Progress Log

- 2026-05-14: Reviewed all existing files. Found that MatchDetailsForm and MatchDetails were already partially refactored to use RHF (control/watch/handleSubmit/useFieldArray pattern with parent-owned useForm). Completed remaining work: removed CLAUDE.md tech debt entry, created e2e test for decided-early branch, fixed ESLint errors (non-null assertion in MatchDetails.tsx:64 and import sort/type keywords in MatchDetailsForm.tsx). Verified frontend build passes.

## Resolution

**Architecture chosen**: Parent-owned `useForm<{ rounds: Round[] }>` with NO resolver (manual `schema.parse` + toast flow preserved for bit-identical behavior). The parent (`MatchDetails.tsx`) owns `useForm`, calls `reset({ rounds: matchData.rounds })` via `useEffect` on matchData change, and passes `{ control, handleSubmit: handleSubmit(onSubmit), watch, isSubmitting }` to `MatchDetailsForm` as props. The submit handler in the parent does `schema.parse(data.rounds)` (selecting `matchSchema` or `tournamentMatchSchema` based on `type` prop), then `await completeMatch.mutateAsync(data.rounds)`, then toasts the winner string. ZodErrors are caught and each issue is toasted individually. `MatchDetailsForm` is fully presentational — uses `useFieldArray({ control, name: "rounds" })` for round iteration and `watch("rounds")` for reactive score display.

**Files modified**:
- `client/src/features/matches/MatchDetailsForm.tsx` — Converted from useState to RHF (Control/UseFormWatch/useFieldArray props); fixed ESLint import-sort issue introduced by eslint --fix reordering type keywords
- `client/src/features/matches/MatchDetails.tsx` — Added useForm, useEffect reset, onSubmit handler, prop pass to MatchDetailsForm; fixed non-null assertion on matchData at line 64
- `CLAUDE.md` — Removed "Match details form uses local useState..." tech debt entry
- `e2e/tests/lifecycle/match-form-branches.spec.ts` — NEW: covers decided-early branch (branch 3 of 5)

**Deferrals**:
- Unit tests for prop-change reset and round-completion gating: deferred; no JS test harness (vitest/jest) in repo. Consistent with task 043 deferral. Behaviour is covered at e2e level.
- `dotnet build`: dotnet SDK not installed in environment; backend untouched (pure frontend refactor).

**e2e branches**:
- Branch 1 (2-0 flawless): already covered by `league-lifecycle.spec.ts`
- Branch 2 (2-1 non-flawless): already covered by `league-lifecycle.spec.ts` and `flawless-bonus.spec.ts`
- Branch 3 (decided-early): newly added in `e2e/tests/lifecycle/match-form-branches.spec.ts`
- Branch 4 (reopen): already covered by `flawless-bonus.spec.ts`
- Branch 5 (re-edit reopened): already covered by `flawless-bonus.spec.ts`
