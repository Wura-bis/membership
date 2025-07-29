import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../components/mainlayout";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState("");
  const [user, setUser] = useState({ firstName: "Admin", lastName: "" });

  useEffect(() => {
    // Fetch dashboard stats and recent activities
    fetch("http://localhost:5000/api/admin/dashboard", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setActivities(data.recentActivities);
        setUser(data.adminUser || { firstName: "Admin", lastName: "" });
      })
      .catch(() => {
        // Use mock data when backend is unavailable
        setStats({
          activeMembers: 'Coming Soon',
          inactiveMembers: 'Coming Soon'
        });
        setActivities([
          { name: 'Demo User', date: new Date().toISOString().split('T')[0] }
        ]);
        setUser({ firstName: "Admin", lastName: "Demo" });
      });
  }, []);

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Welcome Section */}
          <div className="dashboard-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 className="dashboard-title">
                  Welcome back, {user.firstName} {user.lastName}! 👋
                </h1>
                <p className="dashboard-subtitle">
                  Here's what's happening with your membership system today.
                </p>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                boxShadow: '0 4px 14px rgba(20, 184, 166, 0.25)'
              }}>
                ADMINISTRATOR
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '32px' }}>
              {error}
            </div>
          )}

          {/* Dashboard Cards */}
          <div className="dashboard-grid">
            {/* Member Summary */}
            <div className="dashboard-card">
              <h2 className="dashboard-card-title">📊 Member Summary</h2>
              <div>
                <div className="dashboard-stat">
                  <span className="dashboard-stat-label">Active Memberships</span>
                  <span className="dashboard-stat-value positive">
                    {stats?.activeMembers ?? "—"}
                  </span>
                </div>
                <div className="dashboard-stat">
                  <span className="dashboard-stat-label">Non-Active Memberships</span>
                  <span className="dashboard-stat-value negative">
                    {stats?.inactiveMembers ?? "—"}
                  </span>
                </div>
                <Link to="/members" className="btn-primary" style={{ width: '100%', marginTop: '16px', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                  VIEW ALL MEMBERS
                </Link>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="dashboard-card">
              <h2 className="dashboard-card-title">🔔 Recent Activities</h2>
              <div>
                {activities.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '32px', 
                    color: '#94a3b8',
                    fontSize: '14px'
                  }}>
                    No recent activity
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>
                      Latest Signup:
                    </div>
                    {activities.slice(0, 1).map((item, i) => (
                      <div key={i} style={{ 
                        padding: '12px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>on {item.date}</div>
                      </div>
                    ))}
                    
                    {activities.length > 1 && (
                      <>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: '#64748b',
                          marginTop: '8px'
                        }}>
                          Recent Signups:
                        </div>
                        {activities.slice(1, 3).map((item, i) => (
                          <div key={i} style={{ 
                            padding: '8px 12px',
                            background: '#f8fafc',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}>
                            <div style={{ fontWeight: '500', color: '#0f172a' }}>{item.name}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>on {item.date}</div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-card">
              <h2 className="dashboard-card-title">⚡ Quick Actions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link
                  to="/members/new"
                  className="btn-primary"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>👤</span>
                  ADD NEW MEMBER
                </Link>
                <button
                  onClick={() => window.open('http://localhost:5000/api/export/members/csv', '_blank')}
                  className="btn-primary"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    border: 'none'
                  }}
                >
                  <span>📄</span>
                  EXPORT MEMBERS
                </button>
                <Link
                  to="/members"
                  className="btn-primary"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>✏️</span>
                  VIEW MEMBERS
                </Link>
              </div>
            </div>
          </div>

          {/* Announcements/Notifications */}
          <div className="dashboard-card">
            <h2 className="dashboard-card-title">📢 Announcements & Notifications</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: '#14b8a6',
                  borderRadius: '50%',
                  marginTop: '6px',
                  flexShrink: 0
                }}></div>
                <p style={{ color: '#334155', fontSize: '14px', lineHeight: '1.5' }}>
                  Can now update the "active" status in the member view directly.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: '#14b8a6',
                  borderRadius: '50%',
                  marginTop: '6px',
                  flexShrink: 0
                }}></div>
                <p style={{ color: '#334155', fontSize: '14px', lineHeight: '1.5' }}>
                  Support requests and login issues now visible in admin settings.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: '#14b8a6',
                  borderRadius: '50%',
                  marginTop: '6px',
                  flexShrink: 0
                }}></div>
                <p style={{ color: '#334155', fontSize: '14px', lineHeight: '1.5' }}>
                  Don't forget to review pending user approvals this week.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
