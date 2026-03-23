import { test, expect } from '@playwright/test'

test.describe('Workers', () => {
  test('Workers list loads', async ({ page }) => {
    await page.goto('/workers')
    await expect(page.getByRole('heading', { name: 'Workers', exact: true })).toBeVisible()
    // Table headers only exist if there are workers
    const table = page.locator('table')
    const hasTable = await table.count() > 0
    if (hasTable) {
      const headers = ['Name', 'Role', 'Status', 'Type', 'NDIS Screening', 'Police Check Expiry', 'Created']
      for (const header of headers) {
        await expect(page.getByRole('columnheader', { name: header })).toBeVisible()
      }
    }
  })

  test('Workers search', async ({ page }) => {
    await page.goto('/workers')
    await expect(page.getByPlaceholder('Search by name or email...')).toBeVisible()
  })

  test('Workers status filter', async ({ page }) => {
    await page.goto('/workers')
    await expect(page.getByText('All Statuses')).toBeVisible()
  })

  test('Workers type filter', async ({ page }) => {
    await page.goto('/workers')
    await expect(page.getByText('All Types')).toBeVisible()
  })

  test('New Worker button navigates to onboarding', async ({ page }) => {
    await page.goto('/workers')
    const newWorkerButton = page.getByRole('button', { name: /new worker/i })
    await expect(newWorkerButton).toBeVisible()
    await newWorkerButton.click()
    await expect(page).toHaveURL(/\/workers\/onboarding\/new/)
  })

  test('Worker detail page', async ({ page }) => {
    await page.goto('/workers')
    const firstRow = page.locator('table tbody tr').first()
    const rowCount = await page.locator('table tbody tr').count()
    test.skip(rowCount === 0, 'No workers exist to view')
    await firstRow.click()
    await expect(page).toHaveURL(/\/workers\/[a-zA-Z0-9-]+/)
  })

  test('Worker onboarding wizard', async ({ page }) => {
    await page.goto('/workers/onboarding/new')
    await expect(page).toHaveURL(/\/workers\/onboarding\/new/)
    // Verify the page loaded (heading or form content)
    await expect(page.getByRole('heading', { name: 'Worker Onboarding' })).toBeVisible({ timeout: 10_000 })
  })

  test('Worker empty or list state', async ({ page }) => {
    await page.goto('/workers')
    const hasEmptyState = page.getByText('No workers yet')
    const hasRows = page.locator('table tbody tr').first()
    await expect(hasEmptyState.or(hasRows)).toBeVisible()
  })
})

test.describe('Calendar', () => {
  test('Calendar page loads', async ({ page }) => {
    await page.goto('/calendar')
    // FullCalendar renders inside .fc container or we look for date-related elements
    const calendarContainer = page.locator('.fc, [class*="calendar"], [data-testid="calendar"]').first()
    await expect(calendarContainer).toBeVisible()
  })
})

test.describe('Compliance', () => {
  test('Compliance dashboard loads', async ({ page }) => {
    await page.goto('/compliance')
    await expect(
      page.getByRole('heading', { name: /compliance|screening/i })
    ).toBeVisible()
  })
})
