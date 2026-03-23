import { test, expect } from '@playwright/test'
// Override to use fresh context (no saved auth)
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
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

    await expect(page.getByText(/invalid|error|incorrect|failed/i)).toBeVisible({
      timeout: 10000,
    })
  })

  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('successful login flow', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email/i).fill('erfan.test@gmail.com')
    await page.getByLabel(/password/i).fill('Employee123!!')
    await page.getByRole('button', { name: /sign in/i }).click()

    // After successful login, user should be redirected away from /login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 })
  })
})
