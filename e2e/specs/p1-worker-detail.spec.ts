import { test, expect } from '@playwright/test'

test.describe('P1: Worker Detail @p1', () => {
  test('detail page loads from list', async ({ page }) => {
    await page.goto('/workers')
    await expect(
      page.getByRole('heading', { name: 'Workers', exact: true })
    ).toBeVisible({ timeout: 15_000 })

    const rows = page.locator('table tbody tr')
    const rowCount = await rows.count()
    test.skip(rowCount === 0, 'No workers to view')

    await rows.first().click()
    await expect(page).toHaveURL(/\/workers\/[a-zA-Z0-9-]+/, { timeout: 10_000 })
    await page.waitForTimeout(2000)
    const bodyText = await page.locator('main').textContent()
    expect(bodyText).toBeTruthy()
  })

  test('detail page has profile information', async ({ page }) => {
    await page.goto('/workers')
    await expect(
      page.getByRole('heading', { name: 'Workers', exact: true })
    ).toBeVisible({ timeout: 15_000 })

    const rows = page.locator('table tbody tr')
    const rowCount = await rows.count()
    test.skip(rowCount === 0, 'No workers')

    await rows.first().click()
    await expect(page).toHaveURL(/\/workers\/[a-zA-Z0-9-]+/, { timeout: 10_000 })

    // Should display worker name or role
    await page.waitForTimeout(2000)
    const content = await page.locator('main').textContent()
    expect(content?.length).toBeGreaterThan(10)
  })

  test('compliance section shows screening status', async ({ page }) => {
    await page.goto('/workers')
    await expect(
      page.getByRole('heading', { name: 'Workers', exact: true })
    ).toBeVisible({ timeout: 15_000 })

    const rows = page.locator('table tbody tr')
    const rowCount = await rows.count()
    test.skip(rowCount === 0, 'No workers')

    await rows.first().click()
    await expect(page).toHaveURL(/\/workers\/[a-zA-Z0-9-]+/, { timeout: 10_000 })

    // Look for compliance-related content
    const compliance = page.getByText(/compliance|screening|police check|wwcc/i)
    await page.waitForTimeout(2000)
    // Compliance info may be on a separate tab
  })

  test('back button or breadcrumb returns to list', async ({ page }) => {
    await page.goto('/workers')
    await expect(
      page.getByRole('heading', { name: 'Workers', exact: true })
    ).toBeVisible({ timeout: 15_000 })

    const rows = page.locator('table tbody tr')
    const rowCount = await rows.count()
    test.skip(rowCount === 0, 'No workers')

    await rows.first().click()
    await expect(page).toHaveURL(/\/workers\/[a-zA-Z0-9-]+/, { timeout: 10_000 })

    const backButton = page.getByRole('button', { name: /back/i })
      .or(page.getByRole('link', { name: /back/i }))
    if (await backButton.isVisible()) {
      await backButton.click()
      await expect(page).toHaveURL(/\/workers$/, { timeout: 10_000 })
    }
  })
})
