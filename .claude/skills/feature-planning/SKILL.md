---
name: feature-planning
description: Focused task planning for ONE specific idea. Uses narrow-to-broad pattern — starts at user's focus point, expands context only as needed. Creates detailed task via task-board skill.
---

# Feature Planning

Focused planning skill for ONE specific task the user has in mind. Starts narrow at user's focus point, expands outward only as needed.

**Pattern**: Narrow → Broad (start focused, expand as needed)

**PLANNING ONLY — NO IMPLEMENTATION**
This skill creates ONE task file. It does NOT write code or start implementation.

**Use `/backlog-scan` instead** for bulk backlog generation (broad → narrow pattern).

## When to Use This Skill

**Use this skill when**:
- User has a specific idea: "I want to fix X" or "Add feature Y"
- Working on ONE focused task
- Need to plan a single feature or change

**DO NOT use this skill for**:
- Bulk backlog generation → use `backlog-scan` skill
- Finding ALL gaps in codebase → use `backlog-scan` skill
- Implementing tasks → this skill only plans

---

## Context Loading (Area-Specific)

Load ONLY context relevant to user's focus area:

### Step 1: Identify Area

Based on user's input, determine affected layers:
- **Domain** — Entity changes, enums
- **Application** — Handlers, DTOs, validators
- **Persistence** — DbContext, migrations
- **Infrastructure** — Authorization
- **API** — Controllers, endpoints
- **Frontend** — UI, components, hooks, forms

### Step 2: Load Relevant Context

**Always read**:
- `CLAUDE.md` — domain invariants section (always relevant)
- Domain entity files in `Domain/` (if touching data)
- `Persistence/AppDbContext.cs` (if touching data layer)
- `client/src/lib/types/index.d.ts` (if touching frontend)

**Conditionally read**:
- `docs/frontend-rules.md` — only if frontend work
- Related handlers in `Application/` — only if touching business logic
- Related controllers in `API/Controllers/` — only if touching endpoints

### Step 3: Check Completed Work

Scan `task-board/done/` for tasks related to this area:
- Recent patterns and quality standards
- How similar work was done
- Avoid duplicating completed work

---

## Research Pattern: Narrow → Broad

Start at user's specific point, expand ONLY when necessary:

```
User's focus (component, file, feature)
           |
Direct dependencies (imports, related entities)
           |
Related components (sibling handlers, related hooks)
           |
Broader patterns (architecture, conventions)
           |
STOP when you have enough context
```

### Example: "Add Bo1 match support"

1. **Start**: Match entity, Round entity, ChangeLeagueStatus handler
2. **Check**: Match generation algorithm, Round creation logic
3. **Maybe**: CompleteMatch handler, match validation
4. **Only if needed**: Leaderboard calculation, frontend match form
5. **STOP**: Don't scan entire codebase

### Key Principle

**Only expand when necessary.** Don't:
- Read all entity files (only relevant ones)
- Scan all handlers
- Load all frontend components
- Check all completed tasks

---

## Workflow

### Phase 1: Ask User

```
What do you want to work on?
```

**STOP and wait for response.**

### Phase 2: Context Loading

1. Identify affected layers from user's response
2. Load relevant context files
3. Check related completed tasks
4. Identify domain risks

### Phase 3: Focused Research

Research outward from user's starting point:

1. Read the specific files/entities mentioned
2. Check direct dependencies (FKs, imports, related handlers)
3. Expand only if needed for understanding
4. Stop when context is sufficient

### Phase 4: Propose Task

Present focused proposal:

```
**Proposed Task:** [Clear title]
**Type:** FEATURE / BUG / REFACTOR
**Why:** [1-2 sentences]
**Scope:**
- Includes: [what's in]
- Excludes: [what's out]
**Layers affected:** [Domain, Application, API, Frontend, etc.]
**Domain risks:** [None / list specific risks]

Create this task?
```

**STOP and wait for approval.**

### Phase 5: Delegate to task-board

If approved, invoke `task-board` skill with:
- Task title and type
- Research findings (files, patterns, risks)
- Scope boundaries
- Layer-by-layer implementation outline

### Phase 6: End

After task-board creates the file, output exactly:

```
Task created: task-board/backlog/[filename]

Ready in backlog. To implement, use `start-working` skill.
```

Then **STOP**. Do not:
- Offer to implement
- Ask follow-up questions
- Suggest next steps

The user will initiate the next action.

---

## Rules

- **ONE task at a time**
- **Ask before researching**
- **Ask before creating**
- **Start narrow, expand only as needed**
- **Load area context BEFORE researching**
- **Always assess domain risks** (5 invariants from CLAUDE.md)
- **Follow layer order** in implementation proposal (Domain → Application → Persistence → Infrastructure → API → Frontend)

---

## Delegates To

- `task-board` skill — for detailed plan file creation

## See Also

- `backlog-scan` skill — for bulk discovery (broad → narrow)
- `CLAUDE.md` — domain invariants and architecture
- `docs/frontend-rules.md` — frontend conventions
- `task-board/done/` — completed task patterns
