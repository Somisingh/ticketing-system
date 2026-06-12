import { Link } from 'react-router-dom'

export default function Landing() {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 60%, #1a4a8a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 32, padding: 24
        }}>
            <div style={{ textAlign: 'center', color: '#fff' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎫</div>
                <h1 style={{ fontSize: 40, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
                     Help Desk
                </h1>
                <p style={{ fontSize: 17, opacity: 0.75, marginTop: 12, fontWeight: 400 }}>
                    Submit IT support tickets · Track resolutions · Stay informed
                </p>
            </div>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link to="/login" style={{
                    background: '#fff', color: 'var(--brand)', fontWeight: 700,
                    padding: '14px 40px', borderRadius: 8, textDecoration: 'none', fontSize: 15,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                }}>
                    Sign In
                </Link>
                <Link to="/register" style={{
                    background: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 700,
                    padding: '14px 40px', borderRadius: 8, textDecoration: 'none', fontSize: 15,
                    border: '2px solid rgba(255,255,255,0.4)'
                }}>
                    Register
                </Link>
                <Link to="/demo" style={{
                    background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', fontWeight: 600,
                    padding: '14px 40px', borderRadius: 8, textDecoration: 'none', fontSize: 15,
                    border: '2px solid rgba(255,255,255,0.2)',
                    display: 'inline-flex', alignItems: 'center', gap: 8
                }}>
                    ▶ Watch Demo
                </Link>
            </div>
        </div>
    )
}