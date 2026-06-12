import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactQuill from 'react-quill-new'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image'],
    ['clean']
  ]
}

export default function SubmitTicket() {
  const navigate = useNavigate()
  const { user }  = useAuth()
  const [description, setDescription] = useState('')
  const [urgency, setUrgency]         = useState('NotUrgent')
  const [notify, setNotify]           = useState(true)
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (!description || description.replace(/<[^>]*>/g,'').trim() === '') {
      return setError('Please describe the issue before submitting.')
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/tickets?userId=${user.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueDescription: description, urgency: urgency === 'Urgent' ? 1 : 0, notifyOnResolution: notify })
      })
      if (res.ok) { navigate('/my-tickets') }
      else { const t = await res.text(); setError(t || 'Failed to submit ticket.') }
    } catch { setError('Server error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <Layout>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--brand)', marginBottom: 6 }}>Submit a Support Ticket</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 14 }}>Describe your issue and our IT team will be in touch.</p>

        {error && <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:6, padding:'10px 14px', marginBottom:20, color:'#991b1b', fontSize:14 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ background: 'var(--card)', borderRadius: 10, border: '1px solid var(--border)', padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand)', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              Your Details
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Name', value: user?.fullName },
                { label: 'Department', value: user?.department || '—' }
              ].map(f => (
                <div key={f.label}>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:6, color:'var(--text-muted)' }}>{f.label}</label>
                  <div style={{ padding:'10px 12px', background:'#f8fafc', borderRadius:7, border:'1.5px solid var(--border)', fontSize:14, color:'var(--text-muted)' }}>
                    {f.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--card)', borderRadius: 10, border: '1px solid var(--border)', padding: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand)', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              Issue Details
            </h2>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:8 }}>
                Describe the Issue * <span style={{ fontWeight:400, color:'var(--text-muted)' }}>(screenshots/images can be pasted or uploaded)</span>
              </label>
              <ReactQuill
                theme="snow"
                value={description}
                onChange={setDescription}
                modules={modules}
                placeholder="Describe your issue in detail. You can paste screenshots directly into this editor…"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:8 }}>Urgency</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { val: 'NotUrgent', label: 'Not Urgent' },
                    { val: 'Urgent',    label: '🔴 Urgent' }
                  ].map(o => (
                    <label key={o.val} style={{
                      flex: 1, padding: '10px 14px', borderRadius: 7, cursor: 'pointer', textAlign: 'center',
                      border: urgency === o.val ? '2px solid var(--brand-light)' : '2px solid var(--border)',
                      background: urgency === o.val ? '#eff6ff' : '#fff',
                      fontWeight: 600, fontSize: 13, transition: 'all .15s'
                    }}>
                      <input type="radio" name="urgency" value={o.val} checked={urgency === o.val} onChange={() => setUrgency(o.val)} style={{ display:'none' }} />
                      {o.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:8 }}>Notify me when resolved?</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { val: true,  label: '✅ Yes please' },
                    { val: false, label: 'No thanks' }
                  ].map(o => (
                    <label key={String(o.val)} style={{
                      flex: 1, padding: '10px 14px', borderRadius: 7, cursor: 'pointer', textAlign: 'center',
                      border: notify === o.val ? '2px solid var(--brand-light)' : '2px solid var(--border)',
                      background: notify === o.val ? '#eff6ff' : '#fff',
                      fontWeight: 600, fontSize: 13, transition: 'all .15s'
                    }}>
                      <input type="radio" name="notify" checked={notify === o.val} onChange={() => setNotify(o.val)} style={{ display:'none' }} />
                      {o.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
              <button type="submit" disabled={loading} style={{
                padding: '12px 36px', background: 'var(--brand)', color: '#fff',
                fontWeight: 700, fontSize: 15, borderRadius: 7, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
              }}>
                {loading ? 'Submitting…' : 'Submit Ticket'}
              </button>
              <button type="button" onClick={() => navigate('/my-tickets')} style={{
                padding: '12px 24px', background: '#fff', color: 'var(--text-muted)',
                fontWeight: 600, fontSize: 14, borderRadius: 7, border: '1.5px solid var(--border)', cursor: 'pointer'
              }}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}
