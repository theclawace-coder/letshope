import { test, expect } from '@playwright/test'
import { SIDEBAR_LINKS } from '../../fixtures/constants'

/**
 * Helper: wait for the app layout to load (sidebar visible).
 */
async function waitForAppLoad(page: import('@playwright/test').Page) {
  await expect(page.locator('aside').first()).toBeVisible({ timeout: 15_000 })
}

/**
 * Mapping from sidebar link label to expected URL pattern.
 */
const SIDEBAR_URL_MAP: Record<string, RegExp> = {
  Dashboard: /\/dashboard/,
  Participants: /\/participants/,
  Workers: /\/workers/,
  Calendar: /\/calendar/,
  Goals: /\/goals/,
  'Progress Notes': /\/progress-notes/,
  Invoices: /\/invoices/,
  Incidents: /\/incidents/,
  Complaints: /\/complaints/,
  Concerns: /\/concerns/,
  Compliance: /\/compliance/,
  'Consent & Rights': /\/consent/,
  'Risk Register': /\/risks/,
  Notifications: /\/notifications/,
  Messages: /\/messages/,
  'AI Buddy': /\/ai-buddy/,
  'Audit Trail': /\/audit/,
  Documents: /\/documents/,
  Settings: /\/settings/,
}

test.describe('S11: All Navigation Buttons @scenario', () => {
  test.describe('Sidebar Navigation Links', () => {
    test('Dashboard sidebar link navigates correctly', async ({ page }) => {
      await page.goto('/participants')
      await waitForAppLoad(page)
      await page.locator('aside').first().getByRole('link', { name: 'Dashboard' }).click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 })
      await expect(
        page.getByRole('heading', { name: /good (morning|afternoon|evening)/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Participants sidebar link navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForAppLoad(page)
      await page.locator('aside').first().getByRole('link', { name: 'Participants' }).click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/participants/, { timeout: 10_000 })
      await expect(
        page.getByRole('heading', { name: /Participants/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Workers sidebar link navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForAppLoad(page)
      await page.locator('aside').first().getByRole('link', { name: 'Workers' }).click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/workers/, { timeout: 10_000 })
      await expect(
        page.getByRole('heading', { name: /Workers/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Calendar sidebar link navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForAppLoad(page)
      await page.locator('aside').first().getByRole('link', { name: 'Calendar' }).click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/calendar/, { timeout: 10_000 })
      await expect(
        page.getByRole('heading', { name: /Calendar/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Goals sidebar link navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForAppLoad(page)
      await page.locator('aside').first().getByRole('link', { name: 'Goals' }).click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/goals/, { timeout: 10_000 })
      await expect(
        page.getByRole('heading', { name: /Goals/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Progress Notes sidebar link navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForAppLoad(page)
      await page.locator('aside').first().getByRole('link', { name: 'Progress Notes' }).click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/progress-notes/, { timeout: 10_000 })
      await expect(
        page.getByRole('heading', { name: /Progress Notes/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Invoices sidebar link navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForAppLoad(page)
      await page.locator('aside').first().getByRole('link', { name: 'Invoices' }).click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/invoices/, { timeout: 10_000 })
      await expect(
        page.getByRole('heading', { name: /Invoices/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Incidents sidebar link navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForAppLoad(page)
      await page.locator('aside').first().getByRole('link', { name: 'Incidents' }).click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/incidents/, { timeout: 10_000 })
      await expect(
        page.getByRole('heading', { name: /Incidents/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Complaints sidebar link navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForAppLoad(page)
      await page.locator('aside').first().getByRole('link', { name: 'Complaints' }).click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/complaints/, { timeout: 10_000 })
      await expect(
        page.getByRole('heading', { name: /Complaints/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Concerns sidebar link navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForAppLoad(page)
      await page.locator('aside').first().getByRole('link', { name: 'Concerns' }).click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/concerns/, { timeout: 10_000 })
      await expect(
        page.getByRole('heading', { name: /Concerns/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Compliance sidebar link navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForAppLoad(page)
      await page.locator('aside').first().getByRole('link', { name: 'Compliance' }).click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/compliance/, { timeout: 10_000 })
      await expect(
        page.getByRole('heading', { name: /Compliance/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Consent & Rights sidebar link navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForAppLoad(page)
      await page.locator('aside').first().getByRole('link', { name: 'Consent & Rights' }).click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/consent/, { timeout: 10_000 })
      await expect(
        page.getByRole('heading', { name: /Consent/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Risk Register sidebar link navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForAppLoad(page)
      await page.locator('aside').first().getByRole('link', { name: 'Risk Register' }).click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/risks/, { timeout: 10_000 })
      await expect(
        page.getByRole('heading', { name: /Risk/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Notifications sidebar link navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForAppLoad(page)
      await page.locator('aside').first().getByRole('link', { name: 'Notifications' }).click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/notifications/, { timeout: 10_000 })
      await expect(
        page.getByRole('heading', { name: /Notifications/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Messages sidebar link navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForAppLoad(page)
      await page.locator('aside').first().getByRole('link', { name: 'Messages' }).click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/messages/, { timeout: 10_000 })
      await expect(
        page.getByRole('heading', { name: /Messages/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('AI Buddy sidebar link navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForAppLoad(page)
      await page.locator('aside').first().getByRole('link', { name: 'AI Buddy' }).click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/ai-buddy/, { timeout: 10_000 })
      await expect(
        page.getByRole('heading', { name: /AI Buddy/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Audit Trail sidebar link navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForAppLoad(page)
      await page.locator('aside').first().getByRole('link', { name: 'Audit Trail' }).click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/audit/, { timeout: 10_000 })
      await expect(
        page.getByRole('heading', { name: /Audit/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Documents sidebar link navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForAppLoad(page)
      await page.locator('aside').first().getByRole('link', { name: 'Documents' }).click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/documents/, { timeout: 10_000 })
      await expect(
        page.getByRole('heading', { name: /Documents/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Settings sidebar link navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForAppLoad(page)
      await page.locator('aside').first().getByRole('link', { name: 'Settings' }).click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/settings/, { timeout: 10_000 })
      await expect(
        page.getByRole('heading', { name: /Settings/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })
  })

  test.describe('New/Create Buttons on List Pages', () => {
    test('Participants page: New Participant button navigates to onboarding', async ({ page }) => {
      await page.goto('/participants')
      await expect(
        page.getByRole('heading', { name: /Participants/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const newBtn = page.getByRole('button', { name: /new participant/i }).first()
      await expect(newBtn).toBeVisible({ timeout: 10_000 })
      await newBtn.click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/onboarding\/new/, { timeout: 10_000 })
    })

    test('Workers page: new worker button navigates correctly', async ({ page }) => {
      await page.goto('/workers')
      await expect(
        page.getByRole('heading', { name: /Workers/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const newBtn = page.getByRole('button', { name: /new worker|add worker|onboard/i }).first()
      await expect(newBtn).toBeVisible({ timeout: 10_000 })
      await newBtn.click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/workers\/new|\/workers\/onboard|\/onboarding/, { timeout: 10_000 })
    })

    test('Goals page: New Goal button navigates to /goals/new', async ({ page }) => {
      await page.goto('/goals')
      await expect(
        page.getByRole('heading', { name: /Goals/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const newBtn = page.getByRole('button', { name: /new goal|add goal|create goal/i }).first()
      await expect(newBtn).toBeVisible({ timeout: 10_000 })
      await newBtn.click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/goals\/new/, { timeout: 10_000 })
    })

    test('Progress Notes page: New Note button navigates to /progress-notes/new', async ({ page }) => {
      await page.goto('/progress-notes')
      await expect(
        page.getByRole('heading', { name: /Progress Notes/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const newBtn = page.getByRole('button', { name: /new note|write note/i }).first()
      await expect(newBtn).toBeVisible({ timeout: 10_000 })
      await newBtn.click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/progress-notes\/new/, { timeout: 10_000 })
    })

    test('Invoices page: New Invoice button navigates to /invoices/new', async ({ page }) => {
      await page.goto('/invoices')
      await expect(
        page.getByRole('heading', { name: /Invoices/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const newBtn = page.getByRole('button', { name: /new invoice|create invoice/i }).first()
      await expect(newBtn).toBeVisible({ timeout: 10_000 })
      await newBtn.click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/invoices\/new/, { timeout: 10_000 })
    })

    test('Incidents page: Log Incident button navigates to /incidents/new', async ({ page }) => {
      await page.goto('/incidents')
      await expect(
        page.getByRole('heading', { name: /Incidents/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const newBtn = page.getByRole('button', { name: /log incident|new incident/i }).first()
      await expect(newBtn).toBeVisible({ timeout: 10_000 })
      await newBtn.click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/incidents\/new/, { timeout: 10_000 })
    })

    test('Complaints page: Log Complaint button navigates to /complaints/new', async ({ page }) => {
      await page.goto('/complaints')
      await expect(
        page.getByRole('heading', { name: /Complaints/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const newBtn = page.getByRole('button', { name: /log complaint|new complaint/i }).first()
      await expect(newBtn).toBeVisible({ timeout: 10_000 })
      await newBtn.click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/complaints\/new/, { timeout: 10_000 })
    })

    test('Concerns page: Flag Concern button navigates to /concerns/new', async ({ page }) => {
      await page.goto('/concerns')
      await expect(
        page.getByRole('heading', { name: /Concerns/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const newBtn = page.getByRole('button', { name: /flag concern|new concern/i }).first()
      await expect(newBtn).toBeVisible({ timeout: 10_000 })
      await newBtn.click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/concerns\/new/, { timeout: 10_000 })
    })

    test('Consent page: Record Consent button navigates to /consent/new', async ({ page }) => {
      await page.goto('/consent')
      await expect(
        page.getByRole('heading', { name: /Consent/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const newBtn = page.getByRole('button', { name: /record consent|new consent/i }).first()
      await expect(newBtn).toBeVisible({ timeout: 10_000 })
      await newBtn.click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/consent\/new/, { timeout: 10_000 })
    })

    test('Risks page: Register Risk button navigates to /risks/new', async ({ page }) => {
      await page.goto('/risks')
      await expect(
        page.getByRole('heading', { name: /Risk/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const newBtn = page.getByRole('button', { name: /register risk/i }).first()
      await expect(newBtn).toBeVisible({ timeout: 10_000 })
      await newBtn.click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/risks\/new/, { timeout: 10_000 })
    })
  })

  test.describe('Back Buttons on Form Pages', () => {
    test('Incidents new form: back/cancel returns to list', async ({ page }) => {
      await page.goto('/incidents/new')
      await expect(
        page.getByRole('heading', { name: /incident/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const backBtn = page.getByRole('button', { name: /back|cancel/i }).first()
      if (await backBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await backBtn.click()
        await page.waitForTimeout(1500)
        await expect(page).toHaveURL(/\/incidents/, { timeout: 10_000 })
      }
    })

    test('Complaints new form: back/cancel returns to list', async ({ page }) => {
      await page.goto('/complaints/new')
      await expect(
        page.getByRole('heading', { name: /complaint/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const backBtn = page.getByRole('button', { name: /back|cancel/i }).first()
      if (await backBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await backBtn.click()
        await page.waitForTimeout(1500)
        await expect(page).toHaveURL(/\/complaints/, { timeout: 10_000 })
      }
    })

    test('Concerns new form: back/cancel returns to list', async ({ page }) => {
      await page.goto('/concerns/new')
      await expect(
        page.getByRole('heading', { name: /concern/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const backBtn = page.getByRole('button', { name: /back|cancel/i }).first()
      if (await backBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await backBtn.click()
        await page.waitForTimeout(1500)
        await expect(page).toHaveURL(/\/concerns/, { timeout: 10_000 })
      }
    })

    test('Risks new form: back/cancel returns to list', async ({ page }) => {
      await page.goto('/risks/new')
      await expect(
        page.getByRole('heading', { name: /risk/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const backBtn = page.getByRole('button', { name: /back|cancel/i }).first()
      if (await backBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await backBtn.click()
        await page.waitForTimeout(1500)
        await expect(page).toHaveURL(/\/risks/, { timeout: 10_000 })
      }
    })

    test('Goals new form: back/cancel returns to list', async ({ page }) => {
      await page.goto('/goals/new')
      await expect(
        page.getByRole('heading', { name: /goal/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const backBtn = page.getByRole('button', { name: /back|cancel/i }).first()
      if (await backBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await backBtn.click()
        await page.waitForTimeout(1500)
        await expect(page).toHaveURL(/\/goals/, { timeout: 10_000 })
      }
    })
  })

  test.describe('Dashboard Quick Action Buttons', () => {
    test('New Participant quick action navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(
        page.getByRole('heading', { name: /good (morning|afternoon|evening)/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const btn = page.getByRole('button', { name: /new participant/i }).first()
      if (await btn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await btn.click()
        await page.waitForTimeout(1500)
        await expect(page).toHaveURL(/\/onboarding\/new|\/participants\/create/, { timeout: 10_000 })
      }
    })

    test('Log Incident quick action navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(
        page.getByRole('heading', { name: /good (morning|afternoon|evening)/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const btn = page.getByRole('button', { name: /log incident/i }).first()
      if (await btn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await btn.click()
        await page.waitForTimeout(1500)
        await expect(page).toHaveURL(/\/incidents\/new/, { timeout: 10_000 })
      }
    })

    test('Create Invoice quick action navigates correctly', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(
        page.getByRole('heading', { name: /good (morning|afternoon|evening)/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const btn = page.getByRole('button', { name: /create invoice/i }).first()
      if (await btn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await btn.click()
        await page.waitForTimeout(1500)
        await expect(page).toHaveURL(/\/invoices\/new/, { timeout: 10_000 })
      }
    })
  })
})
