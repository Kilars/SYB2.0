/**
 * Sanity checks — smoke project only.
 * These are the minimum tests to confirm the app is alive and serving content.
 */

import {
  test,
  expect,
  checkPageHealth,
  clearAuthState,
  PUBLIC_PAGES,
  PROTECTED_PAGES,
  SEEDED_LEAGUE,
} from './fixtures.js';

test.describe('Sanity Checks', () => {
  test('home page loads when unauthenticated', async ({ page, pageErrors }) => {
    await clearAuthState(page);

    // Home page is public — should render without auth
    await page.goto('/');
    await expect(page.getByText('Smash Your Bros')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Welcome to SYB 2.0')).toBeVisible();

    const healthErrors = await checkPageHealth(page);
    expect([...healthErrors, ...pageErrors]).toEqual([]);
  });

  test('league list page loads', async ({ page, pageErrors }) => {
    // Auth pre-loaded from global setup
    await page.goto('/leagues');
    await expect(page.getByRole('heading', { name: /leagues/i })).toBeVisible({
      timeout: 10000,
    });

    // Seeded league should be present
    await expect(page.getByText(SEEDED_LEAGUE.title)).toBeVisible();

    const healthErrors = await checkPageHealth(page);
    expect([...healthErrors, ...pageErrors]).toEqual([]);
  });

  test('leaderboard page loads with data', async ({ page, pageErrors }) => {
    // Auth required — provided by storageState
    await page.goto(`/leagues/${SEEDED_LEAGUE.id}/leaderboard`);

    // Wait for leaderboard table to render
    await expect(page.getByRole('columnheader', { name: /player/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('columnheader', { name: /points/i })).toBeVisible();

    // Should have at least one data row (seeded with 12 players)
    const rows = page.getByRole('row');
    await expect(rows).toHaveCount(await rows.count(), { timeout: 5000 });
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(1); // header + at least 1 data row

    const healthErrors = await checkPageHealth(page);
    expect([...healthErrors, ...pageErrors]).toEqual([]);
  });

  test('visit all public pages', async ({ page, pageErrors }) => {
    await clearAuthState(page);

    for (const { path, name } of PUBLIC_PAGES) {
      await test.step(`Visit public page: ${name} (${path})`, async () => {
        await page.goto(path);

        // Page must have rendered something
        await expect(page.locator('body')).toBeVisible();

        const healthErrors = await checkPageHealth(page);
        const criticalErrors = healthErrors.filter(
          (e) => e.includes('Error boundary') || e.includes('appears empty')
        );
        expect(criticalErrors, `Page ${name} has critical errors`).toEqual([]);
      });
    }

    if (pageErrors.length > 0) {
      console.warn('[sanity] Console errors during public page visits:', pageErrors);
    }
  });

  test('visit all protected pages when authenticated', async ({ page, pageErrors }) => {
    // Auth pre-loaded from global setup via storageState
    for (const { path, name } of PROTECTED_PAGES) {
      await test.step(`Visit protected page: ${name} (${path})`, async () => {
        await page.goto(path);

        // Should not be redirected to login
        await expect(page).not.toHaveURL(/\/login/, { timeout: 8000 });

        // Page must render body content
        await expect(page.locator('body')).toBeVisible();

        // Wait for any loading states to resolve
        await page.waitForLoadState('networkidle').catch(() => {
          // Ignore timeout — networkidle can be slow with MUI hydration
        });

        const healthErrors = await checkPageHealth(page);
        const criticalErrors = healthErrors.filter(
          (e) => e.includes('Error boundary') || e.includes('appears empty')
        );
        expect(criticalErrors, `Page ${name} has critical errors`).toEqual([]);
      });
    }

    if (pageErrors.length > 0) {
      console.warn('[sanity] Console errors during protected page visits:', pageErrors);
    }
  });
});
