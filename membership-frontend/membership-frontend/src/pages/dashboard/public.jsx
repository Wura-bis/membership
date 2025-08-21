import { useEffect, useState } from "react";
import PublicLayout from "../../components/publiclayout";
import MainLayout from "../../components/mainlayout";
import { useAuth } from "../../hooks/useauth";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

const COLORS = ["#14b8a6", "#0f766e", "#5eead4"];

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
            <h1 className="dashboard-title">🌐 Public Dashboard</h1>
            <p className="dashboard-subtitle">
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
                <div className="dashboard-card" style={{ textAlign: 'center' }}>
                  <h2 className="dashboard-card-title">👥 Total Registered Members</h2>
                  <div style={{
                    fontSize: '48px',
                    fontWeight: '700',
                    color: '#14b8a6',
                    marginBottom: '8px'
                  }}>
                    {stats.totalMembers.toLocaleString()}
                  </div>
                  <p style={{ color: '#64748b', fontSize: '14px' }}>
                    Active community members
                  </p>
                </div>

                {/* Membership Categories */}
                <div className="dashboard-card">
                  <h2 className="dashboard-card-title">📊 Membership Categories</h2>
                  <div style={{ height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.categories}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {stats.categories.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Regional Distribution */}
                <div className="dashboard-card">
                                  <h3 className="text-lg font-semibold mb-4">Provincial Distribution</h3>
                  <div style={{ height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.regions} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Historical Highlights */}
              <div className="dashboard-card">
                <h2 className="dashboard-card-title">📜 Historical Membership Highlights</h2>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '24px'
                }}>
                  <div style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                    borderRadius: '12px',
                    border: '1px solid #5eead4'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f766e', marginBottom: '8px' }}>
                      First Member Registered
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#134e4a' }}>
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
                    padding: '20px',
                    background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                    borderRadius: '12px',
                    border: '1px solid #5eead4'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f766e', marginBottom: '8px' }}>
                      Most Members in a Year
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#134e4a' }}>
                      {stats.historical.mostInAYear}
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                    borderRadius: '12px',
                    border: '1px solid #5eead4'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f766e', marginBottom: '8px' }}>
                      Lifetime Memberships
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#134e4a' }}>
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
