import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Progress Notes
// ---------------------------------------------------------------------------

test.describe('Progress Notes', () => {
  test('list page loads with heading', async ({ page }) => {
    await page.goto('/progress-notes')
    await expect(page.getByRole('heading', { name: 'Progress Notes', exact: true })).toBeVisible({ timeout: 15000 })
  })

  test('"New Note" button is visible', async ({ page }) => {
    await page.goto('/progress-notes')
    await expect(page.getByRole('heading', { name: 'Progress Notes', exact: true })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: /new note/i })).toBeVisible()
  })

  test('create page loads with form fields', async ({ page }) => {
    await page.goto('/progress-notes/new')
    await expect(page.getByRole('heading', { name: 'New Progress Note' })).toBeVisible({ timeout: 15000 })

    // Note Details card fields
    await expect(page.getByText('Participant *')).toBeVisible()
    await expect(page.getByText('Worker *')).toBeVisible()
    await expect(page.getByText('Date *')).toBeVisible()
    await expect(page.getByText('Service Type')).toBeVisible()

    // Content / observations section
    await expect(page.getByText('Note Content *')).toBeVisible()
    await expect(page.getByPlaceholder('Main progress note content...')).toBeVisible()

    // Submit button
    await expect(page.getByRole('button', { name: /save progress note/i })).toBeVisible()
  })

  test('search/filter controls are present on list page', async ({ page }) => {
    await page.goto('/progress-notes')
    await expect(page.getByRole('heading', { name: 'Progress Notes', exact: true })).toBeVisible({ timeout: 15000 })

    // Search input
    await expect(page.getByPlaceholder('Search notes...')).toBeVisible()
  })

  test('empty state or table is shown', async ({ page }) => {
    await page.goto('/progress-notes')
    await expect(page.getByRole('heading', { name: 'Progress Notes', exact: true })).toBeVisible({ timeout: 15000 })

    // Either the empty state message or the data table should be visible
    const emptyState = page.getByText('No progress notes yet')
    const table = page.locator('table')
    await expect(emptyState.or(table)).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Concerns
// ---------------------------------------------------------------------------

test.describe('Concerns', () => {
  test('list page loads with heading', async ({ page }) => {
    await page.goto('/concerns')
    await expect(page.getByRole('heading', { name: 'Concerns', exact: true })).toBeVisible({ timeout: 15000 })
  })

  test('"Flag Concern" button is visible', async ({ page }) => {
    await page.goto('/concerns')
    await expect(page.getByRole('heading', { name: 'Concerns', exact: true })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: /flag concern/i })).toBeVisible()
  })

  test('create page loads with all form fields', async ({ page }) => {
    await page.goto('/concerns/new')
    await expect(page.getByRole('heading', { name: 'Flag a Concern' })).toBeVisible({ timeout: 15000 })

    // Required fields
    await expect(page.getByText('Participant *')).toBeVisible()
    await expect(page.getByText('Concern Type *')).toBeVisible()
    await expect(page.getByText('Severity *')).toBeVisible()
    await expect(page.getByText('Title *')).toBeVisible()
    await expect(page.getByText('Description *')).toBeVisible()

    // Submit button
    await expect(page.getByRole('button', { name: /submit concern/i })).toBeVisible()
  })

  test('concern detail page loads when clicking a row', async ({ page }) => {
    await page.goto('/concerns')
    await expect(page.getByRole('heading', { name: 'Concerns', exact: true })).toBeVisible({ timeout: 15000 })

    // Only run this test if there are concerns in the table
    const table = page.locator('table')
    const emptyState = page.getByText('No concerns flagged')

    // Wait for either state to appear
    await expect(emptyState.or(table)).toBeVisible()

    // Skip if no data
    if (await emptyState.isVisible()) {
      test.skip()
      return
    }

    // Click the first data row
    const firstRow = table.locator('tbody tr').first()
    await firstRow.click()

    // Should navigate to /concerns/{id}
    await expect(page).toHaveURL(/\/concerns\/[a-zA-Z0-9-]+/)
  })

  test('filter dropdowns for severity, status, and type are present', async ({ page }) => {
    await page.goto('/concerns')
    await expect(page.getByRole('heading', { name: 'Concerns', exact: true })).toBeVisible({ timeout: 15000 })

    // Severity filter
    await expect(page.locator('button').filter({ hasText: /all severity/i })).toBeVisible()

    // Status filter
    await expect(page.locator('button').filter({ hasText: /all statuses/i })).toBeVisible()

    // Type filter
    await expect(page.locator('button').filter({ hasText: /all types/i })).toBeVisible()
  })

  test('concern detail page shows resolution controls for open concerns', async ({ page }) => {
    await page.goto('/concerns')
    await expect(page.getByRole('heading', { name: 'Concerns', exact: true })).toBeVisible({ timeout: 15000 })

    const table = page.locator('table')
    const emptyState = page.getByText('No concerns flagged')

    await expect(emptyState.or(table)).toBeVisible()

    if (await emptyState.isVisible()) {
      test.skip()
      return
    }

    // Click the first row to go to detail
    const firstRow = table.locator('tbody tr').first()
    await firstRow.click()
    await expect(page).toHaveURL(/\/concerns\/[a-zA-Z0-9-]+/)

    // Check for Back button (always present)
    await expect(page.getByRole('button', { name: /back/i })).toBeVisible()

    // If the concern is open or reviewing, a Resolve button should be visible.
    // If it is already resolved, the Resolution card should be visible instead.
    const resolveButton = page.getByRole('button', { name: /resolve/i })
    const resolutionCard = page.getByText('Resolution')

    await expect(resolveButton.or(resolutionCard)).toBeVisible()
  })
})
