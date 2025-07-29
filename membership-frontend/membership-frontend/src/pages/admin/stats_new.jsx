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
import MainLayout from "../../components/mainlayout";

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

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

  const handleExport = () => {
    if (!stats) return;

    const rows = [
      ["Metric", "Value"],
      ["Total Members", stats.total],
      ["Growth Rate", stats.growth + "%"],
      ["Active Members", stats.breakdown.active],
      ["Inactive Members", stats.breakdown.inactive],
      ["Deceased Members", stats.breakdown.deceased],
    ];

    // Add yearly data
    if (stats.yearly) {
      rows.push(["", ""]);
      rows.push(["Year", "New Members"]);
      Object.entries(stats.yearly).forEach(([year, count]) => {
        rows.push([year, count]);
      });
    }

    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "membership_stats.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  const COLORS = ["#14b8a6", "#0d9488", "#f87171"];

  const pieData = stats
    ? [
        { name: "Active", value: stats.breakdown.active },
        { name: "Inactive", value: stats.breakdown.inactive },
        { name: "Deceased", value: stats.breakdown.deceased },
      ]
    : [];

  const lineData = stats
    ? Object.entries(stats.yearly).map(([year, value]) => ({
        year,
        value,
      }))
    : [];

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-title">📈 Membership Statistics</h1>
              <p className="dashboard-subtitle">
                Analyze membership trends, demographics, and growth patterns
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="dashboard-card" style={{ marginBottom: '24px' }}>
            <h2 className="dashboard-card-title">🔍 Filters & Controls</h2>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-input"
                >
                  <option value="">All</option>
                  <option value="Honorary">Honorary</option>
                  <option value="Associate">Associate</option>
                  <option value="Full">Full</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <button
                onClick={fetchStats}
                className="btn-primary"
                style={{ margin: 0 }}
              >
                Apply Filters
              </button>
              <button
                onClick={handleExport}
                className="btn-secondary"
                style={{ margin: 0 }}
              >
                Export CSV
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '32px' }}>
              {error}
            </div>
          )}

          {!stats ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '400px'
            }}>
              <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '24px' }}>
              {/* Overview Card */}
              <div className="dashboard-card">
                <h2 className="dashboard-card-title">📊 Overview</h2>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '24px',
                  marginTop: '16px'
                }}>
                  <div className="dashboard-stat">
                    <span className="dashboard-stat-label">Total Members</span>
                    <span className="dashboard-stat-value positive">{stats.total}</span>
                  </div>
                  <div className="dashboard-stat">
                    <span className="dashboard-stat-label">Growth Rate</span>
                    <span className="dashboard-stat-value">{stats.growth}%</span>
                  </div>
                  <div className="dashboard-stat">
                    <span className="dashboard-stat-label">Active</span>
                    <span className="dashboard-stat-value positive">{stats.breakdown.active}</span>
                  </div>
                  <div className="dashboard-stat">
                    <span className="dashboard-stat-label">Inactive</span>
                    <span className="dashboard-stat-value negative">{stats.breakdown.inactive}</span>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
                gap: '24px' 
              }}>
                <div className="dashboard-card">
                  <h3 className="dashboard-card-title">📈 Membership Breakdown</h3>
                  <div style={{ height: '300px', marginTop: '16px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {pieData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="dashboard-card">
                  <h3 className="dashboard-card-title">📊 New Members Per Year</h3>
                  <div style={{ height: '300px', marginTop: '16px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
