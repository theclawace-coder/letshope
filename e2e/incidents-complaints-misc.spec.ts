import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Incidents
// ---------------------------------------------------------------------------
test.describe('Incidents', () => {
  test('list page loads with heading', async ({ page }) => {
    await page.goto('/incidents')
    await expect(
      page.getByRole('heading', { name: 'Incidents', exact: true })
    ).toBeVisible({ timeout: 15000 })
  })

  test('stat cards: Open, Investigating, Pending Report, Major / Critical', async ({ page }) => {
    await page.goto('/incidents')
    const statLabels = ['Open', 'Investigating', 'Pending Report', 'Major / Critical']

    for (const label of statLabels) {
      await expect(page.getByText(label)).toBeVisible({ timeout: 15000 })
    }
  })

  test('search input has correct placeholder', async ({ page }) => {
    await page.goto('/incidents')
    await expect(
      page.getByPlaceholder('Search incidents...')
    ).toBeVisible({ timeout: 15000 })
  })

  test('severity filter dropdown is visible', async ({ page }) => {
    await page.goto('/incidents')
    await expect(
      page.getByText('All Severity')
    ).toBeVisible({ timeout: 15000 })
  })

  test('status filter dropdown is visible', async ({ page }) => {
    await page.goto('/incidents')
    await expect(
      page.getByText('All Statuses').first()
    ).toBeVisible({ timeout: 15000 })
  })

  test('type filter dropdown is visible', async ({ page }) => {
    await page.goto('/incidents')
    await expect(
      page.getByText('All Types')
    ).toBeVisible({ timeout: 15000 })
  })

  test('Log Incident button navigates to /incidents/new', async ({ page }) => {
    await page.goto('/incidents')
    await page.getByRole('button', { name: 'Log Incident' }).click()
    await expect(page).toHaveURL(/\/incidents\/new/, { timeout: 10000 })
  })

  test('create form loads with expected fields', async ({ page }) => {
    await page.goto('/incidents/new')

    await expect(
      page.getByRole('heading', { name: /Log an Incident/i })
    ).toBeVisible({ timeout: 15000 })

    // Key form fields
    await expect(page.getByText('Incident Date')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Description')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Severity *')).toBeVisible({ timeout: 10000 })
  })

  test('table headers are correct when rows exist', async ({ page }) => {
    await page.goto('/incidents')
    const headers = ['Severity', 'Type', 'Date', 'Participant', 'Status', 'Reportable']

    // Wait for page to finish loading
    await expect(page.getByRole('heading', { name: 'Incidents', exact: true })).toBeVisible({ timeout: 15000 })

    const table = page.locator('table')
    const hasTable = await table.isVisible().catch(() => false)

    if (hasTable) {
      for (const header of headers) {
        await expect(
          table.getByRole('columnheader', { name: header })
        ).toBeVisible({ timeout: 10000 })
      }
    } else {
      // Empty state is acceptable
      await expect(page.getByText('No incidents logged')).toBeVisible({ timeout: 10000 })
    }
  })
})

