import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import UrgencyBadge from '../components/UrgencyBadge'

const STATUSES = ['Open','ToDo','InProgress','Blocked','UnderReview','Resolved','Closed']

export default function ITDashboard() {
  const { user } = useAuth()
  const [tickets, setTickets]   = useState([])
  const [filter, setFilter]     = useState('all')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => { fetchTickets() }, [filter])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const q = filter === 'all' ? '' : `?status=${filter}`
      const res = await fetch(`/api/tickets/all${q}`)
      if (res.ok) setTickets(await res.json())
      else setError('Failed to load tickets.')
    } catch { setError('Connection error.') }
    finally { setLoading(false) }
  }

  const fmt = (d) => new Date(d).toLocaleDateString('en-NZ', { day:'numeric', month:'short', year:'numeric' })

  const grouped = STATUSES.reduce((acc, s) => {
    acc[s] = tickets.filter(t => t.status === s)
    return acc
  }, {})

  // Counts by status for header pills
  const counts = STATUSES.reduce((a,s) => ({ ...a, [s]: tickets.filter(t=>t.status===s).length }), {})

  return (
    <Layout>
          <div style={{ margin: '24px' }}>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:26, fontWeight:700, color:'var(--brand)', margin:'0 0 4px' }}>IT Help Desk</h1>
          <p style={{ color:'var(--text-muted)', fontSize:20 }}>
            {tickets.length} active ticket{tickets.length !== 1 ? 's' : ''} · Logged in as {user?.fullName}
          </p>
        </div>

        {/* Filter bar */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
          {['all', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding:'6px 16px', borderRadius:20, fontSize:13, fontWeight:600,
              border: filter===s ? '2px solid var(--brand)' : '2px solid var(--border)',
              background: filter===s ? 'var(--brand)' : '#fff',
              color: filter===s ? '#fff' : 'var(--text-muted)',
              cursor:'pointer', transition:'all .15s'
            }}>
              {s === 'all' ? `All (${tickets.length})` : `${s} (${counts[s]||0})`}
            </button>
          ))}
        </div>

        {error && <div style={{ background:'#fee2e2', borderRadius:6, padding:'10px 14px', marginBottom:16, color:'#991b1b', fontSize:14 }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-muted)' }}>Loading tickets…</div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-muted)' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
            <p>No tickets matching this filter.</p>
          </div>
        ) : filter === 'all' ? (
          /* Kanban board */
          <div style={{ overflowX:'auto', paddingBottom:16 }}>
            <div style={{ display:'flex', gap:14, minWidth: `${STATUSES.length * 230}px` }}>
              {STATUSES.map(s => (
                <div key={s} style={{ width:220, flexShrink:0 }}>
                  <div style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    marginBottom:10, padding:'6px 10px', borderRadius:7,
                    background: s==='Blocked' ? '#fee2e2' : s==='Resolved'||s==='Closed' ? '#d1fae5' : '#eff6ff'
                  }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--text-main)' }}>{s}</span>
                    <span style={{ fontSize:12, background:'#fff', borderRadius:10, padding:'1px 8px', fontWeight:700, color:'var(--text-muted)' }}>
                      {grouped[s].length}
                    </span>
                  </div>
                  <div style={{ minHeight:60 }}>
                    {grouped[s].map(t => (
                      <Link key={t.id} to={`/ticket/${t.id}`} style={{ textDecoration:'none', color:'inherit', display:'block' }}>
                        <div style={{
                          background:'var(--card)', border:'1px solid var(--border)', borderRadius:8,
                          padding:'12px 14px', marginBottom:8, cursor:'pointer', fontSize:13,
                          transition:'box-shadow .15s'
                        }}
                          onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,0.1)'}
                          onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}
                        >
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                            <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>#{t.id}</span>
                            <UrgencyBadge urgency={t.urgency} />
                          </div>
                          <div style={{ fontWeight:600, marginBottom:4, overflow:'hidden', maxHeight:36, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}
                            dangerouslySetInnerHTML={{ __html: t.issueDescription.replace(/<[^>]*>/g,' ').substring(0,80)+'…' }} />
                          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6 }}>
                            {t.submittedByName} · {t.submittedByDepartment}
                          </div>
                          {t.assignedToName && (
                            <div style={{ fontSize:11, color:'var(--brand-light)', marginTop:4 }}>
                              → {t.assignedToName}
                            </div>
                          )}
                          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
                            {new Date(t.createdAt).toLocaleDateString('en-NZ', { day:'numeric', month:'short' })}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* List view when filtered */
          <div>
            {tickets.map(t => (
              <Link key={t.id} to={`/ticket/${t.id}`} style={{ textDecoration:'none', color:'inherit', display:'block' }}>
                <div style={{
                  background:'var(--card)', border:'1px solid var(--border)', borderRadius:10,
                  padding:'16px 20px', marginBottom:10, cursor:'pointer',
                  display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'center',
                  transition:'box-shadow .15s, border-color .15s'
                }}
                  onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.09)'; e.currentTarget.style.borderColor='var(--brand-light)' }}
                  onMouseLeave={e=>{ e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor='var(--border)' }}
                >
                  <div>
                    <div style={{ display:'flex', gap:10, marginBottom:6, alignItems:'center' }}>
                      <span style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)' }}>#{t.id}</span>
                      <StatusBadge status={t.status} />
                      <UrgencyBadge urgency={t.urgency} />
                    </div>
                    <div style={{ fontSize:14, color:'var(--text-main)', marginBottom:6 }}
                      dangerouslySetInnerHTML={{ __html: t.issueDescription.replace(/<[^>]*>/g,' ').substring(0,120)+'…' }} />
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                      Submitted by <strong>{t.submittedByName}</strong> · {t.submittedByDepartment}
                      {t.assignedToName && <> · Assigned to <strong>{t.assignedToName}</strong></>}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', fontSize:12, color:'var(--text-muted)' }}>
                    {fmt(t.createdAt)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
