import { useEffect, useState } from "react";
import PublicLayout from "../../components/publiclayout";
import MainLayout from "../../components/mainlayout";
import { useAuth } from "../../hooks/useauth";
import { API_BASE_URL } from '../../utils/api';
import { T, card, pageHeader } from '../../utils/theme';
import {
  PieChart, Pie, Cell, Legend,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

// High contrast color palette for better accessibility with 4 categories
const COLORS = [
  "#0891b2", // Cyan 600 - Active
  "#dc2626", // Red 600 - Historical
  "#f59e0b", // Amber 500 - Inactive
  "#7c3aed", // Violet 600 - Honorary
];

export default function PublicDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  // Determine which layout to use based on authentication
  const Layout = user ? MainLayout : PublicLayout;

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/dashboard`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard load error:", err);
        // Don't show error for empty database, show welcome message instead
        setStats({
          totalMembers: 0,
          categories: [],
          regions: [],
          historical: {
            firstRegistered: "Coming Soon",
            mostInAYear: "Coming Soon",
            lifetime: "Coming Soon"
          }
        });
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <div className="dashboard-container">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '400px'
          }}>
            <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={pageHeader.wrapper}>
            <div>
              <h1 style={pageHeader.title}>🌐 Public Dashboard</h1>
              <p style={pageHeader.subtitle}>Welcome! Explore membership statistics and learn more about our community.</p>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '32px' }}>
              {error}
            </div>
          )}

          {stats && (
            <>
              {/* Main Stats Grid */}
              <div className="dashboard-grid">
                {/* Total Members Card */}
                <div className="dashboard-card" style={{ ...card, textAlign: 'center', padding: '24px' }}>
                  <h2 className="dashboard-card-title" style={{ fontSize: T.fontLg, marginBottom: '16px', fontWeight: '700', color: T.textMain }}>👥 Membership Overview</h2>
                  <div style={{
                    fontSize: 'clamp(32px, 6vw, 48px)',
                    fontWeight: '800',
                    color: T.primaryLight,
                    marginBottom: '12px'
                  }}>
                    {stats.totalMembers.toLocaleString()}
                  </div>
                  <p style={{ color: T.textMuted, fontSize: T.fontBase, marginBottom: '24px', fontWeight: '600' }}>
                    Historical members honored
                  </p>
                  {stats.totalActive !== undefined && (
                    <div style={{ paddingTop: '20px', borderTop: `2px solid ${T.primaryBorder}` }}>
                      <div style={{ fontSize: '28px', fontWeight: '700', color: T.textMain, marginBottom: '8px' }}>
                        {stats.totalActive.toLocaleString()}
                      </div>
                      <p style={{ color: T.textMuted, fontSize: T.fontBase, fontWeight: '600' }}>
                        Current active members
                      </p>
                    </div>
                  )}
                </div>

                {/* Membership Categories */}
                <div className="dashboard-card" style={{ ...card, padding: '24px' }}>
                  <h2 className="dashboard-card-title" style={{ fontSize: T.fontLg, marginBottom: '16px', fontWeight: '700', color: T.textMain }}>📊 Membership Categories</h2>
                  {stats.categories && stats.categories.length > 0 ? (
                    <div style={{ height: '340px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.categories}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="40%"
                            outerRadius={95}
                            label={false}
                          >
                            {stats.categories.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend 
                            verticalAlign="bottom" 
                            height={90}
                            wrapperStyle={{
                              fontSize: '16px',
                              paddingTop: '16px',
                              fontWeight: '600'
                            }}
                            formatter={(value, entry) => {
                              const percentage = ((entry.payload.value / stats.categories.reduce((sum, cat) => sum + cat.value, 0)) * 100).toFixed(0);
                              return `${value} (${entry.payload.value} - ${percentage}%)`;
                            }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: `2px solid ${T.primaryBorder}`,
                              borderRadius: '12px',
                              fontSize: '16px',
                              padding: '14px',
                              fontWeight: '600'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={{ 
                      height: '280px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: T.textMuted,
                      fontSize: T.fontBase,
                      fontWeight: '600'
                    }}>
                      No category data available
                    </div>
                  )}
                </div>

                {/* Regional Distribution */}
                <div className="dashboard-card" style={{ ...card, padding: '24px' }}>
                  <h2 className="dashboard-card-title" style={{ fontSize: T.fontLg, marginBottom: '16px', fontWeight: '700', color: T.textMain }}>📍 Provincial Distribution</h2>
                  {stats.regions && stats.regions.length > 0 ? (
                    <div style={{ height: '280px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.regions} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 14, fontWeight: '600' }}
                            angle={-45}
                            textAnchor="end"
                            height={90}
                            interval={0}
                          />
                          <YAxis tick={{ fontSize: 15, fontWeight: '600' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: `2px solid ${T.primaryBorder}`,
                              borderRadius: '12px',
                              fontSize: '16px',
                              padding: '14px',
                              fontWeight: '600'
                            }}
                          />
                          <Bar dataKey="value" fill="#4e5d2e" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={{ 
                      height: '280px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: T.textMuted,
                      fontSize: T.fontBase,
                      fontWeight: '600'
                    }}>
                      No provincial data available
                    </div>
                  )}
                </div>
              </div>

              {/* Historical Highlights */}
              <div className="dashboard-card" style={{ ...card, padding: '24px' }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 'clamp(16px, 2.2vw, 20px)', marginBottom: '28px', fontWeight: '700', color: T.textMain }}>📜 Historical Membership Highlights</h2>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '24px'
                }}>
                  <div style={{ padding: '20px', background: T.primaryBg, borderRadius: T.radiusLg, border: `2px solid ${T.primaryBorder}` }}>
                    <div style={{ fontSize: T.fontBase, fontWeight: '700', color: T.textMain, marginBottom: '8px' }}>
                      First Member Registered
                    </div>
                    <div style={{ fontSize: T.fontMd, fontWeight: '800', color: T.textMain }}>
                      {(() => {
                        const d = stats.historical.firstRegistered;
                        if (!d) return "-";
                        try {
                          const dateObj = new Date(d);
                          return dateObj.toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          });
                        } catch {
                          return d;
                        }
                      })()}
                    </div>
                  </div>
                  
                  <div style={{ padding: '20px', background: T.primaryBg, borderRadius: T.radiusLg, border: `2px solid ${T.primaryBorder}` }}>
                    <div style={{ fontSize: T.fontBase, fontWeight: '700', color: T.textMain, marginBottom: '8px' }}>
                      Most Members in a Year
                    </div>
                    <div style={{ fontSize: T.fontMd, fontWeight: '800', color: T.textMain }}>
                      {stats.historical.mostInAYear}
                    </div>
                  </div>
                  
                  <div style={{ padding: '20px', background: T.primaryBg, borderRadius: T.radiusLg, border: `2px solid ${T.primaryBorder}` }}>
                    <div style={{ fontSize: T.fontBase, fontWeight: '700', color: T.textMain, marginBottom: '8px' }}>
                      Honorary Memberships
                    </div>
                    <div style={{ fontSize: T.fontMd, fontWeight: '800', color: T.textMain }}>
                      {stats.historical.lifetime}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
