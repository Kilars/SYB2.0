# Task Board — SYB2.0

## Current Focus

AI scaffolding setup complete. Ready for first backlog scan.

## Status

| Status | Count |
|--------|-------|
| Backlog | 0 |
| In Progress | 0 |
| Done | 0 |

## Top Priorities

_No active priorities. Run `/backlog-scan` to discover tasks or `/feature-planning` to plan a specific feature._

## Recently Completed

_None yet._

---

## Quick Reference

- **Backlog**: `task-board/backlog/` — queued tasks ready for implementation
- **In Progress**: `task-board/in-progress.md` — single active task slot
- **Review**: `task-board/review.md` — completed tasks awaiting verification
- **Done**: `task-board/done/` — completed and verified tasks (immutable history)

## Workflow

```
backlog/ → in-progress.md → review.md → done/
```

1. Pick top priority from backlog
2. Move to in-progress (only 1 task at a time)
3. Implement and verify
4. Move to review for verification
5. Move to done when verified
6. Update this file with new statistics
