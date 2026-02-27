---
name: task-board
description: Planning specialist that creates structured implementation plans for SYB2.0. Transforms user requests into comprehensive, well-researched plan files stored in task-board/backlog/. This skill plans without implementing.
---

# Task-Board Planning Skill

This skill provides specialized workflows for creating and managing implementation plans in SYB2.0. It transforms user requests into comprehensive, well-researched plan files that guide future implementation.

**CRITICAL CONSTRAINT**: This skill is for planning and documentation ONLY. Never implement fixes, write code changes, or modify the codebase. The sole responsibility is creating thorough plan documentation in `task-board/backlog/`.

## When to Use This Skill

**Use this skill for**:
- Feature planning requiring technical design
- Refactoring plans needing impact assessment
- Exploration and research documentation
- Breaking down epics into implementation phases
- User requests that need structured planning

**DO NOT use this skill for**:
- Quick bug fixes (just implement directly)
- Simple changes with obvious implementation
- Active code implementation (skill is planning-only)
- Trivial updates that don't need planning
- AI scaffolding (CLAUDE.md, rules, skills) — update directly, no task

---

## Planning Workflow

### Phase 1: Initial Understanding

1. **Listen carefully**: Read the user's request completely
2. **Ask clarifying questions** to understand scope:
   - What problem are you trying to solve?
   - What does success look like?
   - Are there any constraints or preferences?
   - What's the priority level?
3. **Identify plan type**: FEATURE, REFACTOR, BUG, EXPLORE, or EPIC
4. **Assess complexity**: Simple (< 1 day), Medium (1-3 days), or Complex (3+ days)

### Phase 2: Codebase Research

**CRITICAL**: Conduct thorough research before creating the plan file.

1. **Always read these context files**:
   - `CLAUDE.md` — project overview, domain invariants, architecture
   - `docs/frontend-rules.md` — frontend conventions (if UI work)
   - Domain entities in `Domain/` — relevant entity files
   - `Persistence/AppDbContext.cs` — composite keys and relationships (if data layer)
   - `client/src/lib/types/index.d.ts` — TypeScript types (if frontend)

2. **Search for relevant code**:
   - Use Glob/Grep to find related features, components, or patterns
   - Look for similar implementations in the codebase
   - Check for existing utilities or shared components to reuse

3. **Understand the architecture layers**:
   - **Domain**: Entities, enums
   - **Application**: MediatR handlers (Commands/Queries), DTOs, validators, mapping profiles
   - **Persistence**: AppDbContext, migrations, seed data
   - **Infrastructure**: Authorization requirement handlers
   - **API**: Controllers, middleware, Program.cs
   - **Frontend**: Types, hooks, schemas, components, routes

4. **Map dependencies**:
   - What NuGet/npm packages might be needed?
   - What internal features does this depend on?
   - Are there blocking tasks?

5. **Identify risks** using the 5 domain invariants:
   - Composite key impact?
   - Round-robin integrity?
   - Statistics integrity?
   - Guest upgrade safety?
   - Authorization consistency?

### Phase 3: Approach Design

1. **Define architecture decisions**:
   - Which layers need changes?
   - Follow existing patterns (MediatR CQRS, React Query hooks, etc.)

2. **Plan implementation per layer** (follow CLAUDE.md layer order):
   - Domain → Application → Persistence → Infrastructure → API → Frontend

3. **Break down into phases**:
   - Phase 1: Core functionality
   - Phase 2: Integration
   - Phase 3: Verification

### Phase 4: Create Plan File

Create a comprehensive plan file in `task-board/backlog/` using the task-breakdown template from `.claude/templates/task-breakdown.md`.

### Phase 5: Validation

Before finishing, verify:
- [ ] User's request is fully understood
- [ ] All clarifying questions answered
- [ ] Technical approach is clear and feasible
- [ ] Specific file locations and paths included
- [ ] Domain risk checklist completed
- [ ] Dependencies and risks identified
- [ ] Plan file created in `task-board/backlog/`

---

## File Naming Convention

**Format**: `[NNN]-[TYPE]-[short-description].md`

### Task Numbering — CRITICAL

**ALWAYS scan ALL folders to find the next task number:**

```
1. Glob pattern: task-board/**/*.md
2. Scan: backlog/, done/, in-progress.md, review.md
3. Extract numbers from filenames (e.g., 001-FEATURE-xxx.md → 001)
4. Find highest number across ALL locations
5. Next task = highest + 1
```

