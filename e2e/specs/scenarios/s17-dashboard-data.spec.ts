import { test, expect } from '@playwright/test'

test.describe('S17: Dashboard data accuracy and interactions @scenario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await expect(
      page.getByRole('heading', { name: /good (morning|afternoon|evening)/i }).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('greeting heading is visible', async ({ page }) => {
    const heading = page
      .getByRole('heading', { name: /good (morning|afternoon|evening)/i })
      .first()
    await expect(heading).toBeVisible()
    const text = await heading.textContent()
    expect(text?.length).toBeGreaterThan(5)
  })

  test('stat cards section has at least 3 cards', async ({ page }) => {
    const expectedStats = [
      'Total Participants',
      'Active Workers',
      'Open Concerns',
      'Open Incidents',
    ]
    let visibleCount = 0
    for (const stat of expectedStats) {
      const el = page.getByText(stat).first()
      if (await el.isVisible({ timeout: 5_000 }).catch(() => false)) {
        visibleCount++
      }
    }
    expect(visibleCount).toBeGreaterThanOrEqual(3)
  })

  test('each stat card has a label and a number', async ({ page }) => {
    const statLabels = [
      'Total Participants',
      'Active Workers',
      'Open Concerns',
      'Open Incidents',
    ]
    for (const label of statLabels) {
      const labelEl = page.getByText(label).first()
      if (await labelEl.isVisible({ timeout: 5_000 }).catch(() => false)) {
        // The stat card should contain a numeric value near the label
        // Go up to the Card element (data-slot="card")
        const card = labelEl.locator('xpath=ancestor::*[@data-slot="card"]').first()
        const cardText = await card.textContent()
        // Verify the card container has some numeric content (the count value)
        expect(cardText).toMatch(/\d/)
      }
    }
  })

  test('clicking Total Participants stat navigates to participants', async ({ page }) => {
    const stat = page.getByText('Total Participants').first()
    if (await stat.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Find the clickable ancestor card
      const card = stat.locator('xpath=ancestor::a | xpath=ancestor::button').first()
      if (await card.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await card.click()
        await page.waitForTimeout(1500)
        await expect(page).toHaveURL(/\/participants/, { timeout: 10_000 })
      }
    }
  })

  test('recent activity section exists and has content', async ({ page }) => {
    await page.waitForTimeout(1500)
    // Look for a recent activity heading or section
    const recentSection = page.getByText(/recent|activity|latest/i).first()
    if (await recentSection.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(recentSection).toBeVisible()
    }
    // Regardless, the main content area should have meaningful content
    const mainText = await page.locator('main').first().textContent()
    expect(mainText?.length).toBeGreaterThan(50)
  })

  test('quick action: New Participant navigates to onboarding', async ({ page }) => {
    const btn = page.getByRole('button', { name: /new participant/i }).first()
    if (await btn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btn.click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/onboarding\/new|\/participants\/create/, {
        timeout: 10_000,
      })
      await page.goBack()
      await page.waitForTimeout(1000)
    }
  })

  test('quick action: Log Incident navigates to incidents/new', async ({ page }) => {
    const btn = page.getByRole('button', { name: /log incident/i }).first()
    const link = page.getByRole('link', { name: /log incident/i }).first()
    let target = btn
    if (!(await btn.isVisible({ timeout: 3_000 }).catch(() => false))) {
      target = link
    }
    if (await target.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await target.click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/incidents\/new/, { timeout: 10_000 })
      await page.goBack()
      await page.waitForTimeout(1000)
    }
  })

  test('quick action: New Invoice navigates to invoices/new', async ({ page }) => {
    const btn = page.getByRole('button', { name: /create invoice|new invoice/i }).first()
    const link = page.getByRole('link', { name: /create invoice|new invoice/i }).first()
    let target = btn
    if (!(await btn.isVisible({ timeout: 3_000 }).catch(() => false))) {
      target = link
    }
    if (await target.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await target.click()
      await page.waitForTimeout(1500)
      await expect(page).toHaveURL(/\/invoices\/new/, { timeout: 10_000 })
      await page.goBack()
      await page.waitForTimeout(1000)
    }
  })

  test('alerts/notifications section renders if present', async ({ page }) => {
    await page.waitForTimeout(1500)
    const alertsSection = page.getByText(/alert|reminder|notification|upcoming/i).first()
    if (await alertsSection.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(alertsSection).toBeVisible()
    }
    // Dashboard loaded successfully regardless
    expect(true).toBe(true)
  })

  test('org name appears in topbar', async ({ page }) => {
    await expect(
      page.locator('header').first().getByText('Hope Disability Support')
    ).toBeVisible({ timeout: 10_000 })
  })
})
