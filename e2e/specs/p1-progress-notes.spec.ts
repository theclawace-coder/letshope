import { test, expect } from '@playwright/test'

test.describe('P1: Progress Notes @p1', () => {
  test.describe('Progress Notes List', () => {
    test('list page loads with heading', async ({ page }) => {
      await page.goto('/progress-notes')
      await expect(
        page.getByRole('heading', { name: 'Progress Notes', exact: true })
      ).toBeVisible({ timeout: 15_000 })
    })

    test('New Note button is visible', async ({ page }) => {
      await page.goto('/progress-notes')
      await expect(
        page.getByRole('heading', { name: 'Progress Notes', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await expect(page.getByRole('button', { name: /new note/i })).toBeVisible()
    })

    test('search filter is present', async ({ page }) => {
      await page.goto('/progress-notes')
      await expect(
        page.getByRole('heading', { name: 'Progress Notes', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await expect(page.getByPlaceholder('Search notes...')).toBeVisible()
    })

    test('search accepts input', async ({ page }) => {
      await page.goto('/progress-notes')
      await expect(
        page.getByRole('heading', { name: 'Progress Notes', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      const search = page.getByPlaceholder('Search notes...')
      await search.fill('Test search')
      await expect(search).toHaveValue('Test search')
    })

    test('empty state or data is shown', async ({ page }) => {
      await page.goto('/progress-notes')
      await expect(
        page.getByRole('heading', { name: 'Progress Notes', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      const emptyState = page.getByText('No progress notes yet')
      const table = page.locator('table')
      await expect(emptyState.or(table)).toBeVisible()
    })
  })

  test.describe('Create Progress Note', () => {
    test('form loads with heading', async ({ page }) => {
      await page.goto('/progress-notes/new')
      await expect(
        page.getByRole('heading', { name: 'New Progress Note' })
      ).toBeVisible({ timeout: 15_000 })
    })

    test('form has participant selector', async ({ page }) => {
      await page.goto('/progress-notes/new')
      await expect(
        page.getByRole('heading', { name: 'New Progress Note' })
      ).toBeVisible({ timeout: 15_000 })
      await expect(page.getByText('Participant *')).toBeVisible()
    })

    test('form has worker selector', async ({ page }) => {
      await page.goto('/progress-notes/new')
      await expect(
        page.getByRole('heading', { name: 'New Progress Note' })
      ).toBeVisible({ timeout: 15_000 })
      await expect(page.getByText('Worker *')).toBeVisible()
    })

    test('form has date field', async ({ page }) => {
      await page.goto('/progress-notes/new')
      await expect(
        page.getByRole('heading', { name: 'New Progress Note' })
      ).toBeVisible({ timeout: 15_000 })
      await expect(page.getByText('Date *')).toBeVisible()
    })

    test('form has content textarea', async ({ page }) => {
      await page.goto('/progress-notes/new')
      await expect(
        page.getByRole('heading', { name: 'New Progress Note' })
      ).toBeVisible({ timeout: 15_000 })
      await expect(page.getByText('Note Content *')).toBeVisible()
    })

    test('form has service type field', async ({ page }) => {
      await page.goto('/progress-notes/new')
      await expect(
        page.getByRole('heading', { name: 'New Progress Note' })
      ).toBeVisible({ timeout: 15_000 })
      await expect(page.getByText('Service Type')).toBeVisible()
    })

    test('submit button exists', async ({ page }) => {
      await page.goto('/progress-notes/new')
      await expect(
        page.getByRole('heading', { name: 'New Progress Note' })
      ).toBeVisible({ timeout: 15_000 })
      await expect(
        page.getByRole('button', { name: /save progress note/i })
      ).toBeVisible()
    })

    test('concern flagging section exists', async ({ page }) => {
      await page.goto('/progress-notes/new')
      await expect(
        page.getByRole('heading', { name: 'New Progress Note' })
      ).toBeVisible({ timeout: 15_000 })

      // Look for concern-related label text
      await expect(page.getByText(/concern/i).first()).toBeVisible({ timeout: 10_000 })
    })
  })
})
