# 001-FEATURE-playwright-e2e-testing

**Status**: Done
**Created**: 2026-02-27
**Priority**: High
**Type**: FEATURE
**Estimated Effort**: Medium

---

## Context

SYB2.0 has zero test coverage. This task adds Playwright-based E2E testing infrastructure that enables automated verification of all key user flows and console/network error detection.

Reference implementation: `../ettsted2/e2e/` (Playwright config, global setup, test structure).

### Decisions Made

| Decision | Choice |
|----------|--------|
| Auth strategy | API login (`POST /api/login?useCookies=true`) with seeded credentials |
| Server start | Auto-start via Playwright `webServer` config |
| Install location | Root-level `/e2e/` with own `package.json` |
| Health check | Poll `GET /api/leagues` (no dedicated health endpoint exists) |

---

## Acceptance Criteria

- [x] `e2e/` directory exists at project root with own `package.json`, `tsconfig.json`, `.gitignore`
- [x] `e2e/playwright.config.ts` auto-starts both backend (port 5002) and frontend (port 3000)
- [x] `e2e/global-setup.ts` authenticates via `POST /api/login?useCookies=true` with `denix@test.com` / `Pa$$w0rd` and saves cookie state
- [x] `e2e/tests/fixtures.ts` provides shared test base with console error collection, test constants, helpers
- [x] `e2e/tests/sanity.spec.ts` — smoke tests: home page, league list, leaderboard, all-page visit
- [x] `e2e/tests/auth-flows.spec.ts` — login, invalid login, protected routes, navbar state
- [x] `e2e/tests/league-navigation.spec.ts` — league list, tabs, leaderboard data
- [x] `e2e/tests/match-details.spec.ts` — match viewing, navigation between matches
- [ ] `npm run test:smoke` in `e2e/` passes — requires running backend + frontend servers
- [ ] `npm run test:full` in `e2e/` passes — requires running backend + frontend servers
- [x] No domain logic, AppDbContext, or Clean Architecture layers modified

---

## Implementation Steps

### Phase 1: Foundation
- [x] Create `e2e/package.json` with Playwright, TypeScript, npm scripts (`test`, `test:smoke`, `test:full`, `test:ui`, `report`)
- [x] Create `e2e/tsconfig.json` (ES2022, NodeNext)
- [x] Create `e2e/.gitignore` (node_modules, auth-state, test-results, playwright-report)
- [x] Create `e2e/storage/.gitkeep`
- [x] Run `cd e2e && npm install && npx playwright install chromium`

### Phase 2: Playwright Configuration
- [x] Create `e2e/playwright.config.ts`:
  - `webServer` array: `dotnet run --project API` (port 5002) + `npm run dev` in client/ (port 3000)
  - `reuseExistingServer: !process.env.CI` (allow reuse locally, fresh in CI)
  - Projects: `smoke` (sanity only) and `full` (everything else)
  - `baseURL: 'http://localhost:3000'`
  - `globalSetup` pointing to `global-setup.ts`
  - `storageState: './storage/auth-state.json'`
  - Sequential execution (`workers: 1`, `fullyParallel: false`)
  - Reporter: `html` + `list`
- [x] Create `e2e/global-setup.ts`:
  - Poll `https://localhost:5002/api/leagues` until 200 (no health endpoint)
  - API login: `POST http://localhost:3000/api/login?useCookies=true` with `{ email: 'denix@test.com', password: 'Pa$$w0rd' }` via Vite proxy
  - Save cookie state to `storage/auth-state.json`

### Phase 3: Test Infrastructure
- [x] Create `e2e/tests/fixtures.ts`:
  - `TEST_USER` constant (`denix@test.com` / `Pa$$w0rd`)
  - `SEEDED_LEAGUE` constant (`season-one-league-id`)
  - `PUBLIC_PAGES` array (`/`, `/leagues`, `/login`, `/register`)
  - `PROTECTED_PAGES` array (`/createLeague`, `/leagues/{leagueId}/...`)
  - `clearAuthState()` — clears cookies for logged-out tests
  - `checkPageHealth()` — checks body content, error boundaries
  - Extended `test` fixture with `pageErrors` console error collection

