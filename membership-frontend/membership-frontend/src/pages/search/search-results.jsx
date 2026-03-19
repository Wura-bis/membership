import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import MainLayout from "../../components/mainlayout";
import { API_BASE_URL } from '../../utils/api';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
                <h1 className="dashboard-title" style={{ fontSize: '38px', fontWeight: '800' }}>🔍 Search Results</h1>
                <p className="dashboard-subtitle" style={{ fontSize: '20px', fontWeight: '600' }}>
                  {query ? `Results for "${query}"` : "Enter a search term to find members"}
                </p>
              </div>
              <Link 
                to="/members" 
                style={{ 
                  textDecoration: 'none',
                  padding: '16px 28px',
                  background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
                  color: 'white',
                  borderRadius: '10px',
                  fontSize: '17px',
                  fontWeight: '700',
                  border: '2px solid #0f766e',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(20, 184, 166, 0.3)',
                  display: 'inline-block'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(20, 184, 166, 0.3)';
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
              background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
              border: '2px solid #14b8a6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <strong style={{ color: '#0f766e', fontSize: '18px', fontWeight: '700' }}>🔎 Search Query:</strong>
                  <span style={{ 
                    padding: '10px 20px',
                    background: 'white',
                    color: '#14b8a6',
                    borderRadius: '10px',
                    fontSize: '18px',
                    fontWeight: '700',
                    border: '2px solid #14b8a6'
                  }}>
                    "{query}"
                  </span>
                </div>
                {!loading && (
                  <div style={{ 
                    color: '#0f766e', 
                    fontSize: '18px',
                    fontWeight: '700',
                    padding: '10px 20px',
                    background: 'white',
                    borderRadius: '10px',
                    border: '2px solid #14b8a6'
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
              <p style={{ color: '#64748b', marginTop: '16px' }}>Searching members...</p>
            </div>
          )}

          {/* No Query State */}
          {!query && !loading && (
            <div className="dashboard-card" style={{ textAlign: 'center', padding: '100px 40px', border: '2px solid #14b8a6' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>🔍</div>
              <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#374151', marginBottom: '20px' }}>
                Ready to Search
              </h2>
              <p style={{ color: '#64748b', fontSize: '18px', fontWeight: '500' }}>
                Use the search feature in the members directory to find specific members.
              </p>
            </div>
          )}

          {/* No Results State */}
          {!loading && query && results.length === 0 && !error && (
            <div className="dashboard-card" style={{ textAlign: 'center', padding: '100px 40px', border: '2px solid #14b8a6' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>😔</div>
              <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#374151', marginBottom: '20px' }}>
                No Results Found
              </h2>
              <p style={{ color: '#64748b', fontSize: '18px', fontWeight: '500' }}>
                No members found matching "{query}". Try a different search term.
              </p>
            </div>
          )}

          {/* Results Table */}
          {!loading && results.length > 0 && (
            <div className="dashboard-card" style={{ padding: '36px', border: '2px solid #14b8a6' }}>
              <h2 className="dashboard-card-title" style={{ fontSize: '24px', fontWeight: '700', marginBottom: '28px', color: '#0f766e' }}>📋 Member Results</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '17px', borderCollapse: 'separate', borderSpacing: '0' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)', borderBottom: '3px solid #14b8a6' }}>
                      <th style={{ 
                        padding: '22px 24px', 
                        textAlign: 'left',
                        fontWeight: '700',
                        color: '#0f766e',
                        fontSize: '17px'
                      }}>
                        Surname
                      </th>
                      <th style={{ 
                        padding: '22px 24px', 
                        textAlign: 'left',
                        fontWeight: '700',
                        color: '#0f766e',
                        fontSize: '17px'
                      }}>
                        First Name
                      </th>
                      <th style={{ 
                        padding: '22px 24px', 
                        textAlign: 'left',
                        fontWeight: '700',
                        color: '#0f766e',
                        fontSize: '17px'
                      }}>
                        County
                      </th>
                      <th style={{ 
                        padding: '22px 24px', 
                        textAlign: 'left',
                        fontWeight: '700',
                        color: '#0f766e',
                        fontSize: '17px'
                      }}>
                        Category
                      </th>
                      <th style={{ 
                        padding: '22px 24px', 
                        textAlign: 'left',
                        fontWeight: '700',
                        color: '#0f766e',
                        fontSize: '17px'
                      }}>
                        Status
                      </th>
                      <th style={{ 
                        padding: '22px 24px', 
                        textAlign: 'center',
                        fontWeight: '700',
                        color: '#0f766e',
                        fontSize: '17px'
                      }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((member, index) => (
                      <tr 
                        key={member.id} 
                        style={{ 
                          borderBottom: '2px solid #f0fdfa',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#f0fdfa';
                          e.target.closest('tr').style.transform = 'scale(1.005)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = 'white';
                          e.target.closest('tr').style.transform = 'scale(1)';
                        }}
                      >
                        <td style={{ padding: '20px 24px', fontWeight: '700', fontSize: '17px', color: '#0f172a' }}>
                          {member.lastName}
                        </td>
                        <td style={{ padding: '20px 24px', fontWeight: '600', fontSize: '17px', color: '#374151' }}>
                          {member.firstName}
                        </td>
                        <td style={{ padding: '20px 24px', fontWeight: '500', fontSize: '17px', color: '#64748b' }}>
                          {member.county || "—"}
                        </td>
                        <td style={{ padding: '20px 24px', fontWeight: '500', fontSize: '17px', color: '#64748b' }}>
                          {member.category || "—"}
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '8px 18px',
                            fontSize: '15px',
                            fontWeight: '700',
                            borderRadius: '10px',
                            ...(member.isActive 
                              ? { 
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                                  color: 'white',
                                  border: '2px solid #059669'
                                }
                              : { 
                                  background: '#f1f5f9', 
                                  color: '#64748b',
                                  border: '2px solid #cbd5e1'
                                }
                            )
                          }}>
                            {member.isActive ? "✓ Active" : "✕ Inactive"}
                          </span>
                        </td>
                        <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                          <Link
                            to={`/members/${member.id}`}
                            style={{
                              display: 'inline-block',
                              padding: '14px 28px',
                              background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
                              color: 'white',
                              fontSize: '17px',
                              fontWeight: '700',
                              textDecoration: 'none',
                              borderRadius: '10px',
                              border: '2px solid #0f766e',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 8px rgba(20, 184, 166, 0.3)',
                              minWidth: '160px'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 8px rgba(20, 184, 166, 0.3)';
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
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
