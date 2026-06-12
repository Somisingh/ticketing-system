import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import UrgencyBadge from '../components/UrgencyBadge'

export default function EmployeeDashboard() {
    const { user } = useAuth()
    const [tickets, setTickets] = useState([])
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [showHistory, setShowHistory] = useState(false)
    const [error, setError] = useState('')
    const [deleting, setDeleting] = useState(null) // ticketId being deleted

    useEffect(() => { fetchTickets() }, [])

    const fetchTickets = async () => {
        setLoading(true)
        try {
            const [openRes, histRes] = await Promise.all([
                fetch(`/api/tickets/my/${user.userId}`),
                fetch(`/api/tickets/my/${user.userId}/history`)
            ])
            if (openRes.ok) setTickets(await openRes.json())
            if (histRes.ok) setHistory(await histRes.json())
        } catch { setError('Could not load tickets.') }
        finally { setLoading(false) }
    }

    const handleDelete = async (e, ticketId) => {
        e.preventDefault() // prevent Link navigation
        e.stopPropagation()
        if (!window.confirm('Delete this ticket? This cannot be undone.')) return
        setDeleting(ticketId)
        try {
            const res =await fetch(`/api/tickets/delete/${ticketId}?requestingUserId=${user.userId}`, { method: 'DELETE' })
            if (res.status === 200 || res.ok) {
                setTickets(prev => prev.filter(t => t.id !== ticketId))
                setHistory(prev => prev.filter(t => t.id !== ticketId))
            } else {
                setError('Could not delete ticket.')
            }
        } catch { setError('Server error.') }
        finally { setDeleting(null) }
    }

    const fmt = (d) => new Date(d).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })

    const TicketRow = ({ t }) => (
        <Link to={`/ticket/${t.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div
                style={{
                    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10,
                    padding: '16px 20px', marginBottom: 10, cursor: 'pointer',
                    transition: 'box-shadow .15s, border-color .15s',
                    display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start'
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.09)'; e.currentTarget.style.borderColor = 'var(--brand-light)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>#{t.id}</span>
                        <StatusBadge status={t.status} />
                        <UrgencyBadge urgency={t.urgency} />
                    </div>
                    <div
                        style={{
                            fontSize: 14, color: 'var(--text-main)', overflow: 'hidden', maxHeight: 44,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                        }}
                        dangerouslySetInnerHTML={{ __html: t.issueDescription }}
                    />
                    {t.assignedToName && (
                        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                            Assigned to: <strong>{t.assignedToName}</strong>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {fmt(t.createdAt)}
                    </span>
                    {t.resolvedAt && (
                        <span style={{ color: 'var(--success)', fontSize: 12 }}>✓ Resolved {fmt(t.resolvedAt)}</span>
                    )}
                    {/* Delete button — only show on open tickets the user owns */}
                    {t.status !== 'Closed' && (
                        <button
                            onClick={(e) => handleDelete(e, t.id)}
                            disabled={deleting === t.id}
                            style={{
                                padding: '4px 12px', fontSize: 12, fontWeight: 600,
                                background: '#fee2e2', color: '#991b1b',
                                border: '1px solid #fca5a5', borderRadius: 6,
                                cursor: deleting === t.id ? 'not-allowed' : 'pointer',
                                opacity: deleting === t.id ? 0.6 : 1
                            }}
                        >
                            {deleting === t.id ? 'Deleting…' : 'Delete'}
                        </button>
                    )}
                </div>
            </div>
        </Link>
    )

    return (
        <Layout>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--brand)', margin: 0 }}>My Tickets</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                            Welcome back, {user?.fullName} · {user?.department}
                        </p>
                    </div>
                    <Link to="/submit-ticket" style={{
                        background: 'var(--brand)', color: '#fff', padding: '11px 24px',
                        borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14
                    }}>
                        + New Ticket
                    </Link>
                </div>

                {error && (
                    <div style={{ background: '#fee2e2', borderRadius: 6, padding: '10px 14px', marginBottom: 16, color: '#991b1b', fontSize: 14 }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
                    {[
                        { label: `Open Tickets (${tickets.length})`, val: false },
                        { label: `History (${history.length})`, val: true }
                    ].map(tab => (
                        <button key={String(tab.val)} onClick={() => setShowHistory(tab.val)} style={{
                            padding: '10px 24px', fontWeight: 700, fontSize: 14, border: 'none',
                            background: 'none', cursor: 'pointer',
                            color: showHistory === tab.val ? 'var(--brand)' : 'var(--text-muted)',
                            borderBottom: showHistory === tab.val ? '2px solid var(--brand)' : '2px solid transparent',
                            marginBottom: -2
                        }}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>Loading tickets…</div>
                ) : (
                    <>
                            {!showHistory && (
                                <>
                                    {
                                        tickets.length === 0
                                            ? <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                                                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                                                <p>No open tickets — everything is running smoothly!</p>
                                                <Link to="/submit-ticket" style={{ color: 'var(--brand-light)' }}>Submit a new ticket</Link>
                                            </div>
                                            : tickets.map(t => <TicketRow key={t.id} t={t} />)
                                    }
                                    </>
                        )}
                            {showHistory && (
<>
                                    {history.length === 0
                                        ? <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>No resolved tickets yet.</div>
                                        : history.map(t => <TicketRow key={t.id} t={t} />)
                                    }
                                    </>
                        )}
                    </>
                )}
            </div>
        </Layout>
    )
}