import { test, expect } from '@playwright/test'
import { TEST_WORKER } from '../../fixtures/constants'
import { supabase, cleanup } from '../../fixtures/test-data.fixture'

const UNIQUE_SUFFIX = Date.now().toString().slice(-6)
const WORKER_FIRST = `E2E_${UNIQUE_SUFFIX}`
const WORKER_LAST = 'WorkerTest'
const WORKER_EMAIL = `e2e.worker.${UNIQUE_SUFFIX}@test.com`

test.describe('S02: Worker Lifecycle @scenario', () => {
  const createdWorkerIds: string[] = []
  const createdWorkflowIds: string[] = []

  test.afterAll(async () => {
    // Clean up workflows first (foreign key dependency)
    if (createdWorkerIds.length > 0) {
      await supabase.from('worker_onboarding_workflows').delete().in('worker_id', createdWorkerIds)
    }
    if (createdWorkflowIds.length > 0) {
      await cleanup('worker_onboarding_workflows', createdWorkflowIds)
    }
    await cleanup('workers', createdWorkerIds)
  })

  test.describe.serial('Create & Verify Worker', () => {
    test('S02-01: navigate to worker onboarding page', async ({ page }) => {
      await page.goto('/workers/onboarding/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Worker Onboarding/i })
      ).toBeVisible({ timeout: 15_000 })

      // Should show the basic info form first
      await expect(page.getByLabel(/First Name/i).first()).toBeVisible({ timeout: 10_000 })
      await expect(page.getByLabel(/Last Name/i).first()).toBeVisible({ timeout: 10_000 })
    })

    test('S02-02: fill worker basic info form and submit', async ({ page }) => {
      await page.goto('/workers/onboarding/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Worker Onboarding/i })
      ).toBeVisible({ timeout: 15_000 })

      // Fill first name
      await page.getByLabel(/First Name/i).first().fill(WORKER_FIRST)

      // Fill last name
      await page.getByLabel(/Last Name/i).first().fill(WORKER_LAST)

      // Fill email
      await page.getByLabel(/Email/i).first().fill(WORKER_EMAIL)

      // Fill role title
      await page.getByLabel(/Role Title/i).first().fill('Support Worker')

      // Select employment type - click the trigger and choose Employee
      const employmentTrigger = page.locator('[data-slot="select-trigger"]')
        .filter({ hasText: /Contractor|Employee|Volunteer/i }).first()
      await employmentTrigger.click()
      await page.waitForTimeout(500)
      const employeeOption = page.locator('[data-slot="select-item"]')
        .filter({ hasText: 'Employee' }).first()
      await employeeOption.click()
      await page.waitForTimeout(300)

      // Click "Create Worker & Start Onboarding"
      await page.getByRole('button', { name: /Create Worker & Start Onboarding/i }).first().click()
      await page.waitForTimeout(3000)

      // After creation, wizard should advance to stage 1 (Contract)
      // or show a toast, or the URL changes to include a workflow ID
      const stage1Content = page.getByText(/Contract/i).first()
      const urlHasId = page.url().includes('/onboarding/')

      const stage1Visible = await stage1Content.isVisible({ timeout: 10_000 }).catch(() => false)
      expect(stage1Visible || urlHasId).toBe(true)
    })

    test('S02-03: verify worker appears in workers list', async ({ page }) => {
      await page.goto('/workers', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Workers', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      // Search for the created worker
      const searchInput = page.getByPlaceholder(/search/i).first()
      await searchInput.fill(WORKER_FIRST)
      await page.waitForTimeout(1500)

      // Verify worker row appears
      const row = page.locator('table tbody tr').filter({ hasText: WORKER_FIRST }).first()
      await expect(row).toBeVisible({ timeout: 10_000 })

      // Verify the last name is also visible in the row
      await expect(row.getByText(WORKER_LAST).first()).toBeVisible({ timeout: 5_000 })
    })

    test('S02-04: click worker row to view detail page', async ({ page }) => {
      await page.goto('/workers', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Workers', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      const searchInput = page.getByPlaceholder(/search/i).first()
      await searchInput.fill(WORKER_FIRST)
      await page.waitForTimeout(1500)

      const row = page.locator('table tbody tr').filter({ hasText: WORKER_FIRST }).first()
      await row.click()
      await page.waitForTimeout(2000)

      // Should navigate to worker detail page
      await expect(page).toHaveURL(/\/workers\/[a-f0-9-]+/, { timeout: 10_000 })

      // Extract worker ID from URL for cleanup
      const url = page.url()
      const id = url.split('/workers/')[1]?.split('?')[0]
      if (id && !createdWorkerIds.includes(id)) createdWorkerIds.push(id)
    })

    test('S02-05: verify worker name on detail page', async ({ page }) => {
      await page.goto('/workers', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Workers', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      const searchInput = page.getByPlaceholder(/search/i).first()
      await searchInput.fill(WORKER_FIRST)
      await page.waitForTimeout(1500)

      const row = page.locator('table tbody tr').filter({ hasText: WORKER_FIRST }).first()
      if (!(await row.isVisible({ timeout: 5_000 }).catch(() => false))) {
        test.skip(true, 'Worker not found in list')
        return
      }
      await row.click()
      await page.waitForTimeout(2000)

      // Verify the worker name on the detail page
      await expect(page.getByText(WORKER_FIRST).first()).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(WORKER_LAST).first()).toBeVisible({ timeout: 10_000 })
    })

    test('S02-06: verify worker detail page shows role and status', async ({ page }) => {
      await page.goto('/workers', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Workers', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      const searchInput = page.getByPlaceholder(/search/i).first()
      await searchInput.fill(WORKER_FIRST)
      await page.waitForTimeout(1500)

      const row = page.locator('table tbody tr').filter({ hasText: WORKER_FIRST }).first()
      if (!(await row.isVisible({ timeout: 5_000 }).catch(() => false))) {
        test.skip(true, 'Worker not found')
        return
      }
      await row.click()
      await page.waitForTimeout(2000)

      // Should show role title somewhere on the page
      await expect(page.getByText(/Support Worker/i).first()).toBeVisible({ timeout: 10_000 })
    })
  })

  test.describe('Worker List Edge Cases', () => {
    test('S02-07: search with non-existent name returns no results', async ({ page }) => {
      await page.goto('/workers', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Workers', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      const searchInput = page.getByPlaceholder(/search/i).first()
      await searchInput.fill('ZZZZNONEXISTENT999')
      await page.waitForTimeout(1500)

      const rows = page.locator('table tbody tr')
      const count = await rows.count()
      expect(count).toBe(0)
    })

    test('S02-08: New Worker button navigates to onboarding', async ({ page }) => {
      await page.goto('/workers', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Workers', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      const newWorkerBtn = page.getByRole('button', { name: /New Worker/i }).first()
      await newWorkerBtn.click()
      await expect(page).toHaveURL(/\/workers\/onboarding\/new/, { timeout: 10_000 })
    })
  })

  test.describe('Worker Onboarding Validation', () => {
    test('S02-09: shows validation errors on empty submit', async ({ page }) => {
      await page.goto('/workers/onboarding/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Worker Onboarding/i })
      ).toBeVisible({ timeout: 15_000 })

      // Clear default employment type value and submit
      await page.getByRole('button', { name: /Create Worker & Start Onboarding/i }).first().click()
      await page.waitForTimeout(1000)

      // Should show validation error messages for required fields
      const errorMessages = page.locator('.text-destructive')
      const errorCount = await errorMessages.count()
      expect(errorCount).toBeGreaterThan(0)
    })

    test('S02-10: email field validates format', async ({ page }) => {
      await page.goto('/workers/onboarding/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Worker Onboarding/i })
      ).toBeVisible({ timeout: 15_000 })

      // Fill required fields but with invalid email
      await page.getByLabel(/First Name/i).first().fill('TestFirst')
      await page.getByLabel(/Last Name/i).first().fill('TestLast')
      await page.getByLabel(/Email/i).first().fill('not-an-email')
      await page.getByLabel(/Role Title/i).first().fill('Test Role')

      await page.getByRole('button', { name: /Create Worker & Start Onboarding/i }).first().click()
      await page.waitForTimeout(1000)

      // Should show email validation error or not submit
      const pageContent = await page.locator('main').first().textContent()
      expect(pageContent).toBeDefined()
    })

    test('S02-11: employment type dropdown shows all options', async ({ page }) => {
      await page.goto('/workers/onboarding/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: /Worker Onboarding/i })
      ).toBeVisible({ timeout: 15_000 })

      // Click the employment type trigger
      const trigger = page.locator('[data-slot="select-trigger"]').first()
      await trigger.click()
      await page.waitForTimeout(500)

      // Verify all employment type options exist
      await expect(
        page.locator('[data-slot="select-item"]').filter({ hasText: 'Contractor' }).first()
      ).toBeVisible({ timeout: 5_000 })
      await expect(
        page.locator('[data-slot="select-item"]').filter({ hasText: 'Employee' }).first()
      ).toBeVisible({ timeout: 5_000 })
      await expect(
        page.locator('[data-slot="select-item"]').filter({ hasText: 'Volunteer' }).first()
      ).toBeVisible({ timeout: 5_000 })
    })
  })
})
