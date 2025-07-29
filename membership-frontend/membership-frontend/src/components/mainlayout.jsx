import Sidebar from "./sidebar";
import Navbar from "./navbar";
import { useEffect, useState } from 'react';

function DarkModeToggle() {
  const [dark, setDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches || document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      style={{
        marginLeft: '16px',
        padding: '8px',
        borderRadius: '50%',
        background: '#f1f5f9',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      onMouseEnter={(e) => e.target.style.background = '#e2e8f0'}
      onMouseLeave={(e) => e.target.style.background = '#f1f5f9'}
    >
      {dark ? (
        <svg style={{ width: '20px', height: '20px', color: '#eab308' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-8.66l-.71.71M4.05 19.07l-.71.71M21 12h-1M4 12H3m16.95 7.07l-.71-.71M6.34 6.34l-.71-.71" />
        </svg>
      ) : (
        <svg style={{ width: '20px', height: '20px', color: '#64748b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
        </svg>
      )}
    </button>
  );
}

export default function MainLayout({ children }) {
  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)'
    }}>
      <Sidebar />
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Navbar />
        <main style={{ 
          flex: 1,
          overflowY: 'auto',
          background: 'transparent'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
