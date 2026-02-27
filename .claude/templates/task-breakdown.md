# [NNN]-[TYPE]-[short-description]

**Status**: Backlog
**Created**: [YYYY-MM-DD]
**Priority**: [High / Medium / Low]
**Type**: [FEATURE / REFACTOR / BUG / EXPLORE]
**Estimated Effort**: [Simple / Medium / Complex]

---

## Context

[Why this task exists. What problem it solves. Link to parent feature plan if applicable.]

---

## Acceptance Criteria

- [ ] [Specific, testable criterion 1]
- [ ] [Specific, testable criterion 2]
- [ ] [Specific, testable criterion 3]
- [ ] `dotnet build --configuration Release` passes
- [ ] `cd client && npm run build` passes (if frontend changes)

---

## Implementation Steps

### Domain (if applicable)
- [ ] [Step with specific file path: `Domain/EntityName.cs`]

### Application (if applicable)
- [ ] [Step with specific file path: `Application/Feature/Commands/ActionName.cs`]
- [ ] [Step with specific file path: `Application/Feature/DTOs/NameDto.cs`]
- [ ] [Step with specific file path: `Application/Feature/Validators/NameValidator.cs`]

### Persistence (if applicable)
- [ ] [Step with specific file path: `Persistence/AppDbContext.cs`]
- [ ] [Migration: `dotnet ef migrations add MigrationName`]

### Infrastructure (if applicable)
- [ ] [Step with specific file path: `Infrastructure/Security/RequirementName.cs`]

### API (if applicable)
- [ ] [Step with specific file path: `API/Controllers/FeatureController.cs`]

### Frontend (if applicable)
- [ ] [Step with specific file path: `client/src/lib/types/index.d.ts`]
- [ ] [Step with specific file path: `client/src/lib/hooks/useFeature.ts`]
- [ ] [Step with specific file path: `client/src/lib/schemas/featureSchema.ts`]
- [ ] [Step with specific file path: `client/src/features/feature/Component.tsx`]

---

## Domain Risk Checklist

**Every task MUST complete this checklist before implementation:**

- [ ] **Composite keys**: No composite key columns are being modified (or migration review attached)
- [ ] **Round-robin**: Match generation logic is not affected (or impact documented)
- [ ] **Statistics**: Points/flawless computation is not affected (or impact documented)
- [ ] **Guest identity**: UserId FK references are preserved (or impact documented)
- [ ] **Authorization**: Route params match handler expectations (or mismatch documented)

**If any box cannot be checked, STOP and create a domain-change-proposal first.**

---

## Dependencies

- **Blocked by**: [List task numbers that must complete first, or "None"]
- **Blocks**: [List task numbers that depend on this, or "None"]

---

## Code References

[Relevant existing code patterns to follow]

```csharp
// Example: similar handler pattern
// File: Application/Leagues/Commands/CreateLeague.cs
```

---

## Rollback Plan

[How to safely revert this change if something goes wrong]

- **Database**: [Revert migration: `dotnet ef database update PreviousMigration` / No migration needed]
- **Code**: [Git revert / simple code removal]
- **Risk**: [Low — isolated change / Medium — affects multiple files / High — data migration involved]

---

## Progress Log

[Updated during implementation]
- YYYY-MM-DD HH:MM — [What was done]

---

## Resolution

[Filled when complete]

**Implementation Summary**: [What was built]

**Files created/modified**:
- [path] — [description]

**Test results**:
- [Verification outcome]

**Next steps**: [Follow-up work or "None"]
