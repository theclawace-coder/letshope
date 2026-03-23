import { test, expect } from '@playwright/test'

// Portal tests require a valid portal token — these are smoke tests
// that verify page structure when accessed
test.describe('Portal: Dashboard @portal', () => {
  test('portal dashboard route exists', async ({ page }) => {
    await page.goto('/portal')
    await page.waitForTimeout(3000)

    // Will either show dashboard (if authenticated) or redirect to portal login
    const url = page.url()
    const isPortal = url.includes('/portal')
    expect(isPortal).toBe(true)
  })

  test('portal login page has branding', async ({ page }) => {
    await page.goto('/portal/login')
    await page.waitForTimeout(2000)

    // Should show Hope OS or portal branding
    const branding = page.getByText(/Hope|Portal|My Portal/i).first()
    await expect(branding).toBeVisible({ timeout: 10_000 })
  })
})
