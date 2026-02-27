# Domain Change Proposal: [Short Description]

**Proposed by**: [AI / User]
**Date**: [YYYY-MM-DD]
**Related task**: [NNN-TYPE-description or "Standalone"]

---

## Reason for Change

[Why this entity/schema change is needed. What feature or fix requires it.]

---

## Affected Entities

| Entity | Change Type | Description |
|--------|-------------|-------------|
| [EntityName] | [Add property / Remove property / Modify type / New entity] | [What changes] |

---

## Composite Key Analysis

**Current composite keys** (from `Persistence/AppDbContext.cs`):

| Entity | Key Columns | Changed? |
|--------|-------------|----------|
| LeagueMember | `(UserId, LeagueId)` | [Yes / No] |
| Match | `(LeagueId, MatchNumber, Split)` | [Yes / No] |
| Round | `(LeagueId, MatchNumber, Split, RoundNumber)` | [Yes / No] |

**If any key changes**:
- [ ] Existing data migration strategy documented below
- [ ] All FK references updated
- [ ] AppDbContext relationship config updated
- [ ] No orphaned records possible

---

## FK Cascade Review

List all foreign key relationships affected by this change:

| From Entity | FK Property | To Entity | OnDelete | Impact |
|-------------|-------------|-----------|----------|--------|
| [Match] | [LeagueId] | [League] | NoAction | [None / Must update] |

**Cascade risk**: [None — no FK changes / Low — additive only / High — existing FK modified]

---

## Migration Plan

### Step 1: Generate migration
```bash
dotnet ef migrations add [MigrationName] --project Persistence --startup-project API
```

### Step 2: Review generated migration
- [ ] No data loss (columns not dropped without data migration)
- [ ] Default values set for new non-nullable columns
- [ ] Index changes are intentional

### Step 3: Apply migration
```bash
dotnet ef database update --project Persistence --startup-project API
```

### Step 4: Verify
- [ ] Database schema matches entity definitions
- [ ] Seed data still loads correctly
- [ ] Existing data preserved

---

## Downstream Changes Per Layer

### Domain
- [ ] Entity class updated: `Domain/[Entity].cs`
- [ ] Navigation properties updated (if applicable)

### Application
- [ ] DTOs updated: `Application/[Feature]/DTOs/[Name]Dto.cs`
- [ ] Mapping profiles updated: `Application/Core/MappingProfiles.cs`
- [ ] Handlers updated: [list affected handlers]
- [ ] Validators updated: [list affected validators]

### Persistence
- [ ] `AppDbContext.cs` — composite key config
- [ ] `AppDbContext.cs` — relationship config (HasOne/WithMany/HasForeignKey)
- [ ] Migration generated and reviewed

### Infrastructure
- [ ] Authorization handlers updated (if route params change)

### API
- [ ] Controller DTOs/routes updated (if applicable)

### Frontend
- [ ] `client/src/lib/types/index.d.ts` updated
- [ ] Affected hooks updated
- [ ] Affected components updated

---

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Data loss** | [Low / Med / High] | [Low / Med / High] | [Strategy] |
| **Round-robin corruption** | [Low / Med / High] | [Low / Med / High] | [Strategy] |
| **Statistics invalidation** | [Low / Med / High] | [Low / Med / High] | [Strategy] |
| **Auth bypass** | [Low / Med / High] | [Low / Med / High] | [Strategy] |
| **FK orphans** | [Low / Med / High] | [Low / Med / High] | [Strategy] |

---

## Approval

- [ ] Domain invariants reviewed (all 5 from CLAUDE.md)
- [ ] Migration reviewed and tested locally
- [ ] Rollback plan documented
- [ ] Task-board task created for implementation

**Decision**: [Approved / Rejected / Needs revision]
**Notes**: [Any conditions or modifications to the proposal]
