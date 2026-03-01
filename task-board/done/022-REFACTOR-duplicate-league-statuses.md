# 022-REFACTOR-duplicate-league-statuses

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: Low
**Type**: REFACTOR
**Estimated Effort**: Simple

---

## Context

The `LEAGUE_STATUSES` array is independently defined as an identical 2D array in both `Description.tsx` and `LeagueList.tsx`. Each entry is `[label, color]`:

```tsx
const LEAGUE_STATUSES = [
    ['Planned', "warning"],
    ['Started', "success"],
    ['Finished', "info"],
];
```

Note: The actual labels are **'Planned', 'Started', 'Finished'** (not 'Active' and 'Complete'). This duplication means any label or color change must be made in two places.

---

## Acceptance Criteria

- [x] `LEAGUE_STATUSES` 2D array constant defined in a single shared location (`client/src/lib/util/constants.ts`)
- [x] Both `Description.tsx` and `LeagueList.tsx` import from the shared location using **relative paths** (no `@` alias configured in this project)
- [x] No duplicate `LEAGUE_STATUSES` definitions remain
- [x] Behavior unchanged — same status labels displayed in the same places
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [ ] Create `client/src/lib/util/constants.ts` (the `lib/util/` directory already exists with `util.ts`):
  - Export `LEAGUE_STATUSES` as a 2D array with the actual values:
    ```tsx
    export const LEAGUE_STATUSES = [
        ['Planned', "warning"],
        ['Started', "success"],
        ['Finished', "info"],
    ] as const;
    ```
- [ ] Update `client/src/features/leagues/Description.tsx`:
  - Remove local `LEAGUE_STATUSES` definition
  - Import using relative path: `import { LEAGUE_STATUSES } from "../../lib/util/constants"`
- [ ] Update `client/src/features/leagues/LeagueList.tsx`:
  - Remove local `LEAGUE_STATUSES` definition
  - Import using relative path: `import { LEAGUE_STATUSES } from "../../lib/util/constants"`

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified — frontend refactor only
- [x] **Round-robin**: Match generation logic is not affected — no domain changes
- [x] **Statistics**: Points/flawless computation is not affected — no domain changes
- [x] **Guest identity**: UserId FK references are preserved — no domain changes
- [x] **Authorization**: Route params match handler expectations — no auth handler changes

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None

---

## Code References

```tsx
// Current — identical duplicate definitions in both files:
const LEAGUE_STATUSES = [
    ['Planned', "warning"],
    ['Started', "success"],
    ['Finished', "info"],
];

// Proposed — single source in constants.ts:
export const LEAGUE_STATUSES = [
    ['Planned', "warning"],
    ['Started', "success"],
    ['Finished', "info"],
] as const;

// Import in both files (MUST use relative paths — no @ alias configured):
import { LEAGUE_STATUSES } from "../../lib/util/constants";
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — 3 files (new constants file + 2 import changes)
- **Risk**: Low — pure extraction refactor

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

**Changes**: Created `client/src/lib/util/constants.ts` with shared LEAGUE_STATUSES constant. Removed duplicates from Description.tsx and LeagueList.tsx, replaced with imports.

**Verification**: `npm run build` passes.
