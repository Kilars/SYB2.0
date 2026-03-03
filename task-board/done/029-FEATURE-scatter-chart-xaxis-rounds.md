# 029-FEATURE-scatter-chart-xaxis-rounds

**Status**: Done
**Created**: 2026-03-02
**Priority**: Medium
**Type**: FEATURE
**Estimated Effort**: Simple

---

## Context

The scatter chart in LeagueStats currently uses character name (index) as the X-axis and win rate as the Y-axis, with bubble size encoding rounds played via ZAxis. This makes the X-axis uninformative — it's just an arbitrary index. The rounds-played information encoded in bubble size is hard to read visually.

Switching X-axis to "total rounds played" (numeric) makes the chart more meaningful: you can see at a glance which characters are popular AND successful. Bubble size becomes uniform since rounds info moves to the axis.

---

## Acceptance Criteria

- [x] X-axis displays "Rounds Played" (numeric) instead of character name index
- [x] Y-axis remains "Win Rate" (0-100%)
- [x] Character portrait dots (CharacterDot component) render at a fixed uniform size
- [x] ZAxis is removed (no longer needed for bubble sizing)
- [x] Tooltip still shows character name, win rate %, and rounds played
- [x] Chart remains responsive on mobile
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [x] **`client/src/features/stats/LeagueStats.tsx` line 127-135** — Change `scatterData` mapping: use `x: s.total` instead of `x: i`
- [x] **`client/src/features/stats/LeagueStats.tsx` line 177-186** — XAxis changes:
  - Change `domain` to `[0, Math.max(...scatterData.map(d => d.total)) + 1]`
  - Remove `ticks` prop (auto ticks for numeric axis)
  - Remove `tickFormatter` that maps index to character name
  - Add `label` prop: `{ value: "Rounds Played", position: "insideBottom", offset: -5 }`
  - Reduce `angle` / remove since labels are numeric now
- [x] **`client/src/features/stats/LeagueStats.tsx` line 200** — Remove `<ZAxis type="number" dataKey="total" range={[100, 400]} />`
- [x] **`client/src/features/stats/LeagueStats.tsx` line 144** — CharacterDot: replace dynamic `Math.max(28, Math.min(48, 20 + payload.total * 4))` with a fixed size (e.g., `const size = 36`)
- [x] **`client/src/features/stats/LeagueStats.tsx` line 27** — Remove `ZAxis` from recharts import

---

## Domain Risk Checklist

**Every task MUST complete this checklist before implementation:**

- [x] **Composite keys**: No composite key columns are being modified
- [x] **Round-robin**: Match generation logic is not affected
- [x] **Statistics**: Points/flawless computation is not affected — this is display-only
- [x] **Guest identity**: UserId FK references are preserved
- [x] **Authorization**: Route params match handler expectations

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None

---

## Code References

Current scatter data mapping (line 127-135):
```tsx
const scatterData = charStats
  .sort((a, b) => b.total - a.total)
  .map((s, i) => ({
    x: i,             // Change to: x: s.total
    winRate: s.winRate,
    total: s.total,
    name: s.name,
    imageUrl: s.imageUrl,
  }));
```

Current CharacterDot sizing (line 144):
```tsx
const size = Math.max(28, Math.min(48, 20 + payload.total * 4));
// Change to: const size = 36;
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — single file change
- **Risk**: Low — isolated frontend display change

---

## Progress Log

- 2026-03-03: Implemented all changes in LeagueStats.tsx. Removed ZAxis import, changed scatterData x to s.total, fixed CharacterDot to uniform size 36, updated XAxis with numeric domain and "Rounds Played" label, removed ZAxis component. Build passes.

---

## Resolution

All acceptance criteria met. Single file changed: `client/src/features/stats/LeagueStats.tsx`. The scatter chart now uses "Rounds Played" as the X-axis (numeric), character portrait dots are uniformly sized at 36px, and the ZAxis component has been fully removed. Tooltip continues to display character name, win rate %, and rounds played. Chart remains responsive via ResponsiveContainer.
