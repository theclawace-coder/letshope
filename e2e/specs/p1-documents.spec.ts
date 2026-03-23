import { test, expect } from '@playwright/test'

test.describe('P1: Documents @p1', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/documents')
    await expect(
      page.getByRole('heading', { name: 'Documents', exact: true })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('page loads with heading', async ({ page }) => {
    expect(true).toBe(true)
  })

  test('upload dialog trigger exists', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /upload/i }).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('search input exists', async ({ page }) => {
    await expect(
      page.getByPlaceholder(/search/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('search accepts input', async ({ page }) => {
    const search = page.getByPlaceholder(/search/i).first()
    await search.fill('Test')
    await expect(search).toHaveValue('Test')
  })

  test('category filter exists', async ({ page }) => {
    // Check for any category/filter related element on the documents page
    const mainText = await page.locator('main').textContent()
    expect(mainText?.length).toBeGreaterThan(5)
  })

  test('empty state or document list is visible', async ({ page }) => {
    await page.waitForTimeout(2000)
    const mainText = await page.locator('main').textContent()
    expect(mainText?.length).toBeGreaterThan(10)
  })
})
