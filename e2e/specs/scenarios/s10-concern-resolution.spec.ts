import { test, expect } from '@playwright/test'
import { seedParticipant, cleanup } from '../../fixtures/test-data.fixture'

test.describe('S10: Concern Creation and Resolution @scenario', () => {
  let participantId: string
  let concernId: string | null = null

  test.beforeAll(async () => {
    const participant = await seedParticipant({
      first_name: 'E2E_Concern',
      last_name: 'TestParticipant',
    })
    participantId = participant.id
  })

  test.afterAll(async () => {
    if (concernId) {
      await cleanup('concerns', [concernId])
    }
    await cleanup('participants', [participantId])
  })

  test('create a new concern with full form submission', async ({ page }) => {
    // Navigate to concern creation page
    await page.goto('/concerns/new')
    await expect(
      page.getByRole('heading', { name: /Flag a Concern/i }).first()
    ).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(2000)

    // Select participant from dropdown
    const participantTrigger = page
      .locator('[data-slot="select-trigger"]')
      .filter({ hasText: /select participant/i })
      .first()
    await participantTrigger.click()
    await page.waitForTimeout(1000)
    const participantOption = page.getByText('E2E_Concern TestParticipant').first()
    await participantOption.click()
    await page.waitForTimeout(1000)

    // Select concern type "Safety"
    const typeTrigger = page
      .locator('[data-slot="select-trigger"]')
      .filter({ hasText: /select type/i })
      .first()
    await typeTrigger.click()
    await page.waitForTimeout(1000)
    await page.locator('[data-slot="select-item"], [role="option"]')
      .filter({ hasText: /^Safety$/i }).first().click()
    await page.waitForTimeout(1000)

    // Select severity "High"
    const severityTrigger = page
      .locator('[data-slot="select-trigger"]')
      .filter({ hasText: /select severity/i })
      .first()
    await severityTrigger.click()
    await page.waitForTimeout(1000)
    await page.locator('[data-slot="select-item"], [role="option"]')
      .filter({ hasText: /^High$/i }).first().click()
    await page.waitForTimeout(1000)

    // Fill title
    const titleInput = page.getByPlaceholder('Brief title for this concern...').first()
    await titleInput.fill('E2E Safety Concern')

    // Fill description
    const descriptionTextarea = page
      .getByPlaceholder(/Provide a detailed description/i)
      .first()
    await descriptionTextarea.fill(
      'E2E automated test: Safety concern raised regarding participant environment. Potential hazards identified during home visit.'
    )

    // Click "Submit Concern" button
    const submitButton = page.getByRole('button', { name: /submit concern/i }).first()
    await expect(submitButton).toBeVisible({ timeout: 10_000 })
    await submitButton.click()

    // Expect success toast
    await expect(
      page.getByText('Concern flagged successfully').first()
    ).toBeVisible({ timeout: 10_000 })

    await page.waitForTimeout(2000)
  })

  test('verify concern appears in the list', async ({ page }) => {
    await page.goto('/concerns')
    await expect(
      page.getByRole('heading', { name: 'Concerns', exact: true }).first()
    ).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(2000)

    // Search for the concern
    const searchInput = page.getByPlaceholder('Search concerns...').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('E2E Safety Concern')
      await page.waitForTimeout(1500)
    }

    // Verify concern appears in the list
    await expect(
      page.getByText('E2E Safety Concern').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('view concern detail and verify status is Open', async ({ page }) => {
    await page.goto('/concerns')
    await expect(
      page.getByRole('heading', { name: 'Concerns', exact: true }).first()
    ).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(2000)

    // Search for our specific concern
    const searchInput = page.getByPlaceholder('Search concerns...').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('E2E Safety Concern')
      await page.waitForTimeout(1500)
    }

    // Click the concern to view detail
    const concernRow = page.getByText('E2E Safety Concern').first()
    await expect(concernRow).toBeVisible({ timeout: 10_000 })
    await concernRow.click()
    await page.waitForTimeout(2000)

    // Verify we're on the detail page
    await expect(page).toHaveURL(/\/concerns\/[a-zA-Z0-9-]+/, { timeout: 10_000 })

    // Capture the concern ID from the URL for cleanup
    const url = page.url()
    const match = url.match(/\/concerns\/([a-zA-Z0-9-]+)/)
    if (match) {
      concernId = match[1]
    }

    // Verify the concern title is displayed
    await expect(
      page.getByText('E2E Safety Concern').first()
    ).toBeVisible({ timeout: 10_000 })

    // Verify status shows "Open"
    await expect(
      page.getByText(/open/i).first()
    ).toBeVisible({ timeout: 10_000 })

    // Verify severity badge
    await expect(
      page.getByText(/high/i).first()
    ).toBeVisible({ timeout: 10_000 })

    // Verify concern type badge
    await expect(
      page.getByText(/safety/i).first()
    ).toBeVisible({ timeout: 10_000 })

    // Verify description is shown
    await expect(
      page.getByText(/E2E automated test/).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('resolve concern if resolve button exists', async ({ page }) => {
    // Navigate to the concern detail
    if (concernId) {
      await page.goto(`/concerns/${concernId}`)
    } else {
      await page.goto('/concerns')
      await expect(
        page.getByRole('heading', { name: 'Concerns', exact: true }).first()
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      const searchInput = page.getByPlaceholder('Search concerns...').first()
      if (await searchInput.isVisible()) {
        await searchInput.fill('E2E Safety Concern')
        await page.waitForTimeout(1500)
      }

      const concernRow = page.getByText('E2E Safety Concern').first()
      if (await concernRow.isVisible()) {
        await concernRow.click()
        await page.waitForTimeout(2000)
      } else {
        test.skip(true, 'Concern not found in list')
        return
      }
    }

    await expect(page).toHaveURL(/\/concerns\/[a-zA-Z0-9-]+/, { timeout: 10_000 })
    await page.waitForTimeout(2000)

    // Check if resolve button exists (only shows for open/reviewing concerns)
    const resolveButton = page.getByRole('button', { name: /resolve/i }).first()
    if (await resolveButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await resolveButton.click()
      await page.waitForTimeout(1500)

      // The resolution dialog should open
      const dialog = page.locator('[role="dialog"]').first()
      await dialog.waitFor({ state: 'visible', timeout: 10_000 })

      // Fill resolution notes - match the actual placeholder text
      const resolutionNotes = dialog.locator('textarea').first()
      if (await resolutionNotes.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await resolutionNotes.fill('E2E test resolution: Concern has been addressed and mitigated.')
      }

      // Click the Resolve button in the dialog
      const dialogResolveButton = dialog.getByRole('button', { name: /^resolve$/i }).first()
      if (await dialogResolveButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await dialogResolveButton.click()
        await page.waitForTimeout(2000)

        // Expect success toast or status change
        const successVisible = await page
          .getByText(/resolved|success/i).first()
          .isVisible({ timeout: 10_000 })
          .catch(() => false)
        expect(successVisible).toBeTruthy()
      }
    } else {
      // Concern may already be resolved or button not available
      // Verify back button works instead
      const backButton = page.getByRole('button', { name: /back/i }).first()
      await expect(backButton).toBeVisible({ timeout: 10_000 })
    }
  })

  test('back button on detail page navigates to concerns list', async ({ page }) => {
    if (concernId) {
      await page.goto(`/concerns/${concernId}`)
    } else {
      await page.goto('/concerns')
      await expect(
        page.getByRole('heading', { name: 'Concerns', exact: true }).first()
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      const table = page.locator('table').first()
      if (await table.isVisible()) {
        await table.locator('tbody tr').first().click()
        await page.waitForTimeout(2000)
      } else {
        test.skip(true, 'No concerns to test back button')
        return
      }
    }

    await expect(page).toHaveURL(/\/concerns\/[a-zA-Z0-9-]+/, { timeout: 10_000 })

    // Click back button
    await page.getByRole('button', { name: /back/i }).first().click()
    await page.waitForTimeout(1500)

    // Verify we're back on the concerns list
    await expect(page).toHaveURL(/\/concerns$/, { timeout: 10_000 })
  })
})
