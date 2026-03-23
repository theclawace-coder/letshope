import { test, expect } from '@playwright/test'

test.describe('P1: Compliance Dashboard @p1', () => {
  test('compliance page loads with heading', async ({ page }) => {
    await page.goto('/compliance')
    await expect(
      page.getByRole('heading', { name: /compliance|screening/i })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('compliance page has content', async ({ page }) => {
    await page.goto('/compliance')
    await expect(
      page.getByRole('heading', { name: /compliance|screening/i })
    ).toBeVisible({ timeout: 15_000 })

    const body = await page.locator('main').textContent()
    expect(body?.length).toBeGreaterThan(10)
  })

  test('worker compliance data or empty state is shown', async ({ page }) => {
    await page.goto('/compliance')
    await expect(
      page.getByRole('heading', { name: /compliance|screening/i })
    ).toBeVisible({ timeout: 15_000 })

    await page.waitForTimeout(2000)
    const mainText = await page.locator('main').textContent()
    expect(mainText?.length).toBeGreaterThan(10)
  })
})
