import { test, expect } from '@playwright/test'

test.describe('Invoices', () => {
  test('list page loads with heading', async ({ page }) => {
    await page.goto('/invoices')
    await expect(
      page.getByRole('heading', { name: 'Invoices', exact: true })
    ).toBeVisible({ timeout: 15000 })
  })

  test('stats cards show Drafts, Outstanding, Paid, Rejected', async ({ page }) => {
    await page.goto('/invoices')
    await expect(page.getByRole('heading', { name: 'Invoices', exact: true })).toBeVisible({ timeout: 15000 })

    const statLabels = ['Drafts', 'Outstanding', 'Paid', 'Rejected']
    for (const label of statLabels) {
      await expect(page.getByText(label)).toBeVisible({ timeout: 10000 })
    }
  })

  test('search filter input is visible', async ({ page }) => {
    await page.goto('/invoices')
    await expect(page.getByRole('heading', { name: 'Invoices', exact: true })).toBeVisible({ timeout: 15000 })
    await expect(
      page.getByPlaceholder('Search invoices...')
    ).toBeVisible({ timeout: 10000 })
  })

  test('status filter dropdown is visible', async ({ page }) => {
    await page.goto('/invoices')
    await expect(page.getByRole('heading', { name: 'Invoices', exact: true })).toBeVisible({ timeout: 15000 })
    await expect(
      page.getByText('All Statuses').first()
    ).toBeVisible({ timeout: 10000 })
  })

  test('funding filter dropdown is visible', async ({ page }) => {
    await page.goto('/invoices')
    await expect(page.getByRole('heading', { name: 'Invoices', exact: true })).toBeVisible({ timeout: 15000 })
    await expect(
      page.getByText('All Funding')
    ).toBeVisible({ timeout: 10000 })
  })

  test('New Invoice button navigates to /invoices/new', async ({ page }) => {
    await page.goto('/invoices')
    await expect(page.getByRole('heading', { name: 'Invoices', exact: true })).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: 'New Invoice' }).click()
    await expect(page).toHaveURL(/\/invoices\/new/, { timeout: 10000 })
  })

  test('create invoice page loads with form', async ({ page }) => {
    await page.goto('/invoices/new')

    await expect(
      page.getByRole('heading', { name: 'Create Invoice' })
    ).toBeVisible({ timeout: 15000 })

    // Verify form element is present
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 })
  })

  test('clicking first invoice row navigates to detail page', async ({ page }) => {
    await page.goto('/invoices')
    await expect(page.getByRole('heading', { name: 'Invoices', exact: true })).toBeVisible({ timeout: 15000 })

    // Check if there are any invoice rows in the table
    const rows = page.locator('table tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      await rows.first().click()
      await expect(page).toHaveURL(/\/invoices\/[a-zA-Z0-9-]+/, { timeout: 10000 })
    } else {
      // No invoices exist, skip gracefully
      test.skip()
    }
  })

  test('table headers or empty state displayed', async ({ page }) => {
    await page.goto('/invoices')
    await expect(page.getByRole('heading', { name: 'Invoices', exact: true })).toBeVisible({ timeout: 15000 })

    // Either table or empty state must be visible
    const table = page.locator('table')
    const emptyState = page.getByRole('heading', { name: 'No invoices' })

    await expect(table.or(emptyState)).toBeVisible({ timeout: 10000 })

    if (await table.isVisible()) {
      const expectedHeaders = ['Invoice #', 'Participant', 'Period', 'Total', 'Funding', 'Status', 'Date']
      for (const header of expectedHeaders) {
        await expect(
          table.getByRole('columnheader', { name: header })
        ).toBeVisible({ timeout: 10000 })
      }
    }
  })

  test('empty state shows when no invoices exist', async ({ page }) => {
    await page.goto('/invoices')
    await expect(page.getByRole('heading', { name: 'Invoices', exact: true })).toBeVisible({ timeout: 15000 })

    // Check for either table or empty state
    const table = page.locator('table')
    const emptyState = page.getByRole('heading', { name: 'No invoices' })

    await expect(table.or(emptyState)).toBeVisible({ timeout: 10000 })

    if (await emptyState.isVisible()) {
      await expect(
        page.getByRole('button', { name: 'Create Invoice' })
      ).toBeVisible({ timeout: 10000 })
    }
    // If table is visible, that's fine too - just means invoices exist
  })
})
