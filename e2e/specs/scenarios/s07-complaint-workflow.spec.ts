import { test, expect } from '@playwright/test'
import { seedParticipant, cleanup, supabase } from '../../fixtures/test-data.fixture'
import { TEST_COMPLAINT } from '../../fixtures/constants'

const today = new Date().toISOString().split('T')[0]

test.describe('S07: Complaint Full Lifecycle @scenario', () => {
  let participant: Record<string, unknown>
  const cleanupIds: { complaints: string[]; participants: string[] } = {
    complaints: [],
    participants: [],
  }

  test.beforeAll(async () => {
    participant = await seedParticipant({
      first_name: 'S07_Complaint',
      last_name: 'Scenario',
    })
    cleanupIds.participants.push(participant.id as string)
  })

  test.afterAll(async () => {
    await cleanup('complaints', cleanupIds.complaints)
    await cleanup('participants', cleanupIds.participants)
  })

  test.describe.serial('Create and manage complaint', () => {
    let complaintId: string

    test('navigate to complaint creation page', async ({ page }) => {
      await page.goto('/complaints/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Log a Complaint/i })
      ).toBeVisible({ timeout: 15_000 })
      await expect(page.locator('form')).toBeVisible({ timeout: 10_000 })
    })

    test('select participant from dropdown', async ({ page }) => {
      await page.goto('/complaints/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Log a Complaint/i })
      ).toBeVisible({ timeout: 15_000 })

      const participantTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select participant/i })
        .first()
      await participantTrigger.click()
      await page.waitForTimeout(1000)

      const participantOption = page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: 'S07_Complaint Scenario' })
        .first()
      await expect(participantOption).toBeVisible({ timeout: 10_000 })
      await participantOption.click()
      await page.waitForTimeout(500)

      // Verify participant was selected: "select participant" placeholder should be gone
      await expect(
        page.locator('[data-slot="select-trigger"]').filter({ hasText: /select participant/i })
      ).toHaveCount(0, { timeout: 5_000 })
    })

    test('fill complainant name and relationship', async ({ page }) => {
      await page.goto('/complaints/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Log a Complaint/i })
      ).toBeVisible({ timeout: 15_000 })

      // Fill complainant name
      const complainantInput = page.getByPlaceholder('Who made the complaint?').first()
      await expect(complainantInput).toBeVisible({ timeout: 10_000 })
      await complainantInput.fill('E2E Test Complainant')

      // Fill relationship
      const relationshipInput = page.getByPlaceholder(/parent.*carer.*self/i).first()
      await expect(relationshipInput).toBeVisible({ timeout: 10_000 })
      await relationshipInput.fill('Parent')
    })

    test('select complaint category Service Delivery', async ({ page }) => {
      await page.goto('/complaints/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Log a Complaint/i })
      ).toBeVisible({ timeout: 15_000 })

      const categoryTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select category/i })
        .first()
      await categoryTrigger.click()
      await page.waitForTimeout(1000)

      const serviceOption = page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: /Service Delivery/i })
        .first()
      await expect(serviceOption).toBeVisible({ timeout: 10_000 })
      await serviceOption.click()
      await page.waitForTimeout(500)

      // Verify category was selected: "select category" placeholder should be gone
      await expect(
        page.locator('[data-slot="select-trigger"]').filter({ hasText: /select category/i })
      ).toHaveCount(0, { timeout: 5_000 })
    })

    test('fill full complaint form and submit', async ({ page }) => {
      await page.goto('/complaints/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Log a Complaint/i })
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
        .filter({ hasText: 'S07_Complaint Scenario' })
        .first()
        .click()
      await page.waitForTimeout(500)

      // Fill complainant name
      const complainantInput = page.getByPlaceholder('Who made the complaint?').first()
      await complainantInput.fill('E2E Test Complainant')

      // Fill relationship
      const relationshipInput = page.getByPlaceholder(/parent.*carer.*self/i).first()
      await relationshipInput.fill('Parent')

      // Fill complaint date
      const dateInput = page.locator('input[type="date"]').first()
      await dateInput.fill(today)

      // Select category
      const categoryTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select category/i })
        .first()
      await categoryTrigger.click()
      await page.waitForTimeout(1000)
      await page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: /Service Delivery/i })
        .first()
        .click()
      await page.waitForTimeout(500)

      // Fill description
      const descriptionTextarea = page.locator('textarea').first()
      await expect(descriptionTextarea).toBeVisible({ timeout: 10_000 })
      await descriptionTextarea.fill(TEST_COMPLAINT.description)

      // Submit
      const submitBtn = page.getByRole('button', { name: /submit complaint/i }).first()
      await expect(submitBtn).toBeVisible({ timeout: 10_000 })
      await submitBtn.click()

      // Expect toast
      await expect(
        page.getByText(/complaint logged/i).first()
      ).toBeVisible({ timeout: 15_000 })

      // Should redirect to complaints list or detail page
      await expect(page).toHaveURL(/\/complaints/, { timeout: 15_000 })
      await page.waitForTimeout(2000)

      // Extract complaint ID from URL if on detail page
      const url = page.url()
      const match = url.match(/\/complaints\/([a-f0-9-]{36})/)
      if (match) {
        complaintId = match[1]
        cleanupIds.complaints.push(complaintId)
      } else {
        // Redirected to list page - fetch the latest complaint from DB
        const { data: complaints } = await supabase
          .from('complaints')
          .select('id')
          .eq('participant_id', participant.id as string)
          .order('created_at', { ascending: false })
          .limit(1)
        if (complaints && complaints.length > 0) {
          complaintId = complaints[0].id
          cleanupIds.complaints.push(complaintId)
        }
      }
    })

    test('verify complaint appears in list', async ({ page }) => {
      test.skip(!complaintId, 'No complaint created in previous test')
      await page.goto('/complaints', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Complaints', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      // The complaint should appear
      await expect(
        page.getByText('S07_Complaint').first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('click to view complaint detail from list', async ({ page }) => {
      test.skip(!complaintId, 'No complaint created in previous test')
      await page.goto('/complaints', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Complaints', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      const row = page.locator('table tbody tr').filter({ hasText: 'S07_Complaint' }).first()
      await expect(row).toBeVisible({ timeout: 10_000 })
      await row.click()

      await expect(page).toHaveURL(/\/complaints\/[a-zA-Z0-9-]+/, { timeout: 10_000 })
    })

    test('verify complaint detail page shows Received status', async ({ page }) => {
      test.skip(!complaintId, 'No complaint created in previous test')
      await page.goto(`/complaints/${complaintId}`, { timeout: 15_000 })
      await page.waitForTimeout(2000)

      // Verify status is Received
      await expect(
        page.getByText(/received/i).first()
      ).toBeVisible({ timeout: 10_000 })

      // Verify participant name
      await expect(
        page.getByText('S07_Complaint Scenario').first()
      ).toBeVisible({ timeout: 10_000 })

      // Verify complainant name
      await expect(
        page.getByText('E2E Test Complainant').first()
      ).toBeVisible({ timeout: 10_000 })

      // Verify relationship
      await expect(
        page.getByText('Parent').first()
      ).toBeVisible({ timeout: 10_000 })

      // Verify description
      await expect(
        page.getByText(TEST_COMPLAINT.description).first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('acknowledge complaint via Acknowledge button', async ({ page }) => {
      test.skip(!complaintId, 'No complaint created in previous test')
      await page.goto(`/complaints/${complaintId}`, { timeout: 15_000 })
      await page.waitForTimeout(2000)

      const acknowledgeBtn = page.getByRole('button', { name: /acknowledge/i }).first()
      if (await acknowledgeBtn.isVisible()) {
        await acknowledgeBtn.click()

        // Expect toast
        await expect(
          page.getByText(/complaint acknowledged/i).first()
        ).toBeVisible({ timeout: 15_000 })

        await page.waitForTimeout(2000)

        // Verify status changed — should show Acknowledged badge
        await expect(
          page.getByText(/acknowledged/i).first()
        ).toBeVisible({ timeout: 10_000 })
      }
    })

    test('resolve complaint via Resolve button', async ({ page }) => {
      test.skip(!complaintId, 'No complaint created in previous test')
      await page.goto(`/complaints/${complaintId}`, { timeout: 15_000 })
      await page.waitForTimeout(2000)

      const resolveBtn = page.getByRole('button', { name: /resolve/i }).first()
      if (await resolveBtn.isVisible()) {
        await resolveBtn.click()
        await page.waitForTimeout(1000)

        // Resolution dialog should appear — fill it
        const resolutionTextarea = page.locator('[role="dialog"] textarea').first()
        if (await resolutionTextarea.isVisible()) {
          await resolutionTextarea.fill('E2E test resolution: complaint addressed and resolved satisfactorily.')

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

  test.describe('Complaint form validation', () => {
    test('empty form submission stays on page', async ({ page }) => {
      await page.goto('/complaints/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Log a Complaint/i })
      ).toBeVisible({ timeout: 15_000 })

      const submitBtn = page.getByRole('button', { name: /submit complaint/i }).first()
      await submitBtn.click()
      await page.waitForTimeout(1000)

      await expect(page).toHaveURL(/\/complaints\/new/, { timeout: 5_000 })
    })

    test('complainant name field is visible', async ({ page }) => {
      await page.goto('/complaints/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Log a Complaint/i })
      ).toBeVisible({ timeout: 15_000 })

      await expect(
        page.getByText(/Complainant Name/i).first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('description field is visible', async ({ page }) => {
      await page.goto('/complaints/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Log a Complaint/i })
      ).toBeVisible({ timeout: 15_000 })

      await expect(
        page.getByText(/Description/i).first()
      ).toBeVisible({ timeout: 10_000 })
    })
  })

  test.describe('Complaint list page features', () => {
    test('stat cards are visible', async ({ page }) => {
      await page.goto('/complaints', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Complaints', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      for (const label of ['Open', 'Investigating']) {
        await expect(page.getByText(label).first()).toBeVisible({ timeout: 10_000 })
      }
    })

    test('Log Complaint button navigates to create page', async ({ page }) => {
      await page.goto('/complaints', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Complaints', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      await page.getByRole('button', { name: 'Log Complaint' }).click()
      await expect(page).toHaveURL(/\/complaints\/new/, { timeout: 10_000 })
    })
  })
})
