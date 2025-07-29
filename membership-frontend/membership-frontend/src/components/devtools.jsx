import { useState, useEffect } from 'react';
import { testApiConnection, API_BASE_URL } from '../utils/api';

export default function DevTools() {
  const [isConnected, setIsConnected] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Initial check after a short delay to avoid immediate errors
    const initialTimeout = setTimeout(checkConnection, 1000);
    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const connected = await testApiConnection();
      setIsConnected(connected);
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  // Only show in development
  if (import.meta.env.MODE === 'production') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      background: isConnected ? '#10b981' : '#dc2626',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      minWidth: '200px'
    }}
    onClick={() => setShowDetails(!showDetails)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'white',
          animation: isChecking ? 'pulse 1s infinite' : 'none'
        }}></div>
        <span>
          {isChecking ? 'Backend: Checking...' : isConnected ? 'Backend: Connected' : 'Backend: Disconnected'}
        </span>
      </div>
      {showDetails && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          fontSize: '11px',
          lineHeight: '1.4'
        }}>
          <div><strong>API URL:</strong> {API_BASE_URL}</div>
          <div><strong>Status:</strong> {isConnected ? '✅ Online' : '❌ Offline'}</div>
          <div><strong>Frontend:</strong> {window.location.origin}</div>
          {!isConnected && (
            <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>🔧 Troubleshooting:</div>
              <div>1. Start the backend server:</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', margin: '2px 0' }}>
                cd membership-backend && python app.py
              </div>
              <div>2. Check if port 5000 is available</div>
              <div>3. Verify CORS settings</div>
              <div style={{ marginTop: '4px' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); checkConnection(); }}
                  style={{
                    background: 'white',
                    color: '#dc2626',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Retry Connection
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
