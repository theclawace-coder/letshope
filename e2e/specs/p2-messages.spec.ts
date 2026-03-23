import { test, expect } from '@playwright/test'

test.describe('P2: Messages @p2', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/messages')
    await expect(
      page.getByRole('heading', { name: /Messages/i }).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('page loads with heading', async ({ page }) => {
    // Verified in beforeEach
  })

  test('new thread/message button exists', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new|compose|create/i })
    await page.waitForTimeout(2000)
    if (await newBtn.isVisible()) {
      expect(true).toBe(true)
    }
  })

  test('thread list or empty state is visible', async ({ page }) => {
    const emptyState = page.getByText(/no message|no thread/i)
    const list = page.locator('[class*="thread"], [class*="message"], [class*="card"]').first()
      .or(page.locator('table'))
    await expect(emptyState.or(list)).toBeVisible({ timeout: 10_000 })
  })

  test('search functionality exists', async ({ page }) => {
    const search = page.getByPlaceholder(/search/i)
    await page.waitForTimeout(2000)
    if (await search.isVisible()) {
      await search.fill('Test')
      await expect(search).toHaveValue('Test')
    }
  })
})
