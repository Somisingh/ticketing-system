import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (res.ok) {
        const data = await res.json()
        login(data)
        navigate(data.isITTeam ? '/it-dashboard' : '/my-tickets')
      } else {
        const msg = await res.text()
        setError(msg || 'Invalid credentials.')
      }
    } catch { setError('Server error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--surface)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'var(--card)', borderRadius: 12, padding: '40px 48px',
        width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 36 }}>🎫</span>
          <h1 style={{ margin: '8px 0 4px', fontSize: 24, fontWeight: 700, color: 'var(--brand)' }}>
             Help Desk
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>Sign in to your account</p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6,
            padding: '10px 14px', marginBottom: 20, color: '#991b1b', fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {[
            { label: 'Email', id: 'email', type: 'email', val: email, set: setEmail },
            { label: 'Password', id: 'pass', type: 'password', val: password, set: setPassword }
          ].map(f => (
            <div key={f.id} style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600,
                marginBottom: 6, color: 'var(--text-main)' }}>{f.label}</label>
              <input
                type={f.type} required value={f.val}
                onChange={ev => f.set(ev.target.value)}
                placeholder={f.type === 'email' ? '' : '••••••••'}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 7,
                  border: '1.5px solid var(--border)', fontSize: 14,
                  outline: 'none', transition: 'border-color .2s'
                }}
              />
            </div>
          ))}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '11px', background: 'var(--brand)',
            color: '#fff', fontWeight: 700, fontSize: 15, borderRadius: 7,
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, marginTop: 4
          }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          <Link to="/forgot-password" style={{ color: 'var(--brand-light)', textDecoration: 'none' }}>
            Forgot password?
          </Link>
          {' · '}
          <Link to="/register" style={{ color: 'var(--brand-light)', textDecoration: 'none' }}>
            Create account
          </Link>
        </div>
      </div>
    </div>
  )
}
