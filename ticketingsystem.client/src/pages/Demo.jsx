import { Link } from 'react-router-dom'

export default function Demo() {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 60%, #1a4a8a 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '40px 24px'
        }}>
            {/* Header */}
            <div style={{ width: '100%', maxWidth: 900, marginBottom: 32 }}>
                <Link to="/" style={{
                    color: 'rgba(255,255,255,0.75)', textDecoration: 'none',
                    fontSize: 18, display: 'inline-flex', alignItems: 'center', gap: 6
                }}>
                    ← Back to Home
                </Link>
                <h1 style={{
                    color: '#fff', fontSize: 32, fontWeight: 800,
                    margin: '12px 0 6px', letterSpacing: '-0.5px'
                }}>
                    🎫  Help Desk
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, margin: 0 }}>
                    Watch the demo to see how the ticketing system works
                </p>
            </div>

            {/* Video player card */}
            <div style={{
                width: '100%', maxWidth: 1000,
                background: 'rgba(0,0,0,0.35)',
                borderRadius: 14,
                overflow: 'hidden',
                boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <video
                    controls
                    autoPlay={true}
                    style={{ width: '100%', display: 'block', maxHeight: 540 }}
                    poster=""
                >
                    
                    Your browser does not support the video tag.
                </video>
            </div>

            {/* CTA below video */}
            <div style={{ marginTop: 32, display: 'flex', gap: 14 }}>
                <Link to="/register" style={{
                    background: '#fff', color: 'var(--brand)', fontWeight: 700,
                    padding: '12px 32px', borderRadius: 8, textDecoration: 'none', fontSize: 14,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                }}>
                    Get Started →
                </Link>
                <Link to="/login" style={{
                    background: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 700,
                    padding: '12px 32px', borderRadius: 8, textDecoration: 'none', fontSize: 14,
                    border: '2px solid rgba(255,255,255,0.35)'
                }}>
                    Sign In
                </Link>
            </div>
        </div>
    )
}