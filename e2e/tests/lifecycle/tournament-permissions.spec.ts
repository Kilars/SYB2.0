/**
 * Tournament permissions: admin (denix) sees admin controls,
 * non-admin member (hansemann) does not.
 *
 * Uses API setup for tournament creation + start.
 */

import { test, expect } from '../fixtures.js';
import { BracketViewPage } from '../page-objects/bracket-view.page.js';
import { createTournamentViaApi, startTournamentViaApi, loginAsUser } from '../helpers/api-helpers.js';
import { FOUR_PLAYERS, PASSWORD, uniqueTournamentName, USERS } from '../helpers/test-data.js';

let tournamentId: string;

test.describe('Tournament Permissions', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: './storage/auth-state.json',
    });
    const name = uniqueTournamentName('perms');
    tournamentId = await createTournamentViaApi(context, {
      title: name,
      description: 'Permissions test tournament',
      members: FOUR_PLAYERS,
    });
    await startTournamentViaApi(context, tournamentId);
    await context.close();
  });

  test('admin sees Shuffle and Delete buttons', async ({ page, pageErrors }) => {
    await page.goto(`/tournaments/${tournamentId}`);
    const bracket = new BracketViewPage(page);
    await bracket.waitForBracket();

    // Admin (denix) should see shuffle (no matches completed) and delete
    await expect(
      page.getByRole('button', { name: /shuffle bracket/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^delete$/i })
    ).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('non-admin member cannot see admin controls', async ({ browser }) => {
    // Login as hansemann (non-admin member)
    const hansemannCtx = await loginAsUser(browser, USERS.hansemann.email, PASSWORD);
    const page = await hansemannCtx.newPage();

    await page.goto(`http://localhost:3000/tournaments/${tournamentId}`);
    const bracket = new BracketViewPage(page);
    await bracket.waitForBracket();

    // Non-admin should NOT see admin buttons
    await bracket.expectShuffleNotVisible();
    await bracket.expectDeleteNotVisible();

    await page.close();
    await hansemannCtx.close();
  });

  test('non-admin can view bracket content', async ({ browser }) => {
    const hansemannCtx = await loginAsUser(browser, USERS.hansemann.email, PASSWORD);
    const page = await hansemannCtx.newPage();

    await page.goto(`http://localhost:3000/tournaments/${tournamentId}`);
    const bracket = new BracketViewPage(page);
    await bracket.waitForBracket();

    // Can see bracket structure
    await bracket.expectStatus('Active');
    await expect(page.getByText('Semifinals')).toBeVisible();
    await expect(page.getByText('Final')).toBeVisible();

    // Can click a match card and see match details
    const semis = await bracket.getSemifinalists();
    await bracket.clickMatchCard(semis.match1.p1);
    await page.waitForURL(/\/match\//, { timeout: 10000 });
    await expect(
      page.getByRole('heading', { name: /match result/i })
    ).toBeVisible({ timeout: 15000 });

    await page.close();
    await hansemannCtx.close();
  });
});
