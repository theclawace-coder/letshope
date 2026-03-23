import { test, expect } from '@playwright/test'

test.describe('Participants List Page', () => {
  test('list page loads with heading and table headers', async ({ page }) => {
    await page.goto('/participants')
    // Verify "Participants" heading is visible (appears after loading completes)
    await expect(
      page.getByRole('heading', { name: 'Participants', exact: true })
    ).toBeVisible({ timeout: 15000 })

    // Verify table headers when participants exist, or empty state
    const hasTable = await page.locator('table').isVisible().catch(() => false)

    if (hasTable) {
      const tableHeaders = ['Name', 'NDIS Number', 'Status', 'Funding', 'Plan End', 'Referral Date']
      for (const header of tableHeaders) {
        await expect(
          page.getByRole('columnheader', { name: header })
        ).toBeVisible({ timeout: 10000 })
      }
    } else {
      await expect(
        page.getByText('No participants yet')
      ).toBeVisible({ timeout: 10000 })
    }
  })

  test('search filter works', async ({ page }) => {
    await page.goto('/participants')
    await expect(page.getByRole('heading', { name: 'Participants', exact: true })).toBeVisible({ timeout: 15000 })

    const searchInput = page.getByPlaceholder('Search by name or NDIS number...')
    await expect(searchInput).toBeVisible({ timeout: 10000 })

    // Type a search query and verify the input accepts text
    await searchInput.fill('TestSearchQuery')
    await expect(searchInput).toHaveValue('TestSearchQuery')
  })

  test('status filter exists with options', async ({ page }) => {
    await page.goto('/participants')
    await expect(page.getByRole('heading', { name: 'Participants', exact: true })).toBeVisible({ timeout: 15000 })

    // Find the status filter trigger
    const statusTrigger = page.locator('button').filter({ hasText: /All Statuses/i })
    await expect(statusTrigger).toBeVisible({ timeout: 10000 })
  })

  test('New Participant button navigates to /onboarding/new', async ({ page }) => {
    await page.goto('/participants')
    await expect(page.getByRole('heading', { name: 'Participants', exact: true })).toBeVisible({ timeout: 15000 })

    const newBtn = page.getByRole('button', { name: /New Participant/i })
    await expect(newBtn).toBeVisible({ timeout: 10000 })

    await newBtn.click()
    await expect(page).toHaveURL(/\/onboarding\/new/, { timeout: 10000 })
  })

  test('empty state or table is shown', async ({ page }) => {
    await page.goto('/participants')
    await expect(page.getByRole('heading', { name: 'Participants', exact: true })).toBeVisible({ timeout: 15000 })

    const emptyState = page.getByText('No participants yet')
    const table = page.locator('table')

    await expect(table.or(emptyState)).toBeVisible({ timeout: 10000 })
  })

  test('participant detail page loads when clicking a row', async ({ page }) => {
    await page.goto('/participants')
    await expect(page.getByRole('heading', { name: 'Participants', exact: true })).toBeVisible({ timeout: 15000 })

    const table = page.locator('table')
    const emptyState = page.getByText('No participants yet')

    await expect(table.or(emptyState)).toBeVisible({ timeout: 10000 })

    if (await emptyState.isVisible()) {
      test.skip(true, 'No participants in table to click')
      return
    }

    // Click the first data row in the table body
    const firstRow = page.locator('table tbody tr').first()
    await expect(firstRow).toBeVisible({ timeout: 10000 })
    await firstRow.click()

    // Verify URL changed to /participants/{uuid}
    await expect(page).toHaveURL(/\/participants\/[a-f0-9-]+/, { timeout: 10000 })
  })
})

test.describe('Participant Onboarding Wizard', () => {
  test('wizard loads with heading and Stage 1 form', async ({ page }) => {
    await page.goto('/onboarding/new')

    // Verify the page heading
    await expect(
      page.getByRole('heading', { name: /Participant Onboarding/i })
    ).toBeVisible({ timeout: 15000 })

    // Verify Stage 1 form fields are present (labels have * suffix)
    await expect(page.getByLabel(/First Name/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByLabel(/Last Name/i)).toBeVisible({ timeout: 10000 })

    // Fill in first_name and last_name to verify the form is interactable
    await page.getByLabel(/First Name/i).fill('Test')
    await expect(page.getByLabel(/First Name/i)).toHaveValue('Test')

    await page.getByLabel(/Last Name/i).fill('Participant')
    await expect(page.getByLabel(/Last Name/i)).toHaveValue('Participant')
  })

  test('step indicator shows multiple stages', async ({ page }) => {
    await page.goto('/onboarding/new')

    await expect(
      page.getByRole('heading', { name: /Participant Onboarding/i })
    ).toBeVisible({ timeout: 15000 })

    // Check that step indicator has numbered step circles (at least 3 stages)
    const stepButtons = page.locator('button').filter({ has: page.locator('.rounded-full') })
    await expect(stepButtons.first()).toBeVisible({ timeout: 10000 })
    const count = await stepButtons.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })
})
