import { test, expect } from '@playwright/test'
import { ListPage, FormPage } from '../page-objects/BasePage'

test.describe('P0: Invoices Workflow @p0', () => {
  test.describe('Invoices List', () => {
    test('list page loads with heading', async ({ page }) => {
      await page.goto('/invoices')
      await expect(
        page.getByRole('heading', { name: 'Invoices', exact: true })
      ).toBeVisible({ timeout: 15_000 })
    })

    test('stat cards show Drafts, Outstanding, Paid, Rejected', async ({ page }) => {
      await page.goto('/invoices')
      await expect(
        page.getByRole('heading', { name: 'Invoices', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      for (const label of ['Drafts', 'Outstanding', 'Paid', 'Rejected']) {
        await expect(page.getByText(label)).toBeVisible({ timeout: 10_000 })
      }
    })

    test('search filter is visible', async ({ page }) => {
      await page.goto('/invoices')
      await expect(
        page.getByRole('heading', { name: 'Invoices', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await expect(page.getByPlaceholder('Search invoices...')).toBeVisible({ timeout: 10_000 })
    })

    test('status filter dropdown is visible', async ({ page }) => {
      await page.goto('/invoices')
      await expect(
        page.getByRole('heading', { name: 'Invoices', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await expect(page.getByText('All Statuses').first()).toBeVisible({ timeout: 10_000 })
    })

    test('funding filter dropdown is visible', async ({ page }) => {
      await page.goto('/invoices')
      await expect(
        page.getByRole('heading', { name: 'Invoices', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await expect(page.getByText('All Funding')).toBeVisible({ timeout: 10_000 })
    })

    test('New Invoice button navigates to create page', async ({ page }) => {
      await page.goto('/invoices')
      await expect(
        page.getByRole('heading', { name: 'Invoices', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await page.getByRole('button', { name: 'New Invoice' }).click()
      await expect(page).toHaveURL(/\/invoices\/new/, { timeout: 10_000 })
    })

    test('table headers or empty state displayed', async ({ page }) => {
      await page.goto('/invoices')
      await expect(
        page.getByRole('heading', { name: 'Invoices', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      const table = page.locator('table')
      const emptyState = page.getByRole('heading', { name: 'No invoices' })
      await expect(table.or(emptyState)).toBeVisible({ timeout: 10_000 })

      if (await table.isVisible()) {
        for (const header of ['Invoice #', 'Participant', 'Period', 'Total', 'Funding', 'Status', 'Date']) {
          await expect(
            table.getByRole('columnheader', { name: header })
          ).toBeVisible({ timeout: 10_000 })
        }
      }
    })

    test('clicking first invoice row navigates to detail', async ({ page }) => {
      await page.goto('/invoices')
      await expect(
        page.getByRole('heading', { name: 'Invoices', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      const rows = page.locator('table tbody tr')
      const rowCount = await rows.count()
      if (rowCount > 0) {
        await rows.first().click()
        await expect(page).toHaveURL(/\/invoices\/[a-zA-Z0-9-]+/, { timeout: 10_000 })
      } else {
        test.skip()
      }
    })
  })

  test.describe('Create Invoice Form', () => {
    test('create page loads with form', async ({ page }) => {
      await page.goto('/invoices/new')
      await expect(
        page.getByRole('heading', { name: 'Create Invoice' })
      ).toBeVisible({ timeout: 15_000 })
      await expect(page.locator('form')).toBeVisible({ timeout: 10_000 })
    })

    test('form has participant selector', async ({ page }) => {
      await page.goto('/invoices/new')
      await expect(
        page.getByRole('heading', { name: 'Create Invoice' })
      ).toBeVisible({ timeout: 15_000 })

      await expect(
        page.getByText(/Participant/i).first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('form has funding type selector', async ({ page }) => {
      await page.goto('/invoices/new')
      await expect(
        page.getByRole('heading', { name: 'Create Invoice' })
      ).toBeVisible({ timeout: 15_000 })

      await expect(
        page.getByText(/Funding Type/i).first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('form has line items section', async ({ page }) => {
      await page.goto('/invoices/new')
      await expect(
        page.getByRole('heading', { name: 'Create Invoice' })
      ).toBeVisible({ timeout: 15_000 })

      await expect(
        page.getByText(/line item/i).first()
          .or(page.getByText(/support item/i).first())
      ).toBeVisible({ timeout: 10_000 })
    })

    test('form has date fields', async ({ page }) => {
      await page.goto('/invoices/new')
      await expect(
        page.getByRole('heading', { name: 'Create Invoice' })
      ).toBeVisible({ timeout: 15_000 })

      await expect(page.getByText(/Invoice Date/i)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(/Period Start/i)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(/Period End/i)).toBeVisible({ timeout: 10_000 })
    })
  })
})
