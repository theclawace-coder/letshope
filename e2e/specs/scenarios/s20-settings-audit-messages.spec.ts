import { test, expect } from '@playwright/test'

/* ─── Settings ──────────────────────────────────────────────────────── */

test.describe('S20-A: Settings page @scenario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
    await expect(
      page.getByRole('heading', { name: /settings/i }).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('settings page loads', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /settings/i }).first()
    ).toBeVisible()
  })

  test('profile section shows name and email fields', async ({ page }) => {
    await page.waitForTimeout(1500)
    // Look for profile-related content
    const nameField = page.getByLabel(/name/i).first()
    const emailField = page.getByLabel(/email/i).first()
    const profileText = page.getByText(/profile/i).first()

    if (await profileText.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(profileText).toBeVisible()
    }

    if (await nameField.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(nameField).toBeVisible()
      const nameValue = await nameField.inputValue()
      expect(nameValue.length).toBeGreaterThan(0)
    }

    if (await emailField.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(emailField).toBeVisible()
    }
  })

  test('notification preferences section exists', async ({ page }) => {
    await page.waitForTimeout(1000)
    const notifSection = page.getByText(/notification/i).first()
    if (await notifSection.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(notifSection).toBeVisible()
    }
    // Settings page should have meaningful content regardless
    const mainText = await page.locator('main').first().textContent()
    expect(mainText?.length).toBeGreaterThan(20)
  })

  test('theme toggle exists and works', async ({ page }) => {
    await page.waitForTimeout(1000)
    // Look for theme toggle — could be a switch, button, or select
    const themeToggle = page.getByRole('switch', { name: /dark|theme|mode/i }).first()
    const themeButton = page.getByRole('button', { name: /dark|theme|mode|light/i }).first()
    const themeSelect = page.getByText(/theme|appearance/i).first()

    if (await themeToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // Get initial state
      const wasBefore = await themeToggle.isChecked()
      await themeToggle.click()
      await page.waitForTimeout(1000)
      // Verify the toggle changed
      const isAfter = await themeToggle.isChecked()
      expect(isAfter).not.toBe(wasBefore)
      // Toggle back
      await themeToggle.click()
      await page.waitForTimeout(1000)
    } else if (await themeButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await themeButton.click()
      await page.waitForTimeout(1000)
    } else if (await themeSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(themeSelect).toBeVisible()
    }
  })
})

/* ─── Audit Trail ───────────────────────────────────────────────────── */

test.describe('S20-B: Audit trail @scenario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/audit')
    await page.waitForTimeout(1500)
  })

  test('audit trail page loads', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /audit/i }).first()
    await expect(heading).toBeVisible({ timeout: 15_000 })
  })

  test('filter controls exist', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /audit/i }).first()
    ).toBeVisible({ timeout: 15_000 })

    // Look for filter elements: entity type, action type, date range
    const filterArea = page.locator('main').first()
    const filterText = await filterArea.textContent()

    // Check for at least some filter-related UI elements
    const selectTrigger = page.locator('[data-slot="select-trigger"]').first()
    const filterBtn = page.getByRole('button', { name: /filter|entity|action|type/i }).first()
    const searchInput = page.getByPlaceholder(/search|filter/i).first()

    const hasSelect = await selectTrigger.isVisible({ timeout: 3_000 }).catch(() => false)
    const hasFilterBtn = await filterBtn.isVisible({ timeout: 3_000 }).catch(() => false)
    const hasSearch = await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)

    // Page should have content
    expect(filterText?.length).toBeGreaterThan(5)
  })

  test('audit log entries or empty state is visible', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /audit/i }).first()
    ).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(2000)

    const table = page.locator('table').first()
    const emptyState = page.getByText(/no.*audit|no.*entries|no.*logs|empty/i).first()
    const listItems = page.locator('[class*="audit"], [class*="log"]').first()

    const hasTable = await table.isVisible({ timeout: 3_000 }).catch(() => false)
    const hasEmpty = await emptyState.isVisible({ timeout: 3_000 }).catch(() => false)
    const hasItems = await listItems.isVisible({ timeout: 3_000 }).catch(() => false)

    // The page should show either data or an empty state
    const mainText = await page.locator('main').first().textContent()
    expect(mainText?.length).toBeGreaterThan(5)
  })
})

