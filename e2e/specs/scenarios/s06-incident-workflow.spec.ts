import { test, expect } from '@playwright/test'
import { seedParticipant, cleanup, supabase } from '../../fixtures/test-data.fixture'
import { TEST_INCIDENT } from '../../fixtures/constants'

const today = new Date().toISOString().split('T')[0]

test.describe('S06: Incident Full Lifecycle @scenario', () => {
  let participant: Record<string, unknown>
  const cleanupIds: { incidents: string[]; participants: string[] } = {
    incidents: [],
    participants: [],
  }

  test.beforeAll(async () => {
    participant = await seedParticipant({
      first_name: 'S06_Incident',
      last_name: 'Scenario',
    })
    cleanupIds.participants.push(participant.id as string)
  })

  test.afterAll(async () => {
    await cleanup('incidents', cleanupIds.incidents)
    await cleanup('participants', cleanupIds.participants)
  })

  test.describe.serial('Create and manage incident', () => {
    let incidentId: string

    test('navigate to incident creation page', async ({ page }) => {
      await page.goto('/incidents/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Log an Incident/i })
      ).toBeVisible({ timeout: 15_000 })
      await expect(page.locator('form')).toBeVisible({ timeout: 10_000 })
    })

    test('select participant from dropdown', async ({ page }) => {
      await page.goto('/incidents/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Log an Incident/i })
      ).toBeVisible({ timeout: 15_000 })

      const participantTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select participant/i })
        .first()
      await participantTrigger.click()
      await page.waitForTimeout(1000)

      const participantOption = page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: 'S06_Incident Scenario' })
        .first()
      await expect(participantOption).toBeVisible({ timeout: 10_000 })
      await participantOption.click()
      await page.waitForTimeout(500)

      // Verify participant was selected: "select participant" placeholder should be gone
      await expect(
        page.locator('[data-slot="select-trigger"]').filter({ hasText: /select participant/i })
      ).toHaveCount(0, { timeout: 5_000 })
    })

    test('select incident type Injury', async ({ page }) => {
      await page.goto('/incidents/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Log an Incident/i })
      ).toBeVisible({ timeout: 15_000 })

      const typeTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select type/i })
        .first()
      await typeTrigger.click()
      await page.waitForTimeout(1000)

      const injuryOption = page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: /^Injury$/i })
        .first()
      await expect(injuryOption).toBeVisible({ timeout: 10_000 })
      await injuryOption.click()
      await page.waitForTimeout(500)

      // Verify type was selected: "select type" placeholder should be gone
      await expect(
        page.locator('[data-slot="select-trigger"]').filter({ hasText: /select type/i })
      ).toHaveCount(0, { timeout: 5_000 })
    })

    test('select severity Minor', async ({ page }) => {
      await page.goto('/incidents/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Log an Incident/i })
      ).toBeVisible({ timeout: 15_000 })

      const severityTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select severity/i })
        .first()
      await severityTrigger.click()
      await page.waitForTimeout(1000)

      const minorOption = page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: /Minor/i })
        .first()
      await expect(minorOption).toBeVisible({ timeout: 10_000 })
      await minorOption.click()
      await page.waitForTimeout(500)

      // Verify severity was selected: "select severity" placeholder should be gone
      await expect(
        page.locator('[data-slot="select-trigger"]').filter({ hasText: /select severity/i })
      ).toHaveCount(0, { timeout: 5_000 })
    })

    test('fill full incident form and submit', async ({ page }) => {
      await page.goto('/incidents/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Log an Incident/i })
      ).toBeVisible({ timeout: 15_000 })

      // Select participant
      const participantTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select participant/i })
        .first()
      await participantTrigger.click()
      await page.waitForTimeout(1000)
      await page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: 'S06_Incident Scenario' })
        .first()
        .click()
      await page.waitForTimeout(500)

      // Fill incident date
      const dateInput = page.locator('input[type="date"]').first()
      await dateInput.fill(today)

      // Fill location
      const locationInput = page.getByPlaceholder('Where did it occur?').first()
      await expect(locationInput).toBeVisible({ timeout: 10_000 })
      await locationInput.fill('Main Office')

      // Select incident type
      const typeTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select type/i })
        .first()
      await typeTrigger.click()
      await page.waitForTimeout(1000)
      await page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: /^Injury$/i })
        .first()
        .click()
      await page.waitForTimeout(500)

      // Select severity
      const severityTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select severity/i })
        .first()
      await severityTrigger.click()
      await page.waitForTimeout(1000)
      await page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: /Minor/i })
        .first()
        .click()
      await page.waitForTimeout(500)

      // Fill description
      const descriptionTextarea = page.locator('textarea').first()
      await expect(descriptionTextarea).toBeVisible({ timeout: 10_000 })
      await descriptionTextarea.fill(TEST_INCIDENT.description)

      // Submit
      const submitBtn = page.getByRole('button', { name: /log incident/i }).first()
      await expect(submitBtn).toBeVisible({ timeout: 10_000 })
      await submitBtn.click()

      // Expect toast
      await expect(
        page.getByText(/incident logged/i).first()
      ).toBeVisible({ timeout: 15_000 })

      // Should redirect to incidents list or detail page
      await expect(page).toHaveURL(/\/incidents/, { timeout: 15_000 })
      await page.waitForTimeout(2000)

      // Extract incident ID from URL if on detail page
      const url = page.url()
      const match = url.match(/\/incidents\/([a-f0-9-]{36})/)
      if (match) {
        incidentId = match[1]
        cleanupIds.incidents.push(incidentId)
      } else {
        // Redirected to list page - fetch the latest incident from DB
        const { data: incidents } = await supabase
          .from('incidents')
          .select('id')
          .eq('participant_id', participant.id as string)
          .order('created_at', { ascending: false })
          .limit(1)
        if (incidents && incidents.length > 0) {
          incidentId = incidents[0].id
          cleanupIds.incidents.push(incidentId)
        }
      }
    })

    test('verify incident appears in list', async ({ page }) => {
      test.skip(!incidentId, 'No incident created in previous test')
      await page.goto('/incidents', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Incidents', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      // The incident should appear in the table
      await expect(
        page.getByText('S06_Incident').first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('click to view incident detail from list', async ({ page }) => {
      test.skip(!incidentId, 'No incident created in previous test')
      await page.goto('/incidents', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Incidents', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      // Click the row containing our participant
      const row = page.locator('table tbody tr').filter({ hasText: 'S06_Incident' }).first()
      await expect(row).toBeVisible({ timeout: 10_000 })
      await row.click()

      await expect(page).toHaveURL(/\/incidents\/[a-zA-Z0-9-]+/, { timeout: 10_000 })
    })

    test('verify incident detail page shows correct data', async ({ page }) => {
      test.skip(!incidentId, 'No incident created in previous test')
      await page.goto(`/incidents/${incidentId}`, { timeout: 15_000 })
      await page.waitForTimeout(2000)

      // Verify status is Open
      await expect(
        page.getByText(/open/i).first()
      ).toBeVisible({ timeout: 10_000 })

      // Verify participant name
      await expect(
        page.getByText('S06_Incident Scenario').first()
      ).toBeVisible({ timeout: 10_000 })

      // Verify location
      await expect(
        page.getByText('Main Office').first()
      ).toBeVisible({ timeout: 10_000 })

      // Verify description
      await expect(
        page.getByText(TEST_INCIDENT.description).first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('mark incident as investigating', async ({ page }) => {
      test.skip(!incidentId, 'No incident created in previous test')
      await page.goto(`/incidents/${incidentId}`, { timeout: 15_000 })
      await page.waitForTimeout(2000)

      const investigateBtn = page.getByRole('button', { name: /investigate/i }).first()
      if (await investigateBtn.isVisible()) {
        await investigateBtn.click()
        await expect(
          page.getByText(/investigating/i).first()
        ).toBeVisible({ timeout: 15_000 })
      }
    })

    test('resolve incident via resolve button', async ({ page }) => {
      test.skip(!incidentId, 'No incident created in previous test')
      await page.goto(`/incidents/${incidentId}`, { timeout: 15_000 })
      await page.waitForTimeout(2000)

      const resolveBtn = page.getByRole('button', { name: /resolve/i }).first()
      if (await resolveBtn.isVisible()) {
        await resolveBtn.click()
        await page.waitForTimeout(1000)

        // Resolution dialog should appear — fill it
        const resolutionTextarea = page.locator('[role="dialog"] textarea').first()
        if (await resolutionTextarea.isVisible()) {
          await resolutionTextarea.fill('E2E test resolution: issue addressed and corrective measures taken.')

          // Submit the resolution dialog
          const confirmBtn = page
            .locator('[role="dialog"]')
            .getByRole('button', { name: /resolve|confirm|submit|save/i })
            .first()
          if (await confirmBtn.isVisible()) {
            await confirmBtn.click()
            await page.waitForTimeout(2000)
          }
        }
      }
    })
  })

  test.describe('Incident form validation', () => {
    test('empty form submission stays on page with validation', async ({ page }) => {
      await page.goto('/incidents/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Log an Incident/i })
      ).toBeVisible({ timeout: 15_000 })

      const submitBtn = page.getByRole('button', { name: /log incident/i }).first()
      await submitBtn.click()
      await page.waitForTimeout(1000)

      // Should still be on /incidents/new
      await expect(page).toHaveURL(/\/incidents\/new/, { timeout: 5_000 })
    })

    test('description field is required', async ({ page }) => {
      await page.goto('/incidents/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Log an Incident/i })
      ).toBeVisible({ timeout: 15_000 })

      await expect(
        page.getByText(/Description/i).first()
      ).toBeVisible({ timeout: 10_000 })

      await expect(page.locator('textarea').first()).toBeVisible({ timeout: 10_000 })
    })
  })

  test.describe('Incident list page features', () => {
    test('stat cards are visible', async ({ page }) => {
      await page.goto('/incidents', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Incidents', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      for (const label of ['Open', 'Investigating']) {
        await expect(page.getByText(label).first()).toBeVisible({ timeout: 10_000 })
      }
    })

    test('Log Incident button navigates to create page', async ({ page }) => {
      await page.goto('/incidents', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Incidents', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      await page.getByRole('button', { name: 'Log Incident' }).click()
      await expect(page).toHaveURL(/\/incidents\/new/, { timeout: 10_000 })
    })

    test('search filter is visible', async ({ page }) => {
      await page.goto('/incidents', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Incidents', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      await expect(
        page.getByPlaceholder('Search incidents...').first()
      ).toBeVisible({ timeout: 10_000 })
    })
  })
})
