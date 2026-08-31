import { Link } from "react-router-dom";
import { useState } from "react";
import { T } from '../utils/theme';

export default function PublicLayout({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)'
    }}>
      {/* Public Header */}
      <header style={{
        background: T.white,
        borderBottom: mobileNavOpen ? 'none' : `1px solid ${T.slateBorder}`,
        boxShadow: '0 1px 10px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: `linear-gradient(135deg, ${T.primaryLight} 0%, ${T.primary} 100%)`,
              borderRadius: T.radiusLg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: T.white,
              fontSize: `clamp(${T.fontBase}, 1.8vw, 1.2rem)`,
              fontWeight: '700'
            }}>
              B
            </div>
            <div>
              <h1 style={{
                fontSize: `clamp(${T.fontLg}, 2.2vw, 1.43rem)`,
                fontWeight: '700',
                color: T.primaryLight,
                margin: 0,
                lineHeight: 1
              }}>
                BIS Membership
              </h1>
              <p style={{
                fontSize: T.fontSm,
                color: T.textMuted,
                margin: 0,
                lineHeight: 1
              }}>
                Public Portal
              </p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="public-nav-desktop">
            <Link
              to="/public"
              style={{
                color: T.textMuted,
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: T.fontBase,
                padding: '8px 12px',
                borderRadius: T.radiusMd,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.target.style.background = '#f8fafc'; e.target.style.color = T.primaryLight; }}
              onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = T.textMuted; }}
            >
              🏠 Home
            </Link>
            <Link
              to="/members/historical"
              style={{
                color: T.textMuted,
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: T.fontBase,
                padding: '8px 12px',
                borderRadius: T.radiusMd,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.target.style.background = '#f8fafc'; e.target.style.color = T.primaryLight; }}
              onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = T.textMuted; }}
            >
              📚 Directory
            </Link>
            <div style={{ width: '1px', height: '24px', background: T.slateBorder, margin: '0 8px' }} />
            <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', fontSize: T.fontBase, padding: '10px 20px' }}>
              🔐 Member Login
            </Link>
            <Link
              to="/signup"
              style={{
                color: T.primaryLight,
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: T.fontBase,
                padding: '8px 12px',
                borderRadius: T.radiusMd,
                border: `2px solid ${T.primaryLight}`,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.target.style.background = T.primaryLight; e.target.style.color = T.white; }}
              onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = T.primaryLight; }}
            >
              📝 Sign Up
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="public-nav-mobile-btn"
            onClick={() => setMobileNavOpen(o => !o)}
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown nav */}
        {mobileNavOpen && (
          <nav className="public-nav-mobile-menu" onClick={() => setMobileNavOpen(false)}>
            <Link to="/public">🏠 Home</Link>
            <Link to="/members/historical">📚 Directory</Link>
            <Link to="/login" style={{ fontWeight: '600', color: T.primaryLight }}>🔐 Member Login</Link>
            <Link to="/signup" style={{ fontWeight: '600', color: T.primaryLight }}>📝 Sign Up</Link>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* Public Footer */}
      <footer style={{
        background: T.white,
        borderTop: `1px solid ${T.slateBorder}`,
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px',
          alignItems: 'center'
        }}>
          <div>
            <p style={{
              fontSize: T.fontSm,
              color: T.textLight,
              margin: 0
            }}>
              © 2026 Benevolent Irish Society of PEI
            </p>
            <p style={{
              fontSize: T.fontSm,
              color: T.textLight,
              margin: '4px 0 0 0'
            }}>
              Designed &amp; developed by Wuraola
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Link
              to="/login"
              style={{
                fontSize: T.fontSm,
                color: T.textMuted,
                textDecoration: 'none'
              }}
            >
              Privacy Policy
            </Link>
            <Link
              to="/login"
              style={{
                fontSize: T.fontSm,
                color: T.textMuted,
                textDecoration: 'none'
              }}
            >
              Terms of Service
            </Link>
            <Link
              to="/login"
              style={{
                fontSize: T.fontSm,
                color: T.textMuted,
                textDecoration: 'none'
              }}
            >
              Contact Us
            </Link>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <span style={{ fontSize: T.fontSm, color: T.textLight }}>
              Powered by React & Flask
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
