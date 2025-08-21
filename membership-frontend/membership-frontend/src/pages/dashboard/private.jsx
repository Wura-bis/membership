import { useAuth } from "../../hooks/useauth";
import MainLayout from "../../components/mainlayout";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
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

export default function PrivateDashboard() {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [backendStatus, setBackendStatus] = useState("checking");
  const [memberStats, setMemberStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    newThisMonth: 0
  });
  const [analyticsData, setAnalyticsData] = useState(null);
  // Filter state
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    category: ""
  });

  // Chart colors
  const COLORS = ['#14b8a6', '#dc2626', '#f59e0b', '#3b82f6'];

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

  // Load member statistics and analytics
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Load basic dashboard stats
        const res = await fetch("http://localhost:5000/api/dashboard-stats", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setMemberStats(data);
        }
        // Build query string for filters
        const params = [];
        if (filters.startDate) params.push(`startDate=${encodeURIComponent(filters.startDate)}`);
        if (filters.endDate) params.push(`endDate=${encodeURIComponent(filters.endDate)}`);
        if (filters.category) params.push(`category=${encodeURIComponent(filters.category)}`);
        const query = params.length ? `?${params.join("&")}` : "";
        // Load analytics data (accessible to private users)
        const analyticsRes = await fetch(`http://localhost:5000/api/stats${query}`, {
          credentials: "include",
        });
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setAnalyticsData(analyticsData);
        }
      } catch (err) {
        console.log("Could not load data:", err.message);
      }
    };
    loadStats();
  }, [filters]);

  const prepareChartData = () => {
    if (!analyticsData?.breakdown) return [];
    return [
      { name: 'Active', value: analyticsData.breakdown.active },
      { name: 'Inactive', value: analyticsData.breakdown.inactive },
      { name: 'Deceased', value: analyticsData.breakdown.deceased }
    ].filter(item => item.value > 0);
  };

  const prepareYearlyData = () => {
    if (!analyticsData?.yearly) return [];
    return Object.entries(analyticsData.yearly).map(([year, count]) => ({
      year: parseInt(year),
      members: count
    })).sort((a, b) => a.year - b.year);
  };

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Welcome Section */}
          <div className="dashboard-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 className="dashboard-title">
                  Welcome back, {user?.firstName || 'Member'}! 👋
                </h1>
                <p className="dashboard-subtitle">
                  Access member resources, view directory, and manage your profile.
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
                Private User
              </div>
            </div>
          </div>
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
                  <option value="">All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Deceased">Deceased</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{ minWidth: '140px' }}>Apply Filters</button>
            </form>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '32px' }}>
              {error}
            </div>
          )}

          {/* Main Dashboard Grid */}
          <div className="dashboard-grid">
            {/* Quick Overview */}
            <div className="dashboard-card">
              <h2 className="dashboard-card-title">📊 Member Directory</h2>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: '700',
                  color: '#14b8a6',
                  marginBottom: '8px'
                }}>
                  {memberStats?.totalMembers || analyticsData?.total || 0}
                </div>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
                  Total registered members
                </p>
                <Link 
                  to="/members" 
                  className="btn-primary" 
                  style={{ 
                    textDecoration: 'none',
                    width: '100%',
                    display: 'block'
                  }}
                >
                  📋 View Member Directory
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-card">
              <h2 className="dashboard-card-title">⚡ Quick Actions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link
                  to="/my-profile"
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
                  Edit My Profile
                </Link>
                <Link
                  to="/support"
                  className="btn-primary"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>🎧</span>
                  Get Support
                </Link>
              </div>
            </div>

            {/* Export Data */}
            <div className="dashboard-card">
              <h2 className="dashboard-card-title">📊 Export Data</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  className="btn-primary" 
                  style={{ 
                    background: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onClick={() => window.open('http://localhost:5000/api/export/csv', '_blank')}
                >
                  <span>📄</span>
                  Export CSV
                </button>
                <button 
                  className="btn-primary" 
                  style={{ 
                    background: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onClick={() => window.open('http://localhost:5000/api/export/pdf', '_blank')}
                >
                  <span>📑</span>
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          {/* Society Analytics - Full Width */}
          <div className="dashboard-card" style={{ marginTop: '32px' }}>
            <h2 className="dashboard-card-title">📈 Society Analytics</h2>
            
            {analyticsData ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
                {/* Membership Breakdown */}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
                    Membership Distribution
                  </h3>
                  {prepareChartData().length > 0 ? (
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

                {/* Yearly Growth */}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
                    Membership Growth Over Time
                  </h3>
                  {prepareYearlyData().length > 0 ? (
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
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '32px', 
                color: '#94a3b8',
                fontSize: '14px'
              }}>
                Loading analytics...
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
