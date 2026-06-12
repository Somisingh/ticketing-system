// ============================================================
// src/mocks/handlers.js
// MSW (Mock Service Worker) — Fake API responses for frontend tests
//
// WHY MSW?
//   Your React components call fetch('/api/tickets/...').
//   In tests we don't have a real .NET backend running.
//   MSW intercepts those fetch calls and returns fake data
//   so your tests are fast and don't need a server.
//
// HOW TO INSTALL:
//   npm install -D msw
// ============================================================

import { http, HttpResponse } from 'msw'

// ── Seed data — shared across handlers ──
export const mockUsers = {
  employee: { userId: 1, fullName: 'John Doe',  email: 'john@test.com', department: 'Finance', isITTeam: false },
  itMember: { userId: 2, fullName: 'IT Alice',  email: 'it@test.com',   department: 'IT',      isITTeam: true  },
}

export const mockTickets = [
  {
    id: 1, submittedByUserId: 1, submittedByName: 'John Doe',
    submittedByDepartment: 'Finance', submittedByEmail: 'john@test.com',
    issueDescription: 'Cannot connect to VPN',
    urgency: 'Urgent', notifyOnResolution: true,
    assignedToUserId: null, assignedToName: null,
    status: 'Open', resolutionNotes: null,
    resolvedAt: null,
    createdAt: '2025-01-15T08:00:00Z', updatedAt: '2025-01-15T08:00:00Z',
  },
  {
    id: 2, submittedByUserId: 1, submittedByName: 'John Doe',
    submittedByDepartment: 'Finance', submittedByEmail: 'john@test.com',
    issueDescription: 'Printer not working on 3rd floor',
    urgency: 'NotUrgent', notifyOnResolution: false,
    assignedToUserId: 2, assignedToName: 'IT Alice',
    status: 'InProgress', resolutionNotes: null,
    resolvedAt: null,
    createdAt: '2025-01-14T09:00:00Z', updatedAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 3, submittedByUserId: 1, submittedByName: 'John Doe',
    submittedByDepartment: 'Finance', submittedByEmail: 'john@test.com',
    issueDescription: 'Software license renewal needed',
    urgency: 'NotUrgent', notifyOnResolution: true,
    assignedToUserId: 2, assignedToName: 'IT Alice',
    status: 'Resolved', resolutionNotes: 'License renewed successfully.',
    resolvedAt: '2025-01-13T14:00:00Z',
    createdAt: '2025-01-10T09:00:00Z', updatedAt: '2025-01-13T14:00:00Z',
  },
]

export const mockITMembers = [
  { id: 2, fullName: 'IT Alice' },
  { id: 3, fullName: 'IT Bob'   },
]

// ── Request handlers ──
export const handlers = [

  // AUTH
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json()
    if (!email || !password)
      return HttpResponse.json('Email and password required.', { status: 400 })
    if (email === 'john@test.com' && password === 'Admin@1234')
      return HttpResponse.json(mockUsers.employee)
    if (email === 'it@test.com' && password === 'Admin@1234')
      return HttpResponse.json(mockUsers.itMember)
    return new HttpResponse(null, { status: 401 })
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json()
    if (!body.email || !body.password)
      return HttpResponse.json('Email and password are required.', { status: 400 })
    return HttpResponse.json({
      userId: 99, fullName: body.fullName,
      email: body.email, department: body.department, isITTeam: false,
    })
  }),

  http.post('/api/auth/forgot-password', async ({ request }) => {
    const { email, newPassword } = await request.json()
    if (email === 'unknown@test.com')
      return HttpResponse.json('No account found.', { status: 404 })
    if (!newPassword || newPassword.length < 8)
      return HttpResponse.json('Password must be at least 8 characters.', { status: 400 })
    return new HttpResponse(null, { status: 200 })
  }),

  // TICKETS
  http.get('/api/tickets/all', ({ request }) => {
    const url    = new URL(request.url)
    const status = url.searchParams.get('status')
    const result = mockTickets.filter(t =>
      status ? t.status === status : t.status !== 'Closed'
    )
    return HttpResponse.json(result)
  }),

  http.get('/api/tickets/it-members', () =>
    HttpResponse.json(mockITMembers)
  ),

  http.get('/api/tickets/my/:userId', ({ params }) => {
    const userId = parseInt(params.userId)
    const tickets = mockTickets.filter(
      t => t.submittedByUserId === userId && t.status !== 'Closed'
    )
    return HttpResponse.json(tickets)
  }),

  http.get('/api/tickets/my/:userId/history', ({ params }) => {
    const userId = parseInt(params.userId)
    const tickets = mockTickets.filter(
      t => t.submittedByUserId === userId &&
           (t.status === 'Resolved' || t.status === 'Closed')
    )
    return HttpResponse.json(tickets)
  }),

  http.get('/api/tickets/assigned/:itUserId', ({ params }) => {
    const itUserId = parseInt(params.itUserId)
    const tickets = mockTickets.filter(
      t => t.assignedToUserId === itUserId && t.status !== 'Closed'
    )
    return HttpResponse.json(tickets)
  }),

  http.get('/api/tickets/:id', ({ params }) => {
    const ticket = mockTickets.find(t => t.id === parseInt(params.id))
    if (!ticket) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(ticket)
  }),

  http.post('/api/tickets', async ({ request }) => {
    const body = await request.json()
    const newTicket = {
      id: 99, submittedByUserId: 1, submittedByName: 'John Doe',
      submittedByDepartment: 'Finance', submittedByEmail: 'john@test.com',
      issueDescription: body.issueDescription,
      urgency: body.urgency, notifyOnResolution: body.notifyOnResolution,
      assignedToUserId: null, assignedToName: null,
      status: 'Open', resolutionNotes: null, resolvedAt: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    return HttpResponse.json(newTicket, { status: 201 })
  }),

  http.put('/api/tickets/:id', async ({ params, request }) => {
    const ticket = mockTickets.find(t => t.id === parseInt(params.id))
    if (!ticket) return new HttpResponse(null, { status: 404 })
    const body = await request.json()
    const updated = { ...ticket, ...body, updatedAt: new Date().toISOString() }
    if (body.status === 'Resolved' || body.status === 'Closed')
      updated.resolvedAt = new Date().toISOString()
    return HttpResponse.json(updated)
  }),

  http.delete('/api/tickets/:id', ({ params }) => {
    const ticket = mockTickets.find(t => t.id === parseInt(params.id))
    if (!ticket) return new HttpResponse(null, { status: 404 })
    return new HttpResponse(null, { status: 204 })
  }),
]