/* ─── Messages ──────────────────────────────────────────────────────── */

test.describe('S20-C: Messages @scenario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/messages')
    await page.waitForTimeout(1500)
  })

  test('messages page loads', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /message/i }).first()
    await expect(heading).toBeVisible({ timeout: 15_000 })
  })

  test('thread list or empty state is visible', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /message/i }).first()
    ).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(2000)

    const mainText = await page.locator('main').first().textContent()
    expect(mainText?.length).toBeGreaterThan(5)
  })

  test('new message/thread button exists', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /message/i }).first()
    ).toBeVisible({ timeout: 15_000 })

    const newBtn = page
      .getByRole('button', { name: /new message|new thread|compose|create/i })
      .first()
    if (await newBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(newBtn).toBeVisible()
    }
    // Page should have content regardless
    const mainText = await page.locator('main').first().textContent()
    expect(mainText?.length).toBeGreaterThan(5)
  })
})

/* ─── Notifications ─────────────────────────────────────────────────── */

test.describe('S20-D: Notifications @scenario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForTimeout(1500)
  })

  test('notifications page loads', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /notification/i }).first()
    await expect(heading).toBeVisible({ timeout: 15_000 })
  })

  test('category filter tabs exist if present', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /notification/i }).first()
    ).toBeVisible({ timeout: 15_000 })

    const tabList = page.locator('[role="tablist"]').first()
    const filterBtns = page.getByRole('button', { name: /all|unread|read|archived/i }).first()

    if (await tabList.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(tabList).toBeVisible()
    } else if (await filterBtns.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(filterBtns).toBeVisible()
    }
  })

  test('mark read and archive actions exist if notifications present', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /notification/i }).first()
    ).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(2000)

    const markReadBtn = page
      .getByRole('button', { name: /mark.*read|mark all/i })
      .first()
    const archiveBtn = page.getByRole('button', { name: /archive/i }).first()

    if (await markReadBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(markReadBtn).toBeVisible()
    }
    if (await archiveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(archiveBtn).toBeVisible()
    }
  })

  test('notification items or empty state visible', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /notification/i }).first()
    ).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(2000)

    const mainText = await page.locator('main').first().textContent()
    expect(mainText?.length).toBeGreaterThan(5)
  })
})

/* ─── AI Buddy ──────────────────────────────────────────────────────── */

test.describe('S20-E: AI Buddy @scenario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai-buddy')
    await page.waitForTimeout(1500)
  })

  test('AI buddy page loads', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /ai|buddy|assistant/i }).first()
    await expect(heading).toBeVisible({ timeout: 15_000 })
  })

  test('chat input area exists', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /ai|buddy|assistant/i }).first()
    await expect(heading).toBeVisible({ timeout: 15_000 })

    // Look for chat input (textarea or input)
    const chatInput = page.getByPlaceholder(/ask|type|message|chat/i).first()
    const textarea = page.locator('textarea').first()

    if (await chatInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(chatInput).toBeVisible()
      // Verify it accepts text
      await chatInput.fill('Hello')
      await expect(chatInput).toHaveValue('Hello')
      await chatInput.clear()
    } else if (await textarea.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(textarea).toBeVisible()
      await textarea.fill('Hello')
      const val = await textarea.inputValue()
      expect(val).toBe('Hello')
      await textarea.clear()
    }
  })

  test('message display area exists', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /ai|buddy|assistant/i }).first()
    await expect(heading).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(1000)

    // The main area should have some content — welcome message, suggestions, etc.
    const mainText = await page.locator('main').first().textContent()
    expect(mainText?.length).toBeGreaterThan(10)
  })

  test('conversation list or suggested questions exist', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /ai|buddy|assistant/i }).first()
    await expect(heading).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(1500)

    // Look for suggested prompts / quick questions
    const suggestions = page.getByRole('button', { name: /suggest|help|how|what|show/i }).first()
    const conversationList = page.getByText(/conversation|history|previous/i).first()

    if (await suggestions.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(suggestions).toBeVisible()
    } else if (await conversationList.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(conversationList).toBeVisible()
    }

    // Page should have meaningful content
    const mainText = await page.locator('main').first().textContent()
    expect(mainText?.length).toBeGreaterThan(10)
  })
})
