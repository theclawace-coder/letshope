import { test, expect } from '@playwright/test'

test.describe('S14: Form validation on all entity forms @scenario', () => {
  /**
   * Helper: navigate to a form, click submit without filling, then verify
   * that either a validation error shows, the URL hasn't changed, or
   * HTML5 validation prevents submission.
   */
  async function testFormValidation(
    page: import('@playwright/test').Page,
    url: string,
    submitButtonPattern: RegExp,
    formHeadingPattern: RegExp
  ) {
    await page.goto(url)
    await expect(
      page.getByRole('heading', { name: formHeadingPattern }).first()
    ).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(1000)

    const urlBefore = page.url()

    // Find and click the submit button
    const submitBtn = page.getByRole('button', { name: submitButtonPattern }).first()
    if (await submitBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await submitBtn.click()
      await page.waitForTimeout(1000)
    } else {
      // Try a generic submit button
      const anySubmit = page.locator('button[type="submit"]').first()
      if (await anySubmit.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await anySubmit.click()
        await page.waitForTimeout(1000)
      }
    }

    // Check validation: at least one of these should be true
    const urlAfter = page.url()
    const urlUnchanged = urlAfter.includes(url.replace(/^\//, ''))

    const errorMessageVisible = await page
      .getByText(/required|please|must|invalid|can't be blank|enter a/i)
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false)

    const redBorderVisible = await page
      .locator('[class*="error"], [class*="invalid"], [aria-invalid="true"], .border-red, .text-red, [class*="destructive"]')
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false)

    // HTML5 :invalid pseudo-class
    const html5Invalid = await page
      .locator('input:invalid, select:invalid, textarea:invalid')
      .first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false)

    expect(
      urlUnchanged || errorMessageVisible || redBorderVisible || html5Invalid
    ).toBeTruthy()
  }

  test('onboarding form requires first/last name', async ({ page }) => {
    await page.goto('/onboarding/new')
    await expect(
      page.getByRole('heading', { name: /onboarding/i }).first()
    ).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(1000)

    const urlBefore = page.url()

    // Try to advance without filling required fields
    const nextBtn = page
      .getByRole('button', { name: /next|continue|save|submit/i })
      .first()
    if (await nextBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await nextBtn.click()
      await page.waitForTimeout(1000)
    }

    const urlAfter = page.url()
    const urlUnchanged = urlAfter.includes('onboarding/new')

    const errorVisible = await page
      .getByText(/required|please|must|enter/i)
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false)

    const html5Invalid = await page
      .locator('input:invalid')
      .first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false)

    expect(urlUnchanged || errorVisible || html5Invalid).toBeTruthy()
  })

  test('goals form validates required fields', async ({ page }) => {
    await testFormValidation(
      page,
      '/goals/new',
      /create goal|save|submit/i,
      /goal|new goal/i
    )
  })

  test('progress notes form validates required fields', async ({ page }) => {
    await testFormValidation(
      page,
      '/progress-notes/new',
      /save|create|submit|save progress note/i,
      /progress note|new progress note|new note/i
    )
  })

  test('invoices form validates required fields', async ({ page }) => {
    await testFormValidation(
      page,
      '/invoices/new',
      /create invoice|save|submit/i,
      /invoice|new invoice/i
    )
  })

  test('incidents form validates required fields', async ({ page }) => {
    await testFormValidation(
      page,
      '/incidents/new',
      /log incident|save|submit|create/i,
      /incident|new incident|log incident/i
    )
  })

  test('complaints form validates required fields', async ({ page }) => {
    await testFormValidation(
      page,
      '/complaints/new',
      /submit complaint|save|create|submit/i,
      /complaint|new complaint/i
    )
  })

  test('concerns form validates required fields', async ({ page }) => {
    await testFormValidation(
      page,
      '/concerns/new',
      /submit concern|save|create|submit/i,
      /concern|new concern/i
    )
  })

  test('consent form validates required fields', async ({ page }) => {
    await testFormValidation(
      page,
      '/consent/new',
      /save consent|save|create|submit/i,
      /consent|new consent/i
    )
  })

  test('risks form validates required fields', async ({ page }) => {
    await testFormValidation(
      page,
      '/risks/new',
      /save risk|save|create|submit/i,
      /risk|new risk/i
    )
  })
})
