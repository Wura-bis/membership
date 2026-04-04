import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../../components/mainlayout";
import DeactivateConfirm from "../../components/deactivateconfirm";
import { useAuth } from "../../hooks/useauth";
import { API_BASE_URL } from '../../utils/api';

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
  const [volunteeringFilter, setVolunteeringFilter] = useState("all");
  const [volunteeringOptions, setVolunteeringOptions] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Remove forced redirect for public users

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/members`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setMembers(Array.isArray(data) ? data : []);
        if (!Array.isArray(data) && data.error) setError(data.error);
        // Derive unique volunteering interests from loaded member data
        if (Array.isArray(data)) {
          const allInterests = [...new Set(data.flatMap(m => m.volunteeringInterests || []))].sort();
          setVolunteeringOptions(allInterests);
        }
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
        `${API_BASE_URL}/api/members/${selectedMember.id}/deactivate`,
        { method: "POST", credentials: "include" }
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
    
    const matchesSearch = [m.firstName, m.lastName, m.county, m.address, m.role, ...(m.volunteeringInterests || [])]
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

    const matchesVolunteering =
      volunteeringFilter === "all" || (m.volunteeringInterests || []).includes(volunteeringFilter);

    return matchesSearch && matchesStatus && matchesCategory && matchesCounty && matchesVolunteering;
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

  // Pagination calculation
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMembers = filtered.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, categoryFilter, countyFilter, sortBy, sortOrder]);

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
          padding: '20px', 
          textAlign: 'left',
          fontWeight: '700',
          color: isActive ? '#14b8a6' : '#0f766e',
          fontSize: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          cursor: 'pointer',
          userSelect: 'none',
          position: 'relative',
          transition: 'color 0.2s ease',
          background: isActive ? '#e0f2fe' : 'transparent'
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
              fontSize: '16px', 
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

  // Fetch lookup options for category and county
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/lookups/categories`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setCategoryOptions(data))
      .catch(() => setCategoryOptions([]));
    fetch(`${API_BASE_URL}/api/lookups/counties`, { credentials: "include" })
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <h1 className="dashboard-title" style={{ fontSize: '38px', fontWeight: '800', margin: 0 }}>
                  👥 Member Directory
                </h1>
                <p className="dashboard-subtitle" style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
                  Browse all membership records
                </p>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Export buttons for private and admin users */}
                {user && (user.role === "private" || user.role === "admin") && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => window.open(`${API_BASE_URL}/api/export/members/csv`, '_blank')}
                      style={{
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        color: 'white',
                        border: '2px solid #16a34a',
                        padding: '14px 28px',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.3)';
                      }}
                    >
                      📊 Export CSV
                    </button>
                    <button
                      onClick={() => window.open(`${API_BASE_URL}/api/export/members/pdf`, '_blank')}
                      style={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        border: '2px solid #dc2626',
                        padding: '14px 28px',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
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
                      📄 Export PDF
                    </button>
                  </div>
                )}
                
                {/* Add Member button for admin only */}
                {user && user.role === "admin" && (
                  <Link
                    to="/members/new"
                    style={{
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '14px 28px',
                      fontSize: '16px',
                      fontWeight: '700',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
                      color: 'white',
                      border: '2px solid #0f766e',
                      boxShadow: '0 2px 8px rgba(20, 184, 166, 0.3)',
                      transition: 'all 0.2s ease'
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
          <div style={{ 
            marginBottom: '32px', 
            padding: '36px', 
            background: '#f0fdfa',
            borderRadius: '16px',
            border: '2px solid #5eead4',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.15)'
          }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: '#0f766e', 
              marginBottom: '28px',
              margin: 0,
              marginBottom: '28px'
            }}>
              🔍 Search & Filters
            </h2>
            
            {/* Primary Search */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              marginBottom: '24px',
              flexWrap: 'wrap'
            }}>
              <input
                type="text"
                placeholder="Search by name or county..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{
                  fontSize: '18px',
                  padding: '18px 24px',
                  flex: '1',
                  minWidth: '320px',
                  maxWidth: '600px',
                  border: '2px solid #5eead4',
                  borderRadius: '10px'
                }}
              />
              {(search || statusFilter !== "all" || categoryFilter !== "all" || countyFilter !== "all" || volunteeringFilter !== "all" || sortBy !== "lastName" || sortOrder !== "asc") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setCategoryFilter("all");
                    setCountyFilter("all");
                    setVolunteeringFilter("all");
                    setSortBy("lastName");
                    setSortOrder("asc");
                  }}
                  style={{
                    padding: '18px 28px',
                    fontSize: '17px',
                    fontWeight: '700',
                    border: '2px solid #14b8a6',
                    borderRadius: '10px',
                    background: 'white',
                    color: '#0f766e',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    minHeight: '58px'
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '24px'
            }}>
              <div>
                <label className="form-label" style={{ fontSize: '17px', fontWeight: '700', color: '#0f766e', marginBottom: '14px', display: 'block' }}>Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '17px', padding: '18px 24px', border: '2px solid #5eead4', borderRadius: '10px', fontWeight: '600' }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '17px', fontWeight: '700', color: '#0f766e', marginBottom: '14px', display: 'block' }}>Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '17px', padding: '18px 24px', border: '2px solid #5eead4', borderRadius: '10px', fontWeight: '600' }}
                >
                  <option value="all">All Categories</option>
                  {categoryOptions.map((c) => (
                    <option key={c.value} value={c.label}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '17px', fontWeight: '700', color: '#0f766e', marginBottom: '14px', display: 'block' }}>County</label>
                <select
                  value={countyFilter}
                  onChange={(e) => setCountyFilter(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '17px', padding: '18px 24px', border: '2px solid #5eead4', borderRadius: '10px', fontWeight: '600' }}
                >
                  <option value="all">All Counties</option>
                  {countyOptions.map((c) => (
                    <option key={c.id} value={c.label}>{c.label}</option>
                  ))}
                </select>
              </div>
              {user && (user.role === 'admin' || user.role === 'private') && volunteeringOptions.length > 0 && (
                <div>
                  <label className="form-label" style={{ fontSize: '17px', fontWeight: '700', color: '#0f766e', marginBottom: '14px', display: 'block' }}>Volunteering Interest</label>
                  <select
                    value={volunteeringFilter}
                    onChange={(e) => setVolunteeringFilter(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '17px', padding: '18px 24px', border: '2px solid #5eead4', borderRadius: '10px', fontWeight: '600' }}
                  >
                    <option value="all">All Interests</option>
                    {volunteeringOptions.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

          </div>

          {/* Results Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            margin: '20px 0 16px',
            padding: '0 4px'
          }}>
            <div style={{ fontSize: '17px', fontWeight: '600', color: '#0f766e' }}>
              <strong style={{ fontSize: '22px', fontWeight: '800', color: '#14b8a6' }}>{filtered.length}</strong>
              {' '}{filtered.length === members.length
                ? `total ${filtered.length === 1 ? 'member' : 'members'}`
                : `of ${members.length} ${members.length === 1 ? 'member' : 'members'}`}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#64748b' }}>Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                style={{ padding: '10px 16px', fontSize: '16px', border: '2px solid #5eead4', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', background: 'white' }}
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value={filtered.length}>All ({filtered.length})</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div style={{ 
            padding: '36px', 
            background: 'white',
            borderRadius: '16px',
            border: '2px solid #5eead4',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.15)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '17px' }}>
                <thead>
                  <tr style={{ borderBottom: '3px solid #5eead4', background: '#f0fdfa' }}>
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
                    <th style={{
                      padding: '20px',
                      textAlign: 'left',
                      fontWeight: '700',
                      color: '#0f766e',
                      fontSize: '16px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Volunteering
                    </th>
                    <th style={{ 
                      padding: '20px', 
                      textAlign: 'left',
                      fontWeight: '700',
                      color: '#0f766e',
                      fontSize: '16px',
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
                        padding: '80px 48px'
                      }}>
                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>
                          {members.length === 0 ? '👥' : '🔍'}
                        </div>
                        <div style={{ 
                          fontSize: '24px',
                          fontWeight: '700',
                          color: '#0f766e',
                          marginBottom: '12px'
                        }}>
                          {members.length === 0 ? 'No Members Found' : 'No Matching Members'}
                        </div>
                        <div style={{
                          fontSize: '17px',
                          fontWeight: '500',
                          color: '#64748b'
                        }}>
                          {members.length === 0 ? 'There are no members in the database' : 'No members match your current filters'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedMembers.map((m, index) => (
                      <tr 
                        key={m.id} 
                        style={{ 
                          borderBottom: '2px solid #ccfbf1',
                          background: 'white',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#f0fdfa'}
                        onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 'white'}
                      >
                        <td style={{ padding: '20px', fontWeight: '700', fontSize: '17px', color: '#0f766e' }}>{m.lastName}</td>
                        <td style={{ padding: '20px', fontSize: '17px', fontWeight: '600', color: '#0f766e' }}>{m.firstName}</td>
                        <td style={{ padding: '20px', color: '#64748b', fontSize: '16px', fontWeight: '500' }}>{m.county}</td>
                        <td style={{ padding: '20px', color: '#64748b', fontSize: '16px', fontWeight: '500' }}>{m.address || 'N/A'}</td>
                        <td style={{ padding: '20px', color: '#64748b', fontSize: '16px', fontWeight: '500' }}>{m.category}</td>
                        <td style={{ padding: '20px', color: '#64748b', fontSize: '16px', fontWeight: '500' }}>{m.role || 'N/A'}</td>
                        <td style={{ padding: '16px 20px' }}>
                          {Array.isArray(m.volunteeringInterests) && m.volunteeringInterests.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {m.volunteeringInterests.map((interest, idx) => (
                                <span key={idx} style={{
                                  padding: '4px 10px',
                                  background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                                  border: '1.5px solid #14b8a6',
                                  borderRadius: '10px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: '#0f766e',
                                  whiteSpace: 'nowrap'
                                }}>{interest}</span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontSize: '15px' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '16px 20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {/* View button for all roles */}
                          <Link
                            to={`/members/${m.id}`}
                            style={{
                              fontSize: '15px',
                              fontWeight: '700',
                              lineHeight: '1.2',
                              padding: '10px 18px',
                              borderRadius: '8px',
                              textDecoration: 'none',
                              background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
                              color: 'white',
                              transition: 'all 0.2s ease',
                              border: '2px solid #0f766e',
                              boxShadow: '0 2px 6px rgba(20, 184, 166, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              whiteSpace: 'nowrap',
                              boxSizing: 'border-box'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 10px rgba(20, 184, 166, 0.45)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 6px rgba(20, 184, 166, 0.3)';
                            }}
                          >
                            👁️ View
                          </Link>
                          
                          {/* Edit button for admin only */}
                          {user && user.role === "admin" && (
                            <Link
                              to={`/members/edit/${m.id}`}
                              style={{
                                fontSize: '15px',
                                fontWeight: '700',
                                lineHeight: '1.2',
                                padding: '10px 18px',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: 'white',
                                transition: 'all 0.2s ease',
                                border: '2px solid #d97706',
                                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                whiteSpace: 'nowrap',
                                boxSizing: 'border-box'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 10px rgba(245, 158, 11, 0.45)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(245, 158, 11, 0.3)';
                              }}
                            >
                              ✏️ Edit
                            </Link>
                          )}

                          {/* Deactivate button for admin only */}
                          {user && user.role === "admin" && m.isActive && (
                            <button
                              onClick={() => {
                                setSelectedMember(m);
                                setShowConfirm(true);
                              }}
                              style={{
                                background: '#fef2f2',
                                border: '2px solid #dc2626',
                                color: '#dc2626',
                                fontSize: '15px',
                                fontWeight: '700',
                                lineHeight: '1.2',
                                cursor: 'pointer',
                                padding: '10px 18px',
                                borderRadius: '8px',
                                transition: 'all 0.2s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                whiteSpace: 'nowrap',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit',
                                WebkitAppearance: 'none',
                                appearance: 'none',
                                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.15)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#dc2626';
                                e.currentTarget.style.color = 'white';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 10px rgba(220, 38, 38, 0.35)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#fef2f2';
                                e.currentTarget.style.color = '#dc2626';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(220, 38, 38, 0.15)';
                              }}
                            >
                              🚫 Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filtered.length > 0 && totalPages > 1 && (
              <div style={{ 
                marginTop: '32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
                padding: '24px',
                background: '#ffffff',
                borderRadius: '12px',
                border: '2px solid #ccfbf1'
              }}>
                {/* Page info */}
                <div style={{ 
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#0f766e'
                }}>
                  Showing {startIndex + 1}-{Math.min(endIndex, filtered.length)} of {filtered.length} members
                </div>

                {/* Pagination buttons */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* Previous button */}
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: '14px 24px',
                      fontSize: '16px',
                      fontWeight: '700',
                      border: '2px solid #5eead4',
                      borderRadius: '8px',
                      background: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                      color: currentPage === 1 ? '#94a3b8' : '#0f766e',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: currentPage === 1 ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== 1) {
                        e.target.style.background = '#ccfbf1';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== 1) {
                        e.target.style.background = '#ffffff';
                      }
                    }}
                  >
                    ← Previous
                  </button>

                  {/* Page numbers */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          style={{
                            padding: '14px 18px',
                            fontSize: '16px',
                            fontWeight: '700',
                            border: currentPage === pageNum ? '2px solid #14b8a6' : '2px solid #e5e7eb',
                            borderRadius: '8px',
                            background: currentPage === pageNum ? '#14b8a6' : '#ffffff',
                            color: currentPage === pageNum ? '#ffffff' : '#64748b',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            minWidth: '48px'
                          }}
                          onMouseEnter={(e) => {
                            if (currentPage !== pageNum) {
                              e.target.style.background = '#f0fdfa';
                              e.target.style.borderColor = '#5eead4';
                              e.target.style.color = '#0f766e';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (currentPage !== pageNum) {
                              e.target.style.background = '#ffffff';
                              e.target.style.borderColor = '#e5e7eb';
                              e.target.style.color = '#64748b';
                            }
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next button */}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '14px 24px',
                      fontSize: '16px',
                      fontWeight: '700',
                      border: '2px solid #5eead4',
                      borderRadius: '8px',
                      background: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                      color: currentPage === totalPages ? '#94a3b8' : '#0f766e',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: currentPage === totalPages ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== totalPages) {
                        e.target.style.background = '#ccfbf1';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== totalPages) {
                        e.target.style.background = '#ffffff';
                      }
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
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
