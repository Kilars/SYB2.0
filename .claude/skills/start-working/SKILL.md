---
name: start-working
description: Autonomously execute ALL tasks from the backlog until complete. Runs in a continuous loop — picks task, implements via subagent, moves to done, repeats. No user prompts between tasks. Follows task-board workflow (backlog → in-progress → done).
---

# Start Working Skill

This skill **autonomously executes ALL tasks** from the task board until the backlog is empty. It runs in a continuous loop without stopping between tasks.

**Task Board Flow**: `task-board/backlog/` → `task-board/in-progress.md` → `task-board/done/`

**AUTONOMOUS MODE**: This skill does NOT stop between tasks. It continues until all tasks are complete or a critical blocker occurs.

---

## 7 CRITICAL RULES

### 1. USE THE TASK BOARD SYSTEM
**ALL work flows through `task-board/`** — this is non-negotiable.
- Tasks live in: `backlog/` → `in-progress.md` → `done/`
- `overview.md` is the source of truth for priorities
- **NEVER work on something not tracked in the task board**
- Update task files with progress as you work

### 2. NEVER USE GIT COMMANDS
**ABSOLUTELY NO git commands** — not by the main agent, not by subagents.
- No `git add`, `git commit`, `git push`, `git pull`, `git checkout`, `git branch`, etc.
- No `git status`, `git diff`, `git log` (even read-only commands)
- No command starting with `git`

**Why**: The user handles all git operations. The `push-code` skill handles commits when requested.

### 3. USE SUBAGENTS FOR IMPLEMENTATION
Each task MUST be executed using the **Task tool** with a subagent:
- **Simple tasks**: Use default model — CSS fixes, text changes, simple components, API endpoints with clear patterns
- **Complex tasks**: Use `model: "sonnet"` — multi-file architectural changes, complex business logic, intricate state management
- **ALWAYS include CLAUDE.md context** in subagent prompts

### 4. TASKS ARE DONE IN ORDER
Tasks are numbered for dependency reasons. Execute them **sequentially, in order**:
- Pick task 001 → Complete → Pick task 002 → Complete → ...
- **NEVER skip ahead** unless user explicitly requests it
- **NEVER run tasks in parallel**

### 5. VERIFICATION BEFORE COMPLETION
Every task MUST be verified before marking complete:
```bash
# Backend verification
dotnet build --configuration Release

# Frontend verification (if frontend changes)
cd client && npm run build

# Manual browser check for UI changes
```

**Tasks without build verification are INCOMPLETE.**

### 6. ALWAYS PREFER TOOLS OVER BASH
Subagents MUST use built-in tools instead of bash equivalents:

| NEVER USE | ALWAYS USE |
|-----------|------------|
| `cat`, `head`, `tail` | **Read** tool |
| `echo >`, `cat <<EOF` | **Write** tool |
| `sed`, `awk` | **Edit** tool |
| `find`, `ls` (for search) | **Glob** tool |
| `grep`, `rg` | **Grep** tool |

### 7. NEVER MODIFY COMPOSITE KEYS WITHOUT APPROVAL
**NEVER** change composite key columns (Match PK, Round PK, LeagueMember PK) without:
1. An explicit task-board task approving the change
2. A completed domain-change-proposal (`.claude/templates/domain-change-proposal.md`)
3. Migration review

---

## When to Use This Skill

Use this skill when the user requests:
- "Start working on the next task"
- "Continue work" or "Keep going"
- "Pick up the next priority"
- "Start implementing" or "Begin development"
- Any request to begin implementation work

---

## The 10-Step Workflow

### Step 1: Check Current Priorities

Read `task-board/overview.md` to see what's next.

**If no tasks exist**: Ask the user if they want to:
1. Run `backlog-scan` to discover tasks
2. Run `feature-planning` to plan a specific feature
3. Wait for manual task creation

### Step 2: Select Top Priority

Pick the **first numbered task** from the backlog (unless blocked or user specifies otherwise).

**Decision criteria**:
- Is it blocked by dependencies? (check "Blocked by" in task file)
- Are all prerequisites met?
- Is the scope clear and actionable?

If the top priority is blocked, move to the next unblocked item.

