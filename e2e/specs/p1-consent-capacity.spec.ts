import { test, expect } from '@playwright/test'

test.describe('P1: Capacity Assessment @p1', () => {
  test('form loads at /consent/capacity/new', async ({ page }) => {
    await page.goto('/consent/capacity/new')
    await page.waitForTimeout(2000)
    const heading = page.getByRole('heading', { name: /capacity/i }).first()
    await expect(heading).toBeVisible({ timeout: 15_000 })
  })

  test('form has participant selector', async ({ page }) => {
    await page.goto('/consent/capacity/new')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Participant/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('form has capacity level selector', async ({ page }) => {
    await page.goto('/consent/capacity/new')
    await page.waitForTimeout(2000)
    await expect(
      page.getByText(/Capacity|Level/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('form has assessment date field', async ({ page }) => {
    await page.goto('/consent/capacity/new')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Assessment Date|Date/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('form has assessor name field', async ({ page }) => {
    await page.goto('/consent/capacity/new')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Assessed By|Assessor/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('form has assessment summary', async ({ page }) => {
    await page.goto('/consent/capacity/new')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Summary/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('submit button exists', async ({ page }) => {
    await page.goto('/consent/capacity/new')
    await page.waitForTimeout(2000)
    await expect(
      page.getByRole('button', { name: /save|submit|create|record|assess/i }).first()
    ).toBeVisible({ timeout: 10_000 })
  })
})
