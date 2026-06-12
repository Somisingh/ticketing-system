import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const DEPARTMENTS = ['Admin',  'Design',  'Finance',  'Project Management',  'Sales', 'Service', 'Manufacturing','Other']

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm]     = useState({ fullName:'', email:'', password:'', passwordConfirm:'', department:'' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

 // const emailValid = !form.email || form.email.toLowerCase().endsWith('@co.nz')
  const pwValid    = !form.password || /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(form.password)

  const handleSubmit = async (e) => {
      e.preventDefault(); setError('')
      // Full name validation
      if (!form.fullName.trim()) {
          return setError('Full Name is required.')
      }
 //   if (!emailValid) return setError('Email must end with @co.nz')
    if (!pwValid)    return setError('Password must be 8+ chars with upper, lower, number, special char.')
    if (form.password !== form.passwordConfirm) return setError('Passwords do not match.')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: form.fullName, email: form.email, password: form.password, department: form.department })
      })
      if (res.ok) { navigate('/login') }
      else { const t = await res.text(); setError(t || 'Registration failed.') }
    } catch { setError('Server error.') }
    finally { setLoading(false) }
  }

  const fieldStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 7,
    border: '1.5px solid var(--border)', fontSize: 14, outline: 'none'
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{
        background:'var(--card)', borderRadius:12, padding:'40px 48px',
        width:'100%', maxWidth:440, boxShadow:'0 4px 24px rgba(0,0,0,0.08)', border:'1px solid var(--border)'
      }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <span style={{ fontSize:36 }}>🎫</span>
          <h1 style={{ margin:'8px 0 4px', fontSize:22, fontWeight:700, color:'var(--brand)' }}>Create Account</h1>
          <p style={{ margin:0, color:'var(--text-muted)', fontSize:14 }}> Help Desk</p>
        </div>

        {error && <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:6, padding:'10px 14px', marginBottom:16, color:'#991b1b', fontSize:14 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:6 }}>Full Name *</label>
            <input type="text" required value={form.fullName} onChange={e=>set('fullName',e.target.value)} placeholder="John Smith" style={fieldStyle} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:6 }}>Email *</label>
            <input type="email" required value={form.email} onChange={e=>set('email',e.target.value)} style={{ ...fieldStyle, borderColor: 'var(--border)' }} />
         
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:6 }}>Department</label>
            <select value={form.department} onChange={e=>set('department',e.target.value)} style={fieldStyle}>
              <option value="">Select department…</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:6 }}>Password *</label>
            <input type="password" required value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Min 8 chars, upper/lower/number/special" style={{ ...fieldStyle, borderColor: !pwValid && form.password ? '#ef4444':'var(--border)' }} />
            {!pwValid && form.password && <p style={{ color:'#dc2626', fontSize:12, marginTop:4 }}>Needs upper, lower, number & special character</p>}
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:6 }}>Confirm Password *</label>
            <input type="password" required value={form.passwordConfirm} onChange={e=>set('passwordConfirm',e.target.value)} style={fieldStyle} />
          </div>
          <button type="submit" disabled={loading} style={{
            width:'100%', padding:'11px', background:'var(--brand)', color:'#fff',
            fontWeight:700, fontSize:15, borderRadius:7, border:'none',
            cursor: loading?'not-allowed':'pointer', opacity: loading?0.7:1
          }}>
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign:'center', marginTop:16, fontSize:13, color:'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'var(--brand-light)', textDecoration:'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
