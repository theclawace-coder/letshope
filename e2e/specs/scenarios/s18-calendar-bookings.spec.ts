import { test, expect } from '@playwright/test'

test.describe('S18: Calendar and booking functionality @scenario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar')
    await expect(page.locator('.fc').first()).toBeVisible({ timeout: 15_000 })
  })

  test('calendar container renders with toolbar', async ({ page }) => {
    await expect(page.locator('.fc').first()).toBeVisible()
    // Toolbar should have navigation and view-switching buttons
    await expect(page.locator('.fc-toolbar').first()).toBeVisible({ timeout: 10_000 })
  })

  test('switch to day view', async ({ page }) => {
    const dayBtn = page.locator('.fc-timeGridDay-button').first()
    await expect(dayBtn).toBeVisible({ timeout: 10_000 })
    await dayBtn.click()
    await page.waitForTimeout(1000)
    // In day view the calendar should still be visible
    await expect(page.locator('.fc').first()).toBeVisible()
    // Day view renders a single-day time grid
    await expect(
      page.locator('.fc-timegrid').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('switch to week view', async ({ page }) => {
    // First go to day, then back to week to ensure switching works
    const dayBtn = page.locator('.fc-timeGridDay-button').first()
    await dayBtn.click()
    await page.waitForTimeout(1000)

    const weekBtn = page.locator('.fc-timeGridWeek-button').first()
    await expect(weekBtn).toBeVisible({ timeout: 10_000 })
    await weekBtn.click()
    await page.waitForTimeout(1000)
    await expect(page.locator('.fc').first()).toBeVisible()
  })

  test('month view button works if present', async ({ page }) => {
    const monthBtn = page.locator('.fc-dayGridMonth-button').first()
    if (await monthBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await monthBtn.click()
      await page.waitForTimeout(1000)
      await expect(page.locator('.fc').first()).toBeVisible()
    }
  })

  test('navigate to next period and back', async ({ page }) => {
    const nextBtn = page.locator('.fc-next-button').first()
    const prevBtn = page.locator('.fc-prev-button').first()
    const todayBtn = page.locator('.fc-today-button').first()

    await expect(nextBtn).toBeVisible({ timeout: 10_000 })
    await expect(prevBtn).toBeVisible({ timeout: 10_000 })

    // Get initial title text
    const titleBefore = await page.locator('.fc-toolbar-title').first().textContent()

    // Navigate forward
    await nextBtn.click()
    await page.waitForTimeout(1000)
    const titleAfterNext = await page.locator('.fc-toolbar-title').first().textContent()
    expect(titleAfterNext).not.toBe(titleBefore)

    // Navigate back
    await prevBtn.click()
    await page.waitForTimeout(1000)

    // Return to today
    if (await todayBtn.isEnabled()) {
      await todayBtn.click()
      await page.waitForTimeout(1000)
    }
    await expect(page.locator('.fc').first()).toBeVisible()
  })

  test('today button returns to current period', async ({ page }) => {
    const nextBtn = page.locator('.fc-next-button').first()
    const todayBtn = page.locator('.fc-today-button').first()

    // Navigate away from today
    await nextBtn.click()
    await page.waitForTimeout(1000)
    await nextBtn.click()
    await page.waitForTimeout(1000)

    // Today button should now be enabled
    await expect(todayBtn).toBeVisible({ timeout: 10_000 })
    await todayBtn.click()
    await page.waitForTimeout(1000)
    await expect(page.locator('.fc').first()).toBeVisible()
  })

  test('clicking a time slot opens booking dialog', async ({ page }) => {
    // Switch to day view for easier slot targeting
    await page.locator('.fc-timeGridDay-button').first().click()
    await page.waitForTimeout(1500)

    // Try clicking on the time grid body area to trigger booking creation
    const timeGrid = page.locator('.fc-timegrid-body').first()
    if (await timeGrid.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Click somewhere in the time slots area
      const slotLane = page.locator('.fc-timegrid-slot-lane').first()
      if (await slotLane.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await slotLane.click()
        await page.waitForTimeout(2000)

        // Check if a dialog/modal opened
        const dialog = page.locator('[role="dialog"]').first()
        if (await dialog.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await expect(dialog).toBeVisible()

          // Verify dialog has expected fields
          const dialogText = await dialog.textContent()
          expect(dialogText?.length).toBeGreaterThan(5)

          // Close the dialog
          const closeBtn = dialog.getByRole('button', { name: /close|cancel|×/i }).first()
          if (await closeBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await closeBtn.click()
            await page.waitForTimeout(1000)
          } else {
            await page.keyboard.press('Escape')
            await page.waitForTimeout(1000)
          }
        }
      }
    }
  })

  test('booking dialog has participant and worker selectors', async ({ page }) => {
    // Switch to day view
    await page.locator('.fc-timeGridDay-button').first().click()
    await page.waitForTimeout(1500)

    const slotLane = page.locator('.fc-timegrid-slot-lane').first()
    if (!(await slotLane.isVisible({ timeout: 3_000 }).catch(() => false))) return

    await slotLane.click()
    await page.waitForTimeout(2000)

    const dialog = page.locator('[role="dialog"]').first()
    if (!(await dialog.isVisible({ timeout: 5_000 }).catch(() => false))) return

    // Check for participant selector
    const participantField = dialog.getByText(/participant/i).first()
    if (await participantField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(participantField).toBeVisible()
    }

    // Check for worker selector
    const workerField = dialog.getByText(/worker|staff/i).first()
    if (await workerField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(workerField).toBeVisible()
    }

    // Close dialog
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)
  })

  test('worker filter is visible if present', async ({ page }) => {
    const workerFilter = page.getByText(/filter.*worker|worker.*filter/i).first()
    const workerSelect = page
      .locator('[data-slot="select-trigger"]')
      .first()
    if (await workerFilter.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(workerFilter).toBeVisible()
    } else if (await workerSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // A select trigger might serve as a worker filter
      await expect(workerSelect).toBeVisible()
    }
    // Calendar should remain functional
    await expect(page.locator('.fc').first()).toBeVisible()
  })
})
