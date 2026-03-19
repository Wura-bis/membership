import { useAuth } from "../../hooks/useauth";
import MainLayout from "../../components/mainlayout";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { API_BASE_URL } from '../../utils/api';
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

  // Check backend connection status
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/health`, {
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
        const res = await fetch(`${API_BASE_URL}/api/dashboard-stats`, {
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
        const analyticsRes = await fetch(`${API_BASE_URL}/api/stats${query}`, {
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

  // Standardized chart data for membership breakdown
  const breakdown = analyticsData?.breakdown || {};
  const pieData = [
    { name: 'Active', value: breakdown.active || 0, color: '#14b8a6' },
    { name: 'Inactive', value: breakdown.inactive || 0, color: '#ef4444' },
    { name: 'Historical', value: breakdown.historical || 0, color: '#8b5cf6' },
    { name: 'Honorary', value: breakdown.honorary || 0, color: '#f59e0b' }
  ].filter(item => item.value > 0);
  const yearlyData = analyticsData?.yearly ? Object.entries(analyticsData.yearly).map(([year, value]) => ({ year, value })) : [];

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Welcome Section */}
          <div className="dashboard-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 className="dashboard-title" style={{
                  fontSize: '38px',
                  fontWeight: '700',
                  color: '#0f766e',
                  marginBottom: '8px'
                }}>
                  Welcome back, {user?.firstName || 'Member'}! 👋
                </h1>
                <p className="dashboard-subtitle" style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#64748b'
                }}>
                  Access member resources, view directory, and manage your profile.
                </p>
              </div>
              <div style={{
                background: '#14b8a6',
                color: 'white',
                padding: '14px 24px',
                borderRadius: '20px',
                fontSize: '16px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Private User
              </div>
            </div>
          </div>
          {/* Analytics & Reports Filters */}
          <div className="dashboard-card" style={{ marginBottom: '24px', marginTop: '32px', padding: '36px', background: '#f0fdfa', borderRadius: '12px', boxShadow: '0 2px 12px rgba(20,184,166,0.08)', border: '2px solid #5eead4' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f766e', marginBottom: '24px' }}>📊 Analytics & Reports</h2>
            <form
              style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}
              onSubmit={e => { e.preventDefault(); setFilters(filters); }}
              aria-label="Analytics Filters"
            >
              <div>
                <label htmlFor="startDate" style={{ fontSize: '16px', fontWeight: '700', color: '#0f766e', display: 'block', marginBottom: '8px' }}>Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
                  style={{ 
                    padding: '14px',
                    fontSize: '17px',
                    fontWeight: '500',
                    border: '2px solid #5eead4',
                    borderRadius: '8px',
                    minWidth: '180px'
                  }}
                />
              </div>
              <div>
                <label htmlFor="endDate" style={{ fontSize: '16px', fontWeight: '700', color: '#0f766e', display: 'block', marginBottom: '8px' }}>End Date</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.endDate}
                  onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
                  style={{ 
                    padding: '14px',
                    fontSize: '17px',
                    fontWeight: '500',
                    border: '2px solid #5eead4',
                    borderRadius: '8px',
                    minWidth: '180px'
                  }}
                />
              </div>
              <div>
                <label htmlFor="category" style={{ fontSize: '16px', fontWeight: '700', color: '#0f766e', display: 'block', marginBottom: '8px' }}>Category</label>
                <select
                  id="category"
                  name="category"
                  value={filters.category}
                  onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
                  style={{ 
                    padding: '14px',
                    fontSize: '17px',
                    fontWeight: '500',
                    border: '2px solid #5eead4',
                    borderRadius: '8px',
                    minWidth: '180px'
                  }}
                >
                  <option value="">All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Historical">Historical</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{ 
                minWidth: '180px',
                padding: '16px 24px',
                fontSize: '16px',
                fontWeight: '700',
                borderRadius: '8px'
              }}>Apply Filters</button>
              <button 
                type="button"
                onClick={() => setFilters({ startDate: "", endDate: "", category: "" })}
                className="btn-primary" 
                style={{ 
                  minWidth: '180px',
                  padding: '16px 24px',
                  fontSize: '16px',
                  fontWeight: '700',
                  borderRadius: '8px',
                  background: '#64748b',
                  border: 'none'
                }}
              >
                🔄 Clear Filters
              </button>
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
            <div className="dashboard-card" style={{
              padding: '36px',
              background: '#f0fdfa',
              borderRadius: '12px',
              border: '2px solid #5eead4',
              boxShadow: '0 2px 12px rgba(20,184,166,0.08)'
            }}>
              <h2 className="dashboard-card-title" style={{
                fontSize: '22px',
                fontWeight: '700',
                color: '#0f766e',
                marginBottom: '24px'
              }}>📊 Member Directory</h2>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '64px',
                  fontWeight: '800',
                  color: '#14b8a6',
                  marginBottom: '8px'
                }}>
                  {memberStats?.totalMembers || analyticsData?.total || 0}
                </div>
                <p style={{ color: '#64748b', fontSize: '17px', fontWeight: '600', marginBottom: '24px' }}>
                  Total registered members
                </p>
                <Link 
                  to="/members" 
                  className="btn-primary" 
                  style={{ 
                    textDecoration: 'none',
                    width: '100%',
                    display: 'block',
                    padding: '18px',
                    fontSize: '16px',
                    fontWeight: '700',
                    borderRadius: '8px'
                  }}
                >
                  📋 View Member Directory
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-card" style={{
              padding: '36px',
              background: '#f0fdfa',
              borderRadius: '12px',
              border: '2px solid #5eead4',
              boxShadow: '0 2px 12px rgba(20,184,166,0.08)'
            }}>
              <h2 className="dashboard-card-title" style={{
                fontSize: '22px',
                fontWeight: '700',
                color: '#0f766e',
                marginBottom: '24px'
              }}>⚡ Quick Actions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Link
                  to="/my-profile"
                  className="btn-primary"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '18px',
                    fontSize: '16px',
                    fontWeight: '700',
                    borderRadius: '8px'
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
                    gap: '12px',
                    padding: '18px',
                    fontSize: '16px',
                    fontWeight: '700',
                    borderRadius: '8px'
                  }}
                >
                  <span>🎧</span>
                  Get Support
                </Link>
              </div>
            </div>

            {/* Export Data */}
            <div className="dashboard-card" style={{
              padding: '36px',
              background: '#f0fdfa',
              borderRadius: '12px',
              border: '2px solid #5eead4',
              boxShadow: '0 2px 12px rgba(20,184,166,0.08)'
            }}>
              <h2 className="dashboard-card-title" style={{
                fontSize: '22px',
                fontWeight: '700',
                color: '#0f766e',
                marginBottom: '24px'
              }}>📊 Export Data</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button 
                  className="btn-primary" 
                  style={{ 
                    background: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '18px',
                    fontSize: '16px',
                    fontWeight: '700',
                    borderRadius: '8px'
                  }}
                  onClick={() => window.open(`${API_BASE_URL}/api/export/members/csv`, '_blank')}
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
                    gap: '12px',
                    padding: '18px',
                    fontSize: '16px',
                    fontWeight: '700',
                    borderRadius: '8px'
                  }}
                  onClick={() => window.open(`${API_BASE_URL}/api/export/members/pdf`, '_blank')}
                >
                  <span>📑</span>
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          {/* Society Analytics - Full Width */}
          <div className="dashboard-card" style={{ 
            marginTop: '32px',
            padding: '36px',
            background: '#f0fdfa',
            borderRadius: '12px',
            border: '2px solid #5eead4',
            boxShadow: '0 2px 12px rgba(20,184,166,0.08)'
          }}>
            <h2 className="dashboard-card-title" style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#0f766e',
              marginBottom: '28px'
            }}>📈 Society Analytics</h2>
            
            {analyticsData ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
                {/* Membership Breakdown */}
                <div className="dashboard-card" style={{
                  padding: '28px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '2px solid #ccfbf1'
                }}>
                  <h2 className="dashboard-card-title" style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#0f766e',
                    marginBottom: '20px'
                  }}>Membership Breakdown</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label style={{ fontSize: '16px', fontWeight: '600' }}>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '16px', fontWeight: '600', padding: '12px', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Yearly Growth */}
                <div className="dashboard-card" style={{
                  padding: '28px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '2px solid #ccfbf1'
                }}>
                  <h2 className="dashboard-card-title" style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#0f766e',
                    marginBottom: '20px'
                  }}>Yearly Membership Growth</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={yearlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ccfbf1" />
                      <XAxis dataKey="year" style={{ fontSize: '14px', fontWeight: '600' }} />
                      <YAxis style={{ fontSize: '14px', fontWeight: '600' }} />
                      <Tooltip contentStyle={{ fontSize: '16px', fontWeight: '600', padding: '12px', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={4} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '48px', 
                color: '#94a3b8',
                fontSize: '17px',
                fontWeight: '600'
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
