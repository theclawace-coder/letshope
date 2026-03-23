import { test, expect } from '@playwright/test'

test.describe('P1: Risk Register @p1', () => {
  test.describe('Risks List', () => {
    test('list page loads with heading', async ({ page }) => {
      await page.goto('/risks')
      await expect(
        page.getByRole('heading', { name: /Risk Register|Risks/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Register Risk button is visible', async ({ page }) => {
      await page.goto('/risks')
      await expect(
        page.getByRole('heading', { name: /Risk/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      await expect(
        page.getByRole('button', { name: /register.*risk/i }).first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('Register Risk navigates to /risks/new', async ({ page }) => {
      await page.goto('/risks')
      await expect(
        page.getByRole('heading', { name: /Risk/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      await page.getByRole('button', { name: /register.*risk/i }).first().click()
      await expect(page).toHaveURL(/\/risks\/new/, { timeout: 10_000 })
    })

    test('empty state or data is shown', async ({ page }) => {
      await page.goto('/risks')
      await expect(
        page.getByRole('heading', { name: /Risk/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const emptyState = page.getByText('No risks registered')
      const table = page.locator('table')
      await expect(emptyState.or(table)).toBeVisible({ timeout: 10_000 })
    })
  })

  test.describe('Create Risk', () => {
    test('form loads with heading', async ({ page }) => {
      await page.goto('/risks/new')
      await expect(
        page.getByRole('heading', { name: /risk/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('form has participant selector', async ({ page }) => {
      await page.goto('/risks/new')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/Participant/i).first()).toBeVisible({ timeout: 10_000 })
    })

    test('form has title field', async ({ page }) => {
      await page.goto('/risks/new')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/Title/i).first()).toBeVisible({ timeout: 10_000 })
    })

    test('form has description field', async ({ page }) => {
      await page.goto('/risks/new')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/Description/i).first()).toBeVisible({ timeout: 10_000 })
    })

    test('form has category selector', async ({ page }) => {
      await page.goto('/risks/new')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/Category/i).first()).toBeVisible({ timeout: 10_000 })
    })

    test('form has likelihood selector', async ({ page }) => {
      await page.goto('/risks/new')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/Likelihood/i).first()).toBeVisible({ timeout: 10_000 })
    })

    test('form has consequence selector', async ({ page }) => {
      await page.goto('/risks/new')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/Consequence/i).first()).toBeVisible({ timeout: 10_000 })
    })

    test('form has identified date field', async ({ page }) => {
      await page.goto('/risks/new')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/Date/i).first()).toBeVisible({ timeout: 10_000 })
    })

    test('Register Risk submit button exists', async ({ page }) => {
      await page.goto('/risks/new')
      await page.waitForTimeout(2000)
      await expect(
        page.getByRole('button', { name: /register risk/i })
      ).toBeVisible({ timeout: 10_000 })
    })
  })

  test.describe('Risk Detail', () => {
    test('detail page loads from list', async ({ page }) => {
      await page.goto('/risks')
      await expect(
        page.getByRole('heading', { name: /Risk/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const table = page.locator('table')
      const emptyState = page.getByText('No risks registered')
      await expect(table.or(emptyState)).toBeVisible({ timeout: 10_000 })

      if (await emptyState.isVisible()) {
        test.skip(true, 'No risks to view')
        return
      }

      await table.locator('tbody tr').first().click()
      await expect(page).toHaveURL(/\/risks\/[a-zA-Z0-9-]+/, { timeout: 10_000 })
    })
  })
})
