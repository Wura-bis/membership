// Enhanced Loading Components
export function LoadingSpinner({ size = 'medium', message = 'Loading...' }) {
  const sizes = {
    small: '24px',
    medium: '40px',
    large: '60px'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '32px'
    }}>
      <div 
        className="spinner"
        style={{
          width: sizes[size],
          height: sizes[size],
          border: '3px solid #e2e8f0',
          borderTop: '3px solid #14b8a6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      <p style={{
        color: '#64748b',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        {message}
      </p>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={colIndex} 
              className="skeleton-cell"
              style={{
                height: '20px',
                backgroundColor: '#e2e8f0',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="skeleton-card" style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      <div style={{
        height: '24px',
        backgroundColor: '#e2e8f0',
        borderRadius: '4px',
        marginBottom: '16px',
        animation: 'pulse 1.5s ease-in-out infinite'
      }} />
      <div style={{
        height: '16px',
        backgroundColor: '#f1f5f9',
        borderRadius: '4px',
        marginBottom: '12px',
        animation: 'pulse 1.5s ease-in-out infinite'
      }} />
      <div style={{
        height: '16px',
        backgroundColor: '#f1f5f9',
        borderRadius: '4px',
        width: '70%',
        animation: 'pulse 1.5s ease-in-out infinite'
      }} />
    </div>
  );
}
