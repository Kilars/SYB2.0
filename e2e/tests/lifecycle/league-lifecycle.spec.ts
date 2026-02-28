/**
 * Full league lifecycle: Create → Start → Register matches → Leaderboard → Stats
 *
 * This test creates a league entirely via the UI (no API shortcuts)
 * to validate the complete user journey.
 */

import { test, expect } from '../fixtures.js';
import { LeagueFormPage } from '../page-objects/league-form.page.js';
import { MatchFormPage } from '../page-objects/match-form.page.js';
import { LeaderboardPage } from '../page-objects/leaderboard.page.js';
import { StatusButtonPage } from '../page-objects/status-button.page.js';
import { THREE_PLAYERS, CHARACTERS, uniqueLeagueName } from '../helpers/test-data.js';

// Shared state across serial tests
let leagueName: string;
let leagueId: string;

test.describe('League Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(() => {
    leagueName = uniqueLeagueName('lifecycle');
  });

  test('create league with 3 players via UI', async ({ page, pageErrors }) => {
    const form = new LeagueFormPage(page);

    await page.goto('/createLeague');
    await form.expectHeading('Create');

    await form.fillTitle(leagueName);
    await form.fillDescription('E2E lifecycle test league');

    // Add the other 2 players (denix is auto-added as creator)
    await form.addMember(THREE_PLAYERS[1].displayName); // Hansemann
    await form.addMember(THREE_PLAYERS[2].displayName); // Larsski

    await form.clickCreate();

    // After create, app navigates to /leagues/{id} (which 404s — no tab route).
    // Extract the league ID from the URL.
    await page.waitForURL(/\/leagues\/[^/]+$/, { timeout: 15000 });
    const url = page.url();
    leagueId = url.split('/leagues/')[1];

    // Navigate to the description tab to verify league was created
    await page.goto(`/leagues/${leagueId}/description`);
    await expect(page.getByText(leagueName)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/planned/i)).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('start league generates correct match count', async ({ page, pageErrors }) => {
    const status = new StatusButtonPage(page);

    // Navigate to leaderboard tab (where admin controls are)
    await page.goto(`/leagues/${leagueId}/leaderboard`);

    const leaderboard = new LeaderboardPage(page);
    await leaderboard.waitForTable();

    // Start the league
    await status.clickStartLeague();

    // Wait for status to change — "Set league to planning phase" button appears
    await status.expectRevertVisible();

    // Navigate to matches tab
    await page.getByRole('tab', { name: /matches/i }).click();
    await page.waitForURL(/\/matches/, { timeout: 5000 });

    // 3 players → n*(n-1) = 3*2 = 6 matches (2 splits)
    const cards = page.locator('[class*="MuiCard"]');
    await expect(cards).toHaveCount(6, { timeout: 15000 });

    expect(pageErrors).toEqual([]);
  });

  test('register match with 2-0 result (flawless)', async ({ page, pageErrors }) => {
    const matchForm = new MatchFormPage(page);

    // Navigate to matches tab
    await page.goto(`/leagues/${leagueId}/matches`);

    // Wait for match cards and click first "Register" button
    await expect(page.getByRole('button', { name: /register/i }).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /register/i }).first().click();
    await page.waitForURL(/\/split\//, { timeout: 10000 });

    await matchForm.waitForForm();

    // P1 wins Round 1 and Round 2 (flawless 2-0)
    await matchForm.fillRound(1, CHARACTERS.wolf.fullName, CHARACTERS.yoshi.fullName, 'p1');
    await matchForm.fillRound(2, CHARACTERS.yoshi.fullName, CHARACTERS.wolf.fullName, 'p1');

    await matchForm.clickComplete();

    // Wait for success toast
    await expect(page.getByText(/succes/i)).toBeVisible({ timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });

  test('leaderboard reflects registered match', async ({ page, pageErrors }) => {
    const leaderboard = new LeaderboardPage(page);

    await page.goto(`/leagues/${leagueId}/leaderboard`);
    await leaderboard.waitForTable();

    // Leaderboard only shows players with completed matches (2 after 1 match)
    const rowCount = await leaderboard.getRowCount();
    expect(rowCount).toBe(2);

    // First data row (sorted by points) should have 5 points (4 win + 1 flawless)
    const firstDataRow = page.getByRole('row').nth(1);
    const pointsText = await firstDataRow.getByRole('cell').nth(1).textContent();
    expect(parseInt(pointsText?.trim() ?? '0', 10)).toBe(5);

    expect(pageErrors).toEqual([]);
  });

  test('register second match with 2-1 result', async ({ page, pageErrors }) => {
    const matchForm = new MatchFormPage(page);

    await page.goto(`/leagues/${leagueId}/matches`);

    // Click a "Register" button (skip any completed matches)
    await expect(page.getByRole('button', { name: /register/i }).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /register/i }).first().click();
    await page.waitForURL(/\/split\//, { timeout: 10000 });

    await matchForm.waitForForm();

    // 2-1 result: P1 wins R1, P2 wins R2, P1 wins R3
    await matchForm.fillRound(1, CHARACTERS.wolf.fullName, CHARACTERS.wario.fullName, 'p1');
    await matchForm.fillRound(2, CHARACTERS.wolf.fullName, CHARACTERS.sora.fullName, 'p2');
    await matchForm.fillRound(3, CHARACTERS.yoshi.fullName, CHARACTERS.yoshi.fullName, 'p1');

    await matchForm.clickComplete();

    await expect(page.getByText(/succes/i)).toBeVisible({ timeout: 10000 });

    // Verify leaderboard sorts by points
    await page.goto(`/leagues/${leagueId}/leaderboard`);
    const leaderboard = new LeaderboardPage(page);
    await leaderboard.waitForTable();

    // First row should be highest-scoring player
    const firstDataRow = page.getByRole('row').nth(1);
    const pointsText = await firstDataRow.getByRole('cell').nth(1).textContent();
    expect(parseInt(pointsText?.trim() ?? '0', 10)).toBeGreaterThanOrEqual(4);

    expect(pageErrors).toEqual([]);
  });

  test('stats page renders after matches', async ({ page, pageErrors }) => {
    await page.goto(`/leagues/${leagueId}/stats`);

    // Stats page should render (structure verification)
    await expect(page.locator('body')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
