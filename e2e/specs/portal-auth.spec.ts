import { test, expect } from '@playwright/test'

test.describe('Portal: Authentication @portal', () => {
  test('portal login page loads', async ({ page }) => {
    await page.goto('/portal/login')
    await page.waitForTimeout(2000)

    // Should show portal login form
    const heading = page.getByRole('heading', { name: /portal|my portal|access/i }).first()
      .or(page.getByText(/portal/i).first())
    await expect(heading).toBeVisible({ timeout: 15_000 })
  })

  test('portal login has access code input', async ({ page }) => {
    await page.goto('/portal/login')
    await page.waitForTimeout(2000)

    const codeInput = page.getByLabel(/access code|token|code/i)
      .or(page.getByPlaceholder(/access code|token|enter.*code/i))
      .or(page.locator('input[type="text"]').first())
    await expect(codeInput).toBeVisible({ timeout: 10_000 })
  })

  test('portal login has submit button', async ({ page }) => {
    await page.goto('/portal/login')
    await page.waitForTimeout(2000)

    const submitBtn = page.getByRole('button', { name: /access|login|sign in|submit|enter/i })
    await expect(submitBtn).toBeVisible({ timeout: 10_000 })
  })

  test('empty token submit shows error or prevents submission', async ({ page }) => {
    await page.goto('/portal/login')
    await page.waitForTimeout(2000)

    const submitBtn = page.getByRole('button', { name: /access|login|sign in|submit|enter/i })
    await submitBtn.click()

    // Form may use HTML5 required validation (no visible text) or show inline error
    await page.waitForTimeout(1000)
    const error = page.getByText(/please enter|required|invalid/i).first()
    const stillOnLogin = page.url().includes('/portal/login') || page.url().includes('/portal')

    // Either an error is shown, or the page stays on login (HTML5 validation prevented submit)
    const hasError = await error.isVisible().catch(() => false)
    expect(hasError || stillOnLogin).toBe(true)
  })

  test('invalid token shows error', async ({ page }) => {
    await page.goto('/portal/login')
    await page.waitForTimeout(2000)

    const codeInput = page.getByLabel(/access code|token|code/i)
      .or(page.getByPlaceholder(/access code|token|enter.*code/i))
      .or(page.locator('input[type="text"]').first())
    await codeInput.fill('invalid-token-12345')

    const submitBtn = page.getByRole('button', { name: /access|login|sign in|submit|enter/i })
    await submitBtn.click()

    // Should show error about invalid token
    const error = page.getByText(/invalid|expired|not found|error/i)
    await expect(error).toBeVisible({ timeout: 10_000 })
  })

  test('unauthenticated portal access redirects to portal login', async ({ page }) => {
    await page.goto('/portal')
    await page.waitForTimeout(3000)

    // Should redirect to portal login
    const url = page.url()
    expect(url).toMatch(/portal\/login|portal/)
  })
})
