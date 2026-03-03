/**
 * Tournament list page rendering and bracket navigation.
 * Uses API setup — the navigation itself is what we're testing.
 */

import { test, expect } from './fixtures.js';
import { BracketViewPage } from './page-objects/bracket-view.page.js';
import { createTournamentViaApi, startTournamentViaApi } from './helpers/api-helpers.js';
import { FOUR_PLAYERS, uniqueTournamentName } from './helpers/test-data.js';

let tournamentName: string;
let tournamentId: string;

test.describe('Tournament Navigation', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    tournamentName = uniqueTournamentName('nav');
    const context = await browser.newContext({
      storageState: './storage/auth-state.json',
    });
    tournamentId = await createTournamentViaApi(context, {
      title: tournamentName,
      description: 'Navigation test tournament',
      members: FOUR_PLAYERS,
    });
    await context.close();
  });

  test('tournament list shows created tournament', async ({ page, pageErrors }) => {
    await page.goto('/tournaments');
    await expect(page.getByText(tournamentName)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Planned', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('4 players').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /view bracket/i }).first()).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('clicking View Bracket navigates to bracket view', async ({ page, pageErrors }) => {
    await page.goto('/tournaments');
    // Find the card for our tournament and click View Bracket
    const card = page.locator('[role="article"]').filter({ hasText: tournamentName });
    await card.getByRole('button', { name: /view bracket/i }).click();

    await page.waitForURL(/\/tournaments\//, { timeout: 10000 });
    expect(page.url()).toContain(`/tournaments/${tournamentId}`);

    const bracket = new BracketViewPage(page);
    await bracket.expectTitle(tournamentName);
    await bracket.expectStatus('Planned');
    await bracket.expectPlayerCount(4);

    // Verify member chips visible in planned state
    for (const player of FOUR_PLAYERS) {
      await bracket.expectMemberChip(player.displayName);
    }
    expect(pageErrors).toEqual([]);
  });

  test('bracket view shows round headings after start', async ({ page, pageErrors }) => {
    // Start tournament via API first
    const context = page.context();
    await startTournamentViaApi(context, tournamentId);

    await page.goto(`/tournaments/${tournamentId}`);
    const bracket = new BracketViewPage(page);
    await bracket.waitForBracket();

    await bracket.expectStatus('Active');
    await expect(page.getByText('Semifinals')).toBeVisible();
    await expect(page.getByText('Final', { exact: true })).toBeVisible();

    // 4-player bracket: 2 semis + 1 final = 3 cards
    const count = await bracket.getMatchCardCount();
    expect(count).toBe(3);
    expect(pageErrors).toEqual([]);
  });

  test('clicking match card navigates to match details', async ({ page, pageErrors }) => {
    await page.goto(`/tournaments/${tournamentId}`);
    const bracket = new BracketViewPage(page);
    await bracket.waitForBracket();

    // Get a semifinal player to click on
    const semis = await bracket.getSemifinalists();
    await bracket.clickMatchCard(semis.match1.p1);

    await page.waitForURL(/\/tournaments\/[^/]+\/bracket\/\d+\/match\/\d+/, { timeout: 10000 });
    await expect(
      page.getByRole('heading', { name: /register match result/i })
    ).toBeVisible({ timeout: 15000 });

    // Both player names should be in the score header
    await expect(page.getByRole('heading', { level: 5, name: semis.match1.p1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 5, name: semis.match1.p2 })).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});
