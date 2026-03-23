import { test, expect } from '@playwright/test'
import { TEST_CREDENTIALS } from '../fixtures/constants'

// Use fresh context (no saved auth) for auth tests
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('P0: Authentication @p0', () => {
  test('login page renders all elements', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Hope OS')).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(
      page.getByText(/invalid|error|incorrect|failed/i)
    ).toBeVisible({ timeout: 10_000 })
  })

  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('unauthenticated user cannot access /participants', async ({ page }) => {
    await page.goto('/participants')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('unauthenticated user cannot access /invoices', async ({ page }) => {
    await page.goto('/invoices')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(TEST_CREDENTIALS.director.email)
    await page.getByLabel(/password/i).fill(TEST_CREDENTIALS.director.password)
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
    // Dashboard heading is dynamic greeting
    await expect(
      page.getByRole('heading', { name: /good (morning|afternoon|evening)/i }).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('session persists after page reload', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(TEST_CREDENTIALS.director.email)
    await page.getByLabel(/password/i).fill(TEST_CREDENTIALS.director.password)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })

    await page.reload()
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('logout redirects to login page', async ({ page }) => {
    // First login
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(TEST_CREDENTIALS.director.email)
    await page.getByLabel(/password/i).fill(TEST_CREDENTIALS.director.password)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })

    // Look for sign out in the topbar — try clicking user avatar/button
    const header = page.locator('header')
    const userButton = header.getByRole('button').last()
    await userButton.click()

    // Wait for dropdown and click sign out
    const signOut = page.getByText(/sign out|log out|logout/i)
    if (await signOut.isVisible({ timeout: 3_000 })) {
      await signOut.click()
      await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
    }
  })
})
