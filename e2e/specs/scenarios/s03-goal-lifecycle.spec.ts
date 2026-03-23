import { test, expect } from '@playwright/test'
import { TEST_GOAL } from '../../fixtures/constants'
import { supabase, seedParticipant, cleanup } from '../../fixtures/test-data.fixture'

const UNIQUE_SUFFIX = Date.now().toString().slice(-6)
const GOAL_TITLE = `E2E Goal ${UNIQUE_SUFFIX}`
const TODAY = new Date().toISOString().split('T')[0]
const FUTURE_DATE = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

/** Helper: open a base-ui select and pick an option */
async function selectOption(
  page: import('@playwright/test').Page,
  triggerLocator: import('@playwright/test').Locator,
  optionText: string | RegExp,
) {
  await triggerLocator.click()
  await page.waitForTimeout(500)
  const option = page.locator('[data-slot="select-item"]')
    .filter({ hasText: optionText }).first()
  await option.click()
  await page.waitForTimeout(300)
}

test.describe('S03: Goal Lifecycle @scenario', () => {
  let seededParticipant: { id: string; first_name: string; last_name: string }
  const createdGoalIds: string[] = []
  const createdParticipantIds: string[] = []

  test.beforeAll(async () => {
    seededParticipant = await seedParticipant({
      first_name: `E2E_GoalSeed_${UNIQUE_SUFFIX}`,
      last_name: 'Participant',
    })
    createdParticipantIds.push(seededParticipant.id)
  })

  test.afterAll(async () => {
    await cleanup('goals', createdGoalIds)
    // Clean up onboarding workflows that reference the participant
    await supabase.from('onboarding_workflows').delete().in('participant_id', createdParticipantIds)
    await cleanup('participants', createdParticipantIds)
  })

  test.describe.serial('Create & Verify Goal', () => {
    test('S03-01: navigate to Create Goal page', async ({ page }) => {
      await page.goto('/goals/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Create Goal/i })
      ).toBeVisible({ timeout: 15_000 })

      // Verify form sections are visible
      await expect(page.getByText('Goal Details').first()).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText('Measurement & Dates').first()).toBeVisible({ timeout: 10_000 })
    })

    test('S03-02: select the seeded participant from dropdown', async ({ page }) => {
      await page.goto('/goals/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Create Goal/i })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000) // Wait for participants to load

      // Click the Participant select trigger
      const participantTrigger = page.locator('[data-slot="select-trigger"]')
        .filter({ hasText: /Select participant/i }).first()
      await participantTrigger.click()
      await page.waitForTimeout(1000)

      // Select the seeded participant by name
      const participantName = `${seededParticipant.first_name} ${seededParticipant.last_name}`
      const participantOption = page.locator('[data-slot="select-item"]')
        .filter({ hasText: seededParticipant.first_name }).first()
      await participantOption.click()
      await page.waitForTimeout(500)

      // Verify participant was selected: "Select participant" placeholder should be gone
      await expect(
        page.locator('[data-slot="select-trigger"]').filter({ hasText: /Select participant/i })
      ).toHaveCount(0, { timeout: 5_000 })
    })

    test('S03-03: fill goal form completely and submit', async ({ page }) => {
      await page.goto('/goals/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Create Goal/i })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      // 1. Select participant
      const participantTrigger = page.locator('[data-slot="select-trigger"]')
        .filter({ hasText: /Select participant/i }).first()
      await selectOption(page, participantTrigger, seededParticipant.first_name)

      // 2. Fill goal title
      const titleInput = page.getByPlaceholder(/Improve independent/i).first()
      await titleInput.fill(GOAL_TITLE)

      // 3. Select domain - "Daily Living"
      const domainTrigger = page.locator('[data-slot="select-trigger"]')
        .filter({ hasText: /Select domain/i }).first()
      await selectOption(page, domainTrigger, 'Daily Living')

      // 4. Select timeframe - default is "Short Term" but click to verify
      const timeframeTrigger = page.locator('[data-slot="select-trigger"]')
        .filter({ hasText: /Short Term/i }).first()
      if (await timeframeTrigger.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await selectOption(page, timeframeTrigger, /Medium Term/i)
      }

      // 5. Select priority - default is "Medium" but change to "High"
      const priorityTrigger = page.locator('[data-slot="select-trigger"]')
        .filter({ hasText: /Medium/i }).first()
      if (await priorityTrigger.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await selectOption(page, priorityTrigger, 'High')
      }

      // 6. Fill dates
      const startDateInput = page.locator('input[type="date"]').first()
      await startDateInput.fill(TODAY)

      const targetDateInput = page.locator('input[type="date"]').nth(1)
      if (await targetDateInput.isVisible().catch(() => false)) {
        await targetDateInput.fill(FUTURE_DATE)
      }

      // 7. Fill baseline measure
      const baselineTextarea = page.getByPlaceholder(/Where is the participant starting/i).first()
      if (await baselineTextarea.isVisible().catch(() => false)) {
        await baselineTextarea.fill('Currently requires full assistance with daily activities')
      }

      // 8. Fill target measure
      const targetTextarea = page.getByPlaceholder(/What does success look like/i).first()
      if (await targetTextarea.isVisible().catch(() => false)) {
        await targetTextarea.fill('Can independently complete 3 daily tasks per week')
      }

      // 9. Click "Create Goal"
      await page.getByRole('button', { name: /Create Goal/i }).first().click()
      await page.waitForTimeout(2000)

      // Expect toast: "Goal created successfully"
      const toast = page.getByText('Goal created successfully').first()
      await expect(toast).toBeVisible({ timeout: 10_000 })

      // Should redirect to /goals
      await expect(page).toHaveURL(/\/goals/, { timeout: 10_000 })
    })

    test('S03-04: verify goal appears in goals list', async ({ page }) => {
      await page.goto('/goals', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Goals', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      // Search for the goal
      const searchInput = page.getByPlaceholder('Search goals...').first()
      await searchInput.fill(GOAL_TITLE)
      await page.waitForTimeout(1500)

      // Verify the goal appears
      await expect(page.getByText(GOAL_TITLE).first()).toBeVisible({ timeout: 10_000 })
    })

    test('S03-05: click goal to view detail page', async ({ page }) => {
      await page.goto('/goals', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Goals', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      const searchInput = page.getByPlaceholder('Search goals...').first()
      await searchInput.fill(GOAL_TITLE)
      await page.waitForTimeout(1500)

      // Click on the goal row/card
      const goalElement = page.locator('table tbody tr').filter({ hasText: GOAL_TITLE }).first()
      if (await goalElement.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await goalElement.click()
      } else {
        // Goals might be displayed as cards instead of table
        const goalCard = page.getByText(GOAL_TITLE).first()
        await goalCard.click()
      }
      await page.waitForTimeout(2000)

      // Should navigate to goal detail
      await expect(page).toHaveURL(/\/goals\/[a-f0-9-]+/, { timeout: 10_000 })

      // Extract goal ID from URL for cleanup
      const url = page.url()
      const id = url.split('/goals/')[1]?.split('?')[0]
      if (id && !createdGoalIds.includes(id)) createdGoalIds.push(id)
    })

    test('S03-06: verify goal detail page shows correct info', async ({ page }) => {
      await page.goto('/goals', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Goals', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      const searchInput = page.getByPlaceholder('Search goals...').first()
      await searchInput.fill(GOAL_TITLE)
      await page.waitForTimeout(1500)

      const goalElement = page.locator('table tbody tr').filter({ hasText: GOAL_TITLE }).first()
      if (await goalElement.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await goalElement.click()
      } else {
        const goalCard = page.getByText(GOAL_TITLE).first()
        await goalCard.click()
      }
      await page.waitForTimeout(2000)

      // Verify goal title is shown on detail page
      await expect(page.getByText(GOAL_TITLE).first()).toBeVisible({ timeout: 10_000 })

      // Verify participant name appears
      await expect(
        page.getByText(seededParticipant.first_name).first()
      ).toBeVisible({ timeout: 10_000 })
    })
  })

  test.describe('Goal Form Edge Cases', () => {
    test('S03-07: validation errors shown on empty form submit', async ({ page }) => {
      await page.goto('/goals/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Create Goal/i })
      ).toBeVisible({ timeout: 15_000 })

      // Submit without filling anything
      await page.getByRole('button', { name: /Create Goal/i }).first().click()
      await page.waitForTimeout(1000)

      // Should show validation errors
      const errors = page.locator('.text-destructive')
      const count = await errors.count()
      expect(count).toBeGreaterThan(0)
    })

    test('S03-08: domain dropdown shows all NDIS outcome domains', async ({ page }) => {
      await page.goto('/goals/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Create Goal/i })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(1000)

      // Find and click the domain trigger
      const domainTrigger = page.locator('[data-slot="select-trigger"]')
        .filter({ hasText: /Select domain/i }).first()
      await domainTrigger.click()
      await page.waitForTimeout(500)

      // Verify domain options
      await expect(
        page.locator('[data-slot="select-item"]').filter({ hasText: 'Daily Living' }).first()
      ).toBeVisible({ timeout: 5_000 })
      await expect(
        page.locator('[data-slot="select-item"]').filter({ hasText: 'Employment' }).first()
      ).toBeVisible({ timeout: 5_000 })
      await expect(
        page.locator('[data-slot="select-item"]').filter({ hasText: /Health/i }).first()
      ).toBeVisible({ timeout: 5_000 })
    })

    test('S03-09: goals list search filters correctly', async ({ page }) => {
      await page.goto('/goals', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Goals', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      const searchInput = page.getByPlaceholder('Search goals...').first()
      await searchInput.fill('ZZZZNONEXISTENT999')
      await page.waitForTimeout(1500)

      // Should show no results or empty state
      const mainText = await page.locator('main').first().textContent()
      expect(mainText).not.toContain(GOAL_TITLE)
    })

    test('S03-10: back button on create page navigates to goals list', async ({ page }) => {
      await page.goto('/goals/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Create Goal/i })
      ).toBeVisible({ timeout: 15_000 })

      const backButton = page.getByRole('button', { name: /Back/i }).first()
      await backButton.click()
      await expect(page).toHaveURL(/\/goals$/, { timeout: 10_000 })
    })

    test('S03-11: linked registration groups are clickable', async ({ page }) => {
      await page.goto('/goals/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Create Goal/i })
      ).toBeVisible({ timeout: 15_000 })

      // Scroll to registration groups section
      const regGroupsHeading = page.getByText('Linked Registration Groups').first()
      await regGroupsHeading.scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)

      // Click a registration group pill
      const groupPill = page.locator('button').filter({ hasText: /0107/i }).first()
      if (await groupPill.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await groupPill.click()
        await page.waitForTimeout(300)

        // Should toggle selection (check class change)
        const classes = await groupPill.getAttribute('class')
        expect(classes).toContain('bg-primary')
      }
    })
  })
})
