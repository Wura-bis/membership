import { useAuth } from "../../hooks/useauth";
import MainLayout from "../../components/mainlayout";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function PrivateDashboard() {
  const { user } = useAuth();
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState("");
  const [backendStatus, setBackendStatus] = useState("checking");
  const [memberStats, setMemberStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    newThisMonth: 0
  });

  // Check backend connection status
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/health", {
          credentials: "include",
        });
        setBackendStatus(res.ok ? "connected" : "disconnected");
      } catch (err) {
        setBackendStatus("disconnected");
      }
    };
    checkBackend();
  }, []);

  // Load member statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/dashboard-stats", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setMemberStats(data);
        }
      } catch (err) {
        console.log("Could not load stats:", err.message);
      }
    };
    loadStats();
  }, []);

  const handleRequestPrivate = async () => {
    setRequesting(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/request-private-access", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to request private access");
      setRequested(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <MainLayout>
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #e6fffa 50%, #f0fdfa 100%)',
        padding: '32px 24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#134e4a',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              Welcome back, {user?.firstName || user?.username || "private"}! 👋
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#64748b',
              margin: '0'
            }}>
              Access member resources, view directory, and manage your profile
            </p>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              {error}
            </div>
          )}

          {/* Request Private Access for Public Users */}
          {user?.role === "public" && (
            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🔒 Private Access
              </h2>
              {requested ? (
                <div style={{ 
                  padding: '16px', 
                  background: '#dcfce7', 
                  color: '#166534', 
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0'
                }}>
                  ✅ Your request for private access has been submitted and is pending approval.
                </div>
              ) : (
                <div>
                  <p style={{ marginBottom: '16px', color: '#64748b' }}>
                    Request access to private member features and resources.
                  </p>
                  <button
                    style={{
                      background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: requesting ? 'not-allowed' : 'pointer',
                      opacity: requesting ? 0.7 : 1
                    }}
                    onClick={handleRequestPrivate}
                    disabled={requesting}
                  >
                    {requesting ? "Requesting..." : "Request Private Access"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Overview Card */}
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📊 Quick Overview
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '20px'
            }}>
              <Link to="/members" style={{ textDecoration: 'none' }}>
                <div style={{ 
                  textAlign: 'center',
                  padding: '16px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.15)';
                  e.target.style.borderColor = '#14b8a6';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.borderColor = '#e2e8f0';
                }}
                >
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#64748b', 
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: '500'
                  }}>
                    Member Directory
                  </div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: '#059669',
                    marginBottom: '4px'
                  }}>
                    Available
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#64748b'
                  }}>
                    {memberStats.totalMembers} total members
                  </div>
                </div>
              </Link>

              <Link to="/recognitions" style={{ textDecoration: 'none' }}>
                <div style={{ 
                  textAlign: 'center',
                  padding: '16px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.15)';
                  e.target.style.borderColor = '#14b8a6';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.borderColor = '#e2e8f0';
                }}
                >
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#64748b', 
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: '500'
                  }}>
                    Recognitions
                  </div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: '#1e293b',
                    marginBottom: '4px'
                  }}>
                    Browse
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#64748b'
                }}>
                  Awards & achievements
                </div>
              </div>
            </Link>

            <Link to="/support" style={{ textDecoration: 'none' }}>
              <div style={{ 
                textAlign: 'center',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.15)';
                e.target.style.borderColor = '#14b8a6';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
                e.target.style.borderColor = '#e2e8f0';
              }}
              >
                <div style={{ 
                  fontSize: '12px', 
                  color: '#64748b', 
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: '500'
                }}>
                  Support
                </div>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: '700', 
                  color: '#1e293b',
                  marginBottom: '4px'
                }}>
                  24/7
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#64748b'
                }}>
                  Always available
                </div>
              </div>
            </Link>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚡ Quick Actions
            </h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              <Link 
                to="/members" 
                style={{
                  background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                  color: 'white',
                  padding: '18px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: '0 2px 4px rgba(20, 184, 166, 0.2)',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(20, 184, 166, 0.2)';
                }}
              >
                📋 View Member Directory
              </Link>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '12px' 
              }}>
                <Link 
                  to="/my-profile" 
                  style={{
                    background: 'white',
                    color: '#1e293b',
                    border: '1px solid #e2e8f0',
                    padding: '16px 20px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '15px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f8fafc';
                    e.target.style.borderColor = '#14b8a6';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  👤 Edit My Profile
                </Link>

                {user?.role === "private" && (
                  <>
                    <Link 
                      to="/recognitions" 
                      style={{
                        background: 'white',
                        color: '#1e293b',
                        border: '1px solid #e2e8f0',
                        padding: '16px 20px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '15px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#f8fafc';
                        e.target.style.borderColor = '#14b8a6';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      🏆 View Recognitions
                    </Link>
                    
                    <Link 
                      to="/support" 
                      style={{
                        background: 'white',
                        color: '#1e293b',
                        border: '1px solid #e2e8f0',
                        padding: '16px 20px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '15px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#f8fafc';
                        e.target.style.borderColor = '#14b8a6';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      🎧 Get Support
                    </Link>
                  </>
                )}
              </div>
              
              {/* Data Export Actions */}
              <div style={{ 
                marginTop: '20px',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '20px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📊 Export Data
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '12px' 
                }}>
                  <button
                    onClick={() => window.open('http://localhost:5000/api/export/members/csv', '_blank')}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    📊 Export CSV
                  </button>
                  
                  <button
                    onClick={() => window.open('http://localhost:5000/api/export/members/pdf', '_blank')}
                    style={{
                      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    📄 Export PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Backend Status */}
          <div style={{ 
            position: 'fixed', 
            bottom: '24px', 
            right: '24px',
            zIndex: 1000
          }}>
            <div style={{
              background: backendStatus === "connected" ? '#14b8a6' : '#ef4444',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'white',
                animation: backendStatus === "connected" ? 'pulse 2s infinite' : 'none'
              }}></div>
              Backend: {backendStatus === "connected" ? "Connected" : "Disconnected"}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </MainLayout>
  );
} 