import { useEffect, useState } from "react";
import PublicLayout from "../../components/publiclayout";
import MainLayout from "../../components/mainlayout";
import { useAuth } from "../../hooks/useauth";
import {
  PieChart, Pie, Cell, Legend,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

// High contrast color palette for better accessibility with 4 categories
const COLORS = [
  "#0891b2", // Cyan 600 - Active
  "#dc2626", // Red 600 - Deceased
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
    fetch("http://localhost:5000/api/public/dashboard")
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
          {/* Header */}
          <div className="dashboard-header">
            <h1 className="dashboard-title" style={{ fontSize: '38px', marginBottom: '16px', fontWeight: '700', color: '#0f766e' }}>🌐 Public Dashboard</h1>
            <p className="dashboard-subtitle" style={{ fontSize: '20px', lineHeight: '1.6', color: '#334155', fontWeight: '500' }}>
              Welcome! Explore membership statistics and learn more about our community.
            </p>
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
                <div className="dashboard-card" style={{ textAlign: 'center', padding: '36px', background: '#f0fdfa' }}>
                  <h2 className="dashboard-card-title" style={{ fontSize: '24px', marginBottom: '20px', fontWeight: '700', color: '#0f766e' }}>👥 Membership Overview</h2>
                  <div style={{
                    fontSize: '64px',
                    fontWeight: '800',
                    color: '#14b8a6',
                    marginBottom: '12px'
                  }}>
                    {stats.totalMembers.toLocaleString()}
                  </div>
                  <p style={{ color: '#475569', fontSize: '18px', marginBottom: '24px', fontWeight: '600' }}>
                    Historical members honored
                  </p>
                  {stats.totalActive !== undefined && (
                    <div style={{
                      paddingTop: '24px',
                      borderTop: '3px solid #5eead4'
                    }}>
                      <div style={{
                        fontSize: '40px',
                        fontWeight: '700',
                        color: '#0f766e',
                        marginBottom: '10px'
                      }}>
                        {stats.totalActive.toLocaleString()}
                      </div>
                      <p style={{ color: '#475569', fontSize: '17px', fontWeight: '600' }}>
                        Current active members
                      </p>
                    </div>
                  )}
                </div>

                {/* Membership Categories */}
                <div className="dashboard-card" style={{ padding: '32px', background: '#f0fdfa' }}>
                  <h2 className="dashboard-card-title" style={{ fontSize: '24px', marginBottom: '20px', fontWeight: '700', color: '#0f766e' }}>📊 Membership Categories</h2>
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
                              border: '3px solid #14b8a6',
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
                      color: '#475569',
                      fontSize: '18px',
                      fontWeight: '600'
                    }}>
                      No category data available
                    </div>
                  )}
                </div>

                {/* Regional Distribution */}
                <div className="dashboard-card" style={{ padding: '32px', background: '#f0fdfa' }}>
                  <h2 className="dashboard-card-title" style={{ fontSize: '24px', marginBottom: '20px', fontWeight: '700', color: '#0f766e' }}>📍 Provincial Distribution</h2>
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
                              border: '3px solid #14b8a6',
                              borderRadius: '12px',
                              fontSize: '16px',
                              padding: '14px',
                              fontWeight: '600'
                            }}
                          />
                          <Bar dataKey="value" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={{ 
                      height: '280px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#475569',
                      fontSize: '18px',
                      fontWeight: '600'
                    }}>
                      No provincial data available
                    </div>
                  )}
                </div>
              </div>

              {/* Historical Highlights */}
              <div className="dashboard-card" style={{ padding: '32px', background: '#f0fdfa' }}>
                <h2 className="dashboard-card-title" style={{ fontSize: '24px', marginBottom: '28px', fontWeight: '700', color: '#0f766e' }}>📜 Historical Membership Highlights</h2>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '24px'
                }}>
                  <div style={{
                    padding: '28px',
                    background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                    borderRadius: '16px',
                    border: '2px solid #5eead4'
                  }}>
                    <div style={{ fontSize: '17px', fontWeight: '700', color: '#0f766e', marginBottom: '14px' }}>
                      First Member Registered
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#134e4a' }}>
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
                  
                  <div style={{
                    padding: '28px',
                    background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                    borderRadius: '16px',
                    border: '2px solid #5eead4'
                  }}>
                    <div style={{ fontSize: '17px', fontWeight: '700', color: '#0f766e', marginBottom: '14px' }}>
                      Most Members in a Year
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#134e4a' }}>
                      {stats.historical.mostInAYear}
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '28px',
                    background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                    borderRadius: '16px',
                    border: '2px solid #5eead4'
                  }}>
                    <div style={{ fontSize: '17px', fontWeight: '700', color: '#0f766e', marginBottom: '14px' }}>
                      Lifetime Memberships
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#134e4a' }}>
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
