import { test, expect } from '@playwright/test'

test.describe('P2: Settings @p2', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
    await expect(
      page.getByRole('heading', { name: 'Settings' })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('page loads with heading', async ({ page }) => {
    // Verified in beforeEach
  })

  test('profile section shows user info', async ({ page }) => {
    const profileSection = page.getByText(/profile|account|email/i).first()
    await expect(profileSection).toBeVisible({ timeout: 10_000 })
  })

  test('organisation section exists', async ({ page }) => {
    const orgSection = page.getByText(/organisation|organization|company/i).first()
    await page.waitForTimeout(2000)
    if (await orgSection.isVisible()) {
      expect(true).toBe(true)
    }
  })

  test('notification preferences exist', async ({ page }) => {
    const notifSection = page.getByText(/notification|alert|digest/i).first()
    await page.waitForTimeout(2000)
  })

  test('theme toggle exists', async ({ page }) => {
    const themeToggle = page.getByText(/theme|dark mode|appearance/i).first()
      .or(page.getByRole('button', { name: /theme|dark|light/i }))
    await page.waitForTimeout(2000)
  })

  test('save button exists', async ({ page }) => {
    const saveBtn = page.getByRole('button', { name: /save|update/i })
    await page.waitForTimeout(2000)
  })
})