### Step 3: Move to In-Progress

1. Update `task-board/in-progress.md` with the active task details
2. Keep the task file in `backlog/` but mark status as "In Progress"

**Important**: Only 1 task at a time. If in-progress already has a task, ask user if they want to finish it first.

### Step 4: Read the Task File

Thoroughly understand the task plan:
- **Context**: Why is this work needed?
- **Acceptance Criteria**: Specific, testable requirements (checkboxes)
- **Implementation Steps**: Per-layer breakdown with file paths
- **Domain Risk Checklist**: All 5 invariants checked
- **Dependencies**: What must be completed first
- **Code References**: Relevant patterns and examples

### Step 5: Clarify Uncertainties

**STOP and ask the user if**:
- The task description is unclear or ambiguous
- Multiple implementation approaches are possible
- There are technical uncertainties
- The scope seems too large
- Dependencies are unclear

**Only proceed after all uncertainties are resolved.**

### Step 6: Assess Complexity

Evaluate if the task is appropriately sized:

**If task is too complex**:
- Break it down into smaller, focused sub-tasks
- Create new task files in `backlog/` for each sub-task
- Update `overview.md` with the new breakdown
- Select the first sub-task to work on

**Complexity indicators**:
- Affects more than 3 layers
- Requires changes across 5+ files
- Multiple domain invariants at risk

### Step 7: Add Implementation Plan

If the task file doesn't already have a detailed implementation plan, add one:

```markdown
## Implementation Plan

**Phase 1: Backend** (if applicable)
- [ ] Domain entity changes
- [ ] MediatR handler (Command/Query)
- [ ] DTOs and mapping profiles
- [ ] FluentValidation rules
- [ ] AppDbContext configuration
- [ ] Migration (if needed)

**Phase 2: API** (if applicable)
- [ ] Controller endpoint
- [ ] Authorization policy

**Phase 3: Frontend** (if applicable)
- [ ] TypeScript types (index.d.ts)
- [ ] React Query hook
- [ ] Zod schema
- [ ] Components
- [ ] Routes

**Phase 4: Verification**
- [ ] `dotnet build --configuration Release`
- [ ] `cd client && npm run build`
- [ ] Manual browser check
```

### Step 8: Update Overview

Mark the task as "In Progress" in `task-board/overview.md`.

### Step 9: Implement the Solution

#### Subagent Invocation

Use the **Task tool** to spawn a subagent:

```
Task tool:
  subagent_type: "general-purpose"
  description: "Implement [short description]"
  prompt: |
    Implement the task specified in:
    task-board/backlog/NNN-TYPE-description.md

    READ CLAUDE.md FIRST — it contains all project patterns, domain invariants, and conventions.
    READ docs/frontend-rules.md if this involves frontend work.

    Follow implementation order: Domain → Application → Persistence → Infrastructure → API → Frontend

    CRITICAL RESTRICTIONS:
    1. Work ONLY on this task from task-board/ — no ad-hoc work
    2. NEVER use git commands (git add, commit, push, status, diff, etc.)
    3. Use Read tool (NOT cat/head/tail)
    4. Use Write tool (NOT echo/cat heredoc)
    5. Use Edit tool (NOT sed/awk)
    6. Use Glob tool (NOT find/ls for search)
    7. Use Grep tool (NOT grep/rg bash commands)
    8. CHECK OFF acceptance criteria as you complete them (change [ ] to [x])
    9. NEVER modify composite key columns without explicit task approval
    10. Run `dotnet build --configuration Release` after backend changes
    11. Run `cd client && npm run build` after frontend changes

    When done, provide a summary of:
    - Files created/modified
    - All acceptance criteria status
    - Build verification results
    - Any issues encountered
```

#### Architecture Patterns to Follow

**Backend (.NET Clean Architecture)**:
- **Domain**: Entity classes in `Domain/`
- **Application**: Commands/Queries in `Application/{Feature}/Commands/` or `Queries/`
  - Each file contains a record (Command/Query) + Handler class
  - Handlers return `Result<T>` using the Result pattern
  - Validators use FluentValidation with pipeline behavior
