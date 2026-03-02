/**
 * Full tournament lifecycle: Create → Start → Complete all matches → Winner declared.
 *
 * This is the ONE test that creates a tournament via the UI to validate
 * the complete user journey. All other tournament tests use API setup.
 */

import { test, expect } from '../fixtures.js';
import { TournamentFormPage } from '../page-objects/tournament-form.page.js';
import { BracketViewPage } from '../page-objects/bracket-view.page.js';
import { TournamentMatchPage } from '../page-objects/tournament-match.page.js';
import { FOUR_PLAYERS, CHARACTERS, uniqueTournamentName } from '../helpers/test-data.js';

// Shared state across serial tests
let tournamentName: string;
let tournamentId: string;
let semifinals: {
  match1: { p1: string; p2: string };
  match2: { p1: string; p2: string };
};
let semifinal1Winner: string;
let semifinal2Winner: string;

test.describe('Tournament Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(() => {
    tournamentName = uniqueTournamentName('lifecycle');
  });

  test('create tournament with 4 players via UI', async ({ page, pageErrors }) => {
    const form = new TournamentFormPage(page);

    await page.goto('/createTournament');
    await form.expectHeading();

    await form.fillTitle(tournamentName);
    await form.fillDescription('E2E lifecycle test tournament');
    await form.selectBestOf(3);

    // Add 3 members (denix is auto-added as creator)
    await form.addMember(FOUR_PLAYERS[1].displayName); // Hansemann
    await form.addMember(FOUR_PLAYERS[2].displayName); // Larsski
    await form.addMember(FOUR_PLAYERS[3].displayName); // Matias

    await form.clickCreate();

    // After create, app navigates to /tournaments/{id}
    await page.waitForURL(/\/tournaments\/[^/]+$/, { timeout: 15000 });
    const url = page.url();
    tournamentId = url.split('/tournaments/')[1];

    const bracket = new BracketViewPage(page);
    await bracket.expectTitle(tournamentName);
    await bracket.expectStatus('Planned');

    expect(pageErrors).toEqual([]);
  });

  test('start tournament generates bracket', async ({ page, pageErrors }) => {
    await page.goto(`/tournaments/${tournamentId}`);
    const bracket = new BracketViewPage(page);
    await bracket.expectTitle(tournamentName);

    await bracket.clickStartTournament();

    await expect(page.getByText('Semifinals')).toBeVisible();
    await expect(page.getByText('Final', { exact: true })).toBeVisible();

    const count = await bracket.getMatchCardCount();
    expect(count).toBe(3);

    // Read dynamic semifinal assignments
    semifinals = await bracket.getSemifinalists();
    expect(semifinals.match1.p1).toBeTruthy();
    expect(semifinals.match1.p2).toBeTruthy();
    expect(semifinals.match2.p1).toBeTruthy();
    expect(semifinals.match2.p2).toBeTruthy();

    expect(pageErrors).toEqual([]);
  });

  test('complete semifinal 1 with 2-0 result', async ({ page, pageErrors }) => {
    await page.goto(`/tournaments/${tournamentId}`);
    const bracket = new BracketViewPage(page);
    await bracket.waitForBracket();

    await bracket.clickMatchCard(semifinals.match1.p1);
    await page.waitForURL(/\/match\//, { timeout: 10000 });

    const matchPage = new TournamentMatchPage(page);
    await matchPage.waitForForm();

    // P1 wins rounds 1 and 2 (2-0)
    await matchPage.fillRound(1, CHARACTERS.wolf.fullName, CHARACTERS.yoshi.fullName, 'p1');
    await matchPage.fillRound(2, CHARACTERS.zelda.fullName, CHARACTERS.wario.fullName, 'p1');
    await matchPage.clickComplete();

    await expect(page.getByText(/succes/i)).toBeVisible({ timeout: 10000 });
    semifinal1Winner = semifinals.match1.p1;

    await matchPage.clickBackToBracket();
    await page.waitForURL(/\/tournaments\/[^/]+$/, { timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });

  test('complete semifinal 2 with 2-1 result', async ({ page, pageErrors }) => {
    await page.goto(`/tournaments/${tournamentId}`);
    const bracket = new BracketViewPage(page);
    await bracket.waitForBracket();

    await bracket.clickMatchCard(semifinals.match2.p1);
    await page.waitForURL(/\/match\//, { timeout: 10000 });

    const matchPage = new TournamentMatchPage(page);
    await matchPage.waitForForm();

    // 2-1 result: P1 wins R1, P2 wins R2, P1 wins R3
    await matchPage.fillRound(1, CHARACTERS.sora.fullName, CHARACTERS.joker.fullName, 'p1');
    await matchPage.fillRound(2, CHARACTERS.wolf.fullName, CHARACTERS.yoshi.fullName, 'p2');
    await matchPage.fillRound(3, CHARACTERS.zelda.fullName, CHARACTERS.wario.fullName, 'p1');
    await matchPage.clickComplete();

    await expect(page.getByText(/succes/i)).toBeVisible({ timeout: 10000 });
    semifinal2Winner = semifinals.match2.p1;

    await matchPage.clickBackToBracket();
    await page.waitForURL(/\/tournaments\/[^/]+$/, { timeout: 10000 });

    // Final match card should now show both finalists (not TBD)
    const bracket2 = new BracketViewPage(page);
    await bracket2.waitForBracket();
    const finalists = await bracket2.getFinalists();
    expect(finalists.p1).not.toBe('TBD');
    expect(finalists.p2).not.toBe('TBD');

    expect(pageErrors).toEqual([]);
  });

  test('complete final — tournament winner declared', async ({ page, pageErrors }) => {
    await page.goto(`/tournaments/${tournamentId}`);
    const bracket = new BracketViewPage(page);
    await bracket.waitForBracket();

    // Click the final match card (last card in the bracket)
    await bracket.clickFinalCard();
    await page.waitForURL(/\/match\//, { timeout: 10000 });

    const matchPage = new TournamentMatchPage(page);
    await matchPage.waitForForm();

    // 2-0 finish
    await matchPage.fillRound(1, CHARACTERS.wolf.fullName, CHARACTERS.sora.fullName, 'p1');
    await matchPage.fillRound(2, CHARACTERS.yoshi.fullName, CHARACTERS.joker.fullName, 'p1');
    await matchPage.clickComplete();

    await expect(page.getByText(/succes/i)).toBeVisible({ timeout: 10000 });

    await matchPage.clickBackToBracket();
    await page.waitForURL(/\/tournaments\/[^/]+$/, { timeout: 10000 });

    // Winner banner and Complete status
    const finalBracket = new BracketViewPage(page);
    await finalBracket.waitForBracket();
    const finalists = await finalBracket.getFinalists();
    await finalBracket.expectWinnerBanner(finalists.p1);
    await finalBracket.expectStatus('Complete');

    expect(pageErrors).toEqual([]);
  });
});
