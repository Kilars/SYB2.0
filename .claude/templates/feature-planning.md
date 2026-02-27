# Feature Planning Template

## 1. Problem Statement

**What**: [Clear description of the feature or change]
**Why**: [Business value or user need]
**Who**: [Who benefits — players, league admins, system]

---

## 2. Scope

**Includes**:
- [What is in scope]

**Excludes**:
- [What is explicitly out of scope]

**Estimated Effort**: [Simple (< 1 day) / Medium (1-3 days) / Complex (3+ days)]

---

## 3. Research Phase

### Context Loaded
- [ ] Read relevant Domain entities (`Domain/`)
- [ ] Read `Persistence/AppDbContext.cs` (if touching data layer)
- [ ] Read `client/src/lib/types/index.d.ts` (if touching frontend)
- [ ] Read related handlers in `Application/`
- [ ] Checked existing implementations for similar patterns
- [ ] Reviewed `task-board/done/` for related completed work

### Findings
[Summary of research: existing code, patterns, dependencies found]

---

## 4. Domain Risk Assessment

**Every feature MUST assess these 5 risks before proceeding:**

### 4.1 Composite Key Impact
- [ ] Does this change affect Match, Round, or LeagueMember entities?
- [ ] Are any composite key columns being added, removed, or renamed?
- [ ] Do FK relationships need updating in `AppDbContext.cs`?
- **Risk level**: [None / Low / High]
- **Notes**: [Describe impact or write "No composite key changes"]

### 4.2 Round-Robin Integrity
- [ ] Does this change affect league status transitions?
- [ ] Does this change affect match generation or pairing logic?
- [ ] Could this introduce duplicate or missing pairings?
- **Risk level**: [None / Low / High]
- **Notes**: [Describe impact or write "No round-robin impact"]

### 4.3 Statistics Integrity
- [ ] Does this change affect point calculation or leaderboard queries?
- [ ] Does this introduce any frontend statistics computation?
- [ ] Does this change the Flawless definition (exactly 2 completed rounds)?
- **Risk level**: [None / Low / High]
- **Notes**: [Describe impact or write "No statistics impact"]

### 4.4 Guest Identity Safety
- [ ] Does this change affect User entity or user identification?
- [ ] Are FK references to UserId preserved if user identity changes?
- [ ] Could this break guest → full user upgrade flow?
- **Risk level**: [None / Low / High]
- **Notes**: [Describe impact or write "No identity impact"]

### 4.5 Authorization Consistency
- [ ] Does this add new endpoints requiring authorization?
- [ ] Do route parameter names match what authorization handlers read?
- [ ] Is the correct policy applied (IsLeagueAdmin, IsLeagueMember, etc.)?
- **Risk level**: [None / Low / High]
- **Notes**: [Describe impact or write "No authorization changes"]

---

## 5. Proposed Implementation Per Layer

### Domain (if applicable)
- Files to create/modify: [paths]
- Changes: [description]

### Application (if applicable)
- Commands/Queries: [paths]
- DTOs: [paths]
- Validators: [paths]
- Mapping profiles: [paths]

### Persistence (if applicable)
- DbContext changes: [description]
- Migration needed: [yes/no]

### Infrastructure (if applicable)
- Authorization handlers: [paths]

### API (if applicable)
- Controllers: [paths]
- New endpoints: [routes]

### Frontend (if applicable)
- Types: [changes to index.d.ts]
- Hooks: [new or modified hooks]
- Schemas: [new or modified Zod schemas]
- Components: [new or modified components]
- Routes: [new or modified routes]

---

## 6. Task Breakdown

Delegate to `task-board` skill for detailed task files. Proposed breakdown:

1. **NNN-TYPE-description** — [brief scope]
2. **NNN-TYPE-description** — [brief scope]
3. **NNN-TYPE-description** — [brief scope]

**Dependencies**: [which tasks block others]
