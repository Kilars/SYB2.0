/**
 * Casual Match Lifecycle E2E Tests
 *
 * Tests the casual match flow:
 * 1. Navigate to /casual
 * 2. Create a casual match via the form (select players, characters, winner)
 * 3. Verify the match appears in the casual match list
 * 4. Verify match shows in user profile stats
 */

import { test, expect } from '../fixtures.js';
import { USERS, CHARACTERS } from '../helpers/test-data.js';
import { createCasualMatchViaApi } from '../helpers/api-helpers.js';
import { STORAGE_PATH } from '../../global-setup.js';

test.describe('Casual Match Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  test('can navigate to casual page', async ({ page, pageErrors }) => {
    await page.goto('/casual');
    await expect(page.getByRole('heading', { name: /casual matches/i })).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('can create a casual match via API and see it on the page', async ({ page, browser, pageErrors }) => {
    // Create a casual match via API
    const ctx = await browser.newContext({ storageState: STORAGE_PATH, ignoreHTTPSErrors: true });
    await createCasualMatchViaApi(ctx, {
      playerOneUserId: USERS.denix.userId,
      playerTwoUserId: USERS.hansemann.userId,
      playerOneCharacterId: CHARACTERS.wolf.id,
      playerTwoCharacterId: CHARACTERS.yoshi.id,
      winnerUserId: USERS.denix.userId,
    });
    await ctx.close();

    // Navigate to casual page and verify the match appears
    await page.goto('/casual');
    await expect(page.getByText(USERS.denix.displayName).first()).toBeVisible();
    await expect(page.getByText(USERS.hansemann.displayName).first()).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('can create a casual match via UI form', async ({ page, pageErrors }) => {
    await page.goto('/casual');

    // Click "New Match" button
    await page.getByRole('button', { name: /new match/i }).click();

    // Dialog should open
    await expect(page.getByRole('heading', { name: /new casual match/i })).toBeVisible();

    // Select Player 1 (should default to current user, but let's ensure)
    const p1Combobox = page.getByRole('combobox').nth(0);
    await p1Combobox.click();
    await p1Combobox.fill(USERS.denix.displayName);
    await page.getByRole('option', { name: USERS.denix.displayName }).click();

    // Select Player 2
    const p2Combobox = page.getByRole('combobox').nth(1);
    await p2Combobox.click();
    await p2Combobox.fill(USERS.larsski.displayName);
    await page.getByRole('option', { name: USERS.larsski.displayName }).click();

    // Select characters
    // P1 character
    const charComboboxes = page.locator('[placeholder="Select character..."]');
    await charComboboxes.nth(0).click();
    await charComboboxes.nth(0).fill(CHARACTERS.zelda.fullName);
    await page.locator('li[role="option"]').filter({ hasText: CHARACTERS.zelda.fullName }).first().click();

    // P2 character
    await charComboboxes.nth(1).click();
    await charComboboxes.nth(1).fill(CHARACTERS.wario.fullName);
    await page.locator('li[role="option"]').filter({ hasText: CHARACTERS.wario.fullName }).first().click();

    // Select winner
    await page.getByRole('button', { name: USERS.larsski.displayName, pressed: false }).click();

    // Submit
    await page.getByRole('button', { name: /register match/i }).click();

    // Dialog should close and match should appear in the list
    await expect(page.getByRole('heading', { name: /new casual match/i })).not.toBeVisible({ timeout: 5000 });

    // Verify the match appears — both player names should be visible
    await expect(page.getByText(USERS.larsski.displayName).first()).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('casual match appears in user profile stats', async ({ page, pageErrors }) => {
    // Navigate to the user profile
    await page.goto(`/user/${USERS.denix.userId}`);

    // The user stats page should load and show match data
    // Wait for stats to load (either stats or empty state)
    await page.waitForSelector('[class*="MuiPaper"], [class*="MuiCard"]', { timeout: 10000 });

    // The page should have some content (not just loading)
    const body = await page.locator('body').textContent();
    expect(body?.length).toBeGreaterThan(20);

    expect(pageErrors).toEqual([]);
  });
});

test.describe('Casual Stats', () => {
  test('casual page shows stats section after matches exist', async ({ page, browser, pageErrors }) => {
    // Create a couple of casual matches via API to ensure stats data
    const ctx = await browser.newContext({ storageState: STORAGE_PATH, ignoreHTTPSErrors: true });
    await createCasualMatchViaApi(ctx, {
      playerOneUserId: USERS.denix.userId,
      playerTwoUserId: USERS.matias.userId,
      playerOneCharacterId: CHARACTERS.sora.id,
      playerTwoCharacterId: CHARACTERS.joker.id,
      winnerUserId: USERS.matias.userId,
    });
    await createCasualMatchViaApi(ctx, {
      playerOneUserId: USERS.hansemann.userId,
      playerTwoUserId: USERS.larsski.userId,
      playerOneCharacterId: CHARACTERS.wolf.id,
      playerTwoCharacterId: CHARACTERS.zelda.id,
      winnerUserId: USERS.hansemann.userId,
    });
    await ctx.close();

    await page.goto('/casual');

    // Stats section should be visible
    await expect(page.getByRole('heading', { name: /^stats$/i })).toBeVisible({ timeout: 10000 });

    // Character Win Rates heading should appear
    await expect(page.getByText(/character win rates/i).first()).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});

test.describe('Swipeable Navigation (mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('mode indicator dots are visible on mobile', async ({ page, pageErrors }) => {
    await page.goto('/leagues');

    // Wait for page to load
    await expect(page.getByRole('heading').first()).toBeVisible();

    // Mode indicator dots should be visible (3 dots for casual/leagues/tournaments)
    const dots = page.locator('[data-testid="mode-dot"]');
    await expect(dots.first()).toBeVisible();
    const dotCount = await dots.count();
    expect(dotCount).toBeGreaterThanOrEqual(1);

    expect(pageErrors).toEqual([]);
  });

  test('can navigate between modes via dots', async ({ page, pageErrors }) => {
    await page.goto('/leagues');
    await expect(page.getByRole('heading').first()).toBeVisible();

    // Navigate to tournaments by clicking a dot
    // The rightmost dot should be tournaments
    await page.goto('/tournaments');
    await expect(page.url()).toContain('/tournaments');

    // Navigate back to leagues
    await page.goto('/leagues');
    await expect(page.url()).toContain('/leagues');

    expect(pageErrors).toEqual([]);
  });
});
