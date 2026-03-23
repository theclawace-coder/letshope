import { test, expect } from '@playwright/test'

test.describe('P1: Authorised Representatives @p1', () => {
  test('form loads at /consent/representatives/new', async ({ page }) => {
    await page.goto('/consent/representatives/new')
    await page.waitForTimeout(2000)
    const heading = page.getByRole('heading', { name: /representative|authorised/i }).first()
    await expect(heading).toBeVisible({ timeout: 15_000 })
  })

  test('form has participant selector', async ({ page }) => {
    await page.goto('/consent/representatives/new')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Participant/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('form has full name field', async ({ page }) => {
    await page.goto('/consent/representatives/new')
    await page.waitForTimeout(2000)
    await expect(
      page.getByText(/Full Name|Name/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('form has relationship field', async ({ page }) => {
    await page.goto('/consent/representatives/new')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Relationship/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('form has authority type selector', async ({ page }) => {
    await page.goto('/consent/representatives/new')
    await page.waitForTimeout(2000)
    await expect(
      page.getByText(/Authority Type/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('form has authority start date field', async ({ page }) => {
    await page.goto('/consent/representatives/new')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Start Date/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('submit button exists', async ({ page }) => {
    await page.goto('/consent/representatives/new')
    await page.waitForTimeout(2000)
    await expect(
      page.getByRole('button', { name: /save|submit|create|record/i }).first()
    ).toBeVisible({ timeout: 10_000 })
  })
})
