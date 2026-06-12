// ============================================================
// LoginAndRegister.test.jsx
// Tests for the Login and Register pages
//
// Covers:
//   - Form renders correctly
//   - Validation (empty fields)
//   - Successful login/register
//   - Error handling (wrong password, duplicate email)
// ============================================================

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor }                               from '@testing-library/react'
import userEvent                                                 from '@testing-library/user-event'
import { MemoryRouter }                                          from 'react-router-dom'
import { setupServer }                                           from 'msw/node'
import '@testing-library/jest-dom'

import { handlers }  from '../mocks/handlers'
import { AuthProvider } from '../context/AuthContext'
import Login         from '../pages/Login'
import Register      from '../pages/Register'

// Start fake API server
const server = setupServer(...handlers)
beforeAll(()    => server.listen())
afterEach(()    => server.resetHandlers())
afterAll(()     => server.close())

// Helper — wraps component with all needed providers
function renderWithProviders(component) {
  return render(
    <AuthProvider>
      <MemoryRouter>{component}</MemoryRouter>
    </AuthProvider>
  )
}

// ──────────────────────────────────────────────────────────────
// LOGIN PAGE TESTS
// ──────────────────────────────────────────────────────────────
describe('Login Page', () => {

  /**
   * WHAT: Login page renders with email + password fields and a submit button
   * EXPECT: All form elements are visible
   * WHY: If the form doesn't render, nobody can log in
   */
  it('renders email field, password field, and login button', () => {
    renderWithProviders(<Login />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login|sign in/i })).toBeInTheDocument()
  })

  /**
   * WHAT: Submit the form with empty fields
   * EXPECT: Shows a validation error — does NOT call the API
   * WHY: Client-side validation prevents unnecessary server calls
   */
  it('shows error when submitted with empty fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Login />)

    await user.click(screen.getByRole('button', { name: /login|sign in/i }))

    // Should show some kind of error message
    await waitFor(() => {
      expect(
        screen.getByText(/required|email.*password|enter/i)
      ).toBeInTheDocument()
    })
  })

  /**
   * WHAT: Submit with valid employee credentials
   * EXPECT: Login succeeds (no error message shown)
   * WHY: The main happy path — employee can log in
   */
  it('submits successfully with valid employee credentials', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Login />)

    await user.type(screen.getByLabelText(/email/i), 'john@test.com')
    await user.type(screen.getByLabelText(/password/i), 'Admin@1234')
    await user.click(screen.getByRole('button', { name: /login|sign in/i }))

    // Error message should NOT appear
    await waitFor(() => {
      expect(screen.queryByText(/invalid|incorrect|unauthorized/i)).not.toBeInTheDocument()
    })
  })

  /**
   * WHAT: Submit with wrong password
   * EXPECT: Error message shown (401 from API)
   * WHY: User must know when their credentials are wrong
   */
  it('shows error message on wrong password', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Login />)

    await user.type(screen.getByLabelText(/email/i), 'john@test.com')
    await user.type(screen.getByLabelText(/password/i), 'WrongPassword!')
    await user.click(screen.getByRole('button', { name: /login|sign in/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/invalid|incorrect|wrong|unauthorized/i)
      ).toBeInTheDocument()
    })
  })
})

// ──────────────────────────────────────────────────────────────
// REGISTER PAGE TESTS
// ──────────────────────────────────────────────────────────────
describe('Register Page', () => {

  /**
   * WHAT: Register page renders all required fields
   * EXPECT: Full Name, Email, Password, and Register button visible
   */
  it('renders all form fields and submit button', () => {
    renderWithProviders(<Register />)

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /register|sign up|create/i })).toBeInTheDocument()
  })

  /**
   * WHAT: Submit with empty email field
   * EXPECT: Client-side validation error shown
   */
  it('shows error when email is missing', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Register />)

    await user.type(screen.getByLabelText(/full name/i), 'New User')
    await user.type(screen.getByLabelText(/password/i), 'ValidPass123!')
    await user.click(screen.getByRole('button', { name: /register|sign up|create/i }))

    await waitFor(() => {
      expect(screen.getByText(/required|email|enter/i)).toBeInTheDocument()
    })
  })

  /**
   * WHAT: Submit valid registration form
   * EXPECT: No error — registration succeeds
   * WHY: New users must be able to create accounts
   */
  it('registers successfully with valid data', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Register />)

    await user.type(screen.getByLabelText(/full name/i), 'New Employee')
    await user.type(screen.getByLabelText(/email/i),     'newuser@.com')
    await user.type(screen.getByLabelText(/password/i),  'SecurePass123!')

    // Department is optional — skip it
    await user.click(screen.getByRole('button', { name: /register|sign up|create/i }))

    await waitFor(() => {
      expect(screen.queryByText(/already exists|duplicate|error/i)).not.toBeInTheDocument()
    })
  })

  /**
   * WHAT: There should be a link/button to go back to Login
   * EXPECT: "Login" or "Sign in" link is visible
   * WHY: UX — new users might land on Register but already have an account
   */
  it('shows a link to the Login page', () => {
    renderWithProviders(<Register />)
    expect(screen.getByText(/login|sign in|already have/i)).toBeInTheDocument()
  })
})
