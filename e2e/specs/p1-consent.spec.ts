import { test, expect } from '@playwright/test'

test.describe('P1: Consent & Rights @p1', () => {
  test.describe('Consent List', () => {
    test('list page loads with heading', async ({ page }) => {
      await page.goto('/consent')
      await expect(
        page.getByRole('heading', { name: /Consent|Rights/i }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    test('Record Consent button is visible', async ({ page }) => {
      await page.goto('/consent')
      await expect(
        page.getByRole('heading', { name: /Consent|Rights/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      await expect(
        page.getByRole('button', { name: /record consent/i }).first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('empty state or data is shown', async ({ page }) => {
      await page.goto('/consent')
      await expect(
        page.getByRole('heading', { name: /Consent|Rights/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      await page.waitForTimeout(2000)
      const mainText = await page.locator('main').textContent()
      expect(mainText?.length).toBeGreaterThan(10)
    })
  })

  test.describe('Create Consent', () => {
    test('form loads at /consent/new', async ({ page }) => {
      await page.goto('/consent/new')
      await page.waitForTimeout(2000)
      const heading = page.getByRole('heading', { name: /consent/i }).first()
      await expect(heading).toBeVisible({ timeout: 15_000 })
    })

    test('form has participant selector', async ({ page }) => {
      await page.goto('/consent/new')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/Participant/i).first()).toBeVisible({ timeout: 10_000 })
    })

    test('form has consent type selector', async ({ page }) => {
      await page.goto('/consent/new')
      await page.waitForTimeout(2000)
      await expect(
        page.getByText(/Consent Type/i).first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('form has consent method selector', async ({ page }) => {
      await page.goto('/consent/new')
      await page.waitForTimeout(2000)
      await expect(
        page.getByText(/Method/i).first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('form has title field', async ({ page }) => {
      await page.goto('/consent/new')
      await page.waitForTimeout(2000)
      await expect(
        page.getByText(/Title/i).first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('form has scope field', async ({ page }) => {
      await page.goto('/consent/new')
      await page.waitForTimeout(2000)
      await expect(
        page.getByText(/Scope/i).first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('form has given date field', async ({ page }) => {
      await page.goto('/consent/new')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/Given Date|Date Given|Date/i).first()).toBeVisible({ timeout: 10_000 })
    })

    test('Record Consent submit button exists', async ({ page }) => {
      await page.goto('/consent/new')
      await page.waitForTimeout(2000)
      await expect(
        page.getByRole('button', { name: /record consent/i })
      ).toBeVisible({ timeout: 10_000 })
    })
  })

  test.describe('Consent Detail', () => {
    test('detail page loads from list', async ({ page }) => {
      await page.goto('/consent')
      await expect(
        page.getByRole('heading', { name: /Consent|Rights/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const table = page.locator('table')
      await page.waitForTimeout(2000)

      if (!(await table.isVisible())) {
        test.skip(true, 'No consent records')
        return
      }

      await table.locator('tbody tr').first().click()
      await expect(page).toHaveURL(/\/consent\/[a-zA-Z0-9-]+/, { timeout: 10_000 })
    })
  })
})
