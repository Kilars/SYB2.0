/**
 * Page object for the Tournament Create form.
 * Maps to: client/src/features/tournaments/TournamentForm.tsx
 */

import { Page, expect } from '@playwright/test';

export class TournamentFormPage {
  constructor(private page: Page) {}

  async fillTitle(text: string) {
    await this.page.getByLabel('Title').fill(text);
  }

  async fillDescription(text: string) {
    await this.page.getByLabel('Description').fill(text);
  }

  /**
   * Select best-of format via MUI Select.
   * The Select is labeled "Best Of" via InputLabel.
   */
  async selectBestOf(value: 1 | 3 | 5) {
    const select = this.page.getByRole('combobox', { name: /best of/i });
    await select.click();
    const option = this.page.getByRole('option', { name: `Best of ${value}` });
    await option.click();
  }

  /**
   * Add a member via the MUI Select dropdown.
   * UserSelectInput renders a Select with aria-label "Select a user to add as member".
   */
  async addMember(displayName: string) {
    await this.page.getByRole('heading', { name: /members/i }).waitFor({ timeout: 15000 });
    const select = this.page.getByRole('combobox', { name: /select a user to add as member/i });
    await select.click();
    const option = this.page.getByRole('option', { name: displayName });
    await option.click();
  }

  async clickCreate() {
    await this.page.getByRole('button', { name: /create tournament/i }).click();
  }

  async expectHeading() {
    await expect(
      this.page.getByRole('heading', { name: /create tournament/i })
    ).toBeVisible({ timeout: 15000 });
  }
}
