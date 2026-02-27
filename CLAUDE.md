# SYB2.0 — Smash Your Boys Leaderboard

## Project Overview

SYB2.0 is a Super Smash Bros league management system for tracking round-robin tournaments, match results, character statistics, and player rankings. Built with .NET 9 Clean Architecture + React 19.

**Purpose**: Create and manage fighting game leagues with round-robin scheduling, Bo3 match tracking, character selection, leaderboards, and player statistics.

---

## Architecture

```
SYB2.0/
├── Domain/              # Entities, enums — zero dependencies
├── Application/         # MediatR CQRS handlers, DTOs, validators, interfaces
├── Persistence/         # EF Core DbContext, migrations, seed data
├── Infrastructure/      # Authorization handlers, UserAccessor
├── API/                 # Controllers, middleware, Program.cs (composition root)
├── client/              # React 19 + Vite frontend
├── task-board/          # Task management system
└── .claude/             # AI scaffolding (skills, templates)
```

**Dependency flow**: Domain ← Application ← Persistence/Infrastructure ← API

### Implementation Order Per Layer

When implementing a new feature, follow this order:
1. **Domain** — Entity classes, enums
2. **Application** — Commands/Queries (MediatR), DTOs, validators, mapping profiles
3. **Persistence** — DbContext configuration (composite keys, relationships), migrations
4. **Infrastructure** — Authorization requirements/handlers
5. **API** — Controllers, endpoint registration
6. **Frontend** — Types, hooks, schemas, components, routes

---

## Tech Stack

### Backend (.NET 9)
- **CQRS**: MediatR 12.5 (Commands + Queries + Handlers)
- **ORM**: EF Core 9 with SQL Server
- **Validation**: FluentValidation 12 (pipeline behavior)
- **Mapping**: AutoMapper 14
- **Auth**: ASP.NET Core Identity with cookie auth
- **Pattern**: Result<T> for handler responses

### Frontend (React 19 + TypeScript)
- **Build**: Vite 6 with SWC
- **Server state**: TanStack React Query 5
- **Forms**: React Hook Form 7 + Zod 4
- **UI**: Material UI 7 + Emotion
- **Routing**: React Router 7
- **HTTP**: Axios
- **UI state**: MobX (minimal, just uiStore)
- **Dates**: date-fns with Norwegian locale (nb)
- **Toasts**: react-toastify

---

## Domain Entities

| Entity | Primary Key | Notes |
|--------|-------------|-------|
| User | Id (IdentityUser) | DisplayName, Bio, ImageUrl |
| League | Id (GUID string) | Title, Description, Status (Planned/Active/Complete) |
| LeagueMember | (UserId, LeagueId) | IsAdmin, DateJoined |
| Match | (LeagueId, MatchNumber, Split) | PlayerOneUserId, PlayerTwoUserId, WinnerUserId |
| Round | (LeagueId, MatchNumber, Split, RoundNumber) | Character selections, WinnerUserId |
| Character | Id | FullName, ShorthandName, ImageUrl |

---

## 5 Domain Invariants

These rules MUST be checked before any domain-touching change:

### 1. Round-Robin Integrity
- `n*(n-1)/2` unique pairings per split, 2 splits total
- Side-swap symmetry: if A is P1 in split 1, A is P2 in split 2 for the same pairing
- Pairings use `(i + j) % 2` for deterministic side assignment, Fisher-Yates shuffle for match order
- NEVER regenerate matches for an Active league — delete all and regenerate on status revert to Planned
- 3 rounds per match (Bo3 format)

### 2. Composite Key Safety
- **Match PK**: `{LeagueId, MatchNumber, Split}` — configured in AppDbContext
- **Round PK**: `{LeagueId, MatchNumber, Split, RoundNumber}` — configured in AppDbContext
- **LeagueMember PK**: `{UserId, LeagueId}` — configured in AppDbContext
- All FKs use `OnDelete: NoAction` to prevent cascade disasters
- NEVER modify composite key columns without a migration review and explicit task-board approval

### 3. Statistics Integrity
- **Points formula**: Win = 4 points, Flawless bonus = 1 point
- **Flawless definition**: Win where exactly 2 rounds have a WinnerUserId set (2-0 victory)
- Statistics are computed backend-only in `GetLeagueLeaderboard.Handler`
- Frontend NEVER computes points or statistics — it only displays backend results

### 4. Guest Upgrade Safety
- When a guest upgrades to a full user, the same UserId is retained
- All FK references (LeagueMember, Match.PlayerOneUserId, etc.) are preserved
- Identity enrichment (adding email/password), NOT identity replacement

### 5. Authorization Consistency
- `IsAdminRequirement` reads route param `"id"` (league endpoints use `{leagueId}` in route but the handler reads `"id"`)
- `IsLeagueMember` reads route param `"leagueId"`
- `IsMatchEditable` and `IsMatchComplete` read `"leagueId"`, `"split"`, `"matchNumber"`
- Route param names in controllers MUST match what authorization handlers expect

---

## Development Commands

### Backend
```bash
# Run API (HTTPS on port 5002)
dotnet run --project API

# Build (release check)
dotnet build --configuration Release

# Add migration
dotnet ef migrations add <Name> --project Persistence --startup-project API

# Apply migrations
dotnet ef database update --project Persistence --startup-project API
```

### Frontend
```bash
# Dev server (port 3000, proxies /api to localhost:5002)
cd client && npm run dev

# Build (outputs to API/wwwroot/)
cd client && npm run build

# Lint
cd client && npm run lint
```

