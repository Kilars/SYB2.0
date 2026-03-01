# 019-FEATURE-userstats-top-characters

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: Medium
**Type**: FEATURE
**Estimated Effort**: Medium

---

## Context

Beyond the GUID display bug (fixed in 002-BUG-userstats-character-guids), the "Top Characters" section in UserStats has no character images and uses a flat `display: 'flex', justifyContent: 'space-evenly'` layout that wraps poorly on narrow screens.

**Correction**: The data is richer than initially assessed. `charStats` is a `Record<string, { wins: number; total: number; wr: number }>` — it already contains wins, total rounds, and win rate (as rounded integer percentage). The current rendering already shows all three values. The main improvements are: adding character images, using a card layout, and fixing the GUID-as-key display.

**Note**: Implementing this task fully subsumes task 002 (GUID fix). If done first, task 002 becomes unnecessary. The dependency is listed as "blocked by 002" for the case where 002 is done as a quick standalone fix first.

---

## Acceptance Criteria

- [x] Each top character is displayed as a card with:
  - Character image (from `characters.find(c => c.id === charId)?.imageUrl`)
  - Character name (resolved from charId via `characters.find(c => c.id === charId)?.fullName`)
  - Wins count (already in `charStats[charId].wins`)
  - Total rounds (already in `charStats[charId].total`)
  - Win rate percentage (already in `charStats[charId].wr` as integer)
- [x] Preserve existing sort/filter logic (lines 48-51): filter `total > 2`, sort by `wr` desc then `total` desc, cap at top 3
- [x] Guard against `undefined` charId entries (add `if (!charId) continue` in accumulation loop)
- [x] Cards stack on mobile (1 column) and display in a row on desktop (2-3 columns)
- [x] Empty state when no character stats exist
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [ ] In `client/src/features/stats/UserStats.tsx`:
  - Refactor the top characters section from flat `Object.entries` rendering to card-based layout
  - For each character entry:
    - Look up character data: `characters.find(c => c.id === charId)`
    - Render character image (`<img>` or `<Avatar>`)
    - Render character full name
    - Render game count with label
    - Optionally render win rate if per-character win data is available from the API
  - Use responsive grid: `gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }`
  - Style cards consistently with app's visual language (use `<Card>` or `<Paper>`)
- [ ] Add empty state: "No character data yet — play some matches!"

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified — frontend display only
- [x] **Round-robin**: Match generation logic is not affected — no domain changes
- [x] **Statistics**: Points/flawless computation is not affected — display-only enhancement
- [x] **Guest identity**: UserId FK references are preserved — no domain changes
- [x] **Authorization**: Route params match handler expectations — no auth handler changes

---

## Dependencies

- **Blocked by**: 002-BUG-userstats-character-guids (must fix GUID resolution before enhancing the section)
- **Blocks**: None

---

## Code References

```tsx
// Current rendering — flat flex with GUID keys and { wins, total, wr } values:
{Object.entries(charStats)
    .filter(entry => entry[1].total > 2)
    .sort((a, b) => b[1].total - a[1].total)
    .sort((a, b) => b[1].wr - a[1].wr)
    .slice(0, 3)
    .map((entry) =>
        <Box key={entry[0]}>
            <Typography fontWeight="bold" variant="h5">{entry[0]}</Typography>  // GUID!
            <Typography variant="h5">Wins: {entry[1].wins}</Typography>
            <Typography variant="h5">Total: {entry[1].total}</Typography>
            <Typography variant="h5">Wr: {entry[1].wr}%</Typography>
        </Box>
    )}

// Proposed card rendering (preserve existing filter/sort/slice):
// Note: MUI v7 uses `size` prop instead of `xs/sm/md` on Grid items
<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
  {Object.entries(charStats)
    .filter(([_, stats]) => stats.total > 2)
    .sort((a, b) => b[1].total - a[1].total)
    .sort((a, b) => b[1].wr - a[1].wr)
    .slice(0, 3)
    .map(([charId, stats]) => {
      const character = characters.find(c => c.id === charId);
      return (
        <Card key={charId}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={character?.imageUrl} alt={character?.fullName ?? 'Unknown'} />
            <Box>
              <Typography fontWeight="bold">{character?.fullName ?? 'Unknown'}</Typography>
              <Typography variant="body2">Wins: {stats.wins} / Total: {stats.total}</Typography>
              <Typography variant="body2">Win rate: {stats.wr}%</Typography>
            </Box>
          </CardContent>
        </Card>
      );
    })}
</Box>
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — single component change
- **Risk**: Low — visual enhancement to existing section

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

**Changes**: UserStats.tsx — Replaced flat flex top-characters section with card-based grid (Avatar + name + wins/total/wr%). Added responsive gridTemplateColumns. Added empty state message. Preserved existing filter/sort/slice logic.

**Verification**: `npm run build` passes.
