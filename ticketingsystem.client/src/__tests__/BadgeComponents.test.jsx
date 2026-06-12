// ============================================================
// StatusBadge.test.jsx  &  UrgencyBadge.test.jsx
// Unit tests for the two badge components
//
// HOW TO RUN:
//   npm run test
//
// PACKAGES NEEDED:
//   npm install -D vitest @testing-library/react @testing-library/jest-dom
// ============================================================

import { describe, it, expect } from 'vitest'
import { render, screen }       from '@testing-library/react'
import '@testing-library/jest-dom'

import StatusBadge  from '../components/StatusBadge'
import UrgencyBadge from '../components/UrgencyBadge'

// ──────────────────────────────────────────────────────────────
// StatusBadge Tests
// ──────────────────────────────────────────────────────────────
describe('StatusBadge', () => {

  /**
   * WHAT: Renders "Open" status badge
   * EXPECT: "OPEN" text visible on screen
   * WHY: Badge must show the correct label for each status
   */
  it('renders Open status correctly', () => {
    render(<StatusBadge status="Open" />)
    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('renders InProgress status correctly', () => {
    render(<StatusBadge status="InProgress" />)
    expect(screen.getByText('InProgress')).toBeInTheDocument()
  })

  it('renders Resolved status correctly', () => {
    render(<StatusBadge status="Resolved" />)
    expect(screen.getByText('Resolved')).toBeInTheDocument()
  })

  it('renders Closed status correctly', () => {
    render(<StatusBadge status="Closed" />)
    expect(screen.getByText('Closed')).toBeInTheDocument()
  })

  it('renders Blocked status correctly', () => {
    render(<StatusBadge status="Blocked" />)
    expect(screen.getByText('Blocked')).toBeInTheDocument()
  })

  /**
   * WHAT: Passes an unknown status
   * EXPECT: Still renders — shouldn't crash
   * WHY: Defensive test — we don't want the UI to break if a new status is added to the API
   */
  it('renders without crashing for an unknown status', () => {
    render(<StatusBadge status="SomeNewStatus" />)
    expect(screen.getByText('SomeNewStatus')).toBeInTheDocument()
  })
})

// ──────────────────────────────────────────────────────────────
// UrgencyBadge Tests
// ──────────────────────────────────────────────────────────────
describe('UrgencyBadge', () => {

  /**
   * WHAT: Renders with "Urgent" urgency
   * EXPECT: Shows "🔴 Urgent" text
   * WHY: IT team needs to visually spot urgent tickets fast
   */
  it('renders Urgent badge with correct text', () => {
    render(<UrgencyBadge urgency="Urgent" />)
    expect(screen.getByText(/Urgent/i)).toBeInTheDocument()
  })

  /**
   * WHAT: Renders with "NotUrgent" urgency
   * EXPECT: Shows "Not Urgent" (without red icon)
   * WHY: Non-urgent tickets need a distinct, calm appearance
   */
  it('renders Not Urgent badge with correct text', () => {
    render(<UrgencyBadge urgency="NotUrgent" />)
    expect(screen.getByText(/Not Urgent/i)).toBeInTheDocument()
  })

  /**
   * WHAT: Urgent badge should have red background styling
   * EXPECT: Red background color applied
   * WHY: Color-coding is critical for IT team scanning through tickets
   */
  it('applies red background for Urgent', () => {
    render(<UrgencyBadge urgency="Urgent" />)
    const badge = screen.getByText(/Urgent/i)
    // Check the inline style has a red background
    expect(badge).toHaveStyle({ background: '#fee2e2' })
  })

  /**
   * WHAT: Not Urgent badge should have grey styling
   * EXPECT: Grey background
   */
  it('applies grey background for NotUrgent', () => {
    render(<UrgencyBadge urgency="NotUrgent" />)
    const badge = screen.getByText(/Not Urgent/i)
    expect(badge).toHaveStyle({ background: '#f3f4f6' })
  })
})
