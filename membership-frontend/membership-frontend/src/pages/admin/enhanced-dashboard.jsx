import { useEffect, useState, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";
import MainLayout from "../../components/mainlayout";

export default function EnhancedAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [smartNotifications, setSmartNotifications] = useState([]);
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState({ firstName: "Admin", lastName: "" });
  const [showAllActivities, setShowAllActivities] = useState(false);

  // Fetch dashboard overview data
  useEffect(() => {
    fetch("http://localhost:5000/api/admin/dashboard", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setDashboardData(data.stats);
        setActivities(data.recentActivities);
        setSmartNotifications(data.smartNotifications || []);
        setUser(data.adminUser || { firstName: "Admin", lastName: "" });
      })
      .catch(() => {
        setDashboardData({
          activeMembers: 'Coming Soon',
          inactiveMembers: 'Coming Soon'
        });
        setActivities([]);
        setSmartNotifications([]);
        setUser({ firstName: "Admin", lastName: "Demo" });
      });
  }, []);

  // Fetch detailed stats
  const fetchStats = useCallback(async () => {
    try {
      const query = new URLSearchParams({
        startDate,
        endDate,
        category,
      }).toString();

      const res = await fetch(`http://localhost:5000/api/admin/stats?${query}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (!data.total) {
        setStats({
          total: 0,
          growth: 0,
          breakdown: { active: 0, inactive: 0, deceased: 0 },
          yearly: {},
        });
      } else {
        setStats(data);
      }

      setError("");
    } catch {
      setError("Failed to fetch stats");
    }
  }, [startDate, endDate, category]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Chart colors following membership app patterns
  const COLORS = ['#14b8a6', '#dc2626', '#f59e0b', '#3b82f6'];

  const prepareChartData = () => {
    if (!stats?.breakdown) return [];
    return [
      { name: 'Active', value: stats.breakdown.active },
      { name: 'Inactive', value: stats.breakdown.inactive },
      { name: 'Deceased', value: stats.breakdown.deceased }
    ].filter(item => item.value > 0);
  };

  const prepareYearlyData = () => {
    if (!stats?.yearly) return [];
    return Object.entries(stats.yearly).map(([year, count]) => ({
      year: parseInt(year),
      members: count
    })).sort((a, b) => a.year - b.year);
  };

  const activitiesToShow = showAllActivities ? activities : activities.slice(0, 3);

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
                background: '#14b8a6',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Administrator
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '32px' }}>
              {error}
            </div>
          )}

          <div className="dashboard-grid">
            {/* Member Summary */}
            <div className="dashboard-card">
              <h2 className="dashboard-card-title">📊 Member Summary</h2>
              <div>
                <div className="dashboard-stat">
                  <span className="dashboard-stat-label">Active Memberships</span>
                  <span className="dashboard-stat-value positive">
                    {dashboardData?.activeMembers || 0}
                  </span>
                </div>
                <div className="dashboard-stat">
                  <span className="dashboard-stat-label">Non-Active Memberships</span>
                  <span className="dashboard-stat-value negative">
                    {dashboardData?.inactiveMembers || 0}
                  </span>
                </div>
                <div className="dashboard-stat">
                  <span className="dashboard-stat-label">Active Users</span>
                  <span className="dashboard-stat-value positive">
                    {dashboardData?.activeUsers || 0}
                  </span>
                </div>
                <div className="dashboard-stat">
                  <span className="dashboard-stat-label">Growth Rate</span>
                  <span className="dashboard-stat-value positive">
                    {stats?.growth || 0}%
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
                    <div style={{ 
                      maxHeight: showAllActivities ? '400px' : 'auto', 
                      overflowY: showAllActivities ? 'auto' : 'visible',
                      paddingRight: showAllActivities ? '8px' : '0'
                    }}>
                      {activitiesToShow.map((item, i) => (
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
                    </div>
                    
                    {activities.length > 3 && (
                      <button
                        onClick={() => setShowAllActivities(!showAllActivities)}
                        style={{
                          background: 'none',
                          border: '1px solid #14b8a6',
                          color: '#14b8a6',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = '#14b8a6';
                          e.target.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = 'none';
                          e.target.style.color = '#14b8a6';
                        }}
                      >
                        {showAllActivities ? 'Show Less' : `View All (${activities.length})`}
                      </button>
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
                <Link
                  to="/admin/import"
                  className="btn-primary"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>📊</span>
                  IMPORT MEMBERS
                </Link>
                <Link
                  to="/admin/approvals"
                  className="btn-primary"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>✅</span>
                  USER APPROVALS
                </Link>
              </div>
            </div>

            {/* Analytics Filters */}
            <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
              <h2 className="dashboard-card-title">📈 Analytics & Reports</h2>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">All Categories</option>
                      <option value="1">Active</option>
                      <option value="2">Inactive</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'end' }}>
                    <button
                      onClick={fetchStats}
                      className="btn-primary"
                      style={{ width: '100%' }}
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                {/* Membership Breakdown Pie Chart */}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
                    Membership Breakdown
                  </h3>
                  {stats && prepareChartData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={prepareChartData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {prepareChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '300px', 
                      color: '#9ca3af',
                      fontSize: '14px'
                    }}>
                      No data available
                    </div>
                  )}
                </div>

                {/* Yearly Growth Line Chart */}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
                    Yearly Membership Growth
                  </h3>
                  {stats && prepareYearlyData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={prepareYearlyData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="members" stroke="#14b8a6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '300px', 
                      color: '#9ca3af',
                      fontSize: '14px'
                    }}>
                      No data available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Smart Notifications */}
            <div className="dashboard-card">
              <h2 className="dashboard-card-title">� Smart Notifications</h2>
              <div>
                {smartNotifications.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '32px', 
                    color: '#94a3b8',
                    fontSize: '14px'
                  }}>
                    All systems running smoothly
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {smartNotifications.map((notification, i) => (
                      <div key={i} style={{ 
                        padding: '12px',
                        background: notification.type === 'warning' ? '#fef3cd' : 
                                  notification.type === 'success' ? '#d1e7dd' : '#f8fafc',
                        borderRadius: '8px',
                        border: `1px solid ${notification.type === 'warning' ? '#ffc107' : 
                                                notification.type === 'success' ? '#198754' : '#e2e8f0'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>{notification.icon}</span>
                          <span style={{ 
                            fontSize: '14px', 
                            color: notification.type === 'warning' ? '#856404' : 
                                  notification.type === 'success' ? '#0f5132' : '#334155',
                            fontWeight: '500'
                          }}>
                            {notification.message}
                          </span>
                        </div>
                        {notification.action && (
                          <Link
                            to={notification.action}
                            style={{
                              background: notification.type === 'warning' ? '#ffc107' : 
                                        notification.type === 'success' ? '#198754' : '#14b8a6',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              textDecoration: 'none',
                              transition: 'opacity 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.opacity = '0.8'}
                            onMouseOut={(e) => e.target.style.opacity = '1'}
                          >
                            {notification.actionText}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
