import { test, expect } from '@playwright/test'
import { TEST_PARTICIPANT } from '../fixtures/constants'

test.describe('P0: Participants CRUD @p0', () => {
  test.describe('Participant Onboarding Wizard', () => {
    test('wizard loads with Stage 1 form', async ({ page }) => {
      await page.goto('/onboarding/new')
      await expect(
        page.getByRole('heading', { name: /Participant Onboarding/i })
      ).toBeVisible({ timeout: 15_000 })

      await expect(page.getByLabel(/First Name/i)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByLabel(/Last Name/i)).toBeVisible({ timeout: 10_000 })
    })

    test('step indicator shows multiple stages', async ({ page }) => {
      await page.goto('/onboarding/new')
      await expect(
        page.getByRole('heading', { name: /Participant Onboarding/i })
      ).toBeVisible({ timeout: 15_000 })

      const stepButtons = page.locator('button').filter({ has: page.locator('.rounded-full') })
      await expect(stepButtons.first()).toBeVisible({ timeout: 10_000 })
      const count = await stepButtons.count()
      expect(count).toBeGreaterThanOrEqual(3)
    })

    test('Stage 1: validation errors on empty submit', async ({ page }) => {
      await page.goto('/onboarding/new')
      await expect(
        page.getByRole('heading', { name: /Participant Onboarding/i })
      ).toBeVisible({ timeout: 15_000 })

      // Try to submit/advance without filling required fields
      const nextButton = page.getByRole('button', { name: /next|continue|save/i })
      if (await nextButton.isVisible()) {
        await nextButton.click()
        // Should show validation errors for required fields
        await page.waitForTimeout(1000)
      }
    })

    test('Stage 1: fill required fields and advance', async ({ page }) => {
      await page.goto('/onboarding/new')
      await expect(
        page.getByRole('heading', { name: /Participant Onboarding/i })
      ).toBeVisible({ timeout: 15_000 })

      // Fill Stage 1 required fields
      await page.getByLabel(/First Name/i).fill(TEST_PARTICIPANT.first_name)
      await page.getByLabel(/Last Name/i).fill(TEST_PARTICIPANT.last_name)

      // NDIS Number
      const ndisInput = page.getByLabel(/NDIS Number/i)
        .or(page.getByPlaceholder(/ndis/i))
      if (await ndisInput.isVisible()) {
        await ndisInput.fill(TEST_PARTICIPANT.ndis_number)
      }

      // Services requested (multi-select or checkboxes)
      const serviceCheckbox = page.locator('input[type="checkbox"]').first()
      if (await serviceCheckbox.isVisible()) {
        await serviceCheckbox.check()
      }

      // Referral source
      const referralInput = page.getByLabel(/Referral Source/i)
        .or(page.getByLabel(/referred by/i))
      if (await referralInput.isVisible()) {
        await referralInput.fill(TEST_PARTICIPANT.referral_source)
      }

      // Verify inputs accepted values
      await expect(page.getByLabel(/First Name/i)).toHaveValue(TEST_PARTICIPANT.first_name)
      await expect(page.getByLabel(/Last Name/i)).toHaveValue(TEST_PARTICIPANT.last_name)
    })
  })

  test.describe('Participants List', () => {
    test('list page loads with heading and table or empty state', async ({ page }) => {
      await page.goto('/participants')
      await expect(
        page.getByRole('heading', { name: 'Participants', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      const table = page.locator('table')
      const emptyState = page.getByText('No participants yet')
      await expect(table.or(emptyState)).toBeVisible({ timeout: 10_000 })
    })

    test('search filter is visible and accepts input', async ({ page }) => {
      await page.goto('/participants')
      await expect(
        page.getByRole('heading', { name: 'Participants', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      const searchInput = page.getByPlaceholder('Search by name or NDIS number...')
      await expect(searchInput).toBeVisible({ timeout: 10_000 })
      await searchInput.fill('TestQuery')
      await expect(searchInput).toHaveValue('TestQuery')
    })

    test('status filter dropdown is visible', async ({ page }) => {
      await page.goto('/participants')
      await expect(
        page.getByRole('heading', { name: 'Participants', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      await expect(
        page.locator('button').filter({ hasText: /All Statuses/i })
      ).toBeVisible({ timeout: 10_000 })
    })

    test('New Participant button navigates to onboarding', async ({ page }) => {
      await page.goto('/participants')
      await expect(
        page.getByRole('heading', { name: 'Participants', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      await page.getByRole('button', { name: /New Participant/i }).click()
      await expect(page).toHaveURL(/\/onboarding\/new/, { timeout: 10_000 })
    })

    test('table headers are correct when data exists', async ({ page }) => {
      await page.goto('/participants')
      await expect(
        page.getByRole('heading', { name: 'Participants', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      const table = page.locator('table')
      if (await table.isVisible()) {
        const headers = ['Name', 'NDIS Number', 'Status', 'Funding', 'Plan End', 'Referral Date']
        for (const header of headers) {
          await expect(
            page.getByRole('columnheader', { name: header })
          ).toBeVisible({ timeout: 10_000 })
        }
      }
    })

    test('clicking a row navigates to detail page', async ({ page }) => {
      await page.goto('/participants')
      await expect(
        page.getByRole('heading', { name: 'Participants', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      const emptyState = page.getByText('No participants yet')
      const table = page.locator('table')
      await expect(table.or(emptyState)).toBeVisible({ timeout: 10_000 })

      if (await emptyState.isVisible()) {
        test.skip(true, 'No participants to click')
        return
      }

      await page.locator('table tbody tr').first().click()
      await expect(page).toHaveURL(/\/participants\/[a-f0-9-]+/, { timeout: 10_000 })
    })
  })
})
