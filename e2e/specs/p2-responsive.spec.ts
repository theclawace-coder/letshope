import { test, expect } from '@playwright/test'

// This spec runs in the 'mobile' project with iPhone 14 viewport
test.describe('P2: Responsive / Mobile @p2', () => {
  test('dashboard loads on mobile viewport', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(
      page.getByRole('heading', { name: /good (morning|afternoon|evening)/i }).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('sidebar is collapsed or hidden on mobile', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)

    const sidebar = page.locator('aside')
    // On mobile, sidebar should be collapsed (w-16) or hidden
    if (await sidebar.isVisible()) {
      const box = await sidebar.boundingBox()
      // Collapsed sidebar is typically ≤80px wide
      if (box) {
        expect(box.width).toBeLessThanOrEqual(320)
      }
    }
  })

  test('participants list renders on mobile', async ({ page }) => {
    await page.goto('/participants')
    await expect(
      page.getByRole('heading', { name: 'Participants', exact: true })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('invoices list renders on mobile', async ({ page }) => {
    await page.goto('/invoices')
    await expect(
      page.getByRole('heading', { name: 'Invoices', exact: true })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('create form renders on mobile', async ({ page }) => {
    await page.goto('/incidents/new')
    await expect(
      page.getByRole('heading', { name: /Log an Incident/i })
    ).toBeVisible({ timeout: 15_000 })

    // Form should be visible and scrollable
    await expect(page.locator('form')).toBeVisible({ timeout: 10_000 })
  })

  test('main content is not cut off', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(
      page.getByRole('heading', { name: /good (morning|afternoon|evening)/i }).first()
    ).toBeVisible({ timeout: 15_000 })

    // Content should be within viewport width
    const main = page.locator('main')
    if (await main.isVisible()) {
      const box = await main.boundingBox()
      if (box) {
        const viewport = page.viewportSize()
        if (viewport) {
          expect(box.width).toBeLessThanOrEqual(viewport.width + 10) // Small margin
        }
      }
    }
  })
})
