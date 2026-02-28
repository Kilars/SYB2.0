/**
 * Page object for the League Create/Edit form.
 * Maps to: client/src/features/leagues/LeagueForm.tsx
 */

import { Page, expect } from '@playwright/test';

export class LeagueFormPage {
  constructor(private page: Page) {}

  async fillTitle(text: string) {
    await this.page.getByLabel('Title').fill(text);
  }

  async fillDescription(text: string) {
    await this.page.getByLabel('Description').fill(text);
  }

  /**
   * Add a member via the MUI Select dropdown.
   * The UserSelectInput renders a <Select label="Add members">.
   * MUI Select uses role="combobox" with aria-labelledby pointing to the InputLabel.
   */
  async addMember(displayName: string) {
    // Wait for the Members heading (indicates UserSelectInput has rendered)
    await this.page.getByRole('heading', { name: /members/i }).waitFor({ timeout: 15000 });

    // MUI v7 Select combobox doesn't get an accessible name from InputLabel.
    // It's the only combobox on the league form, so we can target it directly.
    const select = this.page.getByRole('combobox');
    await select.click();

    // Wait for the dropdown menu to appear and click the matching option
    const option = this.page.getByRole('option', { name: displayName });
    await option.click();
  }

  async clickCreate() {
    await this.page.getByRole('button', { name: /create/i }).click();
  }

  async clickSave() {
    await this.page.getByRole('button', { name: /save/i }).click();
  }

  async expectHeading(mode: 'Create' | 'Edit') {
    await expect(
      this.page.getByRole('heading', { name: new RegExp(`${mode} League`, 'i') })
    ).toBeVisible({ timeout: 15000 });
  }

  async expectMemberChip(displayName: string) {
    await expect(this.page.getByText(displayName)).toBeVisible();
  }
}
