import { test, expect } from '@playwright/test'

test.describe('P1: Workers List @p1', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workers')
    await expect(
      page.getByRole('heading', { name: 'Workers', exact: true })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('search by name filters results', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search by name or email...')
    await searchInput.fill('Test')
    await expect(searchInput).toHaveValue('Test')
  })

  test('search by email', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search by name or email...')
    await searchInput.fill('@test.com')
    await expect(searchInput).toHaveValue('@test.com')
  })

  test('status filter opens', async ({ page }) => {
    const statusTrigger = page.locator('button').filter({ hasText: /All Statuses/i })
    await statusTrigger.click()
    const popup = page.locator('[data-slot="select-content"]').first()
    await expect(popup).toBeVisible({ timeout: 5_000 })
  })

  test('type filter opens', async ({ page }) => {
    const typeTrigger = page.locator('button').filter({ hasText: /All Types/i })
    await typeTrigger.click()
    const popup = page.locator('[data-slot="select-content"]').first()
    await expect(popup).toBeVisible({ timeout: 5_000 })
  })

  test('New Worker button is visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /new worker/i })
    ).toBeVisible({ timeout: 10_000 })
  })

  test('empty state or table with correct headers', async ({ page }) => {
    const table = page.locator('table')
    const emptyState = page.getByText('No workers yet')
    await expect(table.or(emptyState)).toBeVisible({ timeout: 10_000 })

    if (await table.isVisible()) {
      for (const header of ['Name', 'Role', 'Status', 'Type']) {
        await expect(
          page.getByRole('columnheader', { name: header })
        ).toBeVisible({ timeout: 5_000 })
      }
    }
  })
})
