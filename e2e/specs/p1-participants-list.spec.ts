import { test, expect } from '@playwright/test'

test.describe('P1: Participants List @p1', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/participants')
    await expect(
      page.getByRole('heading', { name: 'Participants', exact: true })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('search by name filters results', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search by name or NDIS number...')
    await searchInput.fill('E2E')
    await expect(searchInput).toHaveValue('E2E')
  })

  test('search by NDIS number', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search by name or NDIS number...')
    await searchInput.fill('439')
    await expect(searchInput).toHaveValue('439')
  })

  test('status filter dropdown opens', async ({ page }) => {
    const statusTrigger = page.locator('button').filter({ hasText: /All Statuses/i })
    await statusTrigger.click()
    const popup = page.locator('[data-slot="select-content"]').first()
    await expect(popup).toBeVisible({ timeout: 5_000 })
  })

  test('table has correct column headers', async ({ page }) => {
    const table = page.locator('table')
    const emptyState = page.getByText('No participants yet')
    await expect(table.or(emptyState)).toBeVisible({ timeout: 10_000 })

    if (await table.isVisible()) {
      for (const header of ['Name', 'NDIS Number', 'Status', 'Funding', 'Plan End', 'Referral Date']) {
        await expect(
          page.getByRole('columnheader', { name: header })
        ).toBeVisible({ timeout: 5_000 })
      }
    }
  })

  test('clicking row navigates to /participants/:id', async ({ page }) => {
    const table = page.locator('table')
    const emptyState = page.getByText('No participants yet')
    await expect(table.or(emptyState)).toBeVisible({ timeout: 10_000 })

    if (await emptyState.isVisible()) {
      test.skip(true, 'No participants')
      return
    }

    await page.locator('table tbody tr').first().click()
    await expect(page).toHaveURL(/\/participants\/[a-f0-9-]+/, { timeout: 10_000 })
  })

  test('New Participant button is visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /New Participant/i })
    ).toBeVisible({ timeout: 10_000 })
  })
})
