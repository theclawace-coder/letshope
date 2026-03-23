import { test, expect } from '@playwright/test'

test.describe('P1: Concerns @p1', () => {
  test.describe('Concerns List', () => {
    test('list page loads with heading', async ({ page }) => {
      await page.goto('/concerns')
      await expect(
        page.getByRole('heading', { name: 'Concerns', exact: true })
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Flag Concern button is visible', async ({ page }) => {
      await page.goto('/concerns')
      await expect(
        page.getByRole('heading', { name: 'Concerns', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await expect(
        page.getByRole('button', { name: /flag.*concern/i }).first()
      ).toBeVisible()
    })

    test('severity filter is visible', async ({ page }) => {
      await page.goto('/concerns')
      await expect(
        page.getByRole('heading', { name: 'Concerns', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await expect(
        page.locator('button').filter({ hasText: /all severity/i })
      ).toBeVisible()
    })

    test('status filter is visible', async ({ page }) => {
      await page.goto('/concerns')
      await expect(
        page.getByRole('heading', { name: 'Concerns', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await expect(
        page.locator('button').filter({ hasText: /all statuses/i })
      ).toBeVisible()
    })

    test('type filter is visible', async ({ page }) => {
      await page.goto('/concerns')
      await expect(
        page.getByRole('heading', { name: 'Concerns', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await expect(
        page.locator('button').filter({ hasText: /all types/i })
      ).toBeVisible()
    })

    test('empty state or table is shown', async ({ page }) => {
      await page.goto('/concerns')
      await expect(
        page.getByRole('heading', { name: 'Concerns', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      const emptyState = page.getByText('No concerns flagged')
      const table = page.locator('table')
      await expect(emptyState.or(table)).toBeVisible()
    })
  })

  test.describe('Create Concern', () => {
    test('form loads with all fields', async ({ page }) => {
      await page.goto('/concerns/new')
      await expect(
        page.getByRole('heading', { name: 'Flag a Concern' })
      ).toBeVisible({ timeout: 15_000 })

      await expect(page.getByText('Participant *')).toBeVisible()
      await expect(page.getByText('Concern Type *')).toBeVisible()
      await expect(page.getByText('Severity *')).toBeVisible()
      await expect(page.getByText('Title *')).toBeVisible()
      await expect(page.getByText('Description *')).toBeVisible()
    })

    test('Submit Concern button exists', async ({ page }) => {
      await page.goto('/concerns/new')
      await expect(
        page.getByRole('heading', { name: 'Flag a Concern' })
      ).toBeVisible({ timeout: 15_000 })
      await expect(
        page.getByRole('button', { name: /submit concern/i })
      ).toBeVisible()
    })

    test('concern type selector opens', async ({ page }) => {
      await page.goto('/concerns/new')
      await expect(
        page.getByRole('heading', { name: 'Flag a Concern' })
      ).toBeVisible({ timeout: 15_000 })

      const typeTrigger = page.locator('[data-slot="select-trigger"]').filter({ hasText: /select type/i })
      if (await typeTrigger.isVisible()) {
        await typeTrigger.click()
        await page.waitForTimeout(500)
        const popup = page.locator('[data-slot="select-content"]').first()
        await expect(popup).toBeVisible({ timeout: 5_000 })
      }
    })

    test('severity selector opens', async ({ page }) => {
      await page.goto('/concerns/new')
      await expect(
        page.getByRole('heading', { name: 'Flag a Concern' })
      ).toBeVisible({ timeout: 15_000 })

      const sevTrigger = page.locator('[data-slot="select-trigger"]').filter({ hasText: /select severity/i })
      if (await sevTrigger.isVisible()) {
        await sevTrigger.click()
        await page.waitForTimeout(500)
        const popup = page.locator('[data-slot="select-content"]').first()
        await expect(popup).toBeVisible({ timeout: 5_000 })
      }
    })
  })

  test.describe('Concern Detail', () => {
    test('detail page loads and shows resolve/resolution', async ({ page }) => {
      await page.goto('/concerns')
      await expect(
        page.getByRole('heading', { name: 'Concerns', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      const table = page.locator('table')
      const emptyState = page.getByText('No concerns flagged')
      await expect(emptyState.or(table)).toBeVisible()

      if (await emptyState.isVisible()) {
        test.skip(true, 'No concerns to view')
        return
      }

      await table.locator('tbody tr').first().click()
      await expect(page).toHaveURL(/\/concerns\/[a-zA-Z0-9-]+/)

      const resolveButton = page.getByRole('button', { name: /resolve/i })
      const resolutionCard = page.getByText('Resolution')
      await expect(resolveButton.or(resolutionCard)).toBeVisible({ timeout: 10_000 })
    })

    test('back button exists on detail page', async ({ page }) => {
      await page.goto('/concerns')
      await expect(
        page.getByRole('heading', { name: 'Concerns', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      const table = page.locator('table')
      if (!(await table.isVisible())) {
        test.skip(true, 'No concerns')
        return
      }

      await table.locator('tbody tr').first().click()
      await expect(page).toHaveURL(/\/concerns\/[a-zA-Z0-9-]+/)
      await expect(page.getByRole('button', { name: /back/i })).toBeVisible()
    })
  })
})