**Why include `done/`**: Completed tasks retain their numbers. Reusing numbers breaks history tracking.

### Type Prefixes

- `FEATURE` — New functionality
- `REFACTOR` — Code improvements
- `BUG` — Bug fixes
- `EXPLORE` — Research/investigation
- `EPIC` — Major multi-phase features

---

## SYB2.0-Specific Context

### Domain Knowledge

**Smash Bros League Management**:
- Round-robin tournaments with 2 splits
- Bo3 match format (best of 3 rounds)
- Character selection per round
- Points system: Win = 4, Flawless (2-0) = +1 bonus
- League statuses: Planned → Active → Complete

### Architecture Patterns

**Backend (Clean Architecture)**:
```
Domain/                  # Entities (zero dependencies)
Application/             # MediatR CQRS
  {Feature}/Commands/    # Write operations (Command + Handler)
  {Feature}/Queries/     # Read operations (Query + Handler)
  {Feature}/DTOs/        # Data transfer objects
  {Feature}/Validators/  # FluentValidation
Persistence/             # EF Core DbContext, migrations
Infrastructure/Security/ # Authorization handlers
API/Controllers/         # HTTP endpoints
```

**Frontend (Feature-Based)**:
```
client/src/
  features/{domain}/     # Page components
  lib/hooks/             # React Query hooks (useLeagues, useMatch, etc.)
  lib/schemas/           # Zod validation schemas
  lib/types/index.d.ts   # Global type declarations
  app/shared/components/ # Reusable form inputs
```

**Key Patterns**:
- Result<T> for handler responses
- ValidationBehaviour<TRequest, TResponse> for pre-handler validation
- ExceptionMiddleware for global error handling
- Axios agent with response interceptors for frontend errors
- React Hook Form + Zod resolver for form validation

---

## Domain Risk Assessment (Required)

Every plan MUST include the domain risk checklist from `.claude/templates/task-breakdown.md`:

1. **Composite keys** — No key columns modified without migration review
2. **Round-robin** — Match generation not affected
3. **Statistics** — Points/flawless computation not affected
4. **Guest identity** — UserId FK references preserved
5. **Authorization** — Route params match handler expectations

If any risk is identified as High, create a domain-change-proposal using `.claude/templates/domain-change-proposal.md` before proceeding.

---

## Plan Template

Use `.claude/templates/task-breakdown.md` as the base template. Key sections:

1. **Context** — Why this task exists
2. **Acceptance Criteria** — Specific, testable requirements (checkboxes)
3. **Implementation Steps** — Per layer with file paths
4. **Domain Risk Checklist** — 5 invariant checks (mandatory)
5. **Dependencies** — What blocks this, what this blocks
6. **Code References** — Existing patterns to follow
7. **Rollback Plan** — How to safely revert

---

## Handoff to Implementation

After creating a plan file, inform the user:

```
Plan documented: task-board/backlog/[NNN-TYPE-description].md

Next steps:
1. Review the plan for accuracy and completeness
2. Update task-board/overview.md if this is a top priority
3. Use `start-working` skill to begin implementation
4. Task will flow: backlog → in-progress → done

Clarifications needed? Ask now.
```

---

## Completeness Checklist

Before creating a plan file, verify:
- [ ] User's intent is clear — asked clarifying questions if needed
- [ ] Technical approach designed — architecture decisions documented
- [ ] Specific file paths — listed exact files to create/modify
- [ ] Code references included — showed relevant patterns
- [ ] Domain risk checklist completed — all 5 invariants assessed
- [ ] Dependencies identified — blocking work and downstream effects
- [ ] Effort estimated — Simple/Medium/Complex
- [ ] Priority set — High/Medium/Low
- [ ] All template sections filled — no empty sections

---

## See Also

- [`CLAUDE.md`](../../../CLAUDE.md) — Project-wide instructions
- [`docs/frontend-rules.md`](../../../docs/frontend-rules.md) — Frontend conventions
- [`.claude/templates/task-breakdown.md`](../../templates/task-breakdown.md) — Task template
- [`.claude/templates/domain-change-proposal.md`](../../templates/domain-change-proposal.md) — Entity change template
- [`task-board/overview.md`](../../../task-board/overview.md) — Current priorities