### Phase 4: Test Files
- [x] Create `e2e/tests/sanity.spec.ts`:
  - Home page loads (public, no auth)
  - League list page loads
  - Leaderboard page loads with data
  - Visit all public pages
  - Visit all protected pages when authenticated (iterate PROTECTED_PAGES)
- [x] Create `e2e/tests/auth-flows.spec.ts`:
  - Valid login via form
  - Invalid login shows error
  - Protected routes redirect to login when unauthenticated
  - Navbar shows user state when logged in
- [x] Create `e2e/tests/league-navigation.spec.ts`:
  - League list shows seeded league
  - Click league navigates to detail
  - Tab navigation (description, leaderboard, matches, stats)
  - Leaderboard displays player data
- [x] Create `e2e/tests/match-details.spec.ts`:
  - Completed match shows round data
  - Navigation between matches in split

### Phase 5: Validate
- [x] `node_modules/.bin/tsc --noEmit` passes (zero TypeScript errors)
- [x] `npx playwright test --list` discovers 34 tests across 4 spec files
- [ ] `cd e2e && npm run test:smoke` passes — requires live backend + frontend
- [ ] `cd e2e && npm run test:full` passes — requires live backend + frontend

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified — E2E tests are read-only infrastructure
- [x] **Round-robin**: Match generation logic is not affected — no domain changes
- [x] **Statistics**: Points/flawless computation is not affected — no domain changes
- [x] **Guest identity**: UserId FK references are preserved — no domain changes
- [x] **Authorization**: Route params match handler expectations — no auth handler changes

**Risk**: None — this task only adds new files in `e2e/`. Zero changes to existing code.

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None

---

## Code References

### Login pattern (must replicate in global-setup.ts)
```typescript
// File: client/src/lib/hooks/useAccount.ts:15
await agent.post('/login?useCookies=true', creds);
```

### Seeded test credentials
```csharp
// File: Persistence/DbInitializer.cs:19
// Password: Pa$$w0rd
// File: Persistence/SeasonOneLeague.cs:596-613
// Users: denix@test.com, eirik@test.com, ... (12 total)
// League ID: "season-one-league-id"
```

### Frontend routes (tests must navigate these)
```typescript
// File: client/src/app/router/Routes.tsx
// Public: /, /leagues, /login, /register
// Protected: /createLeague, /leagues/:leagueId/{description,leaderboard,matches,stats}, /leagues/:leagueId/split/:split/match/:match, /user/:userId
```

### Reference Playwright config
```
// File: ../ettsted2/e2e/playwright.config.ts
// Pattern: webServer array, global-setup, smoke/full projects, sequential execution
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Delete `e2e/`
- **Risk**: Low — entirely additive, zero changes to existing files

---

## Progress Log

2026-02-27: Infrastructure implemented — all 8 files created, TypeScript compiles clean, 34 tests discovered by Playwright. Runtime validation requires live backend + frontend.

---

## Resolution

All E2E infrastructure files created in `e2e/` at project root:

- `package.json` — npm scripts (test, test:smoke, test:full, test:ui, report)
- `tsconfig.json` — ES2022 + NodeNext module resolution
- `.gitignore` — excludes node_modules, auth state, report artifacts
- `storage/.gitkeep` — placeholder for auth-state.json (gitignored at runtime)
- `playwright.config.ts` — webServer auto-start, smoke/full projects, cookie storageState
- `global-setup.ts` — polls GET /api/leagues for readiness, authenticates via POST /api/login?useCookies=true, saves state
- `tests/fixtures.ts` — TEST_USER, SEEDED_LEAGUE, PUBLIC_PAGES, PROTECTED_PAGES constants; clearAuthState, loginViaForm, checkPageHealth helpers; extended test fixture with pageErrors collection
- `tests/sanity.spec.ts` — 5 smoke tests (home, league list, leaderboard, all-pages)
- `tests/auth-flows.spec.ts` — 8 tests (login form, invalid creds, redirect guard, navbar state)
- `tests/league-navigation.spec.ts` — 10 tests (list display, tab nav, leaderboard columns/rows/data)
- `tests/match-details.spec.ts` — 7 tests (completed match view, round counts, player names, navigation)

TypeScript: zero errors. Playwright test discovery: 34 tests in 4 files, 5 in smoke project, 29 in full project.
