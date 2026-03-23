import { test, expect } from '@playwright/test'
import { seedParticipant, cleanup, supabase } from '../../fixtures/test-data.fixture'
import { TEST_INVOICE } from '../../fixtures/constants'

const today = new Date().toISOString().split('T')[0]

test.describe('S05: Invoice Full Lifecycle @scenario', () => {
  let participant: Record<string, unknown>
  const cleanupIds: { invoices: string[]; participants: string[] } = {
    invoices: [],
    participants: [],
  }

  test.beforeAll(async () => {
    participant = await seedParticipant({
      first_name: 'S05_Invoice',
      last_name: 'Scenario',
    })
    cleanupIds.participants.push(participant.id as string)
  })

  test.afterAll(async () => {
    await cleanup('invoices', cleanupIds.invoices)
    await cleanup('participants', cleanupIds.participants)
  })

  test.describe.serial('Create and manage invoice', () => {
    let invoiceId: string

    test('navigate to invoice creation page', async ({ page }) => {
      await page.goto('/invoices/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Create Invoice' })
      ).toBeVisible({ timeout: 15_000 })
      await expect(page.locator('form')).toBeVisible({ timeout: 10_000 })
    })

    test('select participant from dropdown', async ({ page }) => {
      await page.goto('/invoices/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Create Invoice' })
      ).toBeVisible({ timeout: 15_000 })

      // Click the participant select trigger
      const participantTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select participant/i })
        .first()
      await participantTrigger.click()
      await page.waitForTimeout(1000)

      // Select the seeded participant
      const participantOption = page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: 'S05_Invoice Scenario' })
        .first()
      await expect(participantOption).toBeVisible({ timeout: 10_000 })
      await participantOption.click()
      await page.waitForTimeout(500)

      // Verify participant was selected: "select participant" placeholder should be gone
      await expect(
        page.locator('[data-slot="select-trigger"]').filter({ hasText: /select participant/i })
      ).toHaveCount(0, { timeout: 5_000 })
    })

    test('select funding type NDIA Managed', async ({ page }) => {
      await page.goto('/invoices/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Create Invoice' })
      ).toBeVisible({ timeout: 15_000 })

      // Click the funding type select trigger
      const fundingTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select funding type/i })
        .first()
      await fundingTrigger.click()
      await page.waitForTimeout(1000)

      const ndiaOption = page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: 'NDIA Managed' })
        .first()
      await expect(ndiaOption).toBeVisible({ timeout: 10_000 })
      await ndiaOption.click()
      await page.waitForTimeout(500)

      // Verify funding type was selected: "select funding type" placeholder should be gone
      await expect(
        page.locator('[data-slot="select-trigger"]').filter({ hasText: /select funding type/i })
      ).toHaveCount(0, { timeout: 5_000 })
    })

    test('fill full invoice form and submit with line item', async ({ page }) => {
      await page.goto('/invoices/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Create Invoice' })
      ).toBeVisible({ timeout: 15_000 })

      // Select participant
      const participantTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select participant/i })
        .first()
      await participantTrigger.click()
      await page.waitForTimeout(1000)
      await page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: 'S05_Invoice Scenario' })
        .first()
        .click()
      await page.waitForTimeout(500)

      // Select funding type
      const fundingTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /select funding type/i })
        .first()
      await fundingTrigger.click()
      await page.waitForTimeout(1000)
      await page
        .locator('[data-slot="select-item"], [role="option"]')
        .filter({ hasText: 'NDIA Managed' })
        .first()
        .click()
      await page.waitForTimeout(500)

      // Fill date fields
      const invoiceDateInput = page.locator('input[type="date"]').first()
      await invoiceDateInput.fill(today)

      const dateInputs = page.locator('input[type="date"]')
      const dateCount = await dateInputs.count()
      if (dateCount >= 2) {
        await dateInputs.nth(1).fill(today)
      }
      if (dateCount >= 3) {
        await dateInputs.nth(2).fill(today)
      }

      // Click Add Item button
      const addItemBtn = page.getByRole('button', { name: /add item/i })
      await expect(addItemBtn).toBeVisible({ timeout: 10_000 })
      await addItemBtn.click()
      await page.waitForTimeout(1000)

      // Fill line item: Service Name
      const serviceNameInput = page.getByPlaceholder('e.g. Daily Personal Activities').first()
      await expect(serviceNameInput).toBeVisible({ timeout: 10_000 })
      await serviceNameInput.fill('Daily Personal Activities')

      // Fill line item: Date of Service
      const lineItemDateInputs = page.locator('.border.rounded-lg input[type="date"]').first()
      if (await lineItemDateInputs.isVisible()) {
        await lineItemDateInputs.fill(today)
      }

      // Fill line item: Quantity
      const quantityInput = page.locator('input[type="number"]').first()
      await expect(quantityInput).toBeVisible({ timeout: 10_000 })
      await quantityInput.fill('2')

      // Fill line item: Unit Price
      const unitPriceInput = page.locator('input[type="number"]').nth(1)
      await expect(unitPriceInput).toBeVisible({ timeout: 10_000 })
      await unitPriceInput.fill('65.47')

      await page.waitForTimeout(1000)

      // Verify line total calculates
      const lineTotal = page.getByText('$130.94').first()
      await expect(lineTotal).toBeVisible({ timeout: 10_000 })

      // Submit the invoice
      const createBtn = page.getByRole('button', { name: /create invoice/i })
      await expect(createBtn).toBeVisible({ timeout: 10_000 })
      await createBtn.click()

      // Expect toast
      await expect(
        page.getByText(/invoice created/i).first()
      ).toBeVisible({ timeout: 15_000 })

      // Should redirect to list or detail page
      await expect(page).toHaveURL(/\/invoices/, { timeout: 15_000 })
      await page.waitForTimeout(2000)

      // Extract invoice ID from URL if on detail page
      const url = page.url()
      const match = url.match(/\/invoices\/([a-f0-9-]{36})/)
      if (match) {
        invoiceId = match[1]
        cleanupIds.invoices.push(invoiceId)
      }
    })

    test('verify invoice detail page displays correctly', async ({ page }) => {
      test.skip(!invoiceId, 'No invoice created in previous test')
      await page.goto(`/invoices/${invoiceId}`, { timeout: 15_000 })
      await page.waitForTimeout(2000)

      // Verify participant name
      await expect(
        page.getByText('S05_Invoice Scenario').first()
      ).toBeVisible({ timeout: 10_000 })

      // Verify status is draft
      await expect(
        page.getByText(/draft/i).first()
      ).toBeVisible({ timeout: 10_000 })

      // Verify line item service name
      await expect(
        page.getByText('Daily Personal Activities').first()
      ).toBeVisible({ timeout: 10_000 })

      // Verify total amount
      await expect(
        page.getByText('$130.94').first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('approve invoice via status action button', async ({ page }) => {
      test.skip(!invoiceId, 'No invoice created in previous test')
      await page.goto(`/invoices/${invoiceId}`, { timeout: 15_000 })
      await page.waitForTimeout(2000)

      // Find and click Approve button
      const approveBtn = page.getByRole('button', { name: /approve/i }).first()
      await expect(approveBtn).toBeVisible({ timeout: 10_000 })
      await approveBtn.click()

      // Expect toast
      await expect(
        page.getByText(/invoice approved/i).first()
      ).toBeVisible({ timeout: 15_000 })

      await page.waitForTimeout(2000)

      // Verify status changed to approved
      await expect(
        page.getByText(/approved/i).first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('verify invoice appears in list', async ({ page }) => {
      test.skip(!invoiceId, 'No invoice created in previous test')
      await page.goto('/invoices', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Invoices', exact: true })
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2000)

      // The invoice should appear in the table
      await expect(
        page.getByText('S05_Invoice').first()
      ).toBeVisible({ timeout: 10_000 })
    })
  })

  test.describe('Invoice form validation', () => {
    test('submit button is disabled during submission or empty form shows validation', async ({ page }) => {
      await page.goto('/invoices/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Create Invoice' })
      ).toBeVisible({ timeout: 15_000 })

      // Try to submit without filling any fields
      const createBtn = page.getByRole('button', { name: /create invoice/i })
      await expect(createBtn).toBeVisible({ timeout: 10_000 })
      await createBtn.click()
      await page.waitForTimeout(1000)

      // Should show validation errors (still on /invoices/new)
      await expect(page).toHaveURL(/\/invoices\/new/, { timeout: 5_000 })
    })

    test('Add Item button adds a new line item row', async ({ page }) => {
      await page.goto('/invoices/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Create Invoice' })
      ).toBeVisible({ timeout: 15_000 })

      const addItemBtn = page.getByRole('button', { name: /add item/i })
      await addItemBtn.click()
      await page.waitForTimeout(1000)

      // Verify Item 1 appears
      await expect(page.getByText('Item 1').first()).toBeVisible({ timeout: 10_000 })

      // Add another
      await addItemBtn.click()
      await page.waitForTimeout(1000)

      // Verify Item 2 appears
      await expect(page.getByText('Item 2').first()).toBeVisible({ timeout: 10_000 })
    })

    test('line item can be removed', async ({ page }) => {
      await page.goto('/invoices/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Create Invoice' })
      ).toBeVisible({ timeout: 15_000 })

      const addItemBtn = page.getByRole('button', { name: /add item/i })
      await addItemBtn.click()
      await page.waitForTimeout(1000)

      // Verify Item 1 exists
      await expect(page.getByText('Item 1').first()).toBeVisible({ timeout: 10_000 })

      // Click the delete/trash button
      const deleteBtn = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first()
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click()
        await page.waitForTimeout(500)
        // After removal, no items text should show
        await expect(page.getByText(/no line items/i).first()).toBeVisible({ timeout: 10_000 })
      }
    })

    test('line total auto-calculates from quantity and unit price', async ({ page }) => {
      await page.goto('/invoices/new', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Create Invoice' })
      ).toBeVisible({ timeout: 15_000 })

      const addItemBtn = page.getByRole('button', { name: /add item/i })
      await addItemBtn.click()
      await page.waitForTimeout(1000)

      // Fill quantity = 3
      const quantityInput = page.locator('input[type="number"]').first()
      await quantityInput.fill('3')

      // Fill unit price = 50.00
      const unitPriceInput = page.locator('input[type="number"]').nth(1)
      await unitPriceInput.fill('50')

      await page.waitForTimeout(1000)

      // Verify line total = $150.00
      await expect(page.getByText('$150.00').first()).toBeVisible({ timeout: 10_000 })
    })
  })

  test.describe('Invoice list page features', () => {
    test('stat cards are visible', async ({ page }) => {
      await page.goto('/invoices', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Invoices', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      for (const label of ['Drafts', 'Outstanding', 'Paid', 'Rejected']) {
        await expect(page.getByText(label).first()).toBeVisible({ timeout: 10_000 })
      }
    })

    test('search filter is visible', async ({ page }) => {
      await page.goto('/invoices', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Invoices', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      await expect(
        page.getByPlaceholder('Search invoices...').first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('New Invoice button navigates to create page', async ({ page }) => {
      await page.goto('/invoices', { timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: 'Invoices', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      await page.getByRole('button', { name: 'New Invoice' }).click()
      await expect(page).toHaveURL(/\/invoices\/new/, { timeout: 10_000 })
    })
  })
})
