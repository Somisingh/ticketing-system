import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [newPw, setNewPw]       = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (newPw !== confirm) return setError('Passwords do not match.')
    if (newPw.length < 8)  return setError('Password must be at least 8 characters.')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: newPw })
      })
      if (res.ok) { setSuccess(true); setTimeout(() => navigate('/login'), 2500) }
      else { const t = await res.text(); setError(t || 'Failed to reset password.') }
    } catch { setError('Server error.') }
    finally { setLoading(false) }
  }

  const fieldStyle = { width:'100%', padding:'10px 12px', borderRadius:7, border:'1.5px solid var(--border)', fontSize:14, outline:'none' }

  return (
    <div style={{ minHeight:'100vh', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'var(--card)', borderRadius:12, padding:'40px 48px', width:'100%', maxWidth:420, boxShadow:'0 4px 24px rgba(0,0,0,0.08)', border:'1px solid var(--border)' }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'var(--brand)', marginBottom:6 }}>Reset Password</h1>
        <p style={{ color:'var(--text-muted)', fontSize:14, marginBottom:24 }}>Enter your email and a new password.</p>

        {success && <div style={{ background:'#d1fae5', border:'1px solid #6ee7b7', borderRadius:6, padding:'12px 14px', marginBottom:16, color:'#065f46' }}>Password reset! Redirecting to login…</div>}
        {error   && <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:6, padding:'10px 14px', marginBottom:16, color:'#991b1b', fontSize:14 }}>{error}</div>}

        {!success && (
          <form onSubmit={handleSubmit}>
            {[
              { label:'Email', type:'email', val:email, set:setEmail },
              { label:'New Password', type:'password', val:newPw, set:setNewPw, ph:'Min 8 characters' },
              { label:'Confirm Password', type:'password', val:confirm, set:setConfirm, ph:'Repeat password' },
            ].map((f,i) => (
              <div key={i} style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:6 }}>{f.label}</label>
                <input type={f.type} required value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={fieldStyle} />
              </div>
            ))}
            <button type="submit" disabled={loading} style={{ width:'100%', padding:'11px', background:'var(--brand)', color:'#fff', fontWeight:700, fontSize:15, borderRadius:7, border:'none', cursor:'pointer', opacity:loading?0.7:1 }}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        )}
        <p style={{ textAlign:'center', marginTop:16, fontSize:13, color:'var(--text-muted)' }}>
          <Link to="/login" style={{ color:'var(--brand-light)', textDecoration:'none' }}>Back to Sign in</Link>
        </p>
      </div>
    </div>
  )
}
