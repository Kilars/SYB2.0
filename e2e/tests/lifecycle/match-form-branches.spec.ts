/**
 * Match form branch coverage — task 047
 *
 * Specifically covers the decided-early branch (round 3 disabled after rounds 1+2
 * have the same winner). The other 4 branches in the spec are already covered:
 *
 *  Branch 1 — 2-0 flawless:           league-lifecycle.spec.ts ("register match with 2-0 result")
 *  Branch 2 — 2-1 non-flawless:       league-lifecycle.spec.ts ("register second match with 2-1 result")
 *                                      and flawless-bonus.spec.ts ("register 2-1 match — no flawless bonus")
 *  Branch 4 — Reopen completed match: flawless-bonus.spec.ts ("reopen match")
 *  Branch 5 — Re-edit reopened match: flawless-bonus.spec.ts ("re-register as 2-0 — flawless bonus applied")
 *
 * This file adds only the missing branch:
 *  Branch 3 — Decided-early: once 2 rounds are won by the same player, round 3 shows
 *             "Match already decided" and the submit button becomes available.
 *
 * Setup: League created and started via API for speed.
 */

import { test, expect } from '../fixtures.js';
import { MatchFormPage } from '../page-objects/match-form.page.js';
import {
  createLeagueViaApi,
  changeStatusViaApi,
  getMatchViaApi,
} from '../helpers/api-helpers.js';
import { THREE_PLAYERS, CHARACTERS, uniqueLeagueName } from '../helpers/test-data.js';
import { STORAGE_PATH } from '../../global-setup.js';

let leagueId: string;
let matchUrl: string;

test.describe('Match Form — Decided-Early Branch', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: STORAGE_PATH });
    const title = uniqueLeagueName('decided-early');
    leagueId = await createLeagueViaApi(ctx, {
      title,
      description: 'E2E decided-early branch test (task 047)',
      members: THREE_PLAYERS.map((p) => ({ userId: p.userId, displayName: p.displayName })),
    });
    await changeStatusViaApi(ctx, leagueId, 1);

    // Use match 1 of bracket 1
    await getMatchViaApi(ctx, leagueId, 1, 1);
    matchUrl = `/leagues/${leagueId}/bracket/1/match/1`;

    await ctx.close();
  });

  test('round 3 shows "Match already decided" after same player wins rounds 1 and 2', async ({
    page,
    pageErrors,
  }) => {
    const matchForm = new MatchFormPage(page);

    await page.goto(matchUrl);
    await matchForm.waitForForm();

    // Fill rounds 1 and 2 both won by P1 → match is decided after round 2
    await matchForm.fillRound(1, CHARACTERS.wolf.fullName, CHARACTERS.yoshi.fullName, 'p1');
    await matchForm.fillRound(2, CHARACTERS.yoshi.fullName, CHARACTERS.wolf.fullName, 'p1');

    // Round 3 card should display "Match already decided" text
    await expect(page.getByText(/match already decided/i)).toBeVisible({ timeout: 5000 });

    // The Complete Match button should now be active (not the grey "Fill in rounds" variant)
    const completeBtn = page.getByRole('button', { name: /complete match/i });
    await expect(completeBtn).toBeVisible({ timeout: 5000 });
    await expect(completeBtn).not.toBeDisabled();

    expect(pageErrors).toEqual([]);
  });

  test('submitting a decided-early match completes it and shows reopen button', async ({
    page,
    pageErrors,
  }) => {
    const matchForm = new MatchFormPage(page);

    await page.goto(matchUrl);
    await matchForm.waitForForm();

    // P1 wins both rounds → decided after round 2
    await matchForm.fillRound(1, CHARACTERS.wolf.fullName, CHARACTERS.yoshi.fullName, 'p1');
    await matchForm.fillRound(2, CHARACTERS.yoshi.fullName, CHARACTERS.wolf.fullName, 'p1');

    // Complete the match without filling round 3
    await matchForm.clickComplete();

    // After completion the view flips to MatchDetailsView (reopen button appears)
    await expect(page.getByRole('button', { name: /reopen match/i })).toBeVisible({
      timeout: 10000,
    });

    expect(pageErrors).toEqual([]);
  });
});
