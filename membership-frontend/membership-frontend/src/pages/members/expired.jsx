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
          padding: '16px', 
          textAlign: 'left',
          fontWeight: '600',
          color: isActive ? '#14b8a6' : '#374151',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          cursor: 'pointer',
          userSelect: 'none',
          position: 'relative',
          transition: 'color 0.2s ease',
          borderBottom: isActive ? '2px solid #14b8a6' : '2px solid #e2e8f0'
        }}
        onClick={() => handleSort(column)}
        onMouseEnter={(e) => {
          if (!isActive) e.target.style.color = '#64748b';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.target.style.color = '#374151';
        }}
        title={`Sort by ${children}${isActive ? ` (currently ${sortOrder === "asc" ? "A-Z" : "Z-A"})` : ""}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {children}
          {isActive ? (
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 'bold',
              color: '#14b8a6'
            }}>
              {sortOrder === "asc" ? "↑" : "↓"}
            </span>
          ) : (
            <span style={{ 
              fontSize: '10px', 
              opacity: 0.4,
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
              <h1 className="dashboard-title">⏰ Expired Members</h1>
              <p className="dashboard-subtitle">
                Members with expired memberships
              </p>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '32px' }}>
              {error}
            </div>
          )}

          {/* Filter Bar */}
          <div className="dashboard-card" style={{ marginBottom: '24px' }}>
            <h2 className="dashboard-card-title">🔍 Search & Filters</h2>
            
            {/* Primary Search */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              <input
                type="text"
                placeholder="Search by name or county..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{
                  fontSize: '16px',
                  padding: '12px 16px',
                  flex: '1',
                  minWidth: '300px',
                  maxWidth: '500px'
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
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'white',
                    color: '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>✕</span>
                  Clear All
                </button>
              )}
            </div>

            {/* Filters Grid */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <label className="form-label">County</label>
                <select
                  value={countyFilter}
                  onChange={(e) => setCountyFilter(e.target.value)}
                  className="form-input"
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
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    color: '#64748b'
                  }}>
                    Sort by:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      fontSize: '13px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: 'white'
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
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: '500',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {sortOrder === "asc" ? "A → Z" : "Z → A"}
                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Results Summary */}
            <div style={{ 
              marginTop: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#64748b'
            }}>
              <div>
                <strong style={{ color: '#374151' }}>{filtered.length}</strong> 
                {filtered.length === members.length 
                  ? ` expired members` 
                  : ` of ${members.length} expired members`
                }
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div className="dashboard-card">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <SortableHeader column="lastName">
                      Surname
                    </SortableHeader>
                    <SortableHeader column="firstName">
                      First Name
                    </SortableHeader>
                    <SortableHeader column="membershipEndDate">
                      Membership End
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
                        padding: '48px', 
                        color: '#94a3b8',
                        fontSize: '14px'
                      }}>
                        {members.length === 0 ? 'No expired members found' : 'No members match your current filters'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((m, index) => (
                      <tr 
                        key={m.id || index} 
                        style={{ 
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '16px', fontWeight: '500' }}>{m.lastName || '—'}</td>
                        <td style={{ padding: '16px' }}>{m.firstName || '—'}</td>
                        <td style={{ padding: '16px', color: '#dc2626', fontWeight: '500' }}>
                          {m.membershipEndDate ? new Date(m.membershipEndDate).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '16px', color: '#64748b' }}>{m.county || '—'}</td>
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
