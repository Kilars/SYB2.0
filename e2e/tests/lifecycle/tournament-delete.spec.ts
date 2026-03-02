/**
 * Tournament delete: create → cancel delete → confirm delete → verify removed.
 *
 * Uses API setup for tournament creation.
 */

import { test, expect } from '../fixtures.js';
import { BracketViewPage } from '../page-objects/bracket-view.page.js';
import { createTournamentViaApi } from '../helpers/api-helpers.js';
import { FOUR_PLAYERS, uniqueTournamentName } from '../helpers/test-data.js';

let tournamentName: string;
let tournamentId: string;

test.describe('Tournament Delete', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    tournamentName = uniqueTournamentName('delete');
    const context = await browser.newContext({
      storageState: './storage/auth-state.json',
    });
    tournamentId = await createTournamentViaApi(context, {
      title: tournamentName,
      description: 'Delete test tournament',
      members: FOUR_PLAYERS,
    });
    await context.close();
  });

  test('cancel delete keeps tournament', async ({ page, pageErrors }) => {
    await page.goto(`/tournaments/${tournamentId}`);
    const bracket = new BracketViewPage(page);
    await bracket.expectTitle(tournamentName);

    // Click Delete, then Cancel
    await bracket.clickDelete();

    // Dialog should mention the tournament title
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText(tournamentName)).toBeVisible();

    await bracket.cancelDelete();

    // Still on bracket view — tournament exists
    await bracket.expectTitle(tournamentName);

    expect(pageErrors).toEqual([]);
  });

  test('confirm delete removes tournament', async ({ page, pageErrors }) => {
    await page.goto(`/tournaments/${tournamentId}`);
    const bracket = new BracketViewPage(page);
    await bracket.expectTitle(tournamentName);

    // Click Delete, then confirm
    await bracket.clickDelete();
    await bracket.confirmDelete();

    // Should redirect to tournament list
    await page.waitForURL(/\/tournaments$/, { timeout: 15000 });

    // Success toast
    await expect(page.getByText(/deleted/i)).toBeVisible({ timeout: 10000 });

    // Tournament should NOT appear in the list
    await expect(page.getByText(tournamentName)).not.toBeVisible({ timeout: 5000 });

    expect(pageErrors).toEqual([]);
  });
});
