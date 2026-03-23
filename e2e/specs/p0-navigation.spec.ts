import { test, expect } from '@playwright/test'

// Helper: wait for any authenticated page to load (dashboard has dynamic greeting heading)
async function waitForAppLoad(page: import('@playwright/test').Page) {
  // Wait for sidebar to appear (means auth + layout loaded)
  await expect(page.locator('aside')).toBeVisible({ timeout: 15_000 })
}

test.describe('P0: Navigation & Sidebar @p0', () => {
  test('sidebar has links to all major sections', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppLoad(page)

    const sidebar = page.locator('aside')
    const expectedLinks = [
      'Dashboard',
      'Participants',
      'Workers',
      'Calendar',
      'Goals',
      'Progress Notes',
      'Invoices',
      'Incidents',
      'Complaints',
      'Concerns',
      'Compliance',
      'Consent & Rights',
      'Risk Register',
      'Notifications',
      'Messages',
      'AI Buddy',
      'Audit Trail',
      'Documents',
      'Settings',
    ]

    for (const linkText of expectedLinks) {
      await expect(
        sidebar.getByRole('link', { name: linkText })
      ).toBeVisible({ timeout: 10_000 })
    }
  })

  test('topbar renders with organisation name', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppLoad(page)

    await expect(
      page.locator('header').getByText('Hope Disability Support')
    ).toBeVisible({ timeout: 10_000 })
  })

  test('sidebar: Dashboard link navigates to /dashboard', async ({ page }) => {
    await page.goto('/participants')
    await waitForAppLoad(page)
    await page.locator('aside').getByRole('link', { name: 'Dashboard' }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 })
  })

  test('sidebar: Participants link navigates to /participants', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppLoad(page)
    await page.locator('aside').getByRole('link', { name: 'Participants' }).click()
    await expect(page).toHaveURL(/\/participants/, { timeout: 10_000 })
  })

  test('sidebar: Workers link navigates to /workers', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppLoad(page)
    await page.locator('aside').getByRole('link', { name: 'Workers' }).click()
    await expect(page).toHaveURL(/\/workers/, { timeout: 10_000 })
  })

  test('sidebar: Calendar link navigates to /calendar', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppLoad(page)
    await page.locator('aside').getByRole('link', { name: 'Calendar' }).click()
    await expect(page).toHaveURL(/\/calendar/, { timeout: 10_000 })
  })

  test('sidebar: Goals link navigates to /goals', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppLoad(page)
    await page.locator('aside').getByRole('link', { name: 'Goals' }).click()
    await expect(page).toHaveURL(/\/goals/, { timeout: 10_000 })
  })

  test('sidebar: Progress Notes link navigates to /progress-notes', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppLoad(page)
    await page.locator('aside').getByRole('link', { name: 'Progress Notes' }).click()
    await expect(page).toHaveURL(/\/progress-notes/, { timeout: 10_000 })
  })

  test('sidebar: Invoices link navigates to /invoices', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppLoad(page)
    await page.locator('aside').getByRole('link', { name: 'Invoices' }).click()
    await expect(page).toHaveURL(/\/invoices/, { timeout: 10_000 })
  })

  test('sidebar: Incidents link navigates to /incidents', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppLoad(page)
    await page.locator('aside').getByRole('link', { name: 'Incidents' }).click()
    await expect(page).toHaveURL(/\/incidents/, { timeout: 10_000 })
  })

  test('sidebar: Complaints link navigates to /complaints', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppLoad(page)
    await page.locator('aside').getByRole('link', { name: 'Complaints' }).click()
    await expect(page).toHaveURL(/\/complaints/, { timeout: 10_000 })
  })

  test('sidebar: Concerns link navigates to /concerns', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppLoad(page)
    await page.locator('aside').getByRole('link', { name: 'Concerns' }).click()
    await expect(page).toHaveURL(/\/concerns/, { timeout: 10_000 })
  })

  test('sidebar: Settings link navigates to /settings', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppLoad(page)
    await page.locator('aside').getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings/, { timeout: 10_000 })
  })

  test('sidebar: Documents link navigates to /documents', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppLoad(page)
    await page.locator('aside').getByRole('link', { name: 'Documents' }).click()
    await expect(page).toHaveURL(/\/documents/, { timeout: 10_000 })
  })

  test('sidebar: Audit Trail link navigates to /audit', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppLoad(page)
    await page.locator('aside').getByRole('link', { name: 'Audit Trail' }).click()
    await expect(page).toHaveURL(/\/audit/, { timeout: 10_000 })
  })

  test('navigating between pages preserves sidebar', async ({ page }) => {
    await page.goto('/incidents')
    await waitForAppLoad(page)

    const sidebar = page.locator('aside')
    await sidebar.getByRole('link', { name: 'Complaints' }).click()
    await expect(page).toHaveURL(/\/complaints/, { timeout: 10_000 })
    await expect(sidebar).toBeVisible()

    await sidebar.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings/, { timeout: 10_000 })
    await expect(sidebar).toBeVisible()
  })
})