- **Persistence**: AppDbContext composite key configuration
- **Infrastructure**: Custom authorization requirement handlers
- **API**: Controllers inherit `BaseApiController`, use `HandleResult<T>()`

**Frontend (React 19)**:
- **Types**: Global declarations in `lib/types/index.d.ts`
- **Hooks**: React Query hooks in `lib/hooks/use{Feature}.ts`
- **Schemas**: Zod schemas in `lib/schemas/{feature}Schema.ts`
- **Components**: Feature components in `features/{feature}/`
- **Forms**: Use shared components (TextInput, SelectInput, etc.) with React Hook Form

#### Development Commands

```bash
# Backend (from project root)
dotnet run --project API
dotnet build --configuration Release

# Frontend (from client/)
cd client && npm run dev
cd client && npm run build
cd client && npm run lint
```

### Step 10: Complete and Move to Done

**CRITICAL: Update acceptance criteria checkboxes** before marking complete:
- Change `- [ ]` to `- [x]` for each completed item
- If an item cannot be completed, document why in the Resolution section

**Verification checklist**:
- [ ] All acceptance criteria met AND CHECKED OFF
- [ ] `dotnet build --configuration Release` passes
- [ ] `cd client && npm run build` passes (if frontend changes)
- [ ] Manual browser verification (if UI changes)
- [ ] Domain risk checklist completed
- [ ] Code reviewed (self-review)

**Then finalize**:

1. **Update Resolution section** in the task file with implementation summary
2. **Move task file** from `backlog/` to `done/`
3. **Update `in-progress.md`** — clear the active task
4. **Update `overview.md`** — remove from priorities, add to recently completed, update statistics
5. **IMMEDIATELY start the next task** — no user prompt needed

---

## Working Through the Backlog — AUTONOMOUS MODE

**CRITICAL: This skill runs ALL tasks automatically until backlog is empty.**

```
LOOP until backlog is empty:
  1. Read overview.md to get the FIRST numbered task
  2. Update in-progress.md with task details
  3. Spawn subagent with Task tool
  4. Subagent implements and verifies
  5. Move task to done/
  6. Update overview.md
  7. AUTOMATICALLY continue to next task (NO user prompt needed)
```

**DO NOT STOP between tasks.** Continue until:
- All tasks in backlog are complete, OR
- A critical blocker prevents progress, OR
- User explicitly interrupts

---

## Handling Edge Cases

### If Backlog is Empty
Ask the user:
```
The backlog is currently empty. Would you like me to:
1. Run `backlog-scan` to discover tasks?
2. Run `feature-planning` to plan a specific feature?
3. Wait for you to manually create tasks?
```

### If Top Priority is Blocked
Identify the blocker and skip to next unblocked task. Inform user of the skip.

### If Task is Unclear
**ALWAYS ask clarifying questions** before proceeding.

### If Task is Too Large
Break it down into sub-tasks, create new files in `backlog/`, and start with the first sub-task.

---

## Success Criteria

### For Each Task:
- [ ] Task from `task-board/` (never work outside the task board system)
- [ ] NO git commands used
- [ ] Task executed using Task tool with subagent
- [ ] Built-in tools used (Read/Write/Edit/Glob/Grep — NO bash for file ops)
- [ ] All acceptance criteria checked off
- [ ] Build verification passed (`dotnet build` + `npm run build`)
- [ ] Task moved to `task-board/done/` with Resolution
- [ ] Domain risk checklist completed

### For the Overall Session:
- [ ] ALL tasks processed automatically (no stopping between tasks)
- [ ] Tasks processed IN ORDER (no skipping)
- [ ] Each task used a subagent
- [ ] `overview.md` updated after each completion
- [ ] Zero git commands executed

---

## See Also

- [`CLAUDE.md`](../../../CLAUDE.md) — Project-wide instructions and domain invariants
- [`docs/frontend-rules.md`](../../../docs/frontend-rules.md) — Frontend conventions
- [`task-board/overview.md`](../../../task-board/overview.md) — Current priorities
- [`.claude/skills/task-board/SKILL.md`](../task-board/SKILL.md) — Planning skill
- [`.claude/skills/push-code/SKILL.md`](../push-code/SKILL.md) — Commit and push skill
