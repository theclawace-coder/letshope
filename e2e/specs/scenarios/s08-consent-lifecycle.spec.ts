import { test, expect } from '@playwright/test'
import { seedParticipant, cleanup, supabase } from '../../fixtures/test-data.fixture'
import { TEST_CONSENT } from '../../fixtures/constants'

const today = new Date().toISOString().split('T')[0]

test.describe('S08: Consent Full Lifecycle @scenario', () => {
  let participant: Record<string, unknown>
  const cleanupIds: {
    consent: string[]
    rights_acknowledgments: string[]
    capacity_assessments: string[]
    authorised_representatives: string[]
    participants: string[]
  } = {
    consent: [],
    rights_acknowledgments: [],
    capacity_assessments: [],
    authorised_representatives: [],
    participants: [],
  }

  test.beforeAll(async () => {
    participant = await seedParticipant({
      first_name: 'S08_Consent',
      last_name: 'Scenario',
    })
    cleanupIds.participants.push(participant.id as string)
  })

  test.afterAll(async () => {
    await cleanup('authorised_representatives', cleanupIds.authorised_representatives)
    await cleanup('capacity_assessments', cleanupIds.capacity_assessments)
    await cleanup('rights_acknowledgments', cleanupIds.rights_acknowledgments)
    await cleanup('consent_records', cleanupIds.consent)
    await cleanup('participants', cleanupIds.participants)
  })

  test.describe.serial('Create and manage consent record', () => {
    let consentId: string

    test('navigate to consent creation page', async ({ page }) => {
      await page.goto('/consent/new', { timeout: 15_000 })
      await page.waitForTimeout(2000)
      const heading = page.getByRole('heading', { name: /consent/i }).first()
      await expect(heading).toBeVisible({ timeout: 15_000 })
      await expect(page.locator('form')).toBeVisible({ timeout: 10_000 })
    })

    test('select participant from dropdown', async ({ page }) => {
      await page.goto('/consent/new', { timeout: 15_000 })
      await page.waitForTimeout(2000)

      const participantTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select participant/i })
        .first()
      await participantTrigger.click()
      await page.waitForTimeout(1000)

      const participantOption = page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: 'S08_Consent Scenario' })
        .first()
      await expect(participantOption).toBeVisible({ timeout: 10_000 })
      await participantOption.click()
      await page.waitForTimeout(500)

      // Verify participant was selected: "select participant" placeholder should be gone
      await expect(
        page.locator('[data-slot="select-trigger"]').filter({ hasText: /select participant/i })
      ).toHaveCount(0, { timeout: 5_000 })
    })

    test('select consent type Service Agreement', async ({ page }) => {
      await page.goto('/consent/new', { timeout: 15_000 })
      await page.waitForTimeout(2000)

      const typeTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select type/i })
        .first()
      await typeTrigger.click()
      await page.waitForTimeout(1000)

      const option = page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: /Service Agreement/i })
        .first()
      await expect(option).toBeVisible({ timeout: 10_000 })
      await option.click()
      await page.waitForTimeout(500)

      // Verify consent type was selected: "select type" placeholder should be gone
      await expect(
        page.locator('[data-slot="select-trigger"]').filter({ hasText: /select type/i })
      ).toHaveCount(0, { timeout: 5_000 })
    })

    test('fill full consent form and submit', async ({ page }) => {
      await page.goto('/consent/new', { timeout: 15_000 })
      await page.waitForTimeout(2000)

      // Select participant
      const participantTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select participant/i })
        .first()
      await participantTrigger.click()
      await page.waitForTimeout(1000)
      await page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: 'S08_Consent Scenario' })
        .first()
        .click()
      await page.waitForTimeout(500)

      // Select consent type
      const typeTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select type/i })
        .first()
      await typeTrigger.click()
      await page.waitForTimeout(1000)
      await page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: /Service Agreement/i })
        .first()
        .click()
      await page.waitForTimeout(500)

      // Fill title
      const titleInput = page.getByPlaceholder(/consent for information sharing/i).first()
      await expect(titleInput).toBeVisible({ timeout: 10_000 })
      await titleInput.fill('E2E Test Service Agreement Consent')

      // Fill scope
      const scopeTextarea = page.getByPlaceholder(/what specifically is being consented/i).first()
      await expect(scopeTextarea).toBeVisible({ timeout: 10_000 })
      await scopeTextarea.fill('Consent for all support services under NDIS plan')

      // Select method (Written is default, but let's verify it's set)
      // The method select should already have "Written" as default
      const methodTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /written|select method/i })
        .first()
      if (await methodTrigger.isVisible()) {
        // If it says "Select method", we need to pick Written
        const triggerText = await methodTrigger.textContent()
        if (triggerText && /select method/i.test(triggerText)) {
          await methodTrigger.click()
          await page.waitForTimeout(1000)
          await page
            .locator('[data-slot="select-item"], [role="option"]')
            .filter({ hasText: /^Written$/i })
            .first()
            .click()
          await page.waitForTimeout(500)
        }
      }

      // Fill given date
      const dateInputs = page.locator('input[type="date"]')
      const givenDateInput = dateInputs.first()
      await givenDateInput.fill(today)

      // Fill given by name
      const givenByInput = page.getByPlaceholder('Name of person providing consent').first()
      await expect(givenByInput).toBeVisible({ timeout: 10_000 })
      await givenByInput.fill('E2E Test Person')

      // Submit
      const submitBtn = page.getByRole('button', { name: /record consent/i }).first()
      await expect(submitBtn).toBeVisible({ timeout: 10_000 })
      await submitBtn.click()

      // Expect toast
      await expect(
        page.getByText(/consent recorded/i).first()
      ).toBeVisible({ timeout: 15_000 })

      // Should redirect to consent list or detail page
      await expect(page).toHaveURL(/\/consent/, { timeout: 15_000 })
      await page.waitForTimeout(2000)

      // Extract consent ID from URL if on detail page
      const url = page.url()
      const match = url.match(/\/consent\/([a-f0-9-]{36})/)
      if (match) {
        consentId = match[1]
        cleanupIds.consent.push(consentId)
      } else {
        // Redirected to list page - fetch the latest consent from DB
        const { data: consents } = await supabase
          .from('consent_records')
          .select('id')
          .eq('participant_id', participant.id as string)
          .order('created_at', { ascending: false })
          .limit(1)
        if (consents && consents.length > 0) {
          consentId = consents[0].id
          cleanupIds.consent.push(consentId)
        }
      }
    })

    test('verify consent appears in list', async ({ page }) => {
      test.skip(!consentId, 'No consent created in previous test')
      await page.goto('/consent', { timeout: 15_000 })
      await page.waitForTimeout(2000)
      const heading = page.getByRole('heading', { name: /consent/i }).first()
      await expect(heading).toBeVisible({ timeout: 15_000 })

      await expect(
        page.getByText('S08_Consent').first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('click to view consent detail from list', async ({ page }) => {
      test.skip(!consentId, 'No consent created in previous test')
      await page.goto('/consent', { timeout: 15_000 })
      await page.waitForTimeout(2000)

      const table = page.locator('table')
      if (await table.isVisible()) {
        const row = table.locator('tbody tr').filter({ hasText: 'S08_Consent' }).first()
        await expect(row).toBeVisible({ timeout: 10_000 })
        await row.click()
        await expect(page).toHaveURL(/\/consent\/[a-zA-Z0-9-]+/, { timeout: 10_000 })
      }
    })

    test('verify consent detail page shows Active status', async ({ page }) => {
      test.skip(!consentId, 'No consent created in previous test')
      await page.goto(`/consent/${consentId}`, { timeout: 15_000 })
      await page.waitForTimeout(2000)

      // Verify status is Active
      await expect(
        page.getByText(/active/i).first()
      ).toBeVisible({ timeout: 10_000 })

      // Verify title
      await expect(
        page.getByText('E2E Test Service Agreement Consent').first()
      ).toBeVisible({ timeout: 10_000 })

      // Verify participant name
      await expect(
        page.getByText('S08_Consent Scenario').first()
      ).toBeVisible({ timeout: 10_000 })

      // Verify scope
      await expect(
        page.getByText('Consent for all support services under NDIS plan').first()
      ).toBeVisible({ timeout: 10_000 })

      // Verify consent type badge
      await expect(
        page.getByText(/service agreement/i).first()
      ).toBeVisible({ timeout: 10_000 })
    })
  })

  test.describe.serial('Rights Acknowledgment sub-form', () => {
    let rightsId: string

    test('navigate to rights acknowledgment form', async ({ page }) => {
      await page.goto('/consent/rights/new', { timeout: 15_000 })
      await page.waitForTimeout(2000)
      const heading = page.getByRole('heading', { name: /rights/i }).first()
      await expect(heading).toBeVisible({ timeout: 15_000 })
    })

    test('fill and submit rights acknowledgment form', async ({ page }) => {
      await page.goto('/consent/rights/new', { timeout: 15_000 })
      await page.waitForTimeout(2000)

      // Select participant
      const participantTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select participant/i })
        .first()
      await participantTrigger.click()
      await page.waitForTimeout(1000)
      await page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: 'S08_Consent Scenario' })
        .first()
        .click()
      await page.waitForTimeout(500)

      // Fill acknowledged date
      const dateInput = page.locator('input[type="date"]').first()
      await dateInput.fill(today)

      // Check the accessibility toggles
      const checkboxes = page.locator('input[type="checkbox"]')
      const checkboxCount = await checkboxes.count()
      for (let i = 0; i < Math.min(checkboxCount, 3); i++) {
        await checkboxes.nth(i).check()
        await page.waitForTimeout(200)
      }

      // Fill acknowledged by name
      const nameInput = page.getByPlaceholder('Name of person acknowledging').first()
      await expect(nameInput).toBeVisible({ timeout: 10_000 })
      await nameInput.fill('E2E Test Acknowledger')

      // Submit
      const submitBtn = page.getByRole('button', { name: /record acknowledgment/i }).first()
      await expect(submitBtn).toBeVisible({ timeout: 10_000 })
      await submitBtn.click()

      // Expect success
      await expect(
        page.getByText(/recorded|saved|created|success/i).first()
      ).toBeVisible({ timeout: 15_000 })

      await page.waitForTimeout(2000)

      // Try to extract ID from URL or response
      const url = page.url()
      const match = url.match(/\/consent\/rights\/([a-zA-Z0-9-]+)/)
      if (match && match[1] !== 'new') {
        rightsId = match[1]
        cleanupIds.rights_acknowledgments.push(rightsId)
      }
    })
  })

  test.describe.serial('Capacity Assessment sub-form', () => {
    let capacityId: string

    test('navigate to capacity assessment form', async ({ page }) => {
      await page.goto('/consent/capacity/new', { timeout: 15_000 })
      await page.waitForTimeout(2000)
      const heading = page.getByRole('heading', { name: /capacity/i }).first()
      await expect(heading).toBeVisible({ timeout: 15_000 })
    })

    test('fill and submit capacity assessment form', async ({ page }) => {
      await page.goto('/consent/capacity/new', { timeout: 15_000 })
      await page.waitForTimeout(2000)

      // Select participant
      const participantTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select participant/i })
        .first()
      await participantTrigger.click()
      await page.waitForTimeout(1000)
      await page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: 'S08_Consent Scenario' })
        .first()
        .click()
      await page.waitForTimeout(500)

      // Select capacity level (Full Capacity is default, keep it)
      // The capacity level dropdown is the second select trigger on the page (after participant)
      // Look for it by broader matching or by position
      const capacityTrigger = page.locator('[data-slot="select-trigger"]')
        .filter({ hasText: /full|capacity|select.*level|select.*capacity/i })
        .first()
      if (await capacityTrigger.isVisible({ timeout: 5_000 }).catch(() => false)) {
        // It's already set, no action needed
      }

      // Fill assessment date
      const dateInput = page.locator('input[type="date"]').first()
      await dateInput.fill(today)

      // Fill assessed by name
      const assessorInput = page.getByPlaceholder('Name of assessor').first()
      await expect(assessorInput).toBeVisible({ timeout: 10_000 })
      await assessorInput.fill('E2E Test Assessor')

      // Fill assessor role
      const roleInput = page.getByPlaceholder(/psychologist.*social worker/i).first()
      if (await roleInput.isVisible()) {
        await roleInput.fill('Psychologist')
      }

      // Fill assessment summary
      const summaryTextarea = page.getByPlaceholder(/provide a summary/i).first()
      await expect(summaryTextarea).toBeVisible({ timeout: 10_000 })
      await summaryTextarea.fill('E2E test capacity assessment: participant demonstrates full capacity for decision-making across all assessed domains.')

      // Submit
      const submitBtn = page.getByRole('button', { name: /save assessment/i }).first()
      await expect(submitBtn).toBeVisible({ timeout: 10_000 })
      await submitBtn.click()

      // Expect success
      await expect(
        page.getByText(/saved|recorded|created|success/i).first()
      ).toBeVisible({ timeout: 15_000 })

      await page.waitForTimeout(2000)

      const url = page.url()
      const match = url.match(/\/consent\/capacity\/([a-zA-Z0-9-]+)/)
      if (match && match[1] !== 'new') {
        capacityId = match[1]
        cleanupIds.capacity_assessments.push(capacityId)
      }
    })
  })

  test.describe.serial('Authorised Representative sub-form', () => {
    let repId: string

    test('navigate to authorised representative form', async ({ page }) => {
      await page.goto('/consent/representatives/new', { timeout: 15_000 })
      await page.waitForTimeout(2000)
      const heading = page.getByRole('heading', { name: /representative|authorised/i }).first()
      await expect(heading).toBeVisible({ timeout: 15_000 })
    })

    test('fill and submit authorised representative form', async ({ page }) => {
      await page.goto('/consent/representatives/new', { timeout: 15_000 })
      await page.waitForTimeout(2000)

      // Select participant
      const participantTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select participant/i })
        .first()
      await participantTrigger.click()
      await page.waitForTimeout(1000)
      await page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: 'S08_Consent Scenario' })
        .first()
        .click()
      await page.waitForTimeout(500)

      // Fill full name
      const nameInput = page.getByPlaceholder("Representative's full name").first()
      await expect(nameInput).toBeVisible({ timeout: 10_000 })
      await nameInput.fill('E2E Test Representative')

      // Fill relationship
      const relationshipInput = page.getByPlaceholder(/parent.*spouse.*sibling/i).first()
      await expect(relationshipInput).toBeVisible({ timeout: 10_000 })
      await relationshipInput.fill('Parent')

      // Select authority type
      const authorityTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select authority type/i })
        .first()
      await authorityTrigger.click()
      await page.waitForTimeout(1000)
      await page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: /Guardian/i })
        .first()
        .click()
      await page.waitForTimeout(500)

      // Fill authority start date
      const dateInput = page.locator('input[type="date"]').first()
      await dateInput.fill(today)

      // Submit
      const submitBtn = page.getByRole('button', { name: /save representative/i }).first()
      await expect(submitBtn).toBeVisible({ timeout: 10_000 })
      await submitBtn.click()

      // Expect success
      await expect(
        page.getByText(/saved|recorded|created|success/i).first()
      ).toBeVisible({ timeout: 15_000 })

      await page.waitForTimeout(2000)

      const url = page.url()
      const match = url.match(/\/consent\/representatives\/([a-zA-Z0-9-]+)/)
      if (match && match[1] !== 'new') {
        repId = match[1]
        cleanupIds.authorised_representatives.push(repId)
      }
    })
  })

  test.describe('Consent form validation', () => {
    test('empty consent form submission stays on page', async ({ page }) => {
      await page.goto('/consent/new', { timeout: 15_000 })
      await page.waitForTimeout(2000)

      const submitBtn = page.getByRole('button', { name: /record consent/i }).first()
      await submitBtn.click()
      await page.waitForTimeout(1000)

      await expect(page).toHaveURL(/\/consent\/new/, { timeout: 5_000 })
    })

    test('consent form has all required fields visible', async ({ page }) => {
      await page.goto('/consent/new', { timeout: 15_000 })
      await page.waitForTimeout(2000)

      await expect(page.getByText(/Participant/i).first()).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(/Consent Type/i).first()).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(/Title/i).first()).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(/Scope/i).first()).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(/Method/i).first()).toBeVisible({ timeout: 10_000 })
    })
  })

  test.describe('Consent list page features', () => {
    test('Record Consent button is visible', async ({ page }) => {
      await page.goto('/consent', { timeout: 15_000 })
      await page.waitForTimeout(2000)
      const heading = page.getByRole('heading', { name: /consent/i }).first()
      await expect(heading).toBeVisible({ timeout: 15_000 })

      await expect(
        page.getByRole('button', { name: /record consent/i }).first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('consent list page loads and shows content', async ({ page }) => {
      await page.goto('/consent', { timeout: 15_000 })
      await page.waitForTimeout(2000)
      const heading = page.getByRole('heading', { name: /consent/i }).first()
      await expect(heading).toBeVisible({ timeout: 15_000 })

      // Should have some content in main area
      const mainText = await page.locator('main').textContent()
      expect(mainText?.length).toBeGreaterThan(10)
    })
  })
})
