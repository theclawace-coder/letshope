import { test, expect } from '@playwright/test'

test.describe('P0: Incidents Workflow @p0', () => {
  test.describe('Incidents List', () => {
    test('list page loads with heading', async ({ page }) => {
      await page.goto('/incidents')
      await expect(
        page.getByRole('heading', { name: 'Incidents', exact: true })
      ).toBeVisible({ timeout: 15_000 })
    })

    test('stat cards render', async ({ page }) => {
      await page.goto('/incidents')
      for (const label of ['Open', 'Investigating', 'Pending Report', 'Major / Critical']) {
        await expect(page.getByText(label).first()).toBeVisible({ timeout: 15_000 })
      }
    })

    test('search input is visible', async ({ page }) => {
      await page.goto('/incidents')
      await expect(page.getByPlaceholder('Search incidents...')).toBeVisible({ timeout: 15_000 })
    })

    test('severity filter is visible', async ({ page }) => {
      await page.goto('/incidents')
      await expect(page.getByText('All Severity')).toBeVisible({ timeout: 15_000 })
    })

    test('status filter is visible', async ({ page }) => {
      await page.goto('/incidents')
      await expect(page.getByText('All Statuses').first()).toBeVisible({ timeout: 15_000 })
    })

    test('type filter is visible', async ({ page }) => {
      await page.goto('/incidents')
      await expect(page.getByText('All Types')).toBeVisible({ timeout: 15_000 })
    })

    test('Log Incident button navigates to create page', async ({ page }) => {
      await page.goto('/incidents')
      await page.getByRole('button', { name: 'Log Incident' }).click()
      await expect(page).toHaveURL(/\/incidents\/new/, { timeout: 10_000 })
    })

    test('table headers or empty state', async ({ page }) => {
      await page.goto('/incidents')
      await expect(
        page.getByRole('heading', { name: 'Incidents', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      const table = page.locator('table')
      if (await table.isVisible()) {
        for (const header of ['Severity', 'Type', 'Date', 'Participant', 'Status', 'Reportable']) {
          await expect(
            table.getByRole('columnheader', { name: header })
          ).toBeVisible({ timeout: 10_000 })
        }
      } else {
        await expect(page.getByText('No incidents logged')).toBeVisible({ timeout: 10_000 })
      }
    })
  })

  test.describe('Create Incident Form', () => {
    test('form loads with heading', async ({ page }) => {
      await page.goto('/incidents/new')
      await expect(
        page.getByRole('heading', { name: /Log an Incident/i })
      ).toBeVisible({ timeout: 15_000 })
    })

    test('form has all required fields', async ({ page }) => {
      await page.goto('/incidents/new')
      await expect(
        page.getByRole('heading', { name: /Log an Incident/i })
      ).toBeVisible({ timeout: 15_000 })

      await expect(page.getByText('Incident Date')).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText('Description')).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText('Severity *')).toBeVisible({ timeout: 10_000 })
    })

    test('participant selector is present', async ({ page }) => {
      await page.goto('/incidents/new')
      await expect(
        page.getByRole('heading', { name: /Log an Incident/i })
      ).toBeVisible({ timeout: 15_000 })

      await expect(page.getByText(/Participant/i).first()).toBeVisible({ timeout: 10_000 })
    })

    test('incident type selector is present', async ({ page }) => {
      await page.goto('/incidents/new')
      await expect(
        page.getByRole('heading', { name: /Log an Incident/i })
      ).toBeVisible({ timeout: 15_000 })

      await expect(page.getByText(/Type/i).first()).toBeVisible({ timeout: 10_000 })
    })

    test('submit button is present', async ({ page }) => {
      await page.goto('/incidents/new')
      await expect(
        page.getByRole('heading', { name: /Log an Incident/i })
      ).toBeVisible({ timeout: 15_000 })

      await expect(
        page.getByRole('button', { name: /submit|log|save/i })
      ).toBeVisible({ timeout: 10_000 })
    })
  })

  test.describe('Incident Detail', () => {
    test('detail page loads when clicking a row', async ({ page }) => {
      await page.goto('/incidents')
      await expect(
        page.getByRole('heading', { name: 'Incidents', exact: true })
      ).toBeVisible({ timeout: 15_000 })

      const table = page.locator('table')
      if (!(await table.isVisible())) {
        test.skip(true, 'No incidents to view')
        return
      }

      const rows = page.locator('table tbody tr')
      const count = await rows.count()
      if (count === 0) {
        test.skip(true, 'No incident rows')
        return
      }

      await rows.first().click()
      await expect(page).toHaveURL(/\/incidents\/[a-zA-Z0-9-]+/, { timeout: 10_000 })
    })
  })
})
