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
import { API_BASE_URL } from '../../utils/api';
import { T, card, btn, pageHeader } from '../../utils/theme';

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
    fetch(`${API_BASE_URL}/api/admin/dashboard`, {
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

      const res = await fetch(`${API_BASE_URL}/api/admin/stats?${query}`, {
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
  const COLORS = ['#4e5d2e', '#dc2626', '#f59e0b', '#3b82f6'];

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
          <div style={{ ...pageHeader.wrapper, marginBottom: '32px' }}>
            <div>
              <h1 style={pageHeader.title}>Welcome back, {user.firstName} {user.lastName}! 👋</h1>
              <p style={pageHeader.subtitle}>Here's what's happening with your membership system today.</p>
            </div>
            <div style={{ background: `linear-gradient(135deg, ${T.primaryLight} 0%, ${T.primary} 100%)`, color: T.white, padding: '10px 20px', borderRadius: '24px', fontSize: T.fontBase, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Administrator
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '32px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '16px' }}>
            {/* Member Summary */}
            <div style={{ ...card, padding: '24px' }}>
              <h2 style={{
                fontSize: T.fontLg,
                fontWeight: '700',
                color: T.textMain,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                📊 Member Summary
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: `2px solid ${T.primaryMid}`
                }}>
                  <span style={{ fontSize: T.fontBase, fontWeight: '600', color: T.textMuted }}>Active Memberships</span>
                  <span style={{ fontSize: T.fontMd, fontWeight: '800', color: T.primaryLight }}>
                    {dashboardData?.activeMembers || 0}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: `2px solid ${T.primaryMid}`
                }}>
                  <span style={{ fontSize: T.fontBase, fontWeight: '600', color: T.textMuted }}>Honorary Memberships</span>
                  <span style={{ fontSize: T.fontMd, fontWeight: '800', color: T.amber }}>
                    {dashboardData?.honoraryMembers || 0}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: `2px solid ${T.primaryMid}`
                }}>
                  <span style={{ fontSize: T.fontBase, fontWeight: '600', color: T.textMuted }}>Non-Active Memberships</span>
                  <span style={{ fontSize: T.fontMd, fontWeight: '800', color: T.red }}>
                    {dashboardData?.inactiveMembers || 0}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: `2px solid ${T.primaryMid}`
                }}>
                  <span style={{ fontSize: T.fontBase, fontWeight: '600', color: T.textMuted }}>Active Users</span>
                  <span style={{ fontSize: T.fontMd, fontWeight: '800', color: T.primaryLight }}>
                    {dashboardData?.activeUsers || 0}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0'
                }}>
                  <span style={{ fontSize: T.fontBase, fontWeight: '600', color: T.textMuted }}>Growth Rate</span>
                  <span style={{ fontSize: T.fontMd, fontWeight: '800', color: T.primaryLight }}>
                    {stats?.growth || 0}%
                  </span>
                </div>
                <Link to="/members" style={{ ...btn.primary, justifyContent: 'center', marginTop: '12px' }}>
                  VIEW ALL MEMBERS
                </Link>
              </div>
            </div>

            {/* Recent Activities */}
            <div style={{ ...card, padding: '24px' }}>
              <h2 style={{
                fontSize: T.fontLg,
                fontWeight: '700',
                color: T.textMain,
                marginBottom: '16px',
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
                    color: T.textLight,
                    fontSize: T.fontMd,
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
                          padding: '12px 16px',
                          background: T.white,
                          borderRadius: T.radiusMd,
                          border: `2px solid ${T.primaryMid}`,
                          marginBottom: '8px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '6px',
                            gap: '12px'
                          }}>
                            <div style={{
                              fontSize: T.fontBase,
                              fontWeight: '700',
                              color: T.textMain,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span>{'👤'}</span>
                              {item.name}
                            </div>
                            <div style={{
                              fontSize: T.fontSm,
                              color: T.textMuted,
                              fontWeight: '600',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.date}
                            </div>
                          </div>
                          <div style={{
                            fontSize: T.fontBase,
                            color: T.textMuted,
                            fontWeight: '500',
                            lineHeight: '1.5'
                          }}>
                            {item.activity || item.description || 'New member joined'}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {activities.length > 3 && (
                      <button
                        onClick={() => setShowAllActivities(!showAllActivities)}
                        style={{ ...btn.ghost, border: `1.5px solid ${T.primaryLight}`, color: T.primaryLight, justifyContent: 'center', marginTop: '8px' }}
                      >
                        {showAllActivities ? '▲ Show Less' : `▼ View All (${activities.length})`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ ...card, padding: '24px' }}>
              <h2 style={{
                fontSize: T.fontLg,
                fontWeight: '700',
                color: T.textMain,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                ⚡ Quick Actions
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Link to="/members/new" style={{ ...btn.primary, justifyContent: 'center' }}>
                  👤 Add New Member
                </Link>
                <Link to="/admin/import" style={{ ...btn.primary, justifyContent: 'center' }}>
                  📊 Import Members
                </Link>
                <Link to="/admin/approvals" style={{ ...btn.primary, justifyContent: 'center' }}>
                  ✅ User Approvals
                </Link>
              </div>
            </div>

            {/* Analytics Filters */}
            <div style={{ ...card, padding: '24px', gridColumn: 'span 2' }}>
              <h2 style={{
                fontSize: T.fontLg,
                fontWeight: '700',
                color: T.textMain,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                📈 Analytics & Reports
              </h2>
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: T.fontBase, fontWeight: '700', color: T.textMain }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: `2px solid ${T.primaryBorder}`, borderRadius: T.radiusMd, fontSize: T.fontBase, fontWeight: '500', background: T.white }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: T.fontBase, fontWeight: '700', color: T.textMain }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: `2px solid ${T.primaryBorder}`, borderRadius: T.radiusMd, fontSize: T.fontBase, fontWeight: '500', background: T.white }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: T.fontBase, fontWeight: '700', color: T.textMain }}>
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: `2px solid ${T.primaryBorder}`, borderRadius: T.radiusMd, fontSize: T.fontBase, fontWeight: '500', background: T.white }}
                    >
                      <option value="">All Categories</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Honorary">Honorary</option>
                      <option value="Historical">Historical</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'end' }}>
                    <button onClick={fetchStats} style={{ ...btn.primary, width: '100%', justifyContent: 'center' }}>
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                {/* Membership Breakdown Pie Chart */}
                <div>
                  <h3 style={{ fontSize: T.fontBase, fontWeight: '700', color: T.textMuted, marginBottom: '16px' }}>
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
                      color: T.textLight,
                      fontSize: T.fontBase
                    }}>
                      No data available
                    </div>
                  )}
                </div>

                {/* Yearly Growth Line Chart */}
                <div>
                  <h3 style={{ fontSize: T.fontBase, fontWeight: '700', color: T.textMuted, marginBottom: '16px' }}>
                    Yearly Membership Growth
                  </h3>
                  {stats && prepareYearlyData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={prepareYearlyData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="members" stroke="#4e5d2e" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '300px', 
                      color: T.textLight,
                      fontSize: T.fontBase
                    }}>
                      No data available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Smart Notifications */}
            <div className="dashboard-card">
              <h2 className="dashboard-card-title">🔔 Smart Notifications</h2>
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
                        padding: '12px 14px',
                        background: notification.type === 'warning' ? T.amberLight : notification.type === 'success' ? T.greenLight : T.slateLight,
                        borderRadius: T.radiusMd,
                        border: `1.5px solid ${notification.type === 'warning' ? T.amberBorder : notification.type === 'success' ? T.greenBorder : T.slateBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{notification.icon}</span>
                          <span style={{
                            fontSize: T.fontBase,
                            color: notification.type === 'warning' ? T.amber : notification.type === 'success' ? T.green : T.textMuted,
                            fontWeight: '600'
                          }}>
                            {notification.message}
                          </span>
                        </div>
                        {notification.action && (
                          <Link
                            to={notification.action}
                            style={{
                              ...(notification.type === 'warning' ? btn.warning : notification.type === 'success' ? btn.success : btn.primary),
                              padding: '4px 10px',
                              fontSize: T.fontSm,
                              textDecoration: 'none'
                            }}
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
