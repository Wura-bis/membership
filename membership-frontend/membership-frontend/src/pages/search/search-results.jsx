import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import MainLayout from "../../components/mainlayout";

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

    fetch(`http://localhost:5000/api/members/search?q=${encodeURIComponent(query)}`, {
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 className="dashboard-title">🔍 Search Results</h1>
                <p className="dashboard-subtitle">
                  {query ? `Results for "${query}"` : "Enter a search term to find members"}
                </p>
              </div>
              <Link to="/members" className="btn-primary" style={{ textDecoration: 'none' }}>
                ← Back to Members
              </Link>
            </div>
          </div>

          {/* Search Info */}
          {query && (
            <div className="dashboard-card" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ color: '#0f172a' }}>Search Query:</strong>
                  <span style={{ 
                    marginLeft: '8px',
                    padding: '4px 12px',
                    background: '#f0fdfa',
                    color: '#0f766e',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {query}
                  </span>
                </div>
                {!loading && (
                  <div style={{ color: '#64748b', fontSize: '14px' }}>
                    {results.length} result{results.length !== 1 ? 's' : ''} found
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
            <div className="dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <h2 style={{ fontSize: '24px', color: '#64748b', marginBottom: '16px' }}>
                Ready to Search
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '16px' }}>
                Use the search feature in the members directory to find specific members.
              </p>
            </div>
          )}

          {/* No Results State */}
          {!loading && query && results.length === 0 && !error && (
            <div className="dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>😔</div>
              <h2 style={{ fontSize: '24px', color: '#64748b', marginBottom: '16px' }}>
                No Results Found
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '16px' }}>
                No members found matching "{query}". Try a different search term.
              </p>
            </div>
          )}

          {/* Results Table */}
          {!loading && results.length > 0 && (
            <div className="dashboard-card">
              <h2 className="dashboard-card-title">📋 Search Results</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ 
                        padding: '16px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Surname
                      </th>
                      <th style={{ 
                        padding: '16px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        First Name
                      </th>
                      <th style={{ 
                        padding: '16px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        County
                      </th>
                      <th style={{ 
                        padding: '16px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Category
                      </th>
                      <th style={{ 
                        padding: '16px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Status
                      </th>
                      <th style={{ 
                        padding: '16px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
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
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '16px', fontWeight: '500' }}>
                          {member.lastName}
                        </td>
                        <td style={{ padding: '16px' }}>
                          {member.firstName}
                        </td>
                        <td style={{ padding: '16px', color: '#64748b' }}>
                          {member.county || "—"}
                        </td>
                        <td style={{ padding: '16px', color: '#64748b' }}>
                          {member.category || "—"}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            borderRadius: '20px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            ...(member.isActive 
                              ? { 
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                                  color: 'white'
                                }
                              : { 
                                  background: '#f1f5f9', 
                                  color: '#64748b'
                                }
                            )
                          }}>
                            {member.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <Link
                            to={`/members/${member.id}`}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#14b8a6',
                              fontSize: '12px',
                              fontWeight: '600',
                              textDecoration: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#f0fdfa';
                              e.target.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'none';
                              e.target.style.textDecoration = 'none';
                            }}
                          >
                            View Details
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
