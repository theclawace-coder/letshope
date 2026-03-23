import { type Page, type Locator, expect } from '@playwright/test'

export class BasePage {
  readonly page: Page
  readonly sidebar: Locator
  readonly topbar: Locator
  readonly toastContainer: Locator

  constructor(page: Page) {
    this.page = page
    this.sidebar = page.locator('aside')
    this.topbar = page.locator('header')
    this.toastContainer = page.locator('[data-sonner-toaster]')
  }

  async navigateTo(section: string) {
    await this.sidebar.getByRole('link', { name: section }).click()
  }

  async expectToast(message: string | RegExp) {
    const toast = this.page.locator('[data-sonner-toast]').filter({
      hasText: message,
    })
    await expect(toast).toBeVisible({ timeout: 10_000 })
  }

  async confirmDialog(action: 'confirm' | 'cancel') {
    const dialog = this.page.locator('[role="alertdialog"], [role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    if (action === 'confirm') {
      await dialog
        .getByRole('button', { name: /confirm|yes|delete|remove|resolve|approve|submit/i })
        .click()
    } else {
      await dialog.getByRole('button', { name: /cancel|no|close/i }).click()
    }
  }

  async waitForPageLoad(heading: string | RegExp) {
    await expect(
      this.page.getByRole('heading', { name: heading }).first()
    ).toBeVisible({ timeout: 15_000 })
  }

  async expectSidebarVisible() {
    await expect(this.sidebar).toBeVisible({ timeout: 10_000 })
  }

  async expectTopbarOrgName(name: string) {
    await expect(this.topbar.getByText(name)).toBeVisible({ timeout: 10_000 })
  }
}

export class ListPage extends BasePage {
  readonly heading: Locator
  readonly table: Locator
  readonly emptyState: Locator

  constructor(
    page: Page,
    headingText: string,
    emptyText: string
  ) {
    super(page)
    this.heading = page.getByRole('heading', { name: headingText, exact: true })
    this.table = page.locator('table')
    this.emptyState = page.getByText(emptyText)
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 15_000 })
  }

  async hasData(): Promise<boolean> {
    await expect(this.table.or(this.emptyState)).toBeVisible({ timeout: 10_000 })
    return this.table.isVisible()
  }

  async clickRow(index = 0) {
    const row = this.table.locator('tbody tr').nth(index)
    await expect(row).toBeVisible({ timeout: 10_000 })
    await row.click()
  }

  async getRowCount(): Promise<number> {
    if (!(await this.hasData())) return 0
    return this.table.locator('tbody tr').count()
  }

  async expectTableHeaders(headers: string[]) {
    for (const header of headers) {
      await expect(
        this.table.getByRole('columnheader', { name: header })
      ).toBeVisible({ timeout: 10_000 })
    }
  }

  async search(placeholder: string, query: string) {
    const input = this.page.getByPlaceholder(placeholder)
    await input.fill(query)
    await expect(input).toHaveValue(query)
  }

  async selectFilter(filterText: string | RegExp, optionText: string) {
    await this.page.locator('button').filter({ hasText: filterText }).click()
    await this.page.getByRole('option', { name: optionText }).click()
  }
}

export class FormPage extends BasePage {
  readonly form: Locator
  readonly submitButton: Locator

  constructor(page: Page, submitText: string | RegExp) {
    super(page)
    this.form = page.locator('form')
    this.submitButton = page.getByRole('button', { name: submitText })
  }

  async submit() {
    await this.submitButton.click()
  }

  async fillField(label: string | RegExp, value: string) {
    await this.page.getByLabel(label).fill(value)
  }

  async selectOption(label: string | RegExp, value: string) {
    const trigger = this.page.locator('button').filter({ hasText: label })
    await trigger.click()
    await this.page.getByRole('option', { name: value }).click()
  }

  async expectValidationError(text: string | RegExp) {
    await expect(this.page.getByText(text)).toBeVisible({ timeout: 5_000 })
  }

  async selectParticipant(name: string) {
    const trigger = this.page.getByText('Select participant').first()
      .or(this.page.locator('button').filter({ hasText: /participant/i }).first())
    await trigger.click()
    await this.page.getByRole('option', { name }).click()
  }

  async selectWorker(name: string) {
    const trigger = this.page.getByText('Select worker').first()
      .or(this.page.locator('button').filter({ hasText: /worker/i }).first())
    await trigger.click()
    await this.page.getByRole('option', { name }).click()
  }
}

export class DetailPage extends BasePage {
  readonly backButton: Locator

  constructor(page: Page) {
    super(page)
    this.backButton = page.getByRole('button', { name: /back/i })
  }

  async goBack() {
    await this.backButton.click()
  }

  async expectLoaded(heading: string | RegExp) {
    await this.waitForPageLoad(heading)
  }
}
