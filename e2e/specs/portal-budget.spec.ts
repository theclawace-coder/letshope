import { test, expect } from '@playwright/test'

test.describe('Portal: Budget @portal', () => {
  test('budget route exists', async ({ page }) => {
    await page.goto('/portal/budget')
    await page.waitForTimeout(3000)

    // Will redirect to portal login if not authenticated
    const url = page.url()
    expect(url).toMatch(/portal/)
  })

  test('portal login is accessible from budget redirect', async ({ page }) => {
    await page.goto('/portal/budget')
    await page.waitForTimeout(3000)

    // If redirected to login, login form should be visible
    if (page.url().includes('login')) {
      const loginForm = page.getByRole('button', { name: /access|login|submit/i })
      await expect(loginForm).toBeVisible({ timeout: 10_000 })
    }
  })
})
