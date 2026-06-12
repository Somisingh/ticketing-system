// ============================================================
// AuthContext.test.jsx
// Unit tests for AuthContext — login, logout, persistence
//
// ProtectedRoute.test.jsx
// Tests that routes redirect correctly based on user role
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act }                   from '@testing-library/react'
import { MemoryRouter, Route, Routes }           from 'react-router-dom'
import '@testing-library/jest-dom'

import { AuthProvider, useAuth } from '../context/AuthContext'
import ProtectedRoute            from '../components/ProtectedRoute'

// ──────────────────────────────────────────────────────────────
// AuthContext Tests
// ──────────────────────────────────────────────────────────────

// A simple test component that reads from AuthContext
function AuthDisplay() {
  const { user, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="user">{user ? user.fullName : 'not logged in'}</span>
      <button onClick={() => login({ userId: 1, fullName: 'John', isITTeam: false })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {

  beforeEach(() => {
    // Clear session storage before each test so state is fresh
    sessionStorage.clear()
  })

  /**
   * WHAT: Default state when no user is stored
   * EXPECT: user is null → "not logged in" shown
   * WHY: App must start in a logged-out state for new sessions
   */
  it('starts with no user when sessionStorage is empty', () => {
    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    )
    expect(screen.getByTestId('user').textContent).toBe('not logged in')
  })

  /**
   * WHAT: Call login() with user data
   * EXPECT: user is set, name displayed, stored in sessionStorage
   * WHY: Logging in should persist the user across page navigations
   */
  it('sets user on login and persists to sessionStorage', async () => {
    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    )

    await act(async () => {
      screen.getByText('Login').click()
    })

    expect(screen.getByTestId('user').textContent).toBe('John')
    const stored = JSON.parse(sessionStorage.getItem('ts_user'))
    expect(stored.fullName).toBe('John')
  })

  /**
   * WHAT: Call logout() after being logged in
   * EXPECT: user becomes null, sessionStorage cleared
   * WHY: Logout must clear all session data
   */
  it('clears user on logout', async () => {
    // Pre-populate sessionStorage as if user was already logged in
    sessionStorage.setItem('ts_user', JSON.stringify({ userId: 1, fullName: 'John', isITTeam: false }))

    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    )

    // Should start logged in
    expect(screen.getByTestId('user').textContent).toBe('John')

    await act(async () => {
      screen.getByText('Logout').click()
    })

    expect(screen.getByTestId('user').textContent).toBe('not logged in')
    expect(sessionStorage.getItem('ts_user')).toBeNull()
  })

  /**
   * WHAT: AuthProvider reads from sessionStorage on mount
   * EXPECT: User is restored automatically
   * WHY: Refreshing the page should not log out the user
   */
  it('restores user from sessionStorage on mount', () => {
    sessionStorage.setItem('ts_user', JSON.stringify({ userId: 5, fullName: 'Alice', isITTeam: true }))

    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    )

    expect(screen.getByTestId('user').textContent).toBe('Alice')
  })
})

// ──────────────────────────────────────────────────────────────
// ProtectedRoute Tests
// ──────────────────────────────────────────────────────────────

// Helper — renders a protected route within a MemoryRouter with a given user
function renderWithRoute(user, role, initialPath = '/protected') {
  // Seed sessionStorage so AuthProvider picks up the user
  if (user) sessionStorage.setItem('ts_user', JSON.stringify(user))
  else sessionStorage.removeItem('ts_user')

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login"       element={<div>Login Page</div>} />
          <Route path="/my-tickets"  element={<div>My Tickets</div>} />
          <Route path="/it-dashboard" element={<div>IT Dashboard</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute role={role}>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('ProtectedRoute', () => {

  beforeEach(() => sessionStorage.clear())

  /**
   * WHAT: Unauthenticated user visits a protected route
   * EXPECT: Redirected to /login
   * WHY: Non-logged-in users must never see the dashboard
   */
  it('redirects to /login when not authenticated', () => {
    renderWithRoute(null, undefined)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  /**
   * WHAT: Logged-in employee visits a route (no role restriction)
   * EXPECT: Can see the protected content
   * WHY: Authenticated users without role restriction can access the route
   */
  it('renders content for authenticated user with no role restriction', () => {
    renderWithRoute({ userId: 1, fullName: 'John', isITTeam: false }, undefined)
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  /**
   * WHAT: Employee (isITTeam: false) tries to access an IT-only route
   * EXPECT: Redirected to /my-tickets
   * WHY: Employees must not be able to access IT dashboard
   */
  it('redirects employee away from IT-only route', () => {
    renderWithRoute({ userId: 1, fullName: 'John', isITTeam: false }, 'it')
    expect(screen.getByText('My Tickets')).toBeInTheDocument()
  })

  /**
   * WHAT: IT member (isITTeam: true) tries to access employee-only route
   * EXPECT: Redirected to /it-dashboard
   * WHY: IT members should be on their own dashboard, not the employee one
   */
  it('redirects IT member away from employee-only route', () => {
    renderWithRoute({ userId: 2, fullName: 'Alice IT', isITTeam: true }, 'employee')
    expect(screen.getByText('IT Dashboard')).toBeInTheDocument()
  })

  /**
   * WHAT: IT member accesses IT-only route
   * EXPECT: Content is shown
   */
  it('renders content for IT member on IT-only route', () => {
    renderWithRoute({ userId: 2, fullName: 'Alice IT', isITTeam: true }, 'it')
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
