import { test, expect } from '@playwright/test'

test.describe('P1: Goals @p1', () => {
  test.describe('Goals List', () => {
    test('list page loads with heading', async ({ page }) => {
      await page.goto('/goals')
      await expect(
        page.getByRole('heading', { name: 'Goals', exact: true })
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Create a Goal button is visible', async ({ page }) => {
      await page.goto('/goals')
      await expect(
        page.getByRole('heading', { name: 'Goals', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      const btn = page.getByRole('button', { name: /new goal|create.*goal/i }).first()
        .or(page.getByRole('link', { name: /new goal|create.*goal/i }).first())
      await expect(btn).toBeVisible({ timeout: 10_000 })
    })

    test('New Goal navigates to /goals/new', async ({ page }) => {
      await page.goto('/goals')
      await expect(
        page.getByRole('heading', { name: 'Goals', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      const btn = page.getByRole('button', { name: /new goal|create.*goal/i }).first()
        .or(page.getByRole('link', { name: /new goal|create.*goal/i }).first())
      await btn.click()
      await expect(page).toHaveURL(/\/goals\/new/, { timeout: 10_000 })
    })

    test('empty state or table is shown', async ({ page }) => {
      await page.goto('/goals')
      await expect(
        page.getByRole('heading', { name: 'Goals', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      await page.waitForTimeout(2000)
      const mainText = await page.locator('main').textContent()
      expect(mainText?.length).toBeGreaterThan(10)
    })
  })

  test.describe('Create Goal Form', () => {
    test('form loads with heading', async ({ page }) => {
      await page.goto('/goals/new')
      await expect(
        page.getByRole('heading', { name: /new goal|create goal/i })
      ).toBeVisible({ timeout: 15_000 })
    })

    test('participant selector is present', async ({ page }) => {
      await page.goto('/goals/new')
      await expect(
        page.getByRole('heading', { name: /new goal|create goal/i })
      ).toBeVisible({ timeout: 15_000 })
      await expect(page.getByText(/Participant/i).first()).toBeVisible({ timeout: 10_000 })
    })

    test('title field is present', async ({ page }) => {
      await page.goto('/goals/new')
      await expect(
        page.getByRole('heading', { name: /new goal|create goal/i })
      ).toBeVisible({ timeout: 15_000 })

      await expect(
        page.getByText(/Title/i).first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('domain selector is present', async ({ page }) => {
      await page.goto('/goals/new')
      await expect(
        page.getByRole('heading', { name: /new goal|create goal/i })
      ).toBeVisible({ timeout: 15_000 })

      await expect(
        page.getByText(/Domain/i).first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('timeframe selector exists', async ({ page }) => {
      await page.goto('/goals/new')
      await expect(
        page.getByRole('heading', { name: /new goal|create goal/i })
      ).toBeVisible({ timeout: 15_000 })
      await expect(page.getByText(/Timeframe/i).first()).toBeVisible({ timeout: 10_000 })
    })

    test('priority selector exists', async ({ page }) => {
      await page.goto('/goals/new')
      await expect(
        page.getByRole('heading', { name: /new goal|create goal/i })
      ).toBeVisible({ timeout: 15_000 })
      await expect(page.getByText(/Priority/i).first()).toBeVisible({ timeout: 10_000 })
    })

    test('Create Goal submit button exists', async ({ page }) => {
      await page.goto('/goals/new')
      await expect(
        page.getByRole('heading', { name: /new goal|create goal/i })
      ).toBeVisible({ timeout: 15_000 })
      await expect(
        page.getByRole('button', { name: /create goal/i })
      ).toBeVisible({ timeout: 10_000 })
    })
  })

  test.describe('Goal Detail', () => {
    test('detail page loads from list', async ({ page }) => {
      await page.goto('/goals')
      await expect(
        page.getByRole('heading', { name: 'Goals', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      const table = page.locator('table')
      await page.waitForTimeout(2000)

      if (!(await table.isVisible())) {
        test.skip(true, 'No goals to view')
        return
      }

      await table.locator('tbody tr').first().click()
      await expect(page).toHaveURL(/\/goals\/[a-zA-Z0-9-]+/, { timeout: 10_000 })
    })
  })
})
