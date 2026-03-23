import { test, expect } from '@playwright/test'
import { TEST_PROGRESS_NOTE, TEST_CONCERN } from '../../fixtures/constants'
import {
  supabase,
  seedParticipant,
  seedWorker,
  cleanup,
} from '../../fixtures/test-data.fixture'

const UNIQUE_SUFFIX = Date.now().toString().slice(-6)
const NOTE_CONTENT = `E2E progress note content ${UNIQUE_SUFFIX} - Participant attended session and engaged well.`
const CONCERN_TITLE = `E2E Concern ${UNIQUE_SUFFIX}`
const CONCERN_DESC = `Automated E2E concern description ${UNIQUE_SUFFIX}`
const TODAY = new Date().toISOString().split('T')[0]

/** Helper: open a base-ui select and pick a visible option */
async function selectOption(
  page: import('@playwright/test').Page,
  triggerLocator: import('@playwright/test').Locator,
  optionText: string | RegExp,
) {
  await triggerLocator.click()
  await page.waitForTimeout(1000)
  // Use the listbox role to find the currently open dropdown, then select within it
  const listbox = page.locator('[role="listbox"]:visible').first()
  await listbox.waitFor({ state: 'visible', timeout: 10_000 })
  const option = listbox.locator('[data-slot="select-item"]')
    .filter({ hasText: optionText }).first()
  await option.click()
  await page.waitForTimeout(300)
}

