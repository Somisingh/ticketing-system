import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactQuill from 'react-quill-new'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import UrgencyBadge from '../components/UrgencyBadge'

const STATUSES = ['Open', 'ToDo', 'InProgress', 'Blocked', 'UnderReview', 'Resolved', 'Closed']

const resolutionModules = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image', 'blockquote', 'code-block'],
        ['clean']
    ]
}
const readOnlyModules = { toolbar: false }

export default function TicketDetail() {
    const { id } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const isIT = user?.isITTeam

    const [ticket, setTicket] = useState(null)
    const [itMembers, setITMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState('')
    const [saved, setSaved] = useState(false)

    // Editable IT fields
    const [assignedTo, setAssignedTo] = useState('')
    const [status, setStatus] = useState('Open')
    const [resolution, setResolution] = useState('')
    const [notify, setNotify] = useState(true)

    useEffect(() => { fetchAll() }, [id])

    const fetchAll = async () => {
        setLoading(true)
        try {
            const [tRes, mRes] = await Promise.all([
                fetch(`/api/tickets/${id}`),
                isIT ? fetch('/api/tickets/it-members') : Promise.resolve(null)
            ])
            if (tRes.ok) {
                const t = await tRes.json()
                setTicket(t)
                setAssignedTo(t.assignedToUserId || '')
                setStatus(t.status)
                setResolution(t.resolutionNotes || '')
                setNotify(t.notifyOnResolution)
            }
            if (mRes?.ok) setITMembers(await mRes.json())
        } catch { setError('Could not load ticket.') }
        finally { setLoading(false) }
    }

    const handleSave = async () => {
        setSaving(true); setError(''); setSaved(false)
        try {
            const res = await fetch(`/api/tickets/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignedToUserId: assignedTo || null,
                    status,
                    resolutionNotes: resolution
                })
            })
            if (res.ok) {
                setTicket(await res.json())
                setSaved(true)
                setTimeout(() => setSaved(false), 3000)
            } else { const t = await res.text(); setError(t || 'Save failed.') }
        } catch { setError('Server error.') }
        finally { setSaving(false) }
    }

    const handleDelete = async () => {
        if (!window.confirm('Permanently delete this ticket? This cannot be undone.')) return
        setDeleting(true)
        try {
            const res =await fetch(`/api/tickets/delete/${id}?requestingUserId=${user.userId}`, { method: 'DELETE' })
            if (res.ok) {
                navigate(isIT ? '/it-dashboard' : '/my-tickets')
            } else {
                const t = await res.text()
                setError(t || 'Could not delete ticket.')
            }
        } catch { setError('Server error.') }
        finally { setDeleting(false) }
    }

    const fmt = (d) => d
        ? new Date(d).toLocaleString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '—'

    const isOwner = ticket?.submittedByUserId === user?.userId
    const canDelete = isIT || isOwner

    if (loading) return <Layout><div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>Loading…</div></Layout>
    if (!ticket) return <Layout><div style={{ textAlign: 'center', padding: '80px', color: '#dc2626' }}>{error || 'Ticket not found.'}</div></Layout>

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = resolution || '';

    const plainResolution =
        tempDiv.textContent ||
        tempDiv.innerText ||
        '';

    const emailBody = encodeURIComponent(
        `Hi ${ticket.submittedByName}

Your support ticket #${ticket.id} has been resolved.

${plainResolution ? `Resolution summary:\n${plainResolution}\n` : ''}
To view the full resolution including any screenshots or attachments, please visit:
http://tpms/ticket/${ticket.id}

Kind regards,
IT Team`
    );

    return (
        <Layout>
            <div style={{ maxWidth: 860, margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: 24 }}>
                    <div>
                        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-light)', fontSize: 20, padding: 0, marginBottom: 8 }}>
                            ← Back
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand)', margin: 0 }}>Ticket #{ticket.id}</h1>
                            <StatusBadge status={ticket.status} />
                            <UrgencyBadge urgency={ticket.urgency} />
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
                            Submitted {fmt(ticket.createdAt)} · Updated {fmt(ticket.updatedAt)}
                            {ticket.resolvedAt && ` · Resolved ${fmt(ticket.resolvedAt)}`}
                        </p>
                    </div>

                    {/* Delete button — top right, visible to IT or owner */}
                    {canDelete && (
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            style={{
                                padding: '9px 20px', background: '#fee2e2', color: '#991b1b',
                                fontWeight: 700, fontSize: 13, borderRadius: 7,
                                border: '1.5px solid #fca5a5', cursor: deleting ? 'not-allowed' : 'pointer',
                                opacity: deleting ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6
                            }}
                        >
                            🗑 {deleting ? 'Deleting…' : 'Delete Ticket'}
                        </button>
                    )}
                </div>

                {error && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 14px', marginBottom: 16, color: '#991b1b', fontSize: 14 }}>{error}</div>}
                {saved && <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 6, padding: '10px 14px', marginBottom: 16, color: '#065f46', fontSize: 14 }}>✓ Changes saved successfully.</div>}

                {/* Employee section — always read-only */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 24, marginBottom: 20 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Submitted By
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                        {[
                            { label: 'Name', value: ticket.submittedByName },
                            { label: 'Department', value: ticket.submittedByDepartment || '—' },
                            { label: 'Notify on resolution', value: ticket.notifyOnResolution ? '✅ Yes' : '❌ No' }
                        ].map(f => (
                            <div key={f.label}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>{f.label}</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>{f.value}</div>
                            </div>
                        ))}
                    </div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Issue Description</div>
                        <div style={{
                            border: '1.5px solid var(--border)', borderRadius: 8, padding: 16,
                            background: isIT ? '#f8fafc' : '#fff', minHeight: 100, fontSize: 14, lineHeight: 1.6,
                            overflowWrap: 'break-word',   
                            wordBreak: 'normal',      
                            overflow: 'hidden' 
                        }}>
                            <div dangerouslySetInnerHTML={{ __html: ticket.issueDescription }} />
                        </div>
                    </div>
                </div>

                {/* IT Team section */}
                <div style={{ background: 'var(--card)', border: isIT ? '1px solid var(--brand-light)' : '1px solid var(--border)', borderRadius: 10, padding: 24 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: isIT ? 'var(--brand)' : 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        IT Team {isIT ? '— Editable' : '— Response'}
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: isIT ? '1fr 1fr' : '1fr 1fr', gap: 20, marginBottom: 20 }}>
                        {/* Assigned To */}
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Assigned To</div>
                            {isIT ? (
                                <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 7, border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', background: '#fff' }}>
                                    <option value="">Unassigned</option>
                                    {itMembers.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                                </select>
                            ) : (
                                <div style={{ fontSize: 14, fontWeight: 600 }}>{ticket.assignedToName || 'Unassigned'}</div>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Ticket Status</div>
                            {isIT ? (
                                <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 7, border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', background: '#fff' }}>
                                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            ) : (
                                <StatusBadge status={ticket.status} />
                            )}
                        </div>
                    </div>
                    {/* Resolution notes */}
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                            Resolution Notes {isIT && <span style={{ fontWeight: 400 }}>(links, images, screenshots welcome)</span>}
                        </div>
                        {isIT ? (
                            <ReactQuill
                                theme="snow"
                                value={resolution}
                                onChange={setResolution}
                                modules={resolutionModules}
                                placeholder="Describe the resolution, steps taken, relevant links or screenshots…"
                            />
                        ) : (
                            <div style={{
                                border: '1.5px solid var(--border)', borderRadius: 8, padding: 16,
                                minHeight: 100, fontSize: 14, lineHeight: 1.6,
                                background: resolution ? '#fff' : '#f8fafc',
                                    color: resolution ? 'var(--text-main)' : 'var(--text-muted)',
                                    overflowWrap: 'break-word',   
                                    wordBreak: 'normal',     
                                    overflow: 'hidden'  
                            }}>
                                {resolution
                                    ? <div dangerouslySetInnerHTML={{ __html: resolution }} />
                                    : 'IT team has not yet added resolution notes.'}
                            </div>
                        )}
                    </div>

                    {isIT && (
                        <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
                            <button onClick={handleSave} disabled={saving} style={{
                                padding: '11px 32px', background: 'var(--brand)', color: '#fff',
                                fontWeight: 700, fontSize: 14, borderRadius: 7, border: 'none',
                                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1
                            }}>
                                {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                            {ticket.submittedByName && (ticket.status === 'Resolved' || ticket.status === 'Closed') && ticket.notifyOnResolution && (
                                <a
                                    href={`mailto:${ticket.submittedByEmail || ''}?subject=${encodeURIComponent(
                                        `Your IT ticket #${ticket.id} has been resolved`
                                    )}&body=${emailBody}`}
                                    style={{
                                        padding: '11px 24px', background: '#fff', color: 'var(--brand)',
                                        fontWeight: 700, fontSize: 14, borderRadius: 7, textDecoration: 'none',
                                        border: '2px solid var(--brand)', display: 'inline-block'
                                    }}
                                >
                                    📧 Send Resolution Email
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}