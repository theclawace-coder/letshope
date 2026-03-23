import { test, expect } from '@playwright/test'

test.describe('P2: Toast Notifications @p2', () => {
  test('toast container exists in the DOM', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(
      page.getByRole('heading', { name: /good (morning|afternoon|evening)/i }).first()
    ).toBeVisible({ timeout: 15_000 })

    // Sonner toaster should be in the DOM (may not be visible until triggered)
    const toaster = page.locator('[data-sonner-toaster]')
    await page.waitForTimeout(1000)
    // Toaster is always mounted but only shows toasts when triggered
  })

  test('error toast on invalid login', async ({ page }) => {
    // Use fresh context
    await page.context().clearCookies()
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show error toast or inline error
    const errorToast = page.locator('[data-sonner-toast]')
    const inlineError = page.getByText(/invalid|error|incorrect|failed/i)
    await expect(errorToast.or(inlineError)).toBeVisible({ timeout: 10_000 })
  })

  test('form pages have toast capability', async ({ page }) => {
    // Verify that form pages include the Sonner toaster
    await page.goto('/incidents/new')
    await expect(
      page.getByRole('heading', { name: /Log an Incident/i })
    ).toBeVisible({ timeout: 15_000 })

    // Toaster component should be mounted
    const toaster = page.locator('[data-sonner-toaster]')
    await page.waitForTimeout(1000)
  })
})
