import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../../components/mainlayout";
import DeactivateConfirm from "../../components/deactivateconfirm";
import { useAuth } from "../../hooks/useauth";

export default function Members() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [countyFilter, setCountyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("lastName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [error, setError] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [countyOptions, setCountyOptions] = useState([]);

  // Remove forced redirect for public users

  useEffect(() => {
    fetch("http://localhost:5000/api/members", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setMembers(data);
        setIsLoading(false);
      })
      .catch(() => {
        setError("Failed to load members");
        setIsLoading(false);
      });
  }, []);

  const handleConfirmDeactivate = async () => {
    if (!selectedMember) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/members/${selectedMember.id}/deactivate`,
        { method: "PUT", credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        alert("Member deactivated.");
        setMembers((prev) =>
          prev.map((m) =>
            m.id === selectedMember.id ? { ...m, isActive: false } : m
          )
        );
      } else {
        alert("Failed to deactivate: " + data.message);
      }
    } catch {
      alert("Error deactivating member.");
    } finally {
      setSelectedMember(null);
      setShowConfirm(false);
    }
  };

  // Updated filter logic with sorting
  const filtered = members.filter((m) => {
    // Role-based filtering: Admin sees ALL members, others see backend-filtered results
    // The backend already handles role-based filtering, so don't filter by isActive here
    
    const matchesSearch = [m.firstName, m.lastName, m.county, m.address, m.role]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? m.isActive
        : !m.isActive;

    const matchesCategory =
      categoryFilter === "all" || m.category === categoryFilter;

    const matchesCounty =
      countyFilter === "all" || m.county === countyFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesCounty;
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
      case "address":
        aValue = a.address?.toLowerCase() || "";
        bValue = b.address?.toLowerCase() || "";
        break;
      case "category":
        aValue = a.category?.toLowerCase() || "";
        bValue = b.category?.toLowerCase() || "";
        break;
      case "role":
        aValue = a.role?.toLowerCase() || "";
        bValue = b.role?.toLowerCase() || "";
        break;
      case "status":
        aValue = a.isActive ? "active" : "inactive";
        bValue = b.isActive ? "active" : "inactive";
        break;
      default:
        aValue = a.lastName?.toLowerCase() || "";
        bValue = b.lastName?.toLowerCase() || "";
    }
    
    if (sortOrder === "asc") {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

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

  // Fetch lookup options for category and county
  useEffect(() => {
    fetch("http://localhost:5000/api/lookups/categories", { credentials: "include" })
      .then(res => res.json())
      .then(data => setCategoryOptions(data))
      .catch(() => setCategoryOptions([]));
    fetch("http://localhost:5000/api/lookups/counties", { credentials: "include" })
      .then(res => res.json())
      .then(data => setCountyOptions(data))
      .catch(() => setCountyOptions([]));
  }, []);

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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 className="dashboard-title">👥 Active Members</h1>
                <p className="dashboard-subtitle">
                  Browse active membership records
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* Export buttons for private and admin users */}
                {user && (user.role === "private" || user.role === "admin") && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => window.open('http://localhost:5000/api/export/members/csv', '_blank')}
                      style={{
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      📊 Export CSV
                    </button>
                    <button
                      onClick={() => window.open('http://localhost:5000/api/export/members/pdf', '_blank')}
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      📄 Export PDF
                    </button>
                  </div>
                )}
                
                {/* Add Member button for admin only */}
                {user && user.role === "admin" && (
                  <Link
                    to="/members/new"
                    className="btn-primary"
                    style={{
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>➕</span>
                    Add Member
                  </Link>
                )}
              </div>
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
              {(search || statusFilter !== "all" || categoryFilter !== "all" || countyFilter !== "all" || sortBy !== "lastName" || sortOrder !== "asc") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setCategoryFilter("all");
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
                <label className="form-label">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-input"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="form-label">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="form-input"
                >
                  <option value="all">All Categories</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.label}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">County</label>
                <select
                  value={countyFilter}
                  onChange={(e) => setCountyFilter(e.target.value)}
                  className="form-input"
                >
                  <option value="all">All Counties</option>
                  {countyOptions.map((c) => (
                    <option key={c.id} value={c.label}>{c.label}</option>
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
                    <option value="category">Category</option>
                    <option value="status">Status</option>
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
                
                {/* Quick actions */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => { setSortBy("lastName"); setSortOrder("asc"); }}
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: '500',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      background: sortBy === "lastName" && sortOrder === "asc" ? '#14b8a6' : 'white',
                      color: sortBy === "lastName" && sortOrder === "asc" ? 'white' : '#64748b',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    A-Z Names
                  </button>
                  <button
                    onClick={() => { setSortBy("county"); setSortOrder("asc"); }}
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: '500',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      background: sortBy === "county" && sortOrder === "asc" ? '#14b8a6' : 'white',
                      color: sortBy === "county" && sortOrder === "asc" ? 'white' : '#64748b',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    By County
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
                  ? ` total members` 
                  : ` of ${members.length} members`
                }
              </div>
              {(sortBy && sortBy !== "lastName") || sortOrder !== "asc" ? (
                <div style={{ 
                  fontSize: '12px',
                  padding: '4px 8px',
                  background: 'white',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0'
                }}>
                  Sorted by {sortBy === "lastName" ? "surname" : sortBy === "firstName" ? "first name" : sortBy} 
                  ({sortOrder === "asc" ? "A-Z" : "Z-A"})
                </div>
              ) : null}
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
                    <SortableHeader column="county">
                      County
                    </SortableHeader>
                    <SortableHeader column="address">
                      Address
                    </SortableHeader>
                    <SortableHeader column="category">
                      Category
                    </SortableHeader>
                    <SortableHeader column="role">
                      Role
                    </SortableHeader>
                    <SortableHeader column="status">
                      Status
                    </SortableHeader>
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
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ 
                        textAlign: 'center', 
                        padding: '48px', 
                        color: '#94a3b8',
                        fontSize: '14px'
                      }}>
                        {members.length === 0 ? 'No members found' : 'No members match your current filters'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((m, index) => (
                      <tr 
                        key={m.id} 
                        style={{ 
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '16px', fontWeight: '500' }}>{m.lastName}</td>
                        <td style={{ padding: '16px' }}>{m.firstName}</td>
                        <td style={{ padding: '16px', color: '#64748b' }}>{m.county}</td>
                        <td style={{ padding: '16px', color: '#64748b', fontSize: '12px' }}>{m.address || 'N/A'}</td>
                        <td style={{ padding: '16px', color: '#64748b' }}>{m.category}</td>
                        <td style={{ padding: '16px', color: '#64748b', fontSize: '12px' }}>{m.role || 'N/A'}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            borderRadius: '20px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            ...(m.isActive 
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
                            {m.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                          {/* View button for all roles */}
                          <Link
                            to={`/members/${m.id}`}
                            className="btn-secondary"
                            style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              textDecoration: 'none',
                              background: '#e0e7ef',
                              color: '#374151',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => e.target.style.background = '#cbd5e1'}
                            onMouseLeave={e => e.target.style.background = '#e0e7ef'}
                          >
                            View
                          </Link>
                          
                          {/* Export buttons for admin and private users */}
                          {user && (user.role === "admin" || user.role === "private") && (
                            <>
                              <button
                                onClick={() => window.open(`http://localhost:5000/api/export/member/${m.id}/csv`, '_blank')}
                                style={{
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  background: '#22c55e',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={e => e.target.style.background = '#16a34a'}
                                onMouseLeave={e => e.target.style.background = '#22c55e'}
                                title="Export as CSV"
                              >
                                CSV
                              </button>
                              <button
                                onClick={() => window.open(`http://localhost:5000/api/export/member/${m.id}/pdf`, '_blank')}
                                style={{
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  background: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={e => e.target.style.background = '#2563eb'}
                                onMouseLeave={e => e.target.style.background = '#3b82f6'}
                                title="Export as PDF"
                              >
                                PDF
                              </button>
                            </>
                          )}
                          
                          {/* Deactivate button for admin only */}
                          {user && user.role === "admin" && m.isActive && (
                            <button
                              onClick={() => {
                                setSelectedMember(m);
                                setShowConfirm(true);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#dc2626',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#fef2f2';
                                e.target.style.textDecoration = 'none';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'none';
                                e.target.style.textDecoration = 'underline';
                              }}
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && selectedMember && (
        <DeactivateConfirm
          memberName={`${selectedMember.firstName} ${selectedMember.lastName}`}
          onCancel={() => {
            setShowConfirm(false);
            setSelectedMember(null);
          }}
          onConfirm={handleConfirmDeactivate}
        />
      )}
    </MainLayout>
  );
}
