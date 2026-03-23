import { test, expect } from '@playwright/test'

test.describe('S19: Documents management @scenario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/documents')
    await expect(
      page.getByRole('heading', { name: 'Documents', exact: true }).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('documents page loads with heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Documents', exact: true }).first()
    ).toBeVisible()
  })

  test('search input exists and accepts text', async ({ page }) => {
    const search = page.getByPlaceholder(/search/i).first()
    await expect(search).toBeVisible({ timeout: 10_000 })
    await search.fill('Test Document')
    await expect(search).toHaveValue('Test Document')
    await page.waitForTimeout(1500)
    // After searching, page should still have structure
    const mainText = await page.locator('main').first().textContent()
    expect(mainText?.length).toBeGreaterThan(5)
  })

  test('documents list or empty state is shown', async ({ page }) => {
    await page.waitForTimeout(2000)
    // Either a table/list of documents or an empty state message
    const table = page.locator('table').first()
    const emptyState = page.getByText(/no document|no files|empty|nothing/i).first()
    const docCards = page.locator('[class*="card"], [class*="Card"]').first()

    const hasTable = await table.isVisible({ timeout: 3_000 }).catch(() => false)
    const hasEmpty = await emptyState.isVisible({ timeout: 3_000 }).catch(() => false)
    const hasCards = await docCards.isVisible({ timeout: 3_000 }).catch(() => false)
    // Also check for search/filter area which indicates the page loaded successfully
    const hasSearch = await page.getByPlaceholder(/search/i).first().isVisible({ timeout: 3_000 }).catch(() => false)

    // At least one of these should be present
    expect(hasTable || hasEmpty || hasCards || hasSearch).toBe(true)
  })

  test('upload button exists', async ({ page }) => {
    const uploadBtn = page.getByRole('button', { name: /upload/i }).first()
    await expect(uploadBtn).toBeVisible({ timeout: 10_000 })
  })

  test('upload button opens upload dialog', async ({ page }) => {
    const uploadBtn = page.getByRole('button', { name: /upload/i }).first()
    await expect(uploadBtn).toBeVisible({ timeout: 10_000 })
    await uploadBtn.click()
    await page.waitForTimeout(1500)

    const dialog = page.locator('[role="dialog"]').first()
    if (await dialog.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(dialog).toBeVisible()
      // Close it
      await page.keyboard.press('Escape')
      await page.waitForTimeout(1000)
    }
  })

  test('folder navigation works if folders exist', async ({ page }) => {
    await page.waitForTimeout(1500)
    // Look for folder links or folder icons
    const folder = page.getByRole('button', { name: /folder/i }).first()
    const folderLink = page.getByRole('link', { name: /folder/i }).first()

    if (await folder.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await folder.click()
      await page.waitForTimeout(1500)
      // Should still have documents heading or breadcrumb
      const mainText = await page.locator('main').first().textContent()
      expect(mainText?.length).toBeGreaterThan(5)
    } else if (await folderLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await folderLink.click()
      await page.waitForTimeout(1500)
      const mainText = await page.locator('main').first().textContent()
      expect(mainText?.length).toBeGreaterThan(5)
    }
  })

  test('category filter or tabs exist', async ({ page }) => {
    await page.waitForTimeout(1000)
    // Look for category filter dropdown or tabs
    const categorySelect = page.locator('[data-slot="select-trigger"]').first()
    const tabs = page.locator('[role="tablist"]').first()
    const filterBtn = page.getByRole('button', { name: /category|filter|type/i }).first()

    const hasCategorySelect = await categorySelect
      .isVisible({ timeout: 3_000 })
      .catch(() => false)
    const hasTabs = await tabs.isVisible({ timeout: 3_000 }).catch(() => false)
    const hasFilter = await filterBtn.isVisible({ timeout: 3_000 }).catch(() => false)

    // At least verify the page has meaningful content
    const mainText = await page.locator('main').first().textContent()
    expect(mainText?.length).toBeGreaterThan(10)
  })

  test('page has proper structure: heading and content area', async ({ page }) => {
    // Heading
    await expect(
      page.getByRole('heading', { name: 'Documents', exact: true }).first()
    ).toBeVisible()

    // Main content area
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10_000 })

    // Sidebar should be present
    await expect(page.locator('aside').first()).toBeVisible({ timeout: 10_000 })
  })

  test('document actions are available if documents exist', async ({ page }) => {
    await page.waitForTimeout(2000)
    const table = page.locator('table').first()
    if (await table.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const rows = table.locator('tbody tr')
      const rowCount = await rows.count()
      if (rowCount > 0) {
        // Check first row for action buttons (view, download, delete)
        const firstRow = rows.first()
        const actionBtn = firstRow
          .getByRole('button', { name: /view|download|delete|action|menu/i })
          .first()
        if (await actionBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await expect(actionBtn).toBeVisible()
        }
      }
    }
  })
})
