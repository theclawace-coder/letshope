import { test, expect } from '@playwright/test'
import {
  seedParticipant,
  seedWorker,
  seedGoal,
  seedInvoice,
  seedIncident,
  seedConcern,
  seedConsent,
  seedRisk,
  cleanup,
} from '../../fixtures/test-data.fixture'

test.describe('S13: Cross-entity data flow @scenario', () => {
  let participant: Record<string, unknown>
  let worker: Record<string, unknown>
  let goal: Record<string, unknown>
  let invoice: Record<string, unknown>
  let incident: Record<string, unknown>
  let concern: Record<string, unknown>
  let consent: Record<string, unknown>
  let risk: Record<string, unknown>

  const PARTICIPANT_FIRST = 'E2E_Cross'
  const PARTICIPANT_LAST = 'Test'
  const PARTICIPANT_FULL = `${PARTICIPANT_FIRST} ${PARTICIPANT_LAST}`

  test.beforeAll(async () => {
    participant = await seedParticipant({
      first_name: PARTICIPANT_FIRST,
      last_name: PARTICIPANT_LAST,
    })
    worker = await seedWorker({
      first_name: 'E2E_CrossWorker',
      last_name: 'Test',
    })
    goal = await seedGoal(participant.id as string, {
      title: 'E2E Cross-Entity Goal',
    })
    invoice = await seedInvoice(participant.id as string)
    incident = await seedIncident(participant.id as string)
    concern = await seedConcern(participant.id as string, {
      title: 'E2E Cross-Entity Concern',
    })
    consent = await seedConsent(participant.id as string, {
      title: 'E2E Cross-Entity Consent',
    })
    risk = await seedRisk(participant.id as string, {
      title: 'E2E Cross-Entity Risk',
    })
  })

  test.afterAll(async () => {
    if (risk?.id) await cleanup('risks', [risk.id as string])
    if (consent?.id) await cleanup('consent_records', [consent.id as string])
    if (concern?.id) await cleanup('concerns', [concern.id as string])
    if (incident?.id) await cleanup('incidents', [incident.id as string])
    if (invoice?.id) await cleanup('invoices', [invoice.id as string])
    if (goal?.id) await cleanup('goals', [goal.id as string])
    if (worker?.id) await cleanup('workers', [worker.id as string])
    if (participant?.id) await cleanup('participants', [participant.id as string])
  })

  test('participant appears in /participants list', async ({ page }) => {
    await page.goto('/participants')
    await expect(
      page.getByRole('heading', { name: /participants/i }).first()
    ).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(1500)

    // Search or look for the participant name
    const searchInput = page.getByPlaceholder(/search/i).first()
    if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await searchInput.fill(PARTICIPANT_FIRST)
      await page.waitForTimeout(1500)
    }

    await expect(
      page.getByText(PARTICIPANT_FIRST).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('participant detail page shows correct name', async ({ page }) => {
    await page.goto(`/participants/${participant.id}`)
    await page.waitForTimeout(2000)

    // The participant name should appear somewhere on the detail page
    const nameVisible = await page
      .getByText(PARTICIPANT_FIRST)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)

    const fullNameVisible = await page
      .getByText(PARTICIPANT_FULL)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false)

    expect(nameVisible || fullNameVisible).toBeTruthy()
  })

  test('participant detail shows goals tab or section', async ({ page }) => {
    await page.goto(`/participants/${participant.id}`)
    await page.waitForTimeout(2000)

    // Goals appear as a card in the Overview tab with a "Goals" card title
    // Look for: tab, heading, or text "Goals" in the page
    const goalsTab = page.getByRole('tab', { name: /goals/i }).first()
    const goalsText = page.getByText('Goals', { exact: true }).first()

    const tabVisible = await goalsTab
      .isVisible({ timeout: 3_000 })
      .catch(() => false)
    const textVisible = await goalsText
      .isVisible({ timeout: 3_000 })
      .catch(() => false)

    if (tabVisible) {
      await goalsTab.click()
      await page.waitForTimeout(1500)
    }

    // Goals section exists either as a tab or as a card on the overview page
    expect(tabVisible || textVisible).toBeTruthy()
  })

  test('participant detail has notes section', async ({ page }) => {
    await page.goto(`/participants/${participant.id}`)
    await page.waitForTimeout(2000)

    // Look for notes tab or section
    const notesTab = page.getByRole('button', { name: /notes/i }).first()
    const notesHeading = page
      .getByRole('heading', { name: /notes/i })
      .first()
    const notesLink = page.getByRole('tab', { name: /notes/i }).first()

    const tabVisible = await notesTab
      .isVisible({ timeout: 5_000 })
      .catch(() => false)
    const headingVisible = await notesHeading
      .isVisible({ timeout: 3_000 })
      .catch(() => false)
    const linkVisible = await notesLink
      .isVisible({ timeout: 3_000 })
      .catch(() => false)

    expect(tabVisible || headingVisible || linkVisible).toBeTruthy()
  })

  test('goal detail shows correct participant name', async ({ page }) => {
    await page.goto(`/goals/${goal.id}`)
    await page.waitForTimeout(2000)

    // Goal detail should reference the participant
    const firstNameVisible = await page
      .getByText(PARTICIPANT_FIRST)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)
    const fullNameVisible = await page
      .getByText(PARTICIPANT_FULL)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false)

    expect(firstNameVisible || fullNameVisible).toBeTruthy()
  })

  test('invoice detail shows correct participant name', async ({ page }) => {
    await page.goto(`/invoices/${invoice.id}`)
    await page.waitForTimeout(2000)

    const firstNameVisible = await page
      .getByText(PARTICIPANT_FIRST)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)
    const fullNameVisible = await page
      .getByText(PARTICIPANT_FULL)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false)

    expect(firstNameVisible || fullNameVisible).toBeTruthy()
  })

  test('incident detail shows correct participant name', async ({ page }) => {
    await page.goto(`/incidents/${incident.id}`)
    await page.waitForTimeout(2000)

    const firstNameVisible = await page
      .getByText(PARTICIPANT_FIRST)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)
    const fullNameVisible = await page
      .getByText(PARTICIPANT_FULL)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false)

    expect(firstNameVisible || fullNameVisible).toBeTruthy()
  })

  test('concern detail shows correct participant name', async ({ page }) => {
    await page.goto(`/concerns/${concern.id}`)
    await page.waitForTimeout(2000)

    const firstNameVisible = await page
      .getByText(PARTICIPANT_FIRST)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)
    const fullNameVisible = await page
      .getByText(PARTICIPANT_FULL)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false)

    expect(firstNameVisible || fullNameVisible).toBeTruthy()
  })

  test('risk detail shows correct participant name', async ({ page }) => {
    await page.goto(`/risks/${risk.id}`)
    await page.waitForTimeout(2000)

    const firstNameVisible = await page
      .getByText(PARTICIPANT_FIRST)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)
    const fullNameVisible = await page
      .getByText(PARTICIPANT_FULL)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false)

    expect(firstNameVisible || fullNameVisible).toBeTruthy()
  })

  test('consent detail shows correct participant', async ({ page }) => {
    await page.goto(`/consent/${consent.id}`)
    await page.waitForTimeout(2000)

    const firstNameVisible = await page
      .getByText(PARTICIPANT_FIRST)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)
    const fullNameVisible = await page
      .getByText(PARTICIPANT_FULL)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false)

    expect(firstNameVisible || fullNameVisible).toBeTruthy()
  })

  test('dashboard shows activity with stat cards', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('heading', { name: /good (morning|afternoon|evening)/i }).first()
    ).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(1500)

    // Stat cards should have numbers in them
    const statCards = page.locator('[class*="card"], [class*="stat"], [class*="Card"]').first()
    await expect(statCards).toBeVisible({ timeout: 10_000 })

    // Look for any numeric values on the dashboard
    const numbersOnPage = page.locator('text=/\\d+/').first()
    await expect(numbersOnPage).toBeVisible({ timeout: 10_000 })
  })
})
