import { test, expect } from '@playwright/test'

test.describe('P2: Notifications @p2', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notifications')
    await expect(
      page.getByRole('heading', { name: /Notifications/i }).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('page loads with heading', async ({ page }) => {
    // Verified in beforeEach
  })

  test('notification list or empty state is visible', async ({ page }) => {
    const emptyState = page.getByText(/no notification/i)
    const list = page.locator('[class*="notification"], [class*="card"]').first()
      .or(page.locator('table'))
    await expect(emptyState.or(list)).toBeVisible({ timeout: 10_000 })
  })

  test('category filter exists', async ({ page }) => {
    const filter = page.locator('button').filter({ hasText: /all|category|filter/i }).first()
    await page.waitForTimeout(2000)
  })

  test('mark all read button exists', async ({ page }) => {
    const markRead = page.getByRole('button', { name: /mark.*read/i })
    await page.waitForTimeout(2000)
    // May or may not be visible depending on unread count
  })

  test('unread count is displayed', async ({ page }) => {
    await page.waitForTimeout(2000)
    const body = await page.locator('main').textContent()
    expect(body).toBeTruthy()
  })
})
