import { test, expect } from '@playwright/test'

test.describe('P1: Calendar @p1', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar')
    // Wait for the FullCalendar container
    await expect(
      page.locator('.fc').first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('calendar container renders', async ({ page }) => {
    await expect(page.locator('.fc').first()).toBeVisible()
  })

  test('day view button exists', async ({ page }) => {
    // FullCalendar uses .fc-timeGridDay-button class
    const dayButton = page.locator('.fc-timeGridDay-button')
    await expect(dayButton).toBeVisible({ timeout: 10_000 })
  })

  test('week view button exists', async ({ page }) => {
    const weekButton = page.locator('.fc-timeGridWeek-button')
    await expect(weekButton).toBeVisible({ timeout: 10_000 })
  })

  test('switching to day view works', async ({ page }) => {
    await page.locator('.fc-timeGridDay-button').click()
    await page.waitForTimeout(500)
    await expect(page.locator('.fc').first()).toBeVisible()
  })

  test('switching to week view works', async ({ page }) => {
    await page.locator('.fc-timeGridWeek-button').click()
    await page.waitForTimeout(500)
    await expect(page.locator('.fc').first()).toBeVisible()
  })

  test('today button exists', async ({ page }) => {
    const todayButton = page.locator('.fc-today-button')
    await expect(todayButton).toBeVisible({ timeout: 10_000 })
  })

  test('navigation arrows exist', async ({ page }) => {
    await expect(page.locator('.fc-prev-button')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.fc-next-button')).toBeVisible({ timeout: 10_000 })
  })
})
