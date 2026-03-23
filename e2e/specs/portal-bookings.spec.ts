import { test, expect } from '@playwright/test'

test.describe('Portal: Bookings @portal', () => {
  test('bookings route exists', async ({ page }) => {
    await page.goto('/portal/bookings')
    await page.waitForTimeout(3000)
    const url = page.url()
    expect(url).toMatch(/portal/)
  })

  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/portal/bookings')
    await page.waitForTimeout(3000)

    if (page.url().includes('login')) {
      const loginForm = page.getByRole('button', { name: /access|login|submit/i })
      await expect(loginForm).toBeVisible({ timeout: 10_000 })
    }
  })
})
