import { useAuth } from "../../hooks/useauth";
import MainLayout from "../../components/mainlayout";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { API_BASE_URL } from '../../utils/api';
import { T, card, btn, badge, pageHeader } from '../../utils/theme';
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
    { name: 'Active', value: breakdown.active || 0, color: '#4e5d2e' },
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
          <div style={pageHeader.wrapper}>
            <div>
              <h1 style={pageHeader.title}>Welcome back, {user?.firstName || 'Member'}! 👋</h1>
              <p style={pageHeader.subtitle}>Access member resources, view directory, and manage your profile.</p>
            </div>
            <span style={user?.role === 'admin' ? badge.admin : badge.private}>
              {user?.role === 'admin' ? 'Administrator' : 'Private'}
            </span>
          </div>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '32px' }}>
              {error}
            </div>
          )}

          {/* Main Dashboard Grid */}
          <div className="dashboard-grid">
            {/* Quick Overview */}
            <div className="dashboard-card" style={{ ...card, padding: '24px' }}>
              <h2 className="dashboard-card-title" style={{
                fontSize: T.fontLg,
                fontWeight: '700',
                color: T.textMain,
                marginBottom: '20px'
              }}>📊 Member Directory</h2>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 'clamp(32px, 6vw, 48px)',
                  fontWeight: '800',
                  color: T.primaryLight,
                  marginBottom: '8px'
                }}>
                  {memberStats?.totalMembers || analyticsData?.total || 0}
                </div>
                <p style={{ color: T.textMuted, fontSize: T.fontBase, fontWeight: '600', marginBottom: '20px' }}>
                  Total registered members
                </p>
                <Link
                  to="/members"
                  style={{ ...btn.primary, textDecoration: 'none', width: '100%', justifyContent: 'center' }}
                >
                  📋 View Member Directory
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-card" style={{ ...card, padding: '24px' }}>
              <h2 className="dashboard-card-title" style={{
                fontSize: T.fontLg,
                fontWeight: '700',
                color: T.textMain,
                marginBottom: '20px'
              }}>⚡ Quick Actions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Link
                  to="/my-profile"
                  style={{ ...btn.primary, textDecoration: 'none', width: '100%', justifyContent: 'center' }}
                >
                  👤 Edit My Profile
                </Link>
                <Link
                  to="/support"
                  style={{ ...btn.ghost, textDecoration: 'none', width: '100%', justifyContent: 'center' }}
                >
                  🎧 Get Support
                </Link>
              </div>
            </div>

            {/* Export Data */}
            <div className="dashboard-card" style={{ ...card, padding: '24px' }}>
              <h2 className="dashboard-card-title" style={{
                fontSize: T.fontLg,
                fontWeight: '700',
                color: T.textMain,
                marginBottom: '20px'
              }}>📊 Export Data</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button
                  style={{ ...btn.exportCsv, width: '100%', justifyContent: 'center' }}
                  onClick={() => window.open(`${API_BASE_URL}/api/export/members/csv`, '_blank')}
                >
                  📄 Export CSV
                </button>
                <button
                  style={{ ...btn.exportPdf, width: '100%', justifyContent: 'center' }}
                  onClick={() => window.open(`${API_BASE_URL}/api/export/members/pdf`, '_blank')}
                >
                  📑 Export PDF
                </button>
              </div>
            </div>
          </div>

          {/* Analytics & Reports - Full Width */}
          <div className="dashboard-card" style={{ ...card, marginTop: '32px', padding: '24px' }}>
            <h2 style={{ fontSize: T.fontLg, fontWeight: '700', color: T.textMain, marginBottom: '20px' }}>📊 Analytics & Reports</h2>

            {/* Filters */}
            <form
              style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '24px', paddingBottom: '24px', borderBottom: `2px solid ${T.primaryMid}` }}
              onSubmit={e => { e.preventDefault(); setFilters(filters); }}
              aria-label="Analytics Filters"
            >
              <div>
                <label htmlFor="startDate" style={{ fontSize: T.fontBase, fontWeight: '700', color: T.textMain, display: 'block', marginBottom: '6px' }}>Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
                  style={{ padding: '8px 10px', fontSize: T.fontBase, fontWeight: '500', border: `2px solid ${T.primaryBorder}`, borderRadius: T.radiusMd, minWidth: '160px', outline: 'none' }}
                />
              </div>
              <div>
                <label htmlFor="endDate" style={{ fontSize: T.fontBase, fontWeight: '700', color: T.textMain, display: 'block', marginBottom: '6px' }}>End Date</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.endDate}
                  onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
                  style={{ padding: '8px 10px', fontSize: T.fontBase, fontWeight: '500', border: `2px solid ${T.primaryBorder}`, borderRadius: T.radiusMd, minWidth: '160px', outline: 'none' }}
                />
              </div>
              <div>
                <label htmlFor="category" style={{ fontSize: T.fontBase, fontWeight: '700', color: T.textMain, display: 'block', marginBottom: '6px' }}>Category</label>
                <select
                  id="category"
                  name="category"
                  value={filters.category}
                  onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
                  style={{ padding: '8px 10px', fontSize: T.fontBase, fontWeight: '500', border: `2px solid ${T.primaryBorder}`, borderRadius: T.radiusMd, minWidth: '150px', outline: 'none' }}
                >
                  <option value="">All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Historical">Historical</option>
                </select>
              </div>
              <button type="submit" style={btn.primary}>Apply Filters</button>
              <button
                type="button"
                onClick={() => setFilters({ startDate: "", endDate: "", category: "" })}
                style={btn.ghost}
              >
                🔄 Clear
              </button>
            </form>

            {analyticsData ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
                {/* Membership Breakdown */}
                <div className="dashboard-card" style={{
                  padding: '28px',
                  background: T.white,
                  borderRadius: T.radiusLg,
                  border: `2px solid ${T.primaryMid}`
                }}>
                  <h2 className="dashboard-card-title" style={{
                    fontSize: T.fontMd,
                    fontWeight: '700',
                    color: T.textMain,
                    marginBottom: '16px'
                  }}>Membership Breakdown</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label style={{ fontSize: T.fontLg, fontWeight: '600' }}>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: T.fontLg, fontWeight: '600', padding: '12px', borderRadius: T.radiusMd }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Yearly Growth */}
                <div className="dashboard-card" style={{
                  padding: '28px',
                  background: T.white,
                  borderRadius: T.radiusLg,
                  border: `2px solid ${T.primaryMid}`
                }}>
                  <h2 className="dashboard-card-title" style={{
                    fontSize: T.fontMd,
                    fontWeight: '700',
                    color: T.textMain,
                    marginBottom: '16px'
                  }}>Yearly Membership Growth</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={yearlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.primaryMid} />
                      <XAxis dataKey="year" style={{ fontSize: T.fontBase, fontWeight: '600' }} />
                      <YAxis style={{ fontSize: T.fontBase, fontWeight: '600' }} />
                      <Tooltip contentStyle={{ fontSize: T.fontLg, fontWeight: '600', padding: '12px', borderRadius: T.radiusMd }} />
                      <Line type="monotone" dataKey="value" stroke={T.primaryLight} strokeWidth={4} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: T.textLight, fontSize: T.fontBase, fontWeight: '600' }}>
                Loading analytics...
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
