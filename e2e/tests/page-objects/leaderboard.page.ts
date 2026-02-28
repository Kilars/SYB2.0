/**
 * Page object for the Leaderboard table.
 * Maps to: client/src/features/leagues/Leaderboard.tsx
 *
 * Table columns: Player | Points | WR | Wins | Losses | Flawless
 */

import { Page, expect } from '@playwright/test';

export interface PlayerStats {
  player: string;
  points: number;
  wr: string;
  wins: number;
  losses: number;
  flawless: number;
}

export class LeaderboardPage {
  constructor(private page: Page) {}

  async waitForTable() {
    await expect(
      this.page.getByRole('columnheader', { name: /player/i })
    ).toBeVisible({ timeout: 15000 });
  }

  /**
   * Get stats for a specific player by display name.
   * Finds the row containing the player name and extracts cell values.
   */
  async getPlayerRow(displayName: string): Promise<PlayerStats> {
    const row = this.page.getByRole('row').filter({ hasText: displayName });
    await expect(row).toBeVisible({ timeout: 10000 });

    const cells = row.getByRole('cell');
    const cellTexts: string[] = [];
    const count = await cells.count();
    for (let i = 0; i < count; i++) {
      cellTexts.push((await cells.nth(i).textContent())?.trim() ?? '');
    }

    // Columns: Player, Points, WR, Wins, Losses, Flawless
    return {
      player: cellTexts[0],
      points: parseInt(cellTexts[1], 10),
      wr: cellTexts[2],
      wins: parseInt(cellTexts[3], 10),
      losses: parseInt(cellTexts[4], 10),
      flawless: parseInt(cellTexts[5], 10),
    };
  }

  async getRowCount(): Promise<number> {
    const rows = this.page.getByRole('row');
    const total = await rows.count();
    return total - 1; // subtract header row
  }

  async expectEditLeagueButton() {
    await expect(
      this.page.getByRole('button', { name: /edit league/i })
    ).toBeVisible({ timeout: 5000 });
  }

  async expectNoEditLeagueButton() {
    await expect(
      this.page.getByRole('button', { name: /edit league/i })
    ).not.toBeVisible({ timeout: 3000 });
  }

  async clickEditLeague() {
    await this.page.getByRole('button', { name: /edit league/i }).click();
  }
}
