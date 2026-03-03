/**
 * API-level helpers for fast test setup.
 * All calls go through the Vite proxy (http://localhost:3000/api/...)
 * to reuse cookie auth from the browser context.
 */

import { BrowserContext } from '@playwright/test';

const BASE = 'http://localhost:3000';

interface CreateLeagueOptions {
  title: string;
  description: string;
  members: { userId: string; displayName: string }[];
}

/**
 * Create a league via the API. Returns the new league ID.
 */
export async function createLeagueViaApi(
  context: BrowserContext,
  options: CreateLeagueOptions
): Promise<string> {
  const res = await context.request.post(`${BASE}/api/leagues`, {
    data: {
      title: options.title,
      description: options.description,
      startDate: new Date().toISOString(),
      members: options.members,
    },
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok()) {
    throw new Error(`createLeagueViaApi failed: ${res.status()} ${await res.text()}`);
  }
  // The API returns the league ID as a plain string
  const id = await res.text();
  return id;
}

/**
 * Change league status via the API.
 * Status values: 0 = Planned, 1 = Active, 2 = Complete
 */
export async function changeStatusViaApi(
  context: BrowserContext,
  leagueId: string,
  status: 0 | 1 | 2
): Promise<void> {
  // Frontend sends status as query param: POST /api/leagues/{id}/status?status=N
  const res = await context.request.post(
    `${BASE}/api/leagues/${leagueId}/status?status=${status}`
  );
  if (!res.ok()) {
    throw new Error(`changeStatusViaApi failed: ${res.status()} ${await res.text()}`);
  }
}

interface MatchData {
  completed: boolean;
  competitionId: string;
  bracketNumber: number;
  matchNumber: number;
  winnerUserId?: string;
  playerOne: { userId: string; displayName: string };
  playerTwo: { userId: string; displayName: string };
  rounds: RoundData[];
}

interface RoundData {
  competitionId: string;
  bracketNumber: number;
  matchNumber: number;
  roundNumber: number;
  completed: boolean;
  winnerUserId?: string;
  playerOneCharacterId?: string;
  playerTwoCharacterId?: string;
}

/**
 * Get match details via the API.
 */
export async function getMatchViaApi(
  context: BrowserContext,
  competitionId: string,
  bracketNumber: number,
  matchNumber: number
): Promise<MatchData> {
  const res = await context.request.get(
    `${BASE}/api/matches/${competitionId}/bracket/${bracketNumber}/match/${matchNumber}`
  );
  if (!res.ok()) {
    throw new Error(`getMatchViaApi failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Complete a match via the API.
 * Provide round data with character selections and winners.
 */
export async function completeMatchViaApi(
  context: BrowserContext,
  competitionId: string,
  bracketNumber: number,
  matchNumber: number,
  rounds: RoundData[]
): Promise<void> {
  const res = await context.request.post(
    `${BASE}/api/matches/${competitionId}/bracket/${bracketNumber}/match/${matchNumber}/complete`,
    {
      data: rounds,
      headers: { 'Content-Type': 'application/json' },
    }
  );
  if (!res.ok()) {
    throw new Error(`completeMatchViaApi failed: ${res.status()} ${await res.text()}`);
  }
}

/**
 * Delete a league via the API.
 */
export async function deleteLeagueViaApi(
  context: BrowserContext,
  leagueId: string
): Promise<void> {
  const res = await context.request.delete(`${BASE}/api/leagues/${leagueId}`);
  if (!res.ok()) {
    throw new Error(`deleteLeagueViaApi failed: ${res.status()} ${await res.text()}`);
  }
}

// ---------------------------------------------------------------------------
// Tournament helpers
// ---------------------------------------------------------------------------

interface CreateTournamentOptions {
  title: string;
  description: string;
  bestOf?: 1 | 3 | 5;
  members: { userId: string; displayName: string }[];
}

/**
 * Create a tournament via the API. Returns the new tournament ID.
 */
export async function createTournamentViaApi(
  context: BrowserContext,
  options: CreateTournamentOptions
): Promise<string> {
  const res = await context.request.post(`${BASE}/api/tournaments`, {
    data: {
      title: options.title,
      description: options.description,
      startDate: new Date().toISOString(),
      bestOf: options.bestOf ?? 3,
      members: options.members,
    },
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok()) {
    throw new Error(`createTournamentViaApi failed: ${res.status()} ${await res.text()}`);
  }
  const id = await res.text();
  return id;
}

/**
 * Start a tournament via the API (Planned → Active, generates bracket).
 */
export async function startTournamentViaApi(
  context: BrowserContext,
  competitionId: string
): Promise<void> {
  const res = await context.request.post(
    `${BASE}/api/tournaments/${competitionId}/start`
  );
  if (!res.ok()) {
    throw new Error(`startTournamentViaApi failed: ${res.status()} ${await res.text()}`);
  }
}

/**
 * Delete a tournament via the API.
 */
export async function deleteTournamentViaApi(
  context: BrowserContext,
  competitionId: string
): Promise<void> {
  const res = await context.request.delete(`${BASE}/api/tournaments/${competitionId}`);
  if (!res.ok()) {
    throw new Error(`deleteTournamentViaApi failed: ${res.status()} ${await res.text()}`);
  }
}

/**
 * Get tournament match details via the API.
 */
export async function getTournamentMatchViaApi(
  context: BrowserContext,
  competitionId: string,
  matchNumber: number
): Promise<MatchData> {
  const res = await context.request.get(
    `${BASE}/api/tournaments/${competitionId}/match/${matchNumber}`
  );
  if (!res.ok()) {
    throw new Error(`getTournamentMatchViaApi failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Complete a tournament match via the API.
 */
export async function completeTournamentMatchViaApi(
  context: BrowserContext,
  competitionId: string,
  matchNumber: number,
  rounds: RoundData[]
): Promise<void> {
  const res = await context.request.post(
    `${BASE}/api/tournaments/${competitionId}/match/${matchNumber}/complete`,
    {
      data: rounds,
      headers: { 'Content-Type': 'application/json' },
    }
  );
  if (!res.ok()) {
    throw new Error(`completeTournamentMatchViaApi failed: ${res.status()} ${await res.text()}`);
  }
}

// ---------------------------------------------------------------------------
// Casual helpers
// ---------------------------------------------------------------------------

interface CreateCasualMatchOptions {
  playerOneUserId: string;
  playerTwoUserId: string;
  playerOneCharacterId: string;
  playerTwoCharacterId: string;
  winnerUserId: string;
}

/**
 * Create a casual match via the API.
 */
export async function createCasualMatchViaApi(
  context: BrowserContext,
  options: CreateCasualMatchOptions
): Promise<void> {
  const res = await context.request.post(`${BASE}/api/casual`, {
    data: options,
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok()) {
    throw new Error(`createCasualMatchViaApi failed: ${res.status()} ${await res.text()}`);
  }
}

/**
 * Get casual matches via the API.
 */
export async function getCasualMatchesViaApi(
  context: BrowserContext
): Promise<MatchData[]> {
  const res = await context.request.get(`${BASE}/api/casual`);
  if (!res.ok()) {
    throw new Error(`getCasualMatchesViaApi failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Login via API and return an authenticated browser context.
 */
export async function loginAsUser(
  browser: import('@playwright/test').Browser,
  email: string,
  password: string
): Promise<BrowserContext> {
  const context = await browser.newContext({
    baseURL: BASE,
    ignoreHTTPSErrors: true,
  });
  const res = await context.request.post(`${BASE}/api/login?useCookies=true`, {
    data: { email, password },
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok()) {
    throw new Error(`loginAsUser failed: ${res.status()} ${await res.text()}`);
  }
  return context;
}
