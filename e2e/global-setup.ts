import { test as setup, expect } from '@playwright/test'

setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByText('Hope OS')).toBeVisible()

  await page.getByLabel(/email/i).fill('erfan.test@gmail.com')
  await page.getByLabel(/password/i).fill('Employee123!!')
  await page.getByRole('button', { name: /sign in/i }).click()

  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  await expect(page.getByText(/dashboard/i).first()).toBeVisible()

  // Save auth state
  await page.context().storageState({ path: './e2e/.auth/user.json' })
})
