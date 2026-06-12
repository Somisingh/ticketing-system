// ============================================================
// e2e/tickets.spec.js
// End-to-End tests using Playwright
//
// These tests open a REAL browser and click through your app.
// They test the full stack: React → .NET API → Database
//
// HOW TO INSTALL:
//   npm init playwright@latest
//
// HOW TO RUN:
//   npx playwright test
//
// HOW TO RUN WITH UI (great for debugging):
//   npx playwright test --ui
//
// PREREQUISITE:
//   Your app must be running locally:
//   - Backend: https://localhost:7XXX
//   - Frontend: http://localhost:59320
// ============================================================

import { test, expect } from '@playwright/test'

// Base URL — match your local dev server
const BASE_URL = 'http://localhost:59320'

// ── Test user credentials (must exist in your local DB) ──
const EMPLOYEE = { email: 'employee@.co.nz', password: 'Admin@1234' }
const IT_MEMBER = { email: 'it@.co.nz', password: 'Admin@1234' }

// ──────────────────────────────────────────────────────────────
// HELPER FUNCTIONS — reusable login steps
// ──────────────────────────────────────────────────────────────

async function loginAs(page, credentials) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[type="email"], input[name="email"]', credentials.email)
  await page.fill('input[type="password"], input[name="password"]', credentials.password)
  await page.click('button[type="submit"]')
  // Wait for navigation away from login page
  await page.waitForURL(url => !url.toString().includes('/login'))
}

// ──────────────────────────────────────────────────────────────
// AUTH FLOWS
// ──────────────────────────────────────────────────────────────

test.describe('Authentication', () => {

  /**
   * WHAT: A new user can register and see the employee dashboard
   * WHY: Registration is the first step — if it breaks, nobody can use the app
   */
  test('user can register a new account', async ({ page }) => {
    const uniqueEmail = `test.${Date.now()}@.com`

    await page.goto(`${BASE_URL}/register`)
    await page.fill('input[name="fullName"], [placeholder*="name" i]', 'E2E Test User')
    await page.fill('input[type="email"]', uniqueEmail)
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')

    // Should land on the employee dashboard or tickets page
    await expect(page).toHaveURL(/my-tickets|dashboard/i)
  })

  /**
   * WHAT: Employee logs in and lands on employee dashboard
   * WHY: Login is the gateway — most critical path in the app
   */
  test('employee can log in and sees employee dashboard', async ({ page }) => {
    await loginAs(page, EMPLOYEE)
    await expect(page).toHaveURL(/my-tickets/i)
    // Dashboard should show the ticket list or submit ticket button
    await expect(page.getByText(/submit.*ticket|my tickets|new ticket/i)).toBeVisible()
  })

  /**
   * WHAT: IT member logs in and lands on IT dashboard (not employee dashboard)
   * WHY: Role-based routing — IT must see their board, not the employee view
   */
  test('IT member logs in and sees IT dashboard', async ({ page }) => {
    await loginAs(page, IT_MEMBER)
    await expect(page).toHaveURL(/it-dashboard/i)
  })

  /**
   * WHAT: Wrong password shows an error and does NOT redirect
   * WHY: Security — invalid credentials must not grant access
   */
  test('wrong password shows error and stays on login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', EMPLOYEE.email)
    await page.fill('input[type="password"]', 'WrongPassword!')
    await page.click('button[type="submit"]')

    // Should stay on login page and show an error
    await expect(page).toHaveURL(/login/i)
    await expect(page.getByText(/invalid|incorrect|unauthorized/i)).toBeVisible()
  })
})

// ──────────────────────────────────────────────────────────────
// EMPLOYEE FLOWS
// ──────────────────────────────────────────────────────────────

