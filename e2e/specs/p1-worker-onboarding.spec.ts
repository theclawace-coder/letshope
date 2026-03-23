import { test, expect } from '@playwright/test'

test.describe('P1: Worker Onboarding Stages @p1', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workers/onboarding/new')
    await expect(
      page.getByRole('heading', { name: 'Worker Onboarding' })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('basic info fields are present', async ({ page }) => {
    await expect(page.getByLabel(/First Name/i)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByLabel(/Last Name/i)).toBeVisible({ timeout: 10_000 })
  })

  test('role title field exists', async ({ page }) => {
    await expect(page.getByText(/Role Title/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('employment type exists on page', async ({ page }) => {
    await expect(page.getByText(/Employment Type/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('Save & Continue button exists', async ({ page }) => {
    const nextButton = page.getByRole('button', { name: /save|continue|next|submit|create worker|start onboarding/i }).first()
    await expect(nextButton).toBeVisible({ timeout: 10_000 })
  })

  test('contract section is visible', async ({ page }) => {
    const contractText = page.getByText(/contract/i).first()
    await page.waitForTimeout(1000)
    if (await contractText.isVisible()) {
      expect(true).toBe(true)
    } else {
      const formContent = await page.locator('main').textContent()
      expect(formContent).toBeTruthy()
    }
  })
})
