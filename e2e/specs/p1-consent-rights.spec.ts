import { test, expect } from '@playwright/test'

test.describe('P1: Rights Acknowledgment @p1', () => {
  test('form loads at /consent/rights/new', async ({ page }) => {
    await page.goto('/consent/rights/new')
    await page.waitForTimeout(2000)
    const heading = page.getByRole('heading', { name: /rights/i }).first()
    await expect(heading).toBeVisible({ timeout: 15_000 })
  })

  test('form has participant selector', async ({ page }) => {
    await page.goto('/consent/rights/new')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Participant/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('form has acknowledged date field', async ({ page }) => {
    await page.goto('/consent/rights/new')
    await page.waitForTimeout(2000)
    await expect(
      page.getByText(/Acknowledged Date|Date/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('form has rights explanation toggles', async ({ page }) => {
    await page.goto('/consent/rights/new')
    await page.waitForTimeout(2000)

    // Boolean fields may be checkboxes or switches
    const toggles = page.locator('input[type="checkbox"], [role="checkbox"], [role="switch"]')
    const count = await toggles.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('form has method selector', async ({ page }) => {
    await page.goto('/consent/rights/new')
    await page.waitForTimeout(2000)
    await expect(
      page.locator('[data-slot="select-trigger"]').filter({ hasText: /select method|method/i })
        .or(page.getByText(/Method/i).first())
    ).toBeVisible({ timeout: 10_000 })
  })

  test('form has acknowledged by name field', async ({ page }) => {
    await page.goto('/consent/rights/new')
    await page.waitForTimeout(2000)
    await expect(
      page.getByText(/Acknowledged By|Name/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('submit button exists', async ({ page }) => {
    await page.goto('/consent/rights/new')
    await page.waitForTimeout(2000)
    await expect(
      page.getByRole('button', { name: /save|submit|create|record|acknowledge/i }).first()
    ).toBeVisible({ timeout: 10_000 })
  })
})
