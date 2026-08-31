import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useStickyScrollbar } from "../../hooks/useStickyScrollbar";
import MainLayout from "../../components/mainlayout";
import { API_BASE_URL } from '../../utils/api';
import { T, card, btn, badge, thStyle, tdStyle } from '../../utils/theme';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { tableWrapRef, mirrorScrollbar } = useStickyScrollbar([results]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    fetch(`${API_BASE_URL}/api/members/search?q=${encodeURIComponent(query)}`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Search failed");
        return res.json();
      })
      .then((data) => {
        setResults(data.members || data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch search results: " + err.message);
        setLoading(false);
      });
  }, [query]);

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div className="dashboard-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <h1 className="dashboard-title" style={{ fontSize: 'clamp(20px, 3.5vw, 26px)', fontWeight: '800' }}>🔍 Search Results</h1>
                <p className="dashboard-subtitle" style={{ fontSize: 'clamp(14px, 1.8vw, 17px)', fontWeight: '600' }}>
                  {query ? `Results for "${query}"` : "Enter a search term to find members"}
                </p>
              </div>
              <Link
                to="/members"
                style={{
                  ...btn.primary,
                  padding: '16px 28px',
                  fontSize: '17px',
                  borderRadius: '10px',
                  display: 'inline-block'
                }}
              >
                ← Back to Directory
              </Link>
            </div>
          </div>

          {/* Search Info */}
          {query && (
            <div className="dashboard-card" style={{ 
              marginBottom: '28px',
              padding: '32px',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e5e7eb 100%)',
              border: '2px solid #4e5d2e'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <strong style={{ color: T.textMain, fontSize: '18px', fontWeight: '700' }}>🔎 Search Query:</strong>
                  <span style={{
                    padding: '10px 20px',
                    background: T.white,
                    color: T.primaryLight,
                    borderRadius: '10px',
                    fontSize: '18px',
                    fontWeight: '700',
                    border: `2px solid ${T.primaryLight}`
                  }}>
                    "{query}"
                  </span>
                </div>
                {!loading && (
                  <div style={{
                    color: T.textMain,
                    fontSize: '18px',
                    fontWeight: '700',
                    padding: '10px 20px',
                    background: T.white,
                    borderRadius: '10px',
                    border: `2px solid ${T.primaryLight}`
                  }}>
                    📊 {results.length} result{results.length !== 1 ? 's' : ''} found
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '24px' }}>
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto' }}></div>
              <p style={{ color: T.textMuted, marginTop: '16px' }}>Searching members...</p>
            </div>
          )}

          {/* No Query State */}
          {!query && !loading && (
            <div className="dashboard-card" style={{ textAlign: 'center', padding: '100px 40px', border: '2px solid #4e5d2e' }}>
              <div style={{ fontSize: 'clamp(40px, 7vw, 56px)', marginBottom: '24px' }}>🔍</div>
              <h2 style={{ fontSize: 'clamp(18px, 2.5vw, 22px)', fontWeight: '700', color: '#374151', marginBottom: '20px' }}>
                Ready to Search
              </h2>
              <p style={{ color: T.textMuted, fontSize: '18px', fontWeight: '500' }}>
                Use the search feature in the members directory to find specific members.
              </p>
            </div>
          )}

          {/* No Results State */}
          {!loading && query && results.length === 0 && !error && (
            <div className="dashboard-card" style={{ textAlign: 'center', padding: '100px 40px', border: '2px solid #4e5d2e' }}>
              <div style={{ fontSize: 'clamp(40px, 7vw, 56px)', marginBottom: '24px' }}>😔</div>
              <h2 style={{ fontSize: 'clamp(18px, 2.5vw, 22px)', fontWeight: '700', color: '#374151', marginBottom: '20px' }}>
                No Results Found
              </h2>
              <p style={{ color: T.textMuted, fontSize: '18px', fontWeight: '500' }}>
                No members found matching "{query}". Try a different search term.
              </p>
            </div>
          )}

          {/* Results Table */}
          {!loading && results.length > 0 && (
            <div className="dashboard-card" style={{ padding: '36px', border: '2px solid #4e5d2e' }}>
              <h2 className="dashboard-card-title" style={{ fontSize: 'clamp(16px, 2.2vw, 20px)', fontWeight: '700', marginBottom: '28px', color: T.textMain }}>📋 Member Results</h2>
              <div ref={tableWrapRef} style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '17px', borderCollapse: 'separate', borderSpacing: '0' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle }}>Surname</th>
                      <th style={{ ...thStyle }}>First Name</th>
                      <th style={{ ...thStyle }}>County</th>
                      <th style={{ ...thStyle }}>Category</th>
                      <th style={{ ...thStyle }}>Status</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((member, index) => (
                      <tr 
                        key={member.id} 
                        style={{ 
                          borderBottom: '2px solid #f8f9fa',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#f8f9fa';
                          e.target.closest('tr').style.transform = 'scale(1.005)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = 'white';
                          e.target.closest('tr').style.transform = 'scale(1)';
                        }}
                      >
                        <td style={{ ...tdStyle, fontWeight: '700', fontSize: '17px', color: '#0f172a' }}>
                          {member.lastName}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: '600', fontSize: '17px', color: '#374151' }}>
                          {member.firstName}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: '500', fontSize: '17px', color: T.textMuted }}>
                          {member.county || "—"}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: '500', fontSize: '17px', color: T.textMuted }}>
                          {member.category || "—"}
                        </td>
                        <td style={{ ...tdStyle }}>
                          <span style={member.isActive ? badge.active : badge.inactive}>
                            {member.isActive ? "✓ Active" : "✕ Inactive"}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <Link
                            to={`/members/${member.id}`}
                            style={{
                              ...btn.primary,
                              padding: '14px 28px',
                              fontSize: '17px',
                              borderRadius: '10px',
                              minWidth: '160px'
                            }}
                          >
                            👁️ View Profile
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {mirrorScrollbar}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
