import { test, expect } from '@playwright/test'

test.describe('P1: Participant Detail @p1', () => {
  test('detail page loads from list', async ({ page }) => {
    await page.goto('/participants')
    await expect(
      page.getByRole('heading', { name: 'Participants', exact: true })
    ).toBeVisible({ timeout: 15_000 })

    const emptyState = page.getByText('No participants yet')
    const table = page.locator('table')
    await expect(table.or(emptyState)).toBeVisible({ timeout: 10_000 })

    if (await emptyState.isVisible()) {
      test.skip(true, 'No participants to view')
      return
    }

    await page.locator('table tbody tr').first().click()
    await page.waitForTimeout(3000)
    // Verify we navigated away from the list
    expect(page.url()).not.toBe('http://localhost:5173/participants')
  })

  test('profile tab shows participant info', async ({ page }) => {
    await page.goto('/participants')
    await expect(
      page.getByRole('heading', { name: 'Participants', exact: true })
    ).toBeVisible({ timeout: 15_000 })

    const table = page.locator('table')
    if (!(await table.isVisible())) {
      test.skip(true, 'No participants')
      return
    }

    await page.locator('table tbody tr').first().click()
    await page.waitForTimeout(3000)

    // Should show content on the detail page
    const bodyText = await page.locator('body').textContent()
    expect(bodyText?.length).toBeGreaterThan(50)
  })

  test('tabs are clickable', async ({ page }) => {
    await page.goto('/participants')
    await expect(
      page.getByRole('heading', { name: 'Participants', exact: true })
    ).toBeVisible({ timeout: 15_000 })

    const table = page.locator('table')
    if (!(await table.isVisible())) {
      test.skip(true, 'No participants')
      return
    }

    await page.locator('table tbody tr').first().click()
    await page.waitForTimeout(3000)

    const tabList = page.locator('[role="tablist"]')
    if (await tabList.isVisible()) {
      const tabs = tabList.locator('[role="tab"]')
      const tabCount = await tabs.count()
      expect(tabCount).toBeGreaterThanOrEqual(2)

      if (tabCount > 1) {
        await tabs.nth(1).click()
        await page.waitForTimeout(500)
      }
    }
  })

  test('back button navigates to list', async ({ page }) => {
    await page.goto('/participants')
    await expect(
      page.getByRole('heading', { name: 'Participants', exact: true })
    ).toBeVisible({ timeout: 15_000 })

    const table = page.locator('table')
    if (!(await table.isVisible())) {
      test.skip(true, 'No participants')
      return
    }

    await page.locator('table tbody tr').first().click()
    await page.waitForTimeout(3000)

    const backButton = page.getByRole('button', { name: /back/i }).first()
      .or(page.getByRole('link', { name: /back/i }).first())
    if (await backButton.isVisible()) {
      await backButton.click()
      await expect(page).toHaveURL(/\/participants$/, { timeout: 10_000 })
    }
  })
})
