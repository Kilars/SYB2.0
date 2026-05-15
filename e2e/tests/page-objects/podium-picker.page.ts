/**
 * Page object for the PodiumPicker component.
 * Maps to: client/src/app/shared/components/PodiumPicker.tsx (via FfaMatchForm).
 *
 * Selectors use data-testid exclusively — no CSS class or nth(...) fallbacks.
 */

import { Page, expect } from '@playwright/test';

export class PodiumPickerPage {
  constructor(private page: Page) {}

  async waitForPicker(): Promise<void> {
    await expect(this.page.getByTestId('podium-picker')).toBeVisible({ timeout: 15000 });
  }

  async selectPlacement(rank: 1 | 2 | 3 | 4, userId: string): Promise<void> {
    await this.page.getByTestId(`podium-plinth-${rank}`).click();
    await this.page.getByTestId(`player-chip-${userId}`).click();
  }

  async clickWinnerOnlyToggle(): Promise<void> {
    await this.page.getByTestId('podium-winner-only-toggle').click();
  }
}
