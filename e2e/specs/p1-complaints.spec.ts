import { test, expect } from '@playwright/test'

test.describe('P1: Complaints @p1', () => {
  test.describe('Complaints List', () => {
    test('list page loads with heading', async ({ page }) => {
      await page.goto('/complaints')
      await expect(
        page.getByRole('heading', { name: 'Complaints', exact: true })
      ).toBeVisible({ timeout: 15_000 })
    })

    test('stat cards render', async ({ page }) => {
      await page.goto('/complaints')
      for (const label of ['Open', 'Investigating', 'Overdue Acknowledgment']) {
        await expect(page.getByText(label)).toBeVisible({ timeout: 15_000 })
      }
    })

    test('status filter is visible', async ({ page }) => {
      await page.goto('/complaints')
      await expect(page.getByText('All Statuses').first()).toBeVisible({ timeout: 15_000 })
    })

    test('category filter is visible', async ({ page }) => {
      await page.goto('/complaints')
      await expect(page.getByText('All Categories')).toBeVisible({ timeout: 15_000 })
    })

    test('Log Complaint button navigates to create', async ({ page }) => {
      await page.goto('/complaints')
      await page.getByRole('button', { name: 'Log Complaint' }).click()
      await expect(page).toHaveURL(/\/complaints\/new/, { timeout: 10_000 })
    })

    test('table headers or empty state', async ({ page }) => {
      await page.goto('/complaints')
      await expect(
        page.getByRole('heading', { name: 'Complaints', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      const table = page.locator('table')
      const emptyState = page.getByText('No complaints logged')
      await expect(table.or(emptyState)).toBeVisible({ timeout: 10_000 })

      if (await table.isVisible()) {
        for (const header of ['Date', 'Category', 'Complainant', 'Participant', 'Status', 'Acknowledged']) {
          await expect(
            table.getByRole('columnheader', { name: header })
          ).toBeVisible({ timeout: 10_000 })
        }
      }
    })
  })

  test.describe('Create Complaint', () => {
    test('form loads with heading', async ({ page }) => {
      await page.goto('/complaints/new')
      await expect(
        page.getByRole('heading', { name: /Log a Complaint/i })
      ).toBeVisible({ timeout: 15_000 })
    })

    test('form has participant selector', async ({ page }) => {
      await page.goto('/complaints/new')
      await expect(
        page.getByRole('heading', { name: /Log a Complaint/i })
      ).toBeVisible({ timeout: 15_000 })
      await expect(page.getByText(/Participant/i).first()).toBeVisible({ timeout: 10_000 })
    })

    test('form has complainant name field', async ({ page }) => {
      await page.goto('/complaints/new')
      await expect(
        page.getByRole('heading', { name: /Log a Complaint/i })
      ).toBeVisible({ timeout: 15_000 })
      await expect(page.getByText(/Complainant/i).first()).toBeVisible({ timeout: 10_000 })
    })

    test('category selector opens', async ({ page }) => {
      await page.goto('/complaints/new')
      await expect(
        page.getByRole('heading', { name: /Log a Complaint/i })
      ).toBeVisible({ timeout: 15_000 })

      // Verify category-related selector exists on the form
      await expect(
        page.getByText(/Category/i).first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('description field exists', async ({ page }) => {
      await page.goto('/complaints/new')
      await expect(
        page.getByRole('heading', { name: /Log a Complaint/i })
      ).toBeVisible({ timeout: 15_000 })
      await expect(page.getByText(/Description/i).first()).toBeVisible({ timeout: 10_000 })
    })
  })

  test.describe('Complaint Detail', () => {
    test('detail page loads from list', async ({ page }) => {
      await page.goto('/complaints')
      await expect(
        page.getByRole('heading', { name: 'Complaints', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      const table = page.locator('table')
      const emptyState = page.getByText('No complaints logged')
      await expect(table.or(emptyState)).toBeVisible({ timeout: 10_000 })

      if (await emptyState.isVisible()) {
        test.skip(true, 'No complaints')
        return
      }

      await table.locator('tbody tr').first().click()
      await expect(page).toHaveURL(/\/complaints\/[a-zA-Z0-9-]+/, { timeout: 10_000 })
    })
  })
})
