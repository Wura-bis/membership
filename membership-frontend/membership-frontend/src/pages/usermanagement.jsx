import { useEffect, useState } from "react";
import MainLayout from "../components/mainlayout";
import { useAuth } from "../hooks/useauth";

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Admin access check
  if (!user || user.role !== "admin") {
    return (
      <MainLayout>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>Access Denied</h1>
          <p>You must be an administrator to access user management.</p>
        </div>
      </MainLayout>
    );
  }

  useEffect(() => {
    fetch("http://localhost:5000/api/users", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setFilteredUsers(data);
        setIsLoading(false);
      })
      .catch(() => {
        setError("Failed to load users");
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    let filtered = users.filter((u) => {
      const matchesSearch = `${u.firstName} ${u.lastName} ${u.email || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" ? u.isActive : !u.isActive);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  const updateUser = async (id, action, payload) => {
    const endpointMap = {
      approve: "approve",
      status: "status", 
      role: "role",
    };
    try {
      const res = await fetch(
        `http://localhost:5000/api/users/${id}/${endpointMap[action]}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      // Refresh the list
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
                ...u,
                ...payload,
              }
            : u
        )
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const roleOptions = ["admin", "private", "public"];

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
              <h1 className="dashboard-title">👥 User Management</h1>
              <p className="dashboard-subtitle">
                Manage user roles, permissions, and account status
              </p>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '32px' }}>
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="dashboard-card" style={{ marginBottom: '24px' }}>
            <h2 className="dashboard-card-title">🔍 Search & Filters</h2>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <label className="form-label">Search Users</label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Filter by Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="form-input"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div>
                <label className="form-label">Filter by Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-input"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div style={{ 
              marginTop: '16px',
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#64748b'
            }}>
              Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> users
            </div>
          </div>

          {/* Users Table */}
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
                      User
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
                      Email
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
                      Role
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
                      Approval
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
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ 
                        textAlign: 'center', 
                        padding: '48px', 
                        color: '#94a3b8',
                        fontSize: '14px'
                      }}>
                        {users.length === 0 ? 'No users found' : 'No users match your current filters'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr 
                        key={u.id}
                        style={{ 
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.2s ease',
                          backgroundColor: u.id === user?.id ? '#f0fdfa' : 'transparent'
                        }}
                        onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = u.id === user?.id ? '#f0fdfa' : '#f8fafc'}
                        onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = u.id === user?.id ? '#f0fdfa' : 'transparent'}
                      >
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '600',
                              fontSize: '14px'
                            }}>
                              {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: '500', color: '#0f172a' }}>
                                {u.firstName} {u.lastName}
                                {u.id === user?.id && (
                                  <span style={{ 
                                    marginLeft: '8px',
                                    background: '#14b8a6',
                                    color: 'white',
                                    fontSize: '10px',
                                    padding: '2px 6px',
                                    borderRadius: '10px',
                                    fontWeight: '600'
                                  }}>
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>
                                ID: {u.userID || u.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px', color: '#64748b' }}>
                          {u.email || "No email"}
                        </td>
                        <td style={{ padding: '16px' }}>
                          {u.id === user?.id ? (
                            <span style={{
                              padding: '8px 12px',
                              background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
                              color: 'white',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              textTransform: 'uppercase'
                            }}>
                              {u.role}
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) =>
                                updateUser(u.id, "role", { role: e.target.value })
                              }
                              style={{
                                padding: '6px 10px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                fontSize: '12px',
                                background: 'white'
                              }}
                            >
                              {roleOptions.map((r) => (
                                <option key={r} value={r}>
                                  {r.charAt(0).toUpperCase() + r.slice(1)}
                                </option>
                              ))}
                            </select>
                          )}
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
                            ...(u.isActive 
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
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
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
                            ...(u.isApproved 
                              ? { 
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                                  color: 'white'
                                }
                              : { 
                                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                                  color: 'white'
                                }
                            )
                          }}>
                            {u.isApproved ? "Approved" : "Pending"}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          {u.id !== user?.id && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {!u.isApproved && (
                                <button
                                  onClick={() =>
                                    updateUser(u.id, "approve", { approve: true })
                                  }
                                  style={{
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                                >
                                  ✓ Approve
                                </button>
                              )}
                              {u.isActive ? (
                                <button
                                  onClick={() =>
                                    updateUser(u.id, "status", { isApproved: false })
                                  }
                                  style={{
                                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                                >
                                  ⏸ Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    updateUser(u.id, "status", { isApproved: true })
                                  }
                                  style={{
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                                >
                                  ▶ Activate
                                </button>
                              )}
                            </div>
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
    </MainLayout>
  );
}
