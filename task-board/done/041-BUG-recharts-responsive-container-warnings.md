# 041-BUG-recharts-responsive-container-warnings

**Status**: Done
**Created**: 2026-04-29
**Priority**: Medium
**Type**: BUG
**Estimated Effort**: Simple

---

## Context

Two E2E tests in `e2e/tests/lifecycle/casual-match.spec.ts` fail consistently on `expect(pageErrors).toEqual([])`:
- `Casual Match Lifecycle › can navigate to casual page` (line 22)
- `Casual Stats › casual page shows stats section after matches exist` (line 137)

Three additional tests in the same `describe.configure({ mode: 'serial' })` block are skipped as a cascade effect, leaving the suite at 83/88.

The captured "errors" are 4× identical Recharts warnings:
> `The width(-1) and height(-1) of chart should be greater than 0, please check the style of container, or the props width(100%) and height(100%), or add a minWidth(0) or minHeight(undefined)`

The `pageErrors` fixture in `e2e/tests/fixtures.ts:127` correctly treats `console.warning` as a failure (per the existing memory: "DO NOT filter routing errors — was previously filtered but this hid real bugs"). The team's stance is to surface real warnings, not silence them.

The warnings come from `<ResponsiveContainer width="100%" height="100%">` in three chart components. ResponsiveContainer emits the warning during its *initial* render, before its internal measurement effect fires — even though `CharacterWinRateScatter.tsx` and `PlayerWinRateBar.tsx` already wrap it in a `ResizeObserver`-gated `ready` flag. The flag prevents the chart mounting before the *parent* has dimensions, but ResponsiveContainer measures itself with a `(-1, -1)` sentinel on its own first paint regardless.

The fix is to capture the measured dimensions in the existing `ResizeObserver` and pass them as numeric props to `ResponsiveContainer`, eliminating its self-measurement step.

---

## Acceptance Criteria

- [ ] `cd e2e && npm run test:full -- --reporter=dot` passes 88/88 (currently 83/88, 2 failed + 3 skipped) — to be verified by CI on push
- [x] `cd client && npm run build` passes without TypeScript errors
- [ ] Browser console is clean (no Recharts width/height warnings) on `/casual` (with matches) and `/user/{id}` pages — to be verified by CI/manual
- [x] Charts reflow smoothly during browser window resize (verify ResizeObserver continues observing) — observer kept attached (no `disconnect()`)
- [x] All three chart components share the same dimension-capture pattern (consistent code)
- [x] `dotnet build --configuration Release` passes (sanity — no backend changes expected)

---

## Implementation Steps

### Frontend

For each of the three components below, apply the same pattern:

1. Replace `useState<boolean>(false)` (the `ready` flag) with `useState<{ w: number; h: number } | null>(null)` — call the state `dims`.
2. In the `ResizeObserver` callback, read `entries[0].contentRect.{width, height}`. **Add a no-op guard**: only call `setDims` if `width !== dims?.w || height !== dims?.h`. Avoids redundant rerenders when the observer fires with identical measurements.
3. **Keep observing** — do NOT call `observer.disconnect()` after first measurement. ResizeObserver only fires on actual size changes (idle cost is zero), so leaving it attached restores responsive reflow on viewport resize.
4. Render the chart only when `dims !== null`. Pass `width={dims.w} height={dims.h}` as numeric props to `<ResponsiveContainer>`. ResponsiveContainer becomes a thin passthrough but the (-1, -1) self-measurement is bypassed.

Files:

- [x] `client/src/features/stats/charts/CharacterWinRateScatter.tsx` — modify the existing ResizeObserver (lines 32-43) per pattern above; ResponsiveContainer is at line 114
- [x] `client/src/features/stats/charts/PlayerWinRateBar.tsx` — modify existing ResizeObserver (lines 41-52) per pattern above; ResponsiveContainer is at line 67. Note: this component computes `const height = Math.max(200, chartData.length * 50)` (line 62) for the parent Box's `sx.height`. The measured height from the observer will reflect that computed value naturally — no separate handling needed
- [x] `client/src/features/stats/UserStats.tsx` — PieChart at lines 241-278 currently has no ResizeObserver and no `ready` gating. Add the full pattern: a `useCallback` ref attached to the wrapping Box (line 241), a ResizeObserver, `dims` state, gated render of `<ResponsiveContainer width={dims.w} height={dims.h}>`

---

## Domain Risk Checklist

