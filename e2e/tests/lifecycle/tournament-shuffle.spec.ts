/**
 * Tournament bracket shuffle: verify re-shuffling works before matches,
 * and shuffle button disappears after a match is completed.
 *
 * Uses API setup for tournament creation + start.
 */

import { test, expect } from '../fixtures.js';
import { BracketViewPage } from '../page-objects/bracket-view.page.js';
import { TournamentMatchPage } from '../page-objects/tournament-match.page.js';
import { createTournamentViaApi, startTournamentViaApi } from '../helpers/api-helpers.js';
import { FOUR_PLAYERS, CHARACTERS, uniqueTournamentName } from '../helpers/test-data.js';

let tournamentId: string;

test.describe('Tournament Shuffle', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: './storage/auth-state.json',
    });
    const name = uniqueTournamentName('shuffle');
    tournamentId = await createTournamentViaApi(context, {
      title: name,
      description: 'Shuffle test tournament',
      members: FOUR_PLAYERS,
    });
    await startTournamentViaApi(context, tournamentId);
    await context.close();
  });

  test('shuffle button visible when no matches completed', async ({ page, pageErrors }) => {
    await page.goto(`/tournaments/${tournamentId}`);
    const bracket = new BracketViewPage(page);
    await bracket.waitForBracket();

    await expect(
      page.getByRole('button', { name: /shuffle bracket/i })
    ).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('shuffle reseeds the bracket', async ({ page, pageErrors }) => {
    await page.goto(`/tournaments/${tournamentId}`);
    const bracket = new BracketViewPage(page);
    await bracket.waitForBracket();

    // Read initial assignments
    const initial = await bracket.getSemifinalists();

    // Shuffle
    await bracket.clickShuffleBracket();

    // Bracket should still have 3 match cards (structure preserved)
    const count = await bracket.getMatchCardCount();
    expect(count).toBe(3);

    // Read new assignments — may or may not differ (random),
    // but the operation should succeed without error
    const shuffled = await bracket.getSemifinalists();
    expect(shuffled.match1.p1).toBeTruthy();
    expect(shuffled.match1.p2).toBeTruthy();
    expect(shuffled.match2.p1).toBeTruthy();
    expect(shuffled.match2.p2).toBeTruthy();

    expect(pageErrors).toEqual([]);
  });

  test('shuffle button hidden after completing a match', async ({ page, pageErrors }) => {
    await page.goto(`/tournaments/${tournamentId}`);
    const bracket = new BracketViewPage(page);
    await bracket.waitForBracket();

    // Complete a semifinal match via UI
    const semis = await bracket.getSemifinalists();
    await bracket.clickMatchCard(semis.match1.p1);
    await page.waitForURL(/\/tournaments\/[^/]+\/bracket\/\d+\/match\/\d+/, { timeout: 10000 });

    const matchPage = new TournamentMatchPage(page);
    await matchPage.waitForForm();
    await matchPage.fillRound(1, CHARACTERS.wolf.fullName, CHARACTERS.yoshi.fullName, 'p1');
    await matchPage.fillRound(2, CHARACTERS.zelda.fullName, CHARACTERS.wario.fullName, 'p1');
    await matchPage.clickComplete();
    await matchPage.expectCompleted();

    await matchPage.clickBackToBracket();
    await page.waitForURL(/\/tournaments\/[^/]+$/, { timeout: 10000 });

    // Shuffle button should be gone
    await bracket.expectShuffleNotVisible();

    expect(pageErrors).toEqual([]);
  });
});
