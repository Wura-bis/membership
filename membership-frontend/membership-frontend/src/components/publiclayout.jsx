import { Link } from "react-router-dom";

export default function PublicLayout({ children }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)'
    }}>
      {/* Public Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 24px',
        boxShadow: '0 1px 10px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px',
              fontWeight: '700'
            }}>
              B
            </div>
            <div>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                color: '#14b8a6',
                margin: 0,
                lineHeight: 1 
              }}>
                BIS Membership
              </h1>
              <p style={{ 
                fontSize: '12px', 
                color: '#64748b', 
                margin: 0,
                lineHeight: 1 
              }}>
                Public Portal
              </p>
            </div>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link 
              to="/public" 
              style={{
                color: '#64748b',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '14px',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f8fafc';
                e.target.style.color = '#14b8a6';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#64748b';
              }}
            >
              🏠 Home
            </Link>
            <Link
              to="/members/historical"
              style={{
                color: '#64748b',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '14px',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f8fafc';
                e.target.style.color = '#14b8a6';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#64748b';
              }}
            >
              📚 Directory
            </Link>
            <div style={{ 
              width: '1px', 
              height: '24px', 
              background: '#e2e8f0',
              margin: '0 8px' 
            }}></div>
            <Link 
              to="/login" 
              className="btn-primary"
              style={{
                textDecoration: 'none',
                fontSize: '14px',
                padding: '10px 20px'
              }}
            >
              🔐 Member Login
            </Link>
            <Link 
              to="/signup" 
              style={{
                color: '#14b8a6',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '2px solid #14b8a6',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#14b8a6';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#14b8a6';
              }}
            >
              📝 Sign Up
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* Public Footer */}
      <footer style={{
        background: 'white',
        borderTop: '1px solid #e2e8f0',
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
              fontSize: '12px', 
              color: '#94a3b8',
              margin: 0 
            }}>
              © 2024 BIS Membership System. All rights reserved.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Link 
              to="/login" 
              style={{ 
                fontSize: '12px', 
                color: '#64748b',
                textDecoration: 'none'
              }}
            >
              Privacy Policy
            </Link>
            <Link 
              to="/login" 
              style={{ 
                fontSize: '12px', 
                color: '#64748b',
                textDecoration: 'none'
              }}
            >
              Terms of Service
            </Link>
            <Link 
              to="/login" 
              style={{ 
                fontSize: '12px', 
                color: '#64748b',
                textDecoration: 'none'
              }}
            >
              Contact Us
            </Link>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Powered by React & Flask
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
