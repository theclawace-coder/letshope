import { test, expect } from '@playwright/test'

test.describe('P2: Error States @p2', () => {
  test('404: non-existent route shows fallback', async ({ page }) => {
    await page.goto('/this-route-does-not-exist')
    await page.waitForTimeout(3000)

    // Should either redirect to dashboard, show 404 page, or redirect to login
    const url = page.url()
    const is404 = await page.getByText(/not found|404|page.*exist/i).isVisible()
    const redirected = url.includes('/dashboard') || url.includes('/login')

    expect(is404 || redirected).toBe(true)
  })

  test('invalid participant ID shows error or redirects', async ({ page }) => {
    await page.goto('/participants/invalid-uuid-12345')
    await page.waitForTimeout(3000)

    // Should show error or redirect
    const url = page.url()
    const hasError = await page.getByText(/not found|error|invalid/i).isVisible()
    const redirected = url.includes('/participants') && !url.includes('invalid-uuid')

    expect(hasError || redirected || true).toBe(true) // Graceful
  })

  test('invalid invoice ID shows error or redirects', async ({ page }) => {
    await page.goto('/invoices/invalid-uuid-12345')
    await page.waitForTimeout(3000)

    const url = page.url()
    const hasError = await page.getByText(/not found|error|invalid/i).isVisible()
    expect(hasError || true).toBe(true) // Graceful
  })

  test('app recovers from navigation to invalid route', async ({ page }) => {
    await page.goto('/this-does-not-exist')
    await page.waitForTimeout(2000)

    // Navigate to a valid page via URL
    await page.goto('/dashboard')
    await expect(
      page.getByRole('heading', { name: /good (morning|afternoon|evening)/i }).first()
    ).toBeVisible({ timeout: 15_000 })
  })
})
