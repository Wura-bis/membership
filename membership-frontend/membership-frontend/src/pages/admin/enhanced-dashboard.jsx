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
        setDashboardData(data.stats || null);
        setActivities(data.recentActivities || []);
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
          breakdown: { active: 0, inactive: 0, historical: 0, honorary: 0 },
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
      { name: 'Historical', value: stats.breakdown.historical },
      { name: 'Honorary', value: stats.breakdown.honorary }
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
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{
                  fontSize: '38px',
                  fontWeight: '700',
                  color: '#0f766e',
                  marginBottom: '12px'
                }}>
                  Welcome back, {user.firstName} {user.lastName}! 👋
                </h1>
                <p style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#64748b',
                  margin: '0'
                }}>
                  Here's what's happening with your membership system today.
                </p>
              </div>
              <div style={{
                background: '#14b8a6',
                color: 'white',
                padding: '14px 24px',
                borderRadius: '24px',
                fontSize: '16px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                border: '2px solid #0f766e'
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Member Summary */}
            <div style={{
              background: '#f0fdfa',
              border: '2px solid #5eead4',
              borderRadius: '12px',
              padding: '36px',
              boxShadow: '0 2px 12px rgba(20,184,166,0.08)'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#0f766e',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                📊 Member Summary
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: '2px solid #ccfbf1'
                }}>
                  <span style={{ fontSize: '17px', fontWeight: '600', color: '#64748b' }}>Active Memberships</span>
                  <span style={{ fontSize: '32px', fontWeight: '800', color: '#14b8a6' }}>
                    {dashboardData?.activeMembers || 0}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: '2px solid #ccfbf1'
                }}>
                  <span style={{ fontSize: '17px', fontWeight: '600', color: '#64748b' }}>Non-Active Memberships</span>
                  <span style={{ fontSize: '32px', fontWeight: '800', color: '#dc2626' }}>
                    {dashboardData?.inactiveMembers || 0}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: '2px solid #ccfbf1'
                }}>
                  <span style={{ fontSize: '17px', fontWeight: '600', color: '#64748b' }}>Active Users</span>
                  <span style={{ fontSize: '32px', fontWeight: '800', color: '#14b8a6' }}>
                    {dashboardData?.activeUsers || 0}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '16px 0'
                }}>
                  <span style={{ fontSize: '17px', fontWeight: '600', color: '#64748b' }}>Growth Rate</span>
                  <span style={{ fontSize: '32px', fontWeight: '800', color: '#14b8a6' }}>
                    {stats?.growth || 0}%
                  </span>
                </div>
                <Link 
                  to="/members" 
                  style={{ 
                    background: '#14b8a6',
                    color: 'white',
                    border: '2px solid #0f766e',
                    padding: '16px 24px',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '700',
                    textAlign: 'center',
                    textDecoration: 'none',
                    display: 'block',
                    marginTop: '12px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  VIEW ALL MEMBERS
                </Link>
              </div>
            </div>

            {/* Recent Activities */}
            <div style={{
              background: '#f0fdfa',
              border: '2px solid #5eead4',
              borderRadius: '12px',
              padding: '36px',
              boxShadow: '0 2px 12px rgba(20,184,166,0.08)'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#0f766e',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                🔔 Recent Activities
              </h2>
              <div>
                {activities.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '48px 24px', 
                    color: '#94a3b8',
                    fontSize: '17px',
                    fontWeight: '500'
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
                          padding: '16px 20px',
                          background: '#ffffff',
                          borderRadius: '10px',
                          border: '2px solid #ccfbf1',
                          marginBottom: '8px'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                            gap: '12px'
                          }}>
                            <div style={{ 
                              fontSize: '17px',
                              fontWeight: '700', 
                              color: '#0f766e',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span>{item.type === 'member_added' ? '👤' : '🔑'}</span>
                              {item.name}
                            </div>
                            <div style={{ 
                              fontSize: '15px', 
                              color: '#64748b',
                              fontWeight: '600',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.date}
                            </div>
                          </div>
                          <div style={{ 
                            fontSize: '16px', 
                            color: '#64748b',
                            fontWeight: '500',
                            lineHeight: '1.5'
                          }}>
                            {item.description || (item.type === 'member_added' ? 'New member added' : 'User registered')}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {activities.length > 3 && (
                      <button
                        onClick={() => setShowAllActivities(!showAllActivities)}
                        style={{
                          background: '#ffffff',
                          border: '2px solid #14b8a6',
                          color: '#14b8a6',
                          padding: '12px 20px',
                          borderRadius: '10px',
                          fontSize: '16px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                          marginTop: '8px'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = '#14b8a6';
                          e.target.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = '#ffffff';
                          e.target.style.color = '#14b8a6';
                        }}
                      >
                        {showAllActivities ? '▲ Show Less' : `▼ View All (${activities.length})`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{
              background: '#f0fdfa',
              border: '2px solid #5eead4',
              borderRadius: '12px',
              padding: '36px',
              boxShadow: '0 2px 12px rgba(20,184,166,0.08)'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#0f766e',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                ⚡ Quick Actions
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Link
                  to="/members/new"
                  style={{
                    background: '#14b8a6',
                    color: 'white',
                    border: '2px solid #0f766e',
                    padding: '18px 24px',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '700',
                    textAlign: 'center',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>👤</span>
                  ADD NEW MEMBER
                </Link>
                <Link
                  to="/admin/import"
                  style={{
                    background: '#14b8a6',
                    color: 'white',
                    border: '2px solid #0f766e',
                    padding: '18px 24px',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '700',
                    textAlign: 'center',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>📊</span>
                  IMPORT MEMBERS
                </Link>
                <Link
                  to="/admin/approvals"
                  style={{
                    background: '#14b8a6',
                    color: 'white',
                    border: '2px solid #0f766e',
                    padding: '18px 24px',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '700',
                    textAlign: 'center',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>✅</span>
                  USER APPROVALS
                </Link>
              </div>
            </div>

            {/* Analytics Filters */}
            <div style={{ 
              gridColumn: 'span 2',
              background: '#f0fdfa',
              border: '2px solid #5eead4',
              borderRadius: '12px',
              padding: '36px',
              boxShadow: '0 2px 12px rgba(20,184,166,0.08)'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#0f766e',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                📈 Analytics & Reports
              </h2>
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '10px', 
                      fontSize: '16px', 
                      fontWeight: '700', 
                      color: '#0f766e' 
                    }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '2px solid #5eead4',
                        borderRadius: '10px',
                        fontSize: '17px',
                        fontWeight: '500',
                        background: 'white'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '10px', 
                      fontSize: '16px', 
                      fontWeight: '700', 
                      color: '#0f766e' 
                    }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '2px solid #5eead4',
                        borderRadius: '10px',
                        fontSize: '17px',
                        fontWeight: '500',
                        background: 'white'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '10px', 
                      fontSize: '16px', 
                      fontWeight: '700', 
                      color: '#0f766e' 
                    }}>
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '2px solid #5eead4',
                        borderRadius: '10px',
                        fontSize: '17px',
                        fontWeight: '500',
                        background: 'white'
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
                      style={{
                        width: '100%',
                        background: '#14b8a6',
                        color: 'white',
                        border: '2px solid #0f766e',
                        padding: '16px 24px',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
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
