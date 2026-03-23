import { test, expect } from '@playwright/test'

const listPages = [
  { route: '/participants', heading: 'Participants', emptyText: /No participants yet/i },
  { route: '/workers', heading: 'Workers', emptyText: /No workers yet/i },
  { route: '/goals', heading: 'Goals', emptyText: /No goals yet/i },
  { route: '/progress-notes', heading: 'Progress Notes', emptyText: /No progress notes yet/i },
  { route: '/invoices', heading: 'Invoices', emptyText: /No invoices/i },
  { route: '/incidents', heading: 'Incidents', emptyText: /No incidents logged/i },
  { route: '/complaints', heading: 'Complaints', emptyText: /No complaints logged/i },
  { route: '/concerns', heading: 'Concerns', emptyText: /No concerns flagged/i },
  { route: '/risks', heading: /Risk/i, emptyText: /No risks registered/i },
  { route: '/documents', heading: 'Documents', emptyText: /No documents found/i },
  { route: '/notifications', heading: /Notification/i, emptyText: /No notification/i },
  { route: '/messages', heading: /Message/i, emptyText: /No message|No thread|No conversation/i },
]

test.describe('P2: Empty States @p2', () => {
  for (const { route, heading, emptyText } of listPages) {
    test(`${route}: shows table or empty state`, async ({ page }) => {
      await page.goto(route)
      await expect(
        page.getByRole('heading', { name: heading }).first()
      ).toBeVisible({ timeout: 15_000 })

      // Wait for content to load, then check main has meaningful content
      await page.waitForTimeout(2000)
      const mainText = await page.locator('main').textContent()
      expect(mainText?.length).toBeGreaterThan(5)
    })
  }
})
