---
name: summarize-session
description: Compact the conversation context by summarizing what was accomplished and persisting learnings to CLAUDE.md or memory files. Use when context is getting long or when transitioning between work sessions.
---

# Summarize Session Skill

This skill performs **context compaction** — summarizing the current session and persisting valuable learnings.

**Purpose**: Reduce context length while preserving important information for future sessions.

---

## When to Use

Use this skill when:
- Context is getting long (lots of back-and-forth)
- Transitioning between work sessions
- User explicitly asks to compact or summarize
- Before starting a major new task
- After completing significant work

---

## Workflow

### Phase 1: Session Analysis

Review the current conversation and identify:

1. **Work Completed**
   - Files created/modified
   - Features implemented
   - Bugs fixed
   - Tasks moved through task-board

2. **Decisions Made**
   - Architectural choices
   - Pattern preferences
   - Naming conventions established
   - Trade-offs chosen

3. **Problems Encountered**
   - Errors and how they were resolved
   - EF Core gotchas discovered
   - Build issues and fixes
   - Domain invariant violations caught

4. **User Preferences Revealed**
   - Communication style
   - Code style preferences
   - Workflow preferences

5. **Learnings About the Codebase**
   - Patterns not documented in CLAUDE.md
   - Important file locations
   - Integration details
   - Quirks or edge cases

---

### Phase 2: CLAUDE.md Update Evaluation

CLAUDE.md has a **high threshold** — only global, project-wide learnings.

**Threshold: Only add if it meets ALL THREE criteria:**

1. **Reusable** — Will apply to future work (not a one-time fix)
2. **Non-obvious** — Not something a senior dev would assume
3. **Project-wide** — Applies globally, not to a specific feature

**Examples that PASS the threshold:**
- "All DateTime properties are converted to UTC via AppDbContext value converter" — project-wide
- "FluentValidation runs as MediatR pipeline behavior, not in controllers" — architectural
- "Vite builds frontend to API/wwwroot/" — affects deployment understanding

**Examples that FAIL (go to memory instead):**
- "Fixed a typo in LeagueForm" — not reusable
- "React uses JSX" — too obvious
- "LeagueStats component uses specific MUI grid layout" — feature-specific

---

### Phase 3: Memory Files Evaluation

Memory files in `.claude/projects/` have a **lower threshold** — domain-specific patterns and session-specific insights.

**Threshold: Add if it meets TWO criteria:**

1. **Reusable** — Will apply to future work in that domain
2. **Specific** — Contains actionable detail (not generic advice)

**Examples that SHOULD go in memory:**
- "EF Core composite key FK requires explicit configuration in OnModelCreating" → memory
- "React Query invalidation must use exact query key array" → memory
- "Match validation: exactly 2 won rounds for Bo3 flawless" → memory

---

### Phase 4: Update Files

**Step 1: Update CLAUDE.md (if warranted)**

For global learnings that pass the high threshold:
1. Read CLAUDE.md to find the appropriate section
2. Add the learning in the correct location
3. Keep it concise and match existing style

**CLAUDE.md Placement Guidelines**:

| Learning Type | Where to Add |
|---------------|--------------|
| New domain invariant | Domain Invariants section |
| New tech/dependency | Tech Stack section |
| New convention | File Naming Conventions or Notes for AI Agents |
| New endpoint | API Endpoints section |
| Authorization issue | Authorization Policies section |
| New tech debt | Known Tech Debt section |

**Step 2: Update Memory Files (if warranted)**

For domain-specific learnings:
1. Check existing memory files for relevant topic
2. Update existing file or create new topic file
3. Link from MEMORY.md if creating new file

---

### Phase 5: Context Summary

Produce a compact summary:

```markdown
## Session Summary

### Completed
- [Bullet list of work done]

### Files Changed
- [List of significant files modified]

### Decisions
- [Key decisions made during session]

### Open Items
- [Anything left incomplete or for next session]

### Task Board Updates
- [Tasks moved: backlog → in-progress → done]
- [New tasks created]

### Learnings Persisted
- **CLAUDE.md**: [What was added, if anything, or "None"]
- **Memory**: [What was saved, if anything, or "None"]
```

---

## Output

The skill produces:
1. **Updates to CLAUDE.md** (high threshold, global only)
2. **Updates to memory files** (lower threshold, domain-specific)
3. **Session summary** (displayed to user)

The summary becomes the new context for continuing work, replacing the long conversation history.

---

## Example Session Summary

```markdown
## Session Summary

### Completed
- Implemented Bo1 match support for leagues
- Fixed flawless calculation for 2-round matches
- Added match format selector to league creation form

### Files Changed
- Domain/Match.cs — Added MatchFormat enum
- Application/Leagues/Commands/ChangeLeagueStatus.cs — Modified round generation
- Application/Leagues/Queries/GetLeagueLeaderboard.cs — Updated flawless logic
- client/src/features/leagues/LeagueForm.tsx — Added format selector
- client/src/lib/types/index.d.ts — Added MatchFormat type

### Decisions
- MatchFormat stored on League entity, not per-match
- Bo1 flawless = winning the single round (1-0)
- Bo3 flawless = winning 2-0 (unchanged)

### Open Items
- Frontend match details form needs conditional round display
- Task 004-FEATURE-bo1-frontend still in backlog

### Task Board Updates
- 003-FEATURE-bo1-backend moved to done
- 004-FEATURE-bo1-frontend created in backlog

### Learnings Persisted
- **CLAUDE.md**: Added MatchFormat to Domain Entities table, updated Flawless definition
- **Memory**: None
```

---

## Critical Rules

1. **Be concise** — Summaries should be short, not verbose
2. **Preserve essential info** — Don't lose important context
3. **Prefer memory over CLAUDE.md** — Domain-specific goes to memory files
4. **Update CLAUDE.md sparingly** — Only global, project-wide learnings
5. **Match existing style** — Follow the file's formatting conventions
6. **Focus on actionable** — Learnings should help future work
7. **Don't duplicate** — Don't add what's already documented
8. **Capture EF Core gotchas** — These are common and valuable for .NET projects

---

## Triggering This Skill

The user can invoke with:
- "compact context"
- "summarize session"
- "what did we accomplish"
- "update claude.md with learnings"
- "session summary"
