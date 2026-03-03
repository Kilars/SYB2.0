/**
 * Tournament match reopen: complete a semifinal → reopen it → re-register
 * with a different result.
 *
 * Uses API setup for tournament creation + start.
 */

import { test, expect } from '../fixtures.js';
import { BracketViewPage } from '../page-objects/bracket-view.page.js';
import { TournamentMatchPage } from '../page-objects/tournament-match.page.js';
import { createTournamentViaApi, startTournamentViaApi } from '../helpers/api-helpers.js';
import { FOUR_PLAYERS, CHARACTERS, uniqueTournamentName } from '../helpers/test-data.js';

let tournamentId: string;
let semifinals: {
  match1: { p1: string; p2: string };
  match2: { p1: string; p2: string };
};

test.describe('Tournament Reopen', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: './storage/auth-state.json',
    });
    const name = uniqueTournamentName('reopen');
    tournamentId = await createTournamentViaApi(context, {
      title: name,
      description: 'Reopen test tournament',
      members: FOUR_PLAYERS,
    });
    await startTournamentViaApi(context, tournamentId);
    await context.close();
  });

  test('complete semifinal 1 with p1 winning', async ({ page, pageErrors }) => {
    await page.goto(`/tournaments/${tournamentId}`);
    const bracket = new BracketViewPage(page);
    await bracket.waitForBracket();

    semifinals = await bracket.getSemifinalists();
    await bracket.clickMatchCard(semifinals.match1.p1);
    await page.waitForURL(/\/tournaments\/[^/]+\/bracket\/\d+\/match\/\d+/, { timeout: 10000 });

    const matchPage = new TournamentMatchPage(page);
    await matchPage.waitForForm();

    // P1 wins 2-0
    await matchPage.fillRound(1, CHARACTERS.wolf.fullName, CHARACTERS.yoshi.fullName, 'p1');
    await matchPage.fillRound(2, CHARACTERS.zelda.fullName, CHARACTERS.wario.fullName, 'p1');
    await matchPage.clickComplete();

    await matchPage.expectCompleted();
    await matchPage.clickBackToBracket();
    await page.waitForURL(/\/tournaments\/[^/]+$/, { timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });

  test('reopen completed semifinal', async ({ page, pageErrors }) => {
    await page.goto(`/tournaments/${tournamentId}`);
    const bracket = new BracketViewPage(page);
    await bracket.waitForBracket();

    // Click the completed semifinal match card
    await bracket.clickMatchCard(semifinals.match1.p1);
    await page.waitForURL(/\/tournaments\/[^/]+\/bracket\/\d+\/match\/\d+/, { timeout: 10000 });

    const matchPage = new TournamentMatchPage(page);
    await matchPage.waitForForm();
    await matchPage.expectCompleted();

    // Reopen the match — no toast, just switches to form view
    await matchPage.clickReopen();
    await matchPage.expectRegisterForm();

    expect(pageErrors).toEqual([]);
  });

  test('re-register match with different result (p2 wins)', async ({ page, pageErrors }) => {
    // Already on the match details page from the previous test's page state
    // but serial tests get fresh pages, so navigate again
    await page.goto(`/tournaments/${tournamentId}`);
    const bracket = new BracketViewPage(page);
    await bracket.waitForBracket();

    await bracket.clickMatchCard(semifinals.match1.p1);
    await page.waitForURL(/\/tournaments\/[^/]+\/bracket\/\d+\/match\/\d+/, { timeout: 10000 });

    const matchPage = new TournamentMatchPage(page);
    await matchPage.waitForForm();

    // Clear existing round data and re-register with P2 winning
    await matchPage.clearRound(1);
    await matchPage.clearRound(2);

    await matchPage.fillRound(1, CHARACTERS.sora.fullName, CHARACTERS.joker.fullName, 'p2');
    await matchPage.fillRound(2, CHARACTERS.wolf.fullName, CHARACTERS.wario.fullName, 'p2');
    await matchPage.clickComplete();

    await matchPage.expectCompleted();

    expect(pageErrors).toEqual([]);
  });
});
