import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../components/mainlayout";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState("");
  const [user, setUser] = useState({ firstName: "Admin", lastName: "" });
  // Filter state
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    category: ""
  });

  useEffect(() => {
    // Fetch dashboard stats and recent activities
    // Build query string for filters
    const params = [];
    if (filters.startDate) params.push(`startDate=${encodeURIComponent(filters.startDate)}`);
    if (filters.endDate) params.push(`endDate=${encodeURIComponent(filters.endDate)}`);
    if (filters.category) params.push(`category=${encodeURIComponent(filters.category)}`);
    const query = params.length ? `?${params.join("&")}` : "";
    fetch(`http://localhost:5000/api/stats${query}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        // Optionally fetch activities if needed
      })
      .catch(() => {
        setStats({
          activeMembers: 'Coming Soon',
          inactiveMembers: 'Coming Soon'
        });
      });
    // Activities fetch (unchanged)
    fetch("http://localhost:5000/api/admin/dashboard", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setActivities(data.recentActivities);
        setUser(data.adminUser || { firstName: "Admin", lastName: "" });
      })
      .catch(() => {
        setActivities([
          { name: 'Demo User', date: new Date().toISOString().split('T')[0] }
        ]);
        setUser({ firstName: "Admin", lastName: "Demo" });
      });
  }, [filters]);

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

          {/* Analytics & Reports Filters */}
          <div className="dashboard-card" style={{ marginBottom: '24px', marginTop: '24px', padding: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(20,184,166,0.06)', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#14b8a6', marginBottom: '16px' }}>Analytics & Reports</h2>
            <form
              style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}
              onSubmit={e => { e.preventDefault(); setFilters(filters); }}
              aria-label="Analytics Filters"
            >
              <div>
                <label htmlFor="startDate">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
                  style={{ marginRight: '8px' }}
                />
              </div>
              <div>
                <label htmlFor="endDate">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.endDate}
                  onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
                  style={{ marginRight: '8px' }}
                />
              </div>
              <div>
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={filters.category}
                  onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
                  style={{ marginRight: '8px' }}
                >
                  <option value="">All Categories</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Deceased">Deceased</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{ minWidth: '140px' }}>Apply Filters</button>
              <button
                type="button"
                className="btn-secondary"
                style={{ minWidth: '120px', background: '#f1f5f9', color: '#0f766e', border: '1px solid #14b8a6', fontWeight: '600', marginLeft: '8px' }}
                onClick={() => setFilters({ startDate: '', endDate: '', category: '' })}
              >
                Reset Filters
              </button>
            </form>
          </div>
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

            {/* Membership Breakdown Pie Chart */}
            <div className="dashboard-card">
              <h2 className="dashboard-card-title">Membership Breakdown</h2>
              {stats && stats.breakdown && Object.values(stats.breakdown).reduce((a, b) => a + b, 0) > 0 ? (
                // ...existing pie chart code...
                <div>{/* Pie chart component here */}</div>
              ) : (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '32px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '16px',
                  margin: '16px 0'
                }}>
                  <span role="img" aria-label="No data">📉</span> No data available for the selected filters.
                </div>
              )}
            </div>

            {/* Yearly Membership Growth */}
            <div className="dashboard-card">
              <h2 className="dashboard-card-title">Yearly Membership Growth</h2>
              {stats && stats.yearly && Object.values(stats.yearly).reduce((a, b) => a + b, 0) > 0 ? (
                // ...existing growth graph code...
                <div>{/* Growth graph component here */}</div>
              ) : (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '32px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '16px',
                  margin: '16px 0'
                }}>
                  <span role="img" aria-label="No data">📉</span> No data available for the selected filters.
                </div>
              )}
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
                    {activities.slice(0, 5).map((item, i) => (
                      <div key={i} style={{ 
                        padding: '12px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          marginBottom: '4px'
                        }}>
                          <div style={{ fontWeight: '600', color: '#0f172a' }}>
                            {item.type === 'member_added' ? '👤' : '🔑'} {item.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {item.date}
                          </div>
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                          {item.description || (item.type === 'member_added' ? 'New member added' : 'User registered')}
                        </div>
                      </div>
                    ))}
                    
                    {activities.length > 5 && (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '8px',
                        fontSize: '12px',
                        color: '#64748b'
                      }}>
                        And {activities.length - 5} more activities...
                      </div>
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