- [x] **Composite keys**: Not touched. Frontend-only rendering fix.
- [x] **Round-robin**: Not touched. No match generation changes.
- [x] **Statistics**: Not touched. The chart components consume already-computed stats from `computeCharacterWinRates` / `computePlayerWinRates`; only the rendering pipeline changes.
- [x] **Guest identity**: Not touched. No user FK changes.
- [x] **Authorization**: Not touched. No route or policy changes.

All five invariants safe. No domain-change-proposal needed.

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None (but unblocks 5 E2E tests that currently fail or skip)

---

## Code References

The existing `ResizeObserver` + `useCallback` ref pattern in `CharacterWinRateScatter.tsx`:

```tsx
// client/src/features/stats/charts/CharacterWinRateScatter.tsx:32-43 (CURRENT)
const [ready, setReady] = useState(false);
const containerRef = useCallback((node: HTMLDivElement | null) => {
  if (!node) return;
  const observer = new ResizeObserver((entries) => {
    const { width, height } = entries[0].contentRect;
    if (width > 0 && height > 0) {
      setReady(true);
      observer.disconnect();
    }
  });
  observer.observe(node);
}, []);
```

Target shape after fix:

```tsx
const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
const containerRef = useCallback((node: HTMLDivElement | null) => {
  if (!node) return;
  const observer = new ResizeObserver((entries) => {
    const { width, height } = entries[0].contentRect;
    if (width <= 0 || height <= 0) return;
    setDims((prev) => (prev?.w === width && prev?.h === height ? prev : { w: width, h: height }));
  });
  observer.observe(node);
  // No disconnect — keep observing for window-resize reflow
}, []);

// ...
{dims && (
  <ResponsiveContainer width={dims.w} height={dims.h}>
    {/* chart */}
  </ResponsiveContainer>
)}
```

Test fixture that surfaces the warning (do not modify):
```ts
// e2e/tests/fixtures.ts:127
if (type === 'error' || type === 'warning') { ... }
```

---

## Rollback Plan

- **Database**: No migration. N/A.
- **Code**: `git revert` the commit. Three isolated frontend files; no shared utility extracted, so revert is mechanical.
- **Risk**: Low — purely visual rendering pipeline change in three leaf components. No business logic, no shared state, no API contract.

---

## Out of Scope

- Adding the warning text to the `pageErrors` fixture noise filter — explicitly rejected. Team policy (per existing memory) is to find root causes, not silence warnings.
- DRY-ing the three chart components into a shared `useChartDimensions` hook — they share a near-identical pattern after this fix, but extracting the hook is a separate refactor task.
- Cleaning up casual matches in `e2e/global-teardown.ts` — separate observation; current teardown only cleans test leagues/tournaments, leaving casual matches in DB across runs. Not part of this fix.

---

## Progress Log

[Updated during implementation]
- 2026-04-29 — Created from E2E test triage. Two failing tests + 3 cascade-skipped on `lifecycle/casual-match.spec.ts`.
- 2026-04-29 — Implemented dimension-capture pattern in all three chart components. Build verified.

---

## Resolution

**Implementation Summary**:

Replaced the boolean `ready` gate with a `dims: { w, h } | null` state in each chart component. The `ResizeObserver` callback now stores the measured `contentRect` dimensions and passes them as numeric props to `<ResponsiveContainer>`, eliminating its `(-1, -1)` self-measurement step that was emitting the warning. The observer is kept attached (no `disconnect()` call), so charts continue reflowing on viewport resize. A no-op guard in `setDims` avoids redundant rerenders when the observer fires with identical dimensions. `UserStats.tsx`'s PieChart, which previously had no gating at all, received the full pattern (ref + observer + gated render).

**Files created/modified**:
- `client/src/features/stats/charts/CharacterWinRateScatter.tsx` — `ready` → `dims`; numeric width/height passed to `<ResponsiveContainer>`; observer no longer disconnects
- `client/src/features/stats/charts/PlayerWinRateBar.tsx` — same pattern; the parent `Box`'s computed `height` (`Math.max(200, chartData.length * 50)`) flows naturally into the observed `contentRect.height`
- `client/src/features/stats/UserStats.tsx` — added `useCallback`/`useState` imports; new `pieDims` state and `pieContainerRef` ref; PieChart now gated and sized from observed dims

**Test results**:
- `cd client && npm run build` — passes (no TypeScript errors)
- `dotnet build --configuration Release` — passes (build succeeded, only pre-existing AutoMapper NU1903 warning)
- E2E full run not executed locally (requires Docker stack); CI on the `ci/claude-autofix` branch will verify the 88/88 target.

**Next steps**: Push branch and let CI run E2E. If browser console still shows Recharts warnings on `/casual` or `/user/{id}` after deploy, investigate whether any other ResponsiveContainer remains with `100%` literals.
