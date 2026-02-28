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
  leagueId: string;
  split: number;
  matchNumber: number;
  winnerUserId?: string;
  playerOne: { userId: string; displayName: string };
  playerTwo: { userId: string; displayName: string };
  rounds: RoundData[];
}

interface RoundData {
  leagueId: string;
  split: number;
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
  leagueId: string,
  split: number,
  matchNumber: number
): Promise<MatchData> {
  const res = await context.request.get(
    `${BASE}/api/matches/${leagueId}/split/${split}/match/${matchNumber}`
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
  leagueId: string,
  split: number,
  matchNumber: number,
  rounds: RoundData[]
): Promise<void> {
  const res = await context.request.post(
    `${BASE}/api/matches/${leagueId}/split/${split}/match/${matchNumber}/complete`,
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
