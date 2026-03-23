import { test, expect } from '@playwright/test'
import { seedParticipant, cleanup } from '../../fixtures/test-data.fixture'

test.describe('S09: Risk Management Lifecycle @scenario', () => {
  let participantId: string
  let riskId: string | null = null

  test.beforeAll(async () => {
    const participant = await seedParticipant({
      first_name: 'E2E_Risk',
      last_name: 'TestParticipant',
    })
    participantId = participant.id
  })

  test.afterAll(async () => {
    if (riskId) {
      await cleanup('risks', [riskId])
    }
    await cleanup('participants', [participantId])
  })

  test('create a new risk with full form submission', async ({ page }) => {
    // Navigate to risk creation page
    await page.goto('/risks/new')
    await expect(
      page.getByRole('heading', { name: /risk/i }).first()
    ).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(2000)

    // Select participant from dropdown
    const participantTrigger = page
      .locator('[data-slot="select-trigger"]')
      .filter({ hasText: /select participant/i })
      .first()
    await participantTrigger.click()
    await page.waitForTimeout(1000)
    const participantOption = page.getByText('E2E_Risk TestParticipant').first()
    await participantOption.click()
    await page.waitForTimeout(1000)

    // Select category "Environmental"
    const categoryTrigger = page
      .locator('[data-slot="select-trigger"]')
      .filter({ hasText: /select category/i })
      .first()
    await categoryTrigger.click()
    await page.waitForTimeout(1000)
    await page.getByText('Environmental').first().click()
    await page.waitForTimeout(1000)

    // Fill title
    const titleInput = page.getByPlaceholder('Brief title for this risk...').first()
    await titleInput.fill('E2E Fall Risk Assessment')

    // Fill description
    const descriptionTextarea = page
      .getByPlaceholder(/Describe the risk in detail/i)
      .first()
    await descriptionTextarea.fill(
      'E2E automated test: Participant has a fall risk due to mobility issues and uneven flooring in the home environment.'
    )

    // Fill identified date (should already have today's date as default)
    const dateInput = page.locator('input[type="date"]').first()
    const today = new Date().toISOString().split('T')[0]
    await dateInput.fill(today)

    // Select likelihood "Possible" — the form defaults to "Possible" already,
    // but we click it explicitly to be thorough
    const likelihoodTrigger = page
      .locator('[data-slot="select-trigger"]')
      .filter({ hasText: /possible/i })
      .first()
    await likelihoodTrigger.click()
    await page.waitForTimeout(1000)
    await page.getByText('Possible').first().click()
    await page.waitForTimeout(1000)

    // Select consequence "Moderate" — also defaults, click explicitly
    const consequenceTrigger = page
      .locator('[data-slot="select-trigger"]')
      .filter({ hasText: /moderate/i })
      .first()
    await consequenceTrigger.click()
    await page.waitForTimeout(1000)
    await page.getByText('Moderate').first().click()
    await page.waitForTimeout(1000)

    // Verify the risk level auto-calculates
    // Possible (score 3) x Moderate (score 3) = 9, which yields "Medium"
    await expect(
      page.getByText('Calculated Risk Level:').first()
    ).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Medium').first()).toBeVisible({ timeout: 10_000 })

    // Click "Register Risk" submit button
    await page.getByRole('button', { name: /register risk/i }).first().click()

    // Expect success toast
    await expect(
      page.getByText('Risk registered successfully').first()
    ).toBeVisible({ timeout: 10_000 })

    // Should navigate to risks list or risk detail after creation
    await page.waitForTimeout(2000)
  })

  test('verify risk appears in the list', async ({ page }) => {
    await page.goto('/risks')
    await expect(
      page.getByRole('heading', { name: /Risk Register|Risks/i }).first()
    ).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(2000)

    // Search for the risk
    const searchInput = page.getByPlaceholder('Search risks...').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('E2E Fall Risk Assessment')
      await page.waitForTimeout(1500)
    }

    // Verify risk appears in the list
    await expect(
      page.getByText('E2E Fall Risk Assessment').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('view risk detail and verify data', async ({ page }) => {
    await page.goto('/risks')
    await expect(
      page.getByRole('heading', { name: /Risk Register|Risks/i }).first()
    ).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(2000)

    // Search for our specific risk
    const searchInput = page.getByPlaceholder('Search risks...').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('E2E Fall Risk Assessment')
      await page.waitForTimeout(1500)
    }

    // Click the risk row to view detail
    const riskRow = page.getByText('E2E Fall Risk Assessment').first()
    await expect(riskRow).toBeVisible({ timeout: 10_000 })
    await riskRow.click()
    await page.waitForTimeout(2000)

    // Verify we're on the detail page
    await expect(page).toHaveURL(/\/risks\/[a-zA-Z0-9-]+/, { timeout: 10_000 })

    // Capture the risk ID from the URL for cleanup
    const url = page.url()
    const match = url.match(/\/risks\/([a-zA-Z0-9-]+)/)
    if (match) {
      riskId = match[1]
    }

    // Verify risk title is shown in the heading
    await expect(
      page.getByText('E2E Fall Risk Assessment').first()
    ).toBeVisible({ timeout: 10_000 })

    // Verify risk level badge shows on the detail page
    // The StatusBadge renders the risk_level
    await expect(
      page.getByText(/medium/i).first()
    ).toBeVisible({ timeout: 10_000 })

    // Verify status shows "Active"
    await expect(
      page.getByText(/active/i).first()
    ).toBeVisible({ timeout: 10_000 })

    // Verify category shows "environmental"
    await expect(
      page.getByText(/environmental/i).first()
    ).toBeVisible({ timeout: 10_000 })

    // Verify likelihood and consequence are displayed
    await expect(
      page.getByText(/possible/i).first()
    ).toBeVisible({ timeout: 10_000 })
    await expect(
      page.getByText(/moderate/i).first()
    ).toBeVisible({ timeout: 10_000 })

    // Verify the description card
    await expect(
      page.getByText(/E2E automated test/).first()
    ).toBeVisible({ timeout: 10_000 })

    // Verify back button exists
    await expect(
      page.getByRole('button', { name: /back/i }).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('back button navigates to risks list', async ({ page }) => {
    // If we captured a risk ID, navigate directly to it
    if (riskId) {
      await page.goto(`/risks/${riskId}`)
    } else {
      // Navigate via list
      await page.goto('/risks')
      await expect(
        page.getByRole('heading', { name: /Risk/i }).first()
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      const table = page.locator('table').first()
      if (await table.isVisible()) {
        await table.locator('tbody tr').first().click()
        await page.waitForTimeout(2000)
      }
    }

    await expect(page).toHaveURL(/\/risks\/[a-zA-Z0-9-]+/, { timeout: 10_000 })

    // Click back button
    await page.getByRole('button', { name: /back/i }).first().click()
    await page.waitForTimeout(1500)

    // Verify we're back on the risks list
    await expect(page).toHaveURL(/\/risks$/, { timeout: 10_000 })
  })
})
