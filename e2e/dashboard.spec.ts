import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for the dashboard to fully load
    await page.waitForLoadState('networkidle')
  })

  test('dashboard loads with greeting', async ({ page }) => {
    await expect(
      page.getByText(/Good (morning|afternoon|evening)/i)
    ).toBeVisible({ timeout: 10000 })
  })

  test('dashboard shows stat cards', async ({ page }) => {
    const statCards = [
      'Total Participants',
      'Active Workers',
      'In Progress',
      'Upcoming',
      'Open Concerns',
      'Open Incidents',
      'Open Complaints',
    ]

    for (const card of statCards) {
      await expect(page.getByText(card)).toBeVisible({ timeout: 10000 })
    }
  })

  test('Quick Actions section has all buttons', async ({ page }) => {
    const quickActions = [
      'Start New Participant Onboarding',
      'View All Participants',
      'Start New Worker Onboarding',
      'View Calendar',
      'Screening Compliance',
      'Write Progress Note',
      'Flag a Concern',
      'Log an Incident',
      'Log a Complaint',
      'Ask AI Buddy',
      'View Audit Trail',
    ]

    for (const action of quickActions) {
      await expect(
        page.getByRole('button', { name: action })
      ).toBeVisible({ timeout: 10000 })
    }
  })

  test('quick action "View All Participants" navigates to /participants', async ({ page }) => {
    await page.getByRole('button', { name: 'View All Participants' }).click()
    await expect(page).toHaveURL(/\/participants/, { timeout: 10000 })
  })

  test('quick action "Start New Participant Onboarding" navigates correctly', async ({ page }) => {
    await page.getByRole('button', { name: 'Start New Participant Onboarding' }).click()
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 })
  })

  test('quick action "Start New Worker Onboarding" navigates correctly', async ({ page }) => {
    await page.getByRole('button', { name: 'Start New Worker Onboarding' }).click()
    await expect(page).toHaveURL(/\/worker/, { timeout: 10000 })
  })

  test('quick action "View Calendar" navigates correctly', async ({ page }) => {
    await page.getByRole('button', { name: 'View Calendar' }).click()
    await expect(page).toHaveURL(/\/calendar/, { timeout: 10000 })
  })

  test('quick action "Screening Compliance" navigates correctly', async ({ page }) => {
    await page.getByRole('button', { name: 'Screening Compliance' }).click()
    await expect(page).toHaveURL(/\/screening|\/compliance/, { timeout: 10000 })
  })

  test('quick action "Write Progress Note" navigates correctly', async ({ page }) => {
    await page.getByRole('button', { name: 'Write Progress Note' }).click()
    await expect(page).toHaveURL(/\/progress-note|\/notes/, { timeout: 10000 })
  })

  test('quick action "Flag a Concern" navigates correctly', async ({ page }) => {
    await page.getByRole('button', { name: 'Flag a Concern' }).click()
    await expect(page).toHaveURL(/\/concern/, { timeout: 10000 })
  })

  test('quick action "Log an Incident" navigates correctly', async ({ page }) => {
    await page.getByRole('button', { name: 'Log an Incident' }).click()
    await expect(page).toHaveURL(/\/incident/, { timeout: 10000 })
  })

  test('quick action "Log a Complaint" navigates correctly', async ({ page }) => {
    await page.getByRole('button', { name: 'Log a Complaint' }).click()
    await expect(page).toHaveURL(/\/complaint/, { timeout: 10000 })
  })

  test('quick action "Ask AI Buddy" navigates correctly', async ({ page }) => {
    await page.getByRole('button', { name: 'Ask AI Buddy' }).click()
    await expect(page).toHaveURL(/\/ai|\/buddy|\/chat/, { timeout: 10000 })
  })

  test('quick action "View Audit Trail" navigates correctly', async ({ page }) => {
    await page.getByRole('button', { name: 'View Audit Trail' }).click()
    await expect(page).toHaveURL(/\/audit/, { timeout: 10000 })
  })

  test('"New Participant" button in header navigates to /onboarding/new', async ({ page }) => {
    // There are two "New Participant" buttons - header and quick actions. Click the first one (header).
    await page.getByRole('button', { name: /New Participant/i }).first().click()
    await expect(page).toHaveURL(/\/onboarding\/new/, { timeout: 10000 })
  })

  test('Alerts & Reminders section exists', async ({ page }) => {
    await expect(
      page.getByText(/Alerts & Reminders/i)
    ).toBeVisible({ timeout: 10000 })
  })
})