### Docker (SQL Server)
```bash
docker-compose up -d
```

---

## API Endpoints

### Leagues (`/api/leagues`)
| Method | Route | Auth Policy | Handler |
|--------|-------|-------------|---------|
| GET | `/api/leagues` | AllowAnonymous | GetLeagueList |
| GET | `/api/leagues/{leagueId}` | Authenticated | GetLeagueDetails |
| POST | `/api/leagues` | Authenticated | CreateLeague |
| PUT | `/api/leagues/{leagueId}` | IsLeagueAdmin + IsLeaguePlanned | UpdateLeague |
| POST | `/api/leagues/{leagueId}/status` | IsLeagueAdmin | ChangeLeagueStatus |
| GET | `/api/leagues/{leagueId}/leaderboard` | IsLeagueMember | GetLeagueLeaderboard |

### Matches (`/api/matches`)
| Method | Route | Auth Policy | Handler |
|--------|-------|-------------|---------|
| GET | `/api/matches/{leagueId}/split/{split}/match/{matchNumber}` | IsLeagueMember | GetMatchDetails |
| POST | `.../complete` | IsLeagueMember + IsMatchEditable | CompleteMatch |
| POST | `.../reopen` | IsLeagueMember + IsMatchComplete | ReopenMatch |
| GET | `/api/matches/user/{id}` | Authenticated | GetUserMatches |

### Account
| Method | Route | Handler |
|--------|-------|---------|
| POST | `/api/login` | Identity login (cookie) |
| POST | `/api/register` | Identity register |
| GET | `/api/account/user-info` | Custom AccountController |

---

## Authorization Policies

| Policy | Requirement Class | Route Params Read |
|--------|-------------------|-------------------|
| IsLeagueAdmin | IsAdminRequirement | `"id"` |
| IsLeagueMember | IsLeagueMember | `"leagueId"` |
| IsMatchEditable | IsMatchEditable | `"leagueId"`, `"split"`, `"matchNumber"` |
| IsLeaguePlanned | IsPlannedRequirement | `"id"` |
| IsMatchComplete | IsMatchComplete | `"leagueId"`, `"split"`, `"matchNumber"` |

---

## File Naming Conventions

### Backend
- Commands: `Application/{Feature}/Commands/{ActionName}.cs` — contains Command record + Handler class
- Queries: `Application/{Feature}/Queries/{ActionName}.cs` — contains Query record + Handler class
- DTOs: `Application/{Feature}/DTOs/{Name}Dto.cs`
- Validators: `Application/{Feature}/Validators/{Name}Validator.cs`
- Controllers: `API/Controllers/{Feature}Controller.cs`
- Auth handlers: `Infrastructure/Security/{RequirementName}.cs`

### Frontend
- Hooks: `client/src/lib/hooks/use{Feature}.ts`
- Schemas: `client/src/lib/schemas/{feature}Schema.ts`
- Types: `client/src/lib/types/index.d.ts` (single file)
- Pages/Components: `client/src/features/{feature}/{ComponentName}.tsx`
- Shared components: `client/src/app/shared/components/{ComponentName}.tsx`

---

## Definition of Done

A task is complete when:
- [ ] All acceptance criteria checked off in the task file
- [ ] `dotnet build --configuration Release` passes
- [ ] `cd client && npm run build` passes (if frontend changes)
- [ ] Manual browser verification for UI changes
- [ ] Task file moved to `task-board/done/` with Resolution section filled
- [ ] No regressions introduced

---

## Refactoring Policy

- Only refactor code directly related to the current task
- Never refactor composite key structure without a domain-change-proposal
- Don't add comments, docstrings, or type annotations to code you didn't change
- Don't rename variables or restructure files "for consistency" unless that IS the task

---

## Known Tech Debt

- `LeagueMember.Leagueid` in TypeScript types has lowercase 'id' (should be `leagueId`) — front-end type mismatch
- MobX is used minimally (just uiStore + observer on NavBar) — could be removed in favor of React Query + context
- `requiredString` utility is defined in both `util.ts` and `leagueSchema.ts` — needs consolidation
- Match details form uses local `useState` instead of React Hook Form for round state management
- No error boundary components (only ServerError page for 500s)

---

## Critical Files

| File | Why Critical |
|------|-------------|
| `Persistence/AppDbContext.cs` | All composite key definitions and relationship config — the most dangerous file |
| `Application/Leagues/Commands/ChangeLeagueStatus.cs` | Round-robin match generation algorithm |
| `Application/Leagues/Queries/GetLeagueLeaderboard.cs` | Point calculation and statistics computation |
| `client/src/lib/types/index.d.ts` | TypeScript types that must mirror backend DTOs |
| `API/Program.cs` | Service registration, authorization policy definitions |

---

## Notes for AI Agents

- **SENIOR DEV EXPECTATIONS** — find root causes, fix properly, no lazy workarounds
- **USE BUILT-IN TOOLS** — Read/Write/Edit/Glob/Grep over bash equivalents
- **LOAD CONTEXT BEFORE WORKING** — always read relevant entity files, AppDbContext, and types/index.d.ts before domain work
- **CHECK DOMAIN INVARIANTS** — review the 5 invariants above before any entity or schema change
- **FOLLOW LAYER ORDER** — Domain → Application → Persistence → Infrastructure → API → Frontend
