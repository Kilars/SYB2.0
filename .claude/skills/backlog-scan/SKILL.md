---
name: backlog-scan
description: Bulk backlog scanner that analyzes the entire SYB2.0 codebase vs CLAUDE.md, identifies ALL gaps, and generates a comprehensive, prioritized, numbered task backlog. Uses broad-to-narrow pattern.
---

# Backlog Scan

Autonomous bulk scanner for comprehensive backlog generation. Scans entire codebase against CLAUDE.md spec, finds ALL gaps, generates numbered tasks.

**Pattern**: Broad → Narrow (scan everything, then focus on gaps)

**PLANNING ONLY — NO IMPLEMENTATION**
This skill creates task files. It does NOT write code or start implementation.

**Use `/feature-planning` instead** for a single specific task (narrow → broad pattern).

## When to Use This Skill

**Use this skill when**:
- Starting a new development phase — need comprehensive backlog
- Backlog is stale or empty
- Want to discover ALL missing features, refactors, improvements
- Need to organize and prioritize existing tasks

**DO NOT use this skill for**:
- Creating a single specific task → use `feature-planning` skill
- Implementing tasks → this skill only discovers and plans
- Quick bug fixes → just fix them directly

---

## Context Loading (ALWAYS FIRST)

Before any analysis, load ALL context:

```
CONTEXT LOADING
  - CLAUDE.md completely
  - docs/frontend-rules.md
  - ALL Domain/ entity files
  - Persistence/AppDbContext.cs
  - client/src/lib/types/index.d.ts
  - task-board/done/ (all completed tasks)
  - task-board/backlog/ (existing tasks)
```

1. **Read CLAUDE.md completely**
   - All domain invariants
   - Architecture patterns
   - Known tech debt
   - Definition of done

2. **Read ALL Domain entities**
   - `Domain/*.cs` — understand the full data model

3. **Check ALL completed tasks in `task-board/done/`**
   - Learn what's been done
   - Avoid creating duplicate tasks
   - Identify recurring themes

4. **Check existing backlog in `task-board/backlog/`**
   - Avoid duplicating existing tasks
   - Identify tasks that may be stale

---

## Scan Workflow

### Phase 1: Full Codebase Analysis

**Goal**: Understand EVERYTHING that exists

1. **Read CLAUDE.md and docs/frontend-rules.md**
   - ALL described features, architecture, requirements
   - Known tech debt items
   - Domain invariants

2. **Scan ALL codebase areas**
   - `Domain/` — entity files
   - `Application/` — handlers, DTOs, validators
   - `Persistence/` — DbContext, migrations, seed data
   - `Infrastructure/` — authorization handlers
   - `API/Controllers/` — endpoints
   - `client/src/features/` — frontend pages
   - `client/src/lib/` — hooks, schemas, types, utils
   - TODOs, FIXMEs in code

3. **Review ALL existing tasks**
   - `task-board/backlog/`
   - `task-board/done/`
   - Identify gaps, duplicates, vague tasks

### Phase 2: Gap Analysis

**Goal**: Find ALL gaps between current state and ideal state

**SYB2.0-Specific Gap Categories**:

1. **Tournament Mode Readiness**
   - Bo1 match support (currently Bo3 only)
   - Tournament brackets (single/double elimination)
   - League format options

2. **Guest Upgrade Flow**
   - Guest user creation
   - Guest → full user upgrade (UserId preservation)
   - FK reference integrity during upgrade

3. **Statistics Expansion**
   - Per-character win rates
   - Head-to-head records
   - Match history timeline
   - First-pick advantage analysis
   - Split comparison (split 1 vs split 2 performance)

4. **Infrastructure**
   - Error boundaries
   - Loading skeletons
   - Responsive design gaps
   - Accessibility

5. **Code Quality**
   - TypeScript type mismatches (known: `LeagueMember.Leagueid`)
   - Duplicate utilities (known: `requiredString`)
   - Missing validation
   - Error handling gaps

6. **Known Tech Debt**
   - Items from CLAUDE.md "Known Tech Debt" section
   - MobX minimal usage (could be removed)
   - Match form uses useState instead of RHF

### Phase 3: Task Generation

**Quality Bar** (ALL must be met):
- Clear value: Obvious user benefit OR technical necessity
- Well-scoped: Not epic-sized, not trivial
- Actionable: Can implement without major unknowns
- Domain-aligned: Fits SYB2.0 league management
- Non-redundant: Not covered by existing task in backlog/ or done/

**For each gap that meets quality bar**:
1. Create task file using `.claude/templates/task-breakdown.md`
2. Include domain risk checklist (mandatory)
3. Assign appropriate type (FEATURE, REFACTOR, BUG, EXPLORE)
4. Set priority (High, Medium, Low)

### Phase 4: Numbering & Organization

**CRITICAL**: Scan ALL folders for highest number:

```
1. Glob: task-board/**/*.md
2. Scan: backlog/ + done/
3. Find highest number
4. Next task = highest + 1
```

**Never reuse numbers** — done/ tasks are immutable history.

**File format**: `NNN-TYPE-description.md`
- `001-FEATURE-bo1-match-support.md`
- `002-REFACTOR-consolidate-utils.md`
- `003-BUG-fix-type-mismatch.md`

### Phase 5: Prioritization

Order tasks by priority within the backlog:

**High Priority** (do first):
- Bug fixes affecting correctness
- Security issues
- Features blocking other work
- Known tech debt causing friction

**Medium Priority**:
- New features with clear user value
- Code quality improvements
- Testing improvements

**Low Priority**:
- Nice-to-have features
- Cosmetic improvements
- Exploratory work

### Phase 6: Cleanup

- Enhance vague existing tasks
- Merge duplicates
- Remove outdated tasks
- Final state: numbered, no duplicates, quality bar met

---

## Output

Summary report with:

```markdown
## Backlog Scan Results

### Tasks Created
- NNN-TYPE-description — [priority] — [1-line summary]

### Breakdown
| Type | Count |
|------|-------|
| FEATURE | X |
| REFACTOR | X |
| BUG | X |

### Top 5 Priorities
1. NNN-TYPE-description — [why it's high priority]
2. ...

### Next Steps
- Update task-board/overview.md with top priorities
- Use `start-working` skill to begin implementation
```

---

## Domain Risk in Task Generation

Every generated task MUST include the domain risk checklist:

- [ ] **Composite keys**: No key columns modified without migration review
- [ ] **Round-robin**: Match generation not affected
- [ ] **Statistics**: Points/flawless computation not affected
- [ ] **Guest identity**: UserId FK references preserved
- [ ] **Authorization**: Route params match handler expectations

Tasks that involve domain changes should be flagged with higher scrutiny.

---

## Delegates To

- `task-board` skill — for detailed plan files (optional, for complex tasks)

## See Also

- `feature-planning` skill — for single task planning (narrow → broad)
- `CLAUDE.md` — project instructions and domain invariants
- `docs/frontend-rules.md` — frontend conventions
- `task-board/overview.md` — current priorities
