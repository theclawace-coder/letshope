import { test, expect } from '@playwright/test'

test.describe('P1: Invoice Creation Details @p1', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/invoices/new')
    await expect(
      page.getByRole('heading', { name: 'Create Invoice' })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('form element is present', async ({ page }) => {
    await expect(page.locator('form')).toBeVisible({ timeout: 10_000 })
  })

  test('participant selector is present', async ({ page }) => {
    await expect(
      page.getByText(/Participant/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('invoice date field is present', async ({ page }) => {
    await expect(page.getByText(/Invoice Date/i)).toBeVisible({ timeout: 10_000 })
  })

  test('period start field is present', async ({ page }) => {
    await expect(page.getByText(/Period Start/i)).toBeVisible({ timeout: 10_000 })
  })

  test('period end field is present', async ({ page }) => {
    await expect(page.getByText(/Period End/i)).toBeVisible({ timeout: 10_000 })
  })

  test('funding type selector is present', async ({ page }) => {
    await expect(
      page.getByText(/Funding Type/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('line items section is present', async ({ page }) => {
    await expect(
      page.getByText(/line item|support item|add item/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('Add Item button exists', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /add item/i })
    ).toBeVisible({ timeout: 10_000 })
  })

  test('line item has service name field', async ({ page }) => {
    // Click Add Item if no line items are rendered yet
    const addBtn = page.getByRole('button', { name: /add item/i })
    if (await addBtn.isVisible()) {
      await addBtn.click()
      await page.waitForTimeout(500)
    }
    await expect(
      page.getByText(/Service Name|Support Item/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('line item has quantity field', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add item/i })
    if (await addBtn.isVisible()) {
      await addBtn.click()
      await page.waitForTimeout(500)
    }
    await expect(
      page.getByText(/Qty|Quantity/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('line item has unit selector', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add item/i })
    if (await addBtn.isVisible()) {
      await addBtn.click()
      await page.waitForTimeout(500)
    }
    await expect(
      page.getByText(/Unit/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('line item has GST toggle', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add item/i })
    if (await addBtn.isVisible()) {
      await addBtn.click()
      await page.waitForTimeout(500)
    }
    await expect(
      page.getByText(/GST/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('Create Invoice submit button exists', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /create invoice/i })
    ).toBeVisible({ timeout: 10_000 })
  })
})
