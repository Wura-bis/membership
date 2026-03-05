import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useauth";
import MainLayout from "../../components/mainlayout";

export default function ExpiredMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [countyFilter, setCountyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("lastName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/members/expired", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch expired members");
        return res.json();
      })
      .then((data) => {
        setMembers(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch((err) => {
        setError("Failed to load expired members");
        setIsLoading(false);
      });
  }, []);

  // Helper function to handle column header clicks
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Helper function to render sortable column header
  const SortableHeader = ({ column, children }) => {
    const isActive = sortBy === column;
    return (
      <th 
        style={{ 
          padding: '22px 24px', 
          textAlign: 'left',
          fontWeight: '700',
          color: isActive ? '#14b8a6' : '#0f766e',
          fontSize: '17px',
          cursor: 'pointer',
          userSelect: 'none',
          position: 'relative',
          transition: 'all 0.2s ease'
        }}
        onClick={() => handleSort(column)}
        onMouseEnter={(e) => {
          if (!isActive) e.target.style.color = '#14b8a6';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.target.style.color = '#0f766e';
        }}
        title={`Sort by ${children}${isActive ? ` (currently ${sortOrder === "asc" ? "A-Z" : "Z-A"})` : ""}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {children}
          {isActive ? (
            <span style={{ 
              fontSize: '18px', 
              fontWeight: 'bold',
              color: '#14b8a6'
            }}>
              {sortOrder === "asc" ? "↑" : "↓"}
            </span>
          ) : (
            <span style={{ 
              fontSize: '14px', 
              opacity: 0.5,
              transition: 'opacity 0.2s ease'
            }}>
              ↕
            </span>
          )}
        </div>
      </th>
    );
  };

  // Get unique counties for filter dropdown
  const countyOptions = [...new Set(members.map(m => m.county).filter(Boolean))].sort();

  // Filter and sort members
  const filtered = members.filter((m) => {
    const matchesSearch = [m.firstName, m.lastName, m.county]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCounty = countyFilter === "all" || m.county === countyFilter;

    return matchesSearch && matchesCounty;
  }).sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case "firstName":
        aValue = a.firstName?.toLowerCase() || "";
        bValue = b.firstName?.toLowerCase() || "";
        break;
      case "lastName":
        aValue = a.lastName?.toLowerCase() || "";
        bValue = b.lastName?.toLowerCase() || "";
        break;
      case "county":
        aValue = a.county?.toLowerCase() || "";
        bValue = b.county?.toLowerCase() || "";
        break;
      case "membershipEndDate":
        aValue = new Date(a.membershipEndDate || "1900-01-01");
        bValue = new Date(b.membershipEndDate || "1900-01-01");
        break;
      default:
        aValue = a.lastName?.toLowerCase() || "";
        bValue = b.lastName?.toLowerCase() || "";
    }
    
    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
    }
  });

  if (isLoading) {
    return (
      <MainLayout>
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
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-title" style={{ fontSize: '38px', fontWeight: '800' }}>⏰ Expired Memberships</h1>
              <p className="dashboard-subtitle" style={{ fontSize: '20px', fontWeight: '600' }}>
                Members whose memberships require renewal
              </p>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '32px' }}>
              {error}
            </div>
          )}

          {/* Filter Bar */}
          <div className="dashboard-card" style={{ marginBottom: '28px', padding: '36px', background: '#f0fdfa', border: '2px solid #14b8a6' }}>
            <h2 className="dashboard-card-title" style={{ fontSize: '24px', fontWeight: '700', marginBottom: '28px', color: '#0f766e' }}>🔍 Search & Filter</h2>
            
            {/* Primary Search */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px', 
              marginBottom: '28px',
              flexWrap: 'wrap'
            }}>
              <input
                type="text"
                placeholder="Search by name or county..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{
                  fontSize: '17px',
                  padding: '18px 24px',
                  flex: '1',
                  minWidth: '320px',
                  maxWidth: '600px',
                  border: '2px solid #14b8a6',
                  borderRadius: '10px',
                  fontWeight: '600',
                  background: 'white'
                }}
              />
              {(search || countyFilter !== "all" || sortBy !== "lastName" || sortOrder !== "asc") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setCountyFilter("all");
                    setSortBy("lastName");
                    setSortOrder("asc");
                  }}
                  style={{
                    padding: '18px 28px',
                    fontSize: '17px',
                    fontWeight: '700',
                    border: '2px solid #ef4444',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    minHeight: '58px',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                  }}
                >
                  <span style={{ fontSize: '20px' }}>✕</span>
                  Clear All
                </button>
              )}
            </div>

            {/* Filters Grid */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '28px'
            }}>
              <div>
                <label className="form-label" style={{ fontSize: '17px', fontWeight: '700', marginBottom: '14px', display: 'block', color: '#0f766e' }}>📍 County</label>
                <select
                  value={countyFilter}
                  onChange={(e) => setCountyFilter(e.target.value)}
                  className="form-input"
                  style={{
                    fontSize: '17px',
                    padding: '18px 24px',
                    border: '2px solid #14b8a6',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: 'white'
                  }}
                >
                  <option value="all">All Counties</option>
                  {countyOptions.map((county) => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort Controls */}
            <div style={{
              padding: '24px',
              background: 'white',
              borderRadius: '12px',
              border: '2px solid #14b8a6'
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ 
                    fontSize: '17px', 
                    fontWeight: '700', 
                    color: '#0f766e'
                  }}>
                    ⚡ Sort by:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      padding: '14px 20px',
                      fontSize: '17px',
                      border: '2px solid #14b8a6',
                      borderRadius: '10px',
                      background: 'white',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="lastName">Last Name</option>
                    <option value="firstName">First Name</option>
                    <option value="county">County</option>
                    <option value="membershipEndDate">Expiry Date</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    style={{
                      padding: '14px 24px',
                      fontSize: '17px',
                      fontWeight: '700',
                      border: '2px solid #14b8a6',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(20, 184, 166, 0.3)'
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
                    {sortOrder === "asc" ? "A → Z" : "Z → A"}
                    <span style={{ fontSize: '20px' }}>{sortOrder === "asc" ? "↑" : "↓"}</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Results Summary */}
            <div style={{ 
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '20px 28px',
              background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
              borderRadius: '12px',
              border: '2px solid #14b8a6',
              fontSize: '17px',
              fontWeight: '700',
              color: '#0f766e',
              boxShadow: '0 2px 8px rgba(20, 184, 166, 0.15)'
            }}>
              <div>
                📊 Showing <strong style={{ fontSize: '24px', color: '#14b8a6' }}>{filtered.length}</strong> 
                {filtered.length === members.length 
                  ? ` expired member${filtered.length !== 1 ? 's' : ''}` 
                  : ` of ${members.length} expired members`
                }
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div className="dashboard-card" style={{ padding: '36px', border: '2px solid #14b8a6' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '17px', borderCollapse: 'separate', borderSpacing: '0' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)', borderBottom: '3px solid #14b8a6' }}>
                    <SortableHeader column="lastName">
                      Surname
                    </SortableHeader>
                    <SortableHeader column="firstName">
                      First Name
                    </SortableHeader>
                    <SortableHeader column="membershipEndDate">
                      Expiry Date
                    </SortableHeader>
                    <SortableHeader column="county">
                      County
                    </SortableHeader>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ 
                        textAlign: 'center', 
                        padding: '100px 40px', 
                        color: '#64748b'
                      }}>
                        <div style={{ fontSize: '80px', marginBottom: '24px' }}>⏰</div>
                        <h3 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '16px', color: '#374151' }}>
                          {members.length === 0 ? 'No Expired Members' : 'No Members Found'}
                        </h3>
                        <p style={{ fontSize: '18px', fontWeight: '500' }}>
                          {members.length === 0 ? 'All memberships are current!' : 'Try adjusting your search or filter criteria.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((m, index) => (
                      <tr 
                        key={m.id || index} 
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
                        <td style={{ padding: '20px 24px', fontWeight: '700', fontSize: '17px', color: '#0f172a' }}>{m.lastName || '—'}</td>
                        <td style={{ padding: '20px 24px', fontWeight: '600', fontSize: '17px', color: '#374151' }}>{m.firstName || '—'}</td>
                        <td style={{ padding: '20px 24px', color: '#ef4444', fontWeight: '700', fontSize: '17px' }}>
                          {m.membershipEndDate ? new Date(m.membershipEndDate).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '20px 24px', color: '#64748b', fontWeight: '500', fontSize: '17px' }}>{m.county || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