test.describe('S04: Progress Note with Concern @scenario', () => {
  let seededParticipant: { id: string; first_name: string; last_name: string }
  let seededWorker: { id: string; first_name: string; last_name: string }
  const createdNoteIds: string[] = []
  const createdConcernIds: string[] = []
  const createdParticipantIds: string[] = []
  const createdWorkerIds: string[] = []

  test.beforeAll(async () => {
    seededParticipant = await seedParticipant({
      first_name: `E2E_NoteSeed_${UNIQUE_SUFFIX}`,
      last_name: 'Participant',
    })
    createdParticipantIds.push(seededParticipant.id)

    seededWorker = await seedWorker({
      first_name: `E2E_NoteSeed_${UNIQUE_SUFFIX}`,
      last_name: 'Worker',
    })
    createdWorkerIds.push(seededWorker.id)
  })

  test.afterAll(async () => {
    // Delete concerns first (may reference progress notes)
    await cleanup('concerns', createdConcernIds)
    await cleanup('progress_notes', createdNoteIds)
    // Clean up onboarding workflows referencing participants
    await supabase.from('onboarding_workflows').delete().in('participant_id', createdParticipantIds)
    await supabase.from('worker_onboarding_workflows').delete().in('worker_id', createdWorkerIds)
    await cleanup('participants', createdParticipantIds)
    await cleanup('workers', createdWorkerIds)
  })

  test.describe.serial('Create Progress Note with Concern', () => {
    test('S04-01: navigate to New Progress Note page', async ({ page }) => {
      await page.goto('/progress-notes/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'New Progress Note' })
      ).toBeVisible({ timeout: 15_000 })

      // Verify key form sections
      await expect(page.getByText('Note Details').first()).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText('Observations & Actions').first()).toBeVisible({ timeout: 10_000 })
    })

    test('S04-02: select participant from dropdown', async ({ page }) => {
      await page.goto('/progress-notes/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'New Progress Note' })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      // Click participant select trigger
      const participantTrigger = page.locator('[data-slot="select-trigger"]')
        .filter({ hasText: /Select participant/i }).first()
      await participantTrigger.click()
      await page.waitForTimeout(1000)

      // Select the seeded participant
      const participantOption = page.locator('[data-slot="select-item"]')
        .filter({ hasText: seededParticipant.first_name }).first()
      await participantOption.click()
      await page.waitForTimeout(500)

      // Verify participant was selected: "Select participant" placeholder should be gone
      await expect(
        page.locator('[data-slot="select-trigger"]').filter({ hasText: /Select participant/i })
      ).toHaveCount(0, { timeout: 5_000 })
    })

    test('S04-03: select worker from dropdown', async ({ page }) => {
      await page.goto('/progress-notes/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'New Progress Note' })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      // Click worker select trigger
      const workerTrigger = page.locator('[data-slot="select-trigger"]')
        .filter({ hasText: /Select worker/i }).first()
      await workerTrigger.click()
      await page.waitForTimeout(1000)

      // Select the seeded worker
      const workerOption = page.locator('[data-slot="select-item"]')
        .filter({ hasText: seededWorker.first_name }).first()
      await workerOption.click()
      await page.waitForTimeout(500)

      // Verify worker was selected: "Select worker" placeholder should be gone
      await expect(
        page.locator('[data-slot="select-trigger"]').filter({ hasText: /Select worker/i })
      ).toHaveCount(0, { timeout: 5_000 })
    })

    test('S04-04: fill complete progress note with concern and submit', async ({ page }) => {
      await page.goto('/progress-notes/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'New Progress Note' })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      // 1. Select participant
      const participantTrigger = page.locator('[data-slot="select-trigger"]')
        .filter({ hasText: /Select participant/i }).first()
      await selectOption(page, participantTrigger, seededParticipant.first_name)

      // 2. Select worker
      const workerTrigger = page.locator('[data-slot="select-trigger"]')
        .filter({ hasText: /Select worker/i }).first()
      await selectOption(page, workerTrigger, seededWorker.first_name)

      // 3. Date should already be prefilled with today
      const dateInput = page.locator('input[type="date"]').first()
      const currentDate = await dateInput.inputValue()
      if (!currentDate) {
        await dateInput.fill(TODAY)
      }

      // 4. Select service type - pick the first available service
      const serviceTrigger = page.locator('[data-slot="select-trigger"]')
        .filter({ hasText: /Select service/i }).first()
      if (await serviceTrigger.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await serviceTrigger.click()
        await page.waitForTimeout(1000)
        const listbox = page.locator('[role="listbox"]:visible').first()
        await listbox.waitFor({ state: 'visible', timeout: 10_000 })
        const firstService = listbox.locator('[data-slot="select-item"]').first()
        await firstService.click()
        await page.waitForTimeout(300)
      }

      // 5. Fill presentation/observations
      const presentationTextarea = page.getByPlaceholder(/presentation, mood/i).first()
      if (await presentationTextarea.isVisible().catch(() => false)) {
        await presentationTextarea.fill('Participant appeared well-rested and in good spirits.')
      }

      // 6. Fill actions taken
      const actionsTextarea = page.getByPlaceholder(/Activities completed/i).first()
      if (await actionsTextarea.isVisible().catch(() => false)) {
        await actionsTextarea.fill('Assisted with meal preparation and community access.')
      }

      // 7. Fill note content (required field)
      const contentTextarea = page.getByPlaceholder(/Main progress note content/i).first()
      await contentTextarea.fill(NOTE_CONTENT)

      // 8. Check "Flag a concern" checkbox
      const concernCheckbox = page.locator('[data-slot="checkbox"]').first()
      await concernCheckbox.click()
      await page.waitForTimeout(500)

      // 9. Verify concern fields appeared
      await expect(page.getByText('Concern Type *').first()).toBeVisible({ timeout: 5_000 })

      // 10. Select concern type - "Safety"
      const concernTypeTrigger = page.locator('[data-slot="select-trigger"]')
        .filter({ hasText: /Select type/i }).first()
      await selectOption(page, concernTypeTrigger, 'Safety')

      // 11. Select concern severity - "Low"
      const severityTrigger = page.locator('[data-slot="select-trigger"]')
        .filter({ hasText: /Select severity/i }).first()
      await selectOption(page, severityTrigger, 'Low')

      // 12. Fill concern title
      const concernTitleInput = page.getByPlaceholder(/Brief title/i).first()
      await concernTitleInput.fill(CONCERN_TITLE)

      // 13. Fill concern description
      const concernDescTextarea = page.getByPlaceholder(/Detailed description of the concern/i).first()
      await concernDescTextarea.fill(CONCERN_DESC)

      // 14. Submit the form
      await page.getByRole('button', { name: /Save Progress Note/i }).first().click()
      await page.waitForTimeout(2000)

      // 15. Expect success toast
      const toast = page.getByText('Progress note saved successfully').first()
      await expect(toast).toBeVisible({ timeout: 10_000 })

      // 16. Should redirect to /progress-notes
      await expect(page).toHaveURL(/\/progress-notes/, { timeout: 10_000 })
    })

    test('S04-05: verify progress note appears in list', async ({ page }) => {
      await page.goto('/progress-notes', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Progress Notes', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      // Search for the note content or participant name
      const searchInput = page.getByPlaceholder('Search notes...').first()
      await searchInput.fill(seededParticipant.first_name)
      await page.waitForTimeout(1500)

      // Verify a matching note appears
      const noteElement = page.getByText(seededParticipant.first_name).first()
      await expect(noteElement).toBeVisible({ timeout: 10_000 })
    })

    test('S04-06: verify concern was auto-created in concerns list', async ({ page }) => {
      await page.goto('/concerns', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Concerns', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      // Search for the concern title
      const searchInput = page.getByPlaceholder('Search concerns...').first()
      await searchInput.fill(CONCERN_TITLE)
      await page.waitForTimeout(1500)

      // Verify the concern appears
      const concernElement = page.getByText(CONCERN_TITLE).first()
      await expect(concernElement).toBeVisible({ timeout: 10_000 })

      // Also verify participant name is associated
      await expect(
        page.getByText(seededParticipant.first_name).first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('S04-07: click concern to view detail', async ({ page }) => {
      await page.goto('/concerns', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Concerns', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      const searchInput = page.getByPlaceholder('Search concerns...').first()
      await searchInput.fill(CONCERN_TITLE)
      await page.waitForTimeout(1500)

      // Click on the concern row/card
      const concernRow = page.locator('table tbody tr').filter({ hasText: CONCERN_TITLE }).first()
      if (await concernRow.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await concernRow.click()
      } else {
        const concernCard = page.getByText(CONCERN_TITLE).first()
        await concernCard.click()
      }
      await page.waitForTimeout(2000)

      // Should navigate to concern detail
      await expect(page).toHaveURL(/\/concerns\/[a-f0-9-]+/, { timeout: 10_000 })

      // Extract concern ID for cleanup
      const url = page.url()
      const id = url.split('/concerns/')[1]?.split('?')[0]
      if (id && !createdConcernIds.includes(id)) createdConcernIds.push(id)

      // Verify concern title and type on detail page
      await expect(page.getByText(CONCERN_TITLE).first()).toBeVisible({ timeout: 10_000 })
    })
  })

  test.describe('Progress Note Form Edge Cases', () => {
    test('S04-08: validation errors on empty submit', async ({ page }) => {
      await page.goto('/progress-notes/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'New Progress Note' })
      ).toBeVisible({ timeout: 15_000 })

      // Submit without filling required fields
      await page.getByRole('button', { name: /Save Progress Note/i }).first().click()
      await page.waitForTimeout(1000)

      // Should show validation error messages
      const errors = page.locator('.text-destructive')
      const count = await errors.count()
      expect(count).toBeGreaterThan(0)
    })

    test('S04-09: concern checkbox toggles concern fields visibility', async ({ page }) => {
      await page.goto('/progress-notes/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'New Progress Note' })
      ).toBeVisible({ timeout: 15_000 })

      // Initially concern fields should be hidden
      await expect(page.getByText('Concern Type *').first()).not.toBeVisible()

      // Check the concern checkbox
      const checkbox = page.locator('[data-slot="checkbox"]').first()
      await checkbox.click()
      await page.waitForTimeout(500)

      // Concern fields should appear
      await expect(page.getByText('Concern Type *').first()).toBeVisible({ timeout: 5_000 })
      await expect(page.getByText('Severity *').first()).toBeVisible({ timeout: 5_000 })
      await expect(page.getByText('Concern Title *').first()).toBeVisible({ timeout: 5_000 })
      await expect(page.getByText('Concern Description *').first()).toBeVisible({ timeout: 5_000 })

      // Uncheck - concern fields should hide
      await checkbox.click()
      await page.waitForTimeout(500)
      await expect(page.getByText('Concern Type *').first()).not.toBeVisible()
    })

    test('S04-10: concern type dropdown shows all options', async ({ page }) => {
      await page.goto('/progress-notes/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'New Progress Note' })
      ).toBeVisible({ timeout: 15_000 })

      // Enable concern section
      const checkbox = page.locator('[data-slot="checkbox"]').first()
      await checkbox.click()
      await page.waitForTimeout(500)

      // Open concern type dropdown
      const typeTrigger = page.locator('[data-slot="select-trigger"]')
        .filter({ hasText: /Select type/i }).first()
      await typeTrigger.click()
      await page.waitForTimeout(500)

      // Verify options
      await expect(
        page.locator('[data-slot="select-item"]').filter({ hasText: 'Safety' }).first()
      ).toBeVisible({ timeout: 5_000 })
      await expect(
        page.locator('[data-slot="select-item"]').filter({ hasText: 'Health' }).first()
      ).toBeVisible({ timeout: 5_000 })
      await expect(
        page.locator('[data-slot="select-item"]').filter({ hasText: 'Behavioral' }).first()
      ).toBeVisible({ timeout: 5_000 })
      await expect(
        page.locator('[data-slot="select-item"]').filter({ hasText: 'Environmental' }).first()
      ).toBeVisible({ timeout: 5_000 })
      await expect(
        page.locator('[data-slot="select-item"]').filter({ hasText: 'Financial' }).first()
      ).toBeVisible({ timeout: 5_000 })
    })

    test('S04-11: severity dropdown shows all severity levels', async ({ page }) => {
      await page.goto('/progress-notes/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'New Progress Note' })
      ).toBeVisible({ timeout: 15_000 })

      // Enable concern section
      const checkbox = page.locator('[data-slot="checkbox"]').first()
      await checkbox.click()
      await page.waitForTimeout(500)

      // Open severity dropdown
      const severityTrigger = page.locator('[data-slot="select-trigger"]')
        .filter({ hasText: /Select severity/i }).first()
      await severityTrigger.click()
      await page.waitForTimeout(500)

      // Verify severity options
      await expect(
        page.locator('[data-slot="select-item"]').filter({ hasText: 'Low' }).first()
      ).toBeVisible({ timeout: 5_000 })
      await expect(
        page.locator('[data-slot="select-item"]').filter({ hasText: 'Medium' }).first()
      ).toBeVisible({ timeout: 5_000 })
      await expect(
        page.locator('[data-slot="select-item"]').filter({ hasText: 'High' }).first()
      ).toBeVisible({ timeout: 5_000 })
      await expect(
        page.locator('[data-slot="select-item"]').filter({ hasText: 'Critical' }).first()
      ).toBeVisible({ timeout: 5_000 })
    })

    test('S04-12: goals addressed tag input works', async ({ page }) => {
      await page.goto('/progress-notes/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'New Progress Note' })
      ).toBeVisible({ timeout: 15_000 })

      // Type a goal and click Add
      const goalInput = page.getByPlaceholder(/Type a goal and press Enter/i).first()
      await goalInput.fill('Improve meal preparation')

      const addButton = page.getByRole('button', { name: 'Add' }).first()
      await addButton.click()
      await page.waitForTimeout(500)

      // Verify the tag appears
      await expect(page.getByText('Improve meal preparation').first()).toBeVisible({ timeout: 5_000 })

      // Add another goal via Enter key
      await goalInput.fill('Community access')
      await goalInput.press('Enter')
      await page.waitForTimeout(500)

      await expect(page.getByText('Community access').first()).toBeVisible({ timeout: 5_000 })
    })

    test('S04-13: back button returns to progress notes list', async ({ page }) => {
      await page.goto('/progress-notes/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'New Progress Note' })
      ).toBeVisible({ timeout: 15_000 })

      const backButton = page.getByRole('button', { name: /Back/i }).first()
      await backButton.click()
      await expect(page).toHaveURL(/\/progress-notes$/, { timeout: 10_000 })
    })

    test('S04-14: progress notes list search filters correctly', async ({ page }) => {
      await page.goto('/progress-notes', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Progress Notes', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      const searchInput = page.getByPlaceholder('Search notes...').first()
      await searchInput.fill('ZZZZNONEXISTENT999')
      await page.waitForTimeout(1500)

      // Should show no matching results
      const mainText = await page.locator('main').first().textContent()
      expect(mainText).not.toContain(NOTE_CONTENT)
    })
  })

  test.describe('Cleanup Verification', () => {
    test('S04-15: fetch created IDs from database for cleanup', async () => {
      // Query for progress notes created in this test run
      const { data: notes } = await supabase
        .from('progress_notes')
        .select('id')
        .eq('participant_id', seededParticipant.id)
        .like('content', `%${UNIQUE_SUFFIX}%`)

      if (notes) {
        for (const note of notes) {
          if (!createdNoteIds.includes(note.id)) {
            createdNoteIds.push(note.id)
          }
        }
      }

      // Query for concerns created in this test run
      const { data: concerns } = await supabase
        .from('concerns')
        .select('id')
        .eq('participant_id', seededParticipant.id)
        .like('title', `%${UNIQUE_SUFFIX}%`)

      if (concerns) {
        for (const concern of concerns) {
          if (!createdConcernIds.includes(concern.id)) {
            createdConcernIds.push(concern.id)
          }
        }
      }

      // This test just collects IDs - afterAll handles deletion
      expect(true).toBe(true)
    })
  })
})
