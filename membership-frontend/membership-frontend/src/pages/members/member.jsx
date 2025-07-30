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
  const [error, setError] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // Updated filter logic
  const filtered = members.filter((m) => {
    // Role-based filtering: Admin sees ALL members, others see backend-filtered results
    // The backend already handles role-based filtering, so don't filter by isActive here
    
    const matchesSearch = [m.firstName, m.lastName, m.county]
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
  });

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [countyOptions, setCountyOptions] = useState([]);

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
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <label className="form-label">Search</label>
                <input
                  type="text"
                  placeholder="Search by name or county..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-input"
                />
              </div>
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
            
            {/* Results Summary */}
            <div style={{ 
              marginTop: '16px',
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#64748b'
            }}>
              Showing <strong>{filtered.length}</strong> of <strong>{members.length}</strong> members
            </div>
          </div>

          {/* Members Table */}
          <div className="dashboard-card">
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
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ 
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
                        <td style={{ padding: '16px', color: '#64748b' }}>{m.category}</td>
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
