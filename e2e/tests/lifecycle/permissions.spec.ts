/**
 * Permission validation — parameterized over league and tournament.
 *
 * Two tests per domain × two domains, but expressed as a single matrix:
 *  1. Admin sees admin controls.
 *  2. Non-admin member does NOT see admin controls.
 *
 * Setup creates a fresh league/tournament owned by denix (admin) per domain.
 * Hansemann is included as a non-admin member to exercise the negative case.
 */

import type { Browser, Page } from '@playwright/test';
import { test, expect } from '../fixtures.js';
import { BracketViewPage } from '../page-objects/bracket-view.page.js';
import {
  createLeagueViaApi,
  createTournamentViaApi,
  startTournamentViaApi,
  loginAsUser,
} from '../helpers/api-helpers.js';
import {
  THREE_PLAYERS,
  FOUR_PLAYERS,
  USERS,
  PASSWORD,
  uniqueLeagueName,
  uniqueTournamentName,
} from '../helpers/test-data.js';
import { STORAGE_PATH } from '../../global-setup.js';

interface DomainConfig {
  name: 'league' | 'tournament';
  setup: (browser: Browser) => Promise<string>;
  pageUrl: (id: string) => string;
  waitForReady: (page: Page) => Promise<void>;
  adminButtonNames: RegExp[];
}

const DOMAINS: DomainConfig[] = [
  {
    name: 'league',
    setup: async (browser) => {
      const ctx = await browser.newContext({ storageState: STORAGE_PATH });
      const id = await createLeagueViaApi(ctx, {
        title: uniqueLeagueName('permissions'),
        description: 'E2E permissions test',
        members: THREE_PLAYERS.map((p) => ({ userId: p.userId, displayName: p.displayName })),
      });
      await ctx.close();
      return id;
    },
    pageUrl: (id) => `/leagues/${id}/leaderboard`,
    waitForReady: async (page) => {
      await expect(page.getByRole('columnheader', { name: /player/i })).toBeVisible({
        timeout: 15000,
      });
    },
    adminButtonNames: [/start league/i, /edit league/i],
  },
  {
    name: 'tournament',
    setup: async (browser) => {
      const ctx = await browser.newContext({ storageState: STORAGE_PATH });
      const id = await createTournamentViaApi(ctx, {
        title: uniqueTournamentName('perms'),
        description: 'Permissions test tournament',
        members: FOUR_PLAYERS,
      });
      await startTournamentViaApi(ctx, id);
      await ctx.close();
      return id;
    },
    pageUrl: (id) => `/tournaments/${id}`,
    waitForReady: async (page) => {
      const bracket = new BracketViewPage(page);
      await bracket.waitForBracket();
    },
    adminButtonNames: [/shuffle bracket/i, /^delete$/i],
  },
];

for (const domain of DOMAINS) {
  test.describe(`Permissions: ${domain.name}`, () => {
    let entityId: string;

    test.beforeAll(async ({ browser }) => {
      entityId = await domain.setup(browser);
    });

    test('admin sees admin controls', async ({ page, pageErrors }) => {
      await page.goto(domain.pageUrl(entityId));
      await domain.waitForReady(page);

      for (const buttonName of domain.adminButtonNames) {
        await expect(page.getByRole('button', { name: buttonName })).toBeVisible();
      }

      expect(pageErrors).toEqual([]);
    });

    test('non-admin member does not see admin controls', async ({ browser }) => {
      const ctx = await loginAsUser(browser, USERS.hansemann.email, PASSWORD);
      const page = await ctx.newPage();
      try {
        await page.goto(`http://localhost:3000${domain.pageUrl(entityId)}`);
        await domain.waitForReady(page);

        for (const buttonName of domain.adminButtonNames) {
          await expect(page.getByRole('button', { name: buttonName })).not.toBeVisible({
            timeout: 3000,
          });
        }
      } finally {
        await page.close();
        await ctx.close();
      }
    });
  });
}
