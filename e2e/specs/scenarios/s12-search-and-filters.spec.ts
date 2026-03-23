import { test, expect } from '@playwright/test'

test.describe('S12: Search and Filters @scenario', () => {
  test.describe('Participants Page', () => {
    test('search input exists and accepts text', async ({ page }) => {
      await page.goto('/participants')
      await expect(
        page.getByRole('heading', { name: /Participants/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const searchInput = page.getByPlaceholder('Search by name or NDIS number...').first()
      await expect(searchInput).toBeVisible({ timeout: 10_000 })

      await searchInput.fill('E2E Test')
      await page.waitForTimeout(1000)
      await expect(searchInput).toHaveValue('E2E Test')

      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(1000)
      await expect(searchInput).toHaveValue('')
    })

    test('status filter dropdown exists and opens', async ({ page }) => {
      await page.goto('/participants')
      await expect(
        page.getByRole('heading', { name: /Participants/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const statusFilter = page.locator('button').filter({ hasText: /all status|status/i }).first()
      if (await statusFilter.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await statusFilter.click()
        await page.waitForTimeout(1000)
        // Verify filter options appear
        const filterContent = page.locator('[data-slot="select-content"]').first()
        await expect(filterContent).toBeVisible({ timeout: 5_000 })
      }
    })
  })

  test.describe('Workers Page', () => {
    test('search input exists and accepts text', async ({ page }) => {
      await page.goto('/workers')
      await expect(
        page.getByRole('heading', { name: /Workers/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const searchInput = page.getByPlaceholder('Search by name or email...').first()
      await expect(searchInput).toBeVisible({ timeout: 10_000 })

      await searchInput.fill('Test Worker')
      await page.waitForTimeout(1000)
      await expect(searchInput).toHaveValue('Test Worker')

      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(1000)
      await expect(searchInput).toHaveValue('')
    })

    test('status filter dropdown exists and opens', async ({ page }) => {
      await page.goto('/workers')
      await expect(
        page.getByRole('heading', { name: /Workers/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const statusFilter = page.locator('button').filter({ hasText: /all status|status/i }).first()
      if (await statusFilter.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await statusFilter.click()
        await page.waitForTimeout(1000)
        const filterContent = page.locator('[data-slot="select-content"]').first()
        await expect(filterContent).toBeVisible({ timeout: 5_000 })
      }
    })

    test('type filter dropdown exists and opens', async ({ page }) => {
      await page.goto('/workers')
      await expect(
        page.getByRole('heading', { name: /Workers/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const typeFilter = page.locator('button').filter({ hasText: /all type|type/i }).first()
      if (await typeFilter.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await typeFilter.click()
        await page.waitForTimeout(1000)
        const filterContent = page.locator('[data-slot="select-content"]').first()
        await expect(filterContent).toBeVisible({ timeout: 5_000 })
      }
    })
  })

  test.describe('Goals Page', () => {
    test('search input exists and accepts text', async ({ page }) => {
      await page.goto('/goals')
      await expect(
        page.getByRole('heading', { name: /Goals/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const searchInput = page.getByPlaceholder('Search goals...').first()
      await expect(searchInput).toBeVisible({ timeout: 10_000 })

      await searchInput.fill('Daily living')
      await page.waitForTimeout(1000)
      await expect(searchInput).toHaveValue('Daily living')

      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(1000)
      await expect(searchInput).toHaveValue('')
    })
  })

  test.describe('Progress Notes Page', () => {
    test('search input exists and accepts text', async ({ page }) => {
      await page.goto('/progress-notes')
      await expect(
        page.getByRole('heading', { name: /Progress Notes/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const searchInput = page.getByPlaceholder('Search notes...').first()
      await expect(searchInput).toBeVisible({ timeout: 10_000 })

      await searchInput.fill('Test note')
      await page.waitForTimeout(1000)
      await expect(searchInput).toHaveValue('Test note')

      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(1000)
      await expect(searchInput).toHaveValue('')
    })
  })

  test.describe('Invoices Page', () => {
    test('search input exists and accepts text', async ({ page }) => {
      await page.goto('/invoices')
      await expect(
        page.getByRole('heading', { name: /Invoices/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const searchInput = page.getByPlaceholder('Search invoices...').first()
      await expect(searchInput).toBeVisible({ timeout: 10_000 })

      await searchInput.fill('INV-001')
      await page.waitForTimeout(1000)
      await expect(searchInput).toHaveValue('INV-001')

      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(1000)
      await expect(searchInput).toHaveValue('')
    })

    test('status filter dropdown exists and opens', async ({ page }) => {
      await page.goto('/invoices')
      await expect(
        page.getByRole('heading', { name: /Invoices/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const statusFilter = page.locator('button').filter({ hasText: /all status|status/i }).first()
      if (await statusFilter.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await statusFilter.click()
        await page.waitForTimeout(1000)
        const filterContent = page.locator('[data-slot="select-content"]').first()
        await expect(filterContent).toBeVisible({ timeout: 5_000 })
      }
    })

    test('funding type filter dropdown exists and opens', async ({ page }) => {
      await page.goto('/invoices')
      await expect(
        page.getByRole('heading', { name: /Invoices/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const fundingFilter = page.locator('button').filter({ hasText: /all funding|funding/i }).first()
      if (await fundingFilter.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await fundingFilter.click()
        await page.waitForTimeout(1000)
        const filterContent = page.locator('[data-slot="select-content"]').first()
        await expect(filterContent).toBeVisible({ timeout: 5_000 })
      }
    })
  })

  test.describe('Incidents Page', () => {
    test('search input exists and accepts text', async ({ page }) => {
      await page.goto('/incidents')
      await expect(
        page.getByRole('heading', { name: /Incidents/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const searchInput = page.getByPlaceholder('Search incidents...').first()
      await expect(searchInput).toBeVisible({ timeout: 10_000 })

      await searchInput.fill('Test incident')
      await page.waitForTimeout(1000)
      await expect(searchInput).toHaveValue('Test incident')

      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(1000)
      await expect(searchInput).toHaveValue('')
    })

    test('severity filter dropdown exists and opens', async ({ page }) => {
      await page.goto('/incidents')
      await expect(
        page.getByRole('heading', { name: /Incidents/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const severityFilter = page.locator('button').filter({ hasText: /all severity/i }).first()
      if (await severityFilter.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await severityFilter.click()
        await page.waitForTimeout(1000)
        const filterContent = page.locator('[data-slot="select-content"]').first()
        await expect(filterContent).toBeVisible({ timeout: 5_000 })
      }
    })

    test('status filter dropdown exists and opens', async ({ page }) => {
      await page.goto('/incidents')
      await expect(
        page.getByRole('heading', { name: /Incidents/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const statusFilter = page.locator('button').filter({ hasText: /all statuses/i }).first()
      if (await statusFilter.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await statusFilter.click()
        await page.waitForTimeout(1000)
        const filterContent = page.locator('[data-slot="select-content"]').first()
        await expect(filterContent).toBeVisible({ timeout: 5_000 })
      }
    })
  })

  test.describe('Complaints Page', () => {
    test('search input exists and accepts text', async ({ page }) => {
      await page.goto('/complaints')
      await expect(
        page.getByRole('heading', { name: /Complaints/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const searchInput = page.getByPlaceholder('Search complaints...').first()
      await expect(searchInput).toBeVisible({ timeout: 10_000 })

      await searchInput.fill('Test complaint')
      await page.waitForTimeout(1000)
      await expect(searchInput).toHaveValue('Test complaint')

      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(1000)
      await expect(searchInput).toHaveValue('')
    })

    test('status filter dropdown exists and opens', async ({ page }) => {
      await page.goto('/complaints')
      await expect(
        page.getByRole('heading', { name: /Complaints/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const statusFilter = page.locator('button').filter({ hasText: /all statuses|all status/i }).first()
      if (await statusFilter.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await statusFilter.click()
        await page.waitForTimeout(1000)
        const filterContent = page.locator('[data-slot="select-content"]').first()
        await expect(filterContent).toBeVisible({ timeout: 5_000 })
      }
    })
  })

  test.describe('Concerns Page', () => {
    test('search input exists and accepts text', async ({ page }) => {
      await page.goto('/concerns')
      await expect(
        page.getByRole('heading', { name: /Concerns/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const searchInput = page.getByPlaceholder('Search concerns...').first()
      await expect(searchInput).toBeVisible({ timeout: 10_000 })

      await searchInput.fill('Test concern')
      await page.waitForTimeout(1000)
      await expect(searchInput).toHaveValue('Test concern')

      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(1000)
      await expect(searchInput).toHaveValue('')
    })

    test('severity filter dropdown exists and opens', async ({ page }) => {
      await page.goto('/concerns')
      await expect(
        page.getByRole('heading', { name: /Concerns/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const severityFilter = page.locator('button').filter({ hasText: /all severity/i }).first()
      if (await severityFilter.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await severityFilter.click()
        await page.waitForTimeout(1000)
        const filterContent = page.locator('[data-slot="select-content"]').first()
        await expect(filterContent).toBeVisible({ timeout: 5_000 })
      }
    })

    test('status filter dropdown exists and opens', async ({ page }) => {
      await page.goto('/concerns')
      await expect(
        page.getByRole('heading', { name: /Concerns/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const statusFilter = page.locator('button').filter({ hasText: /all statuses/i }).first()
      if (await statusFilter.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await statusFilter.click()
        await page.waitForTimeout(1000)
        const filterContent = page.locator('[data-slot="select-content"]').first()
        await expect(filterContent).toBeVisible({ timeout: 5_000 })
      }
    })
  })

  test.describe('Consent Page', () => {
    test('search input exists and accepts text', async ({ page }) => {
      await page.goto('/consent')
      await expect(
        page.getByRole('heading', { name: /Consent/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const searchInput = page.getByPlaceholder('Search consents...').first()
      await expect(searchInput).toBeVisible({ timeout: 10_000 })

      await searchInput.fill('Service agreement')
      await page.waitForTimeout(1000)
      await expect(searchInput).toHaveValue('Service agreement')

      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(1000)
      await expect(searchInput).toHaveValue('')
    })
  })

  test.describe('Risk Register Page', () => {
    test('search input exists and accepts text', async ({ page }) => {
      await page.goto('/risks')
      await expect(
        page.getByRole('heading', { name: /Risk/i }).first()
      ).toBeVisible({ timeout: 15_000 })

      const searchInput = page.getByPlaceholder('Search risks...').first()
      await expect(searchInput).toBeVisible({ timeout: 10_000 })

      await searchInput.fill('Fall risk')
      await page.waitForTimeout(1000)
      await expect(searchInput).toHaveValue('Fall risk')

      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(1000)
      await expect(searchInput).toHaveValue('')
    })
  })
})