// ---------------------------------------------------------------------------
// Complaints
// ---------------------------------------------------------------------------
test.describe('Complaints', () => {
  test('list page loads with heading', async ({ page }) => {
    await page.goto('/complaints')
    await expect(
      page.getByRole('heading', { name: 'Complaints', exact: true })
    ).toBeVisible({ timeout: 15000 })
  })

  test('stat cards: Open, Investigating, Overdue Acknowledgment', async ({ page }) => {
    await page.goto('/complaints')
    const statLabels = ['Open', 'Investigating', 'Overdue Acknowledgment']

    for (const label of statLabels) {
      await expect(page.getByText(label)).toBeVisible({ timeout: 15000 })
    }
  })

  test('status filter dropdown is visible', async ({ page }) => {
    await page.goto('/complaints')
    await expect(
      page.getByText('All Statuses').first()
    ).toBeVisible({ timeout: 15000 })
  })

  test('category filter dropdown is visible', async ({ page }) => {
    await page.goto('/complaints')
    await expect(
      page.getByText('All Categories')
    ).toBeVisible({ timeout: 15000 })
  })

  test('Log Complaint button navigates to /complaints/new', async ({ page }) => {
    await page.goto('/complaints')
    await page.getByRole('button', { name: 'Log Complaint' }).click()
    await expect(page).toHaveURL(/\/complaints\/new/, { timeout: 10000 })
  })

  test('create form loads with heading', async ({ page }) => {
    await page.goto('/complaints/new')

    await expect(
      page.getByRole('heading', { name: /Log a Complaint/i })
    ).toBeVisible({ timeout: 15000 })
  })

  test('table headers are correct when rows exist', async ({ page }) => {
    await page.goto('/complaints')
    const headers = ['Date', 'Category', 'Complainant', 'Participant', 'Status', 'Acknowledged']

    await expect(page.getByRole('heading', { name: 'Complaints', exact: true })).toBeVisible({ timeout: 15000 })

    const table = page.locator('table')
    const hasTable = await table.isVisible().catch(() => false)

    if (hasTable) {
      for (const header of headers) {
        await expect(
          table.getByRole('columnheader', { name: header })
        ).toBeVisible({ timeout: 10000 })
      }
    } else {
      await expect(page.getByText('No complaints logged')).toBeVisible({ timeout: 10000 })
    }
  })
})

// ---------------------------------------------------------------------------
// Misc pages
// ---------------------------------------------------------------------------
test.describe('Misc pages', () => {
  test('AI Buddy page loads', async ({ page }) => {
    await page.goto('/ai-buddy')

    await expect(
      page.getByRole('heading', { name: 'AI Buddy', exact: true })
    ).toBeVisible({ timeout: 15000 })
  })

  test('Audit logs page loads', async ({ page }) => {
    await page.goto('/audit')

    await expect(
      page.getByRole('heading', { name: 'Audit Trail' })
    ).toBeVisible({ timeout: 15000 })
  })

  test('Settings page loads', async ({ page }) => {
    await page.goto('/settings')

    await expect(
      page.getByRole('heading', { name: 'Settings' })
    ).toBeVisible({ timeout: 15000 })
  })

  test('Documents page loads with heading', async ({ page }) => {
    await page.goto('/documents')

    await expect(
      page.getByRole('heading', { name: 'Documents', exact: true })
    ).toBeVisible({ timeout: 15000 })
  })
})

// ---------------------------------------------------------------------------
// Navigation / Sidebar
// ---------------------------------------------------------------------------
test.describe('Navigation and Sidebar', () => {
  test('sidebar has links to all major sections', async ({ page }) => {
    await page.goto('/dashboard')

    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible({ timeout: 10000 })

    const expectedLinks = [
      'Dashboard',
      'Participants',
      'Workers',
      'Calendar',
      'Progress Notes',
      'Invoices',
      'Incidents',
      'Complaints',
      'Concerns',
      'Compliance',
      'AI Buddy',
      'Audit Trail',
      'Documents',
      'Settings',
    ]

    for (const linkText of expectedLinks) {
      await expect(
        sidebar.getByRole('link', { name: linkText })
      ).toBeVisible({ timeout: 10000 })
    }
  })

  test('topbar renders with organisation name', async ({ page }) => {
    await page.goto('/dashboard')

    const topbar = page.locator('header')
    await expect(topbar).toBeVisible({ timeout: 10000 })

    await expect(
      topbar.getByText('Hope Disability Support')
    ).toBeVisible({ timeout: 10000 })
  })

  test('navigating between pages preserves sidebar state', async ({ page }) => {
    await page.goto('/incidents')

    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible({ timeout: 10000 })

    // Navigate to complaints via sidebar link
    await sidebar.getByRole('link', { name: 'Complaints' }).click()
    await expect(page).toHaveURL(/\/complaints/, { timeout: 10000 })

    // Sidebar should still be visible after navigation
    await expect(sidebar).toBeVisible({ timeout: 10000 })

    // Navigate to settings
    await sidebar.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings/, { timeout: 10000 })
    await expect(sidebar).toBeVisible({ timeout: 10000 })
  })
})
