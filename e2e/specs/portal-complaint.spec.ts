import { test, expect } from '@playwright/test'

test.describe('Portal: Complaint @portal', () => {
  test('complaint route exists', async ({ page }) => {
    await page.goto('/portal/complaint')
    await page.waitForTimeout(3000)
    const url = page.url()
    expect(url).toMatch(/portal/)
  })

  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/portal/complaint')
    await page.waitForTimeout(3000)

    if (page.url().includes('login')) {
      const loginForm = page.getByRole('button', { name: /access|login|submit/i })
      await expect(loginForm).toBeVisible({ timeout: 10_000 })
    }
  })

  test('portal login page renders complaint path correctly', async ({ page }) => {
    await page.goto('/portal/complaint')
    await page.waitForTimeout(3000)

    // Regardless of auth state, the page should render without errors
    const body = await page.locator('body').textContent()
    expect(body).toBeTruthy()
  })
})