test.describe('Employee — Submit Ticket', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMPLOYEE)
  })

  /**
   * WHAT: Employee submits a new ticket with all required fields
   * EXPECT: Ticket appears in the "My Tickets" list
   * WHY: Core user action — the whole system is pointless if tickets can't be submitted
   */
  test('can submit a ticket and see it in my tickets', async ({ page }) => {
    const issueText = `E2E Test Issue ${Date.now()}`

    await page.goto(`${BASE_URL}/submit-ticket`)

    // Fill in the ticket form
    // Note: IssueDescription uses ReactQuill (rich text editor)
    // We interact with the editor's content-editable area
    const editorArea = page.locator('.ql-editor, [contenteditable="true"]').first()
    await editorArea.click()
    await editorArea.fill(issueText)

    // Select Urgent if there's an urgency toggle
    const urgentToggle = page.getByLabel(/urgent/i)
    if (await urgentToggle.isVisible()) {
      await urgentToggle.check()
    }

    await page.click('button[type="submit"]')

    // Should redirect to my tickets or show success
    await page.goto(`${BASE_URL}/my-tickets`)
    await expect(page.getByText(issueText)).toBeVisible({ timeout: 10_000 })
  })

  /**
   * WHAT: Employee sees their tickets on the dashboard
   * EXPECT: Ticket list loads without error
   */
  test('my tickets dashboard loads and shows ticket list', async ({ page }) => {
    await page.goto(`${BASE_URL}/my-tickets`)

    // Should not show an error page
    await expect(page.getByText(/error|something went wrong/i)).not.toBeVisible()
    // Should show the ticket list container (even if empty)
    await expect(page.locator('main, [data-testid="ticket-list"]')).toBeVisible()
  })
})

// ──────────────────────────────────────────────────────────────
// IT TEAM FLOWS
// ──────────────────────────────────────────────────────────────

test.describe('IT Team — Manage Tickets', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, IT_MEMBER)
  })

  /**
   * WHAT: IT member sees all open tickets on their dashboard
   * EXPECT: Ticket board loads with at least the headers/columns
   */
  test('IT dashboard loads and shows all tickets', async ({ page }) => {
    await page.goto(`${BASE_URL}/it-dashboard`)
    await expect(page.getByText(/error|something went wrong/i)).not.toBeVisible()
    await expect(page.locator('main')).toBeVisible()
  })

  /**
   * WHAT: IT member opens a ticket, changes status to InProgress, saves
   * EXPECT: The ticket detail page shows the updated status
   * WHY: Status updates are the main IT workflow action
   */
  test('IT member can update ticket status to InProgress', async ({ page }) => {
    await page.goto(`${BASE_URL}/it-dashboard`)

    // Click the first available ticket
    const firstTicket = page.locator('[data-testid="ticket-row"], .ticket-card, tr').first()
    await firstTicket.click()

    // Should be on ticket detail page
    await expect(page).toHaveURL(/tickets\/\d+/)

    // Change status dropdown (IT section)
    const statusSelect = page.getByLabel(/status/i).or(page.locator('select[name="status"]')).last()
    await statusSelect.selectOption('InProgress')

    // Save
    await page.click('button:has-text("Save"), button:has-text("Update")')

    // Status badge should now show InProgress
    await expect(page.getByText('InProgress')).toBeVisible()
  })

  /**
   * WHAT: IT member resolves a ticket and adds resolution notes
   * EXPECT: Status shows "Resolved", resolution notes are saved
   * WHY: Resolving tickets closes the loop with the employee
   */
  test('IT member can resolve a ticket with resolution notes', async ({ page }) => {
    await page.goto(`${BASE_URL}/it-dashboard`)

    // Open first ticket
    await page.locator('[data-testid="ticket-row"], .ticket-card, tr').first().click()
    await expect(page).toHaveURL(/tickets\/\d+/)

    // Set status to Resolved
    const statusSelect = page.locator('select').filter({ hasText: /open|progress|blocked/i }).last()
    await statusSelect.selectOption('Resolved')

    // Add resolution notes
    const notesEditor = page.locator('.ql-editor, [contenteditable="true"]').last()
    await notesEditor.click()
    await notesEditor.fill('Issue was resolved by resetting network adapter settings.')

    // Save changes
    await page.click('button:has-text("Save"), button:has-text("Update")')

    // Verify resolved status is shown
    await expect(page.getByText('Resolved')).toBeVisible()
  })
})

// ──────────────────────────────────────────────────────────────
// NAVIGATION & PROTECTION
// ──────────────────────────────────────────────────────────────

test.describe('Route Protection', () => {

  /**
   * WHAT: Unauthenticated user visits /my-tickets
   * EXPECT: Redirected to /login
   * WHY: Protected routes must not be accessible without login
   */
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/my-tickets`)
    await expect(page).toHaveURL(/login/)
  })

  /**
   * WHAT: Employee tries to visit /it-dashboard
   * EXPECT: Redirected away to /my-tickets
   * WHY: Role-based protection must prevent employees accessing IT views
   */
  test('employee cannot access IT dashboard', async ({ page }) => {
    await loginAs(page, EMPLOYEE)
    await page.goto(`${BASE_URL}/it-dashboard`)
    await expect(page).toHaveURL(/my-tickets/)
  })
})
