import { useState, useEffect } from "react";
import MainLayout from "../components/mainlayout";
import ConfirmModal from "../components/confirmmodal";
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
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

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
      
      // Show success message
      const actionText = payload.isApproved === false ? 'deactivated' : 'updated';
      alert(`User ${actionText} successfully!`);
      
    } catch (error) {
      alert(`Failed to update user: ${error.message}`);
    } finally {
      setShowConfirm(false);
      setConfirmAction(null);
    }
  };

  const handleConfirmUserAction = (userId, action, payload, user) => {
    if (action === 'status' && payload.isApproved === false) {
      // Show confirmation modal for user deactivation
      setConfirmAction({
        userId,
        action,
        payload,
        user,
        title: "⚠️ Deactivate User Account",
        message: `Are you sure you want to deactivate the account for "${user.name || user.username}"? This will prevent them from logging into the system.`,
        confirmLabel: "Deactivate"
      });
      setShowConfirm(true);
    } else {
      // Other actions don't need confirmation
      updateUser(userId, action, payload);
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
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ 
              fontSize: '38px', 
              fontWeight: '700', 
              color: '#0f766e', 
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              👥 User Management
            </h1>
            <p style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#64748b',
              margin: 0
            }}>
              Manage user roles, permissions, and account status
            </p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '32px' }}>
              {error}
            </div>
          )}

          {/* Filters */}
          <div style={{ 
            padding: '36px', 
            background: '#f0fdfa', 
            borderRadius: '12px', 
            boxShadow: '0 2px 12px rgba(20,184,166,0.08)', 
            border: '2px solid #5eead4',
            marginBottom: '24px'
          }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: '#0f766e',
              marginBottom: '28px'
            }}>
              🔍 Search & Filters
            </h2>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '10px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#0f766e'
                }}>
                  Search Users
                </label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '10px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#0f766e'
                }}>
                  Filter by Role
                </label>
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
                <label style={{ 
                  display: 'block',
                  marginBottom: '10px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#0f766e'
                }}>
                  Filter by Status
                </label>
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
              marginTop: '24px',
              padding: '16px 20px',
              background: 'white',
              borderRadius: '10px',
              border: '2px solid #ccfbf1',
              fontSize: '17px',
              fontWeight: '500',
              color: '#0f766e'
            }}>
              Showing <strong style={{ fontWeight: '700' }}>{filteredUsers.length}</strong> of <strong style={{ fontWeight: '700' }}>{users.length}</strong> users
            </div>
          </div>

          {/* Users Table */}
          <div style={{ 
            padding: '36px', 
            background: '#f0fdfa', 
            borderRadius: '12px', 
            boxShadow: '0 2px 12px rgba(20,184,166,0.08)', 
            border: '2px solid #5eead4'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '16px' }}>
                <thead>
                  <tr style={{ borderBottom: '3px solid #5eead4' }}>
                    <th style={{ 
                      padding: '20px 16px', 
                      textAlign: 'left',
                      fontWeight: '700',
                      color: '#0f766e',
                      fontSize: '16px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      User
                    </th>
                    <th style={{ 
                      padding: '20px 16px', 
                      textAlign: 'left',
                      fontWeight: '700',
                      color: '#0f766e',
                      fontSize: '16px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Email
                    </th>
                    <th style={{ 
                      padding: '20px 16px', 
                      textAlign: 'left',
                      fontWeight: '700',
                      color: '#0f766e',
                      fontSize: '16px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Role
                    </th>
                    <th style={{ 
                      padding: '20px 16px', 
                      textAlign: 'left',
                      fontWeight: '700',
                      color: '#0f766e',
                      fontSize: '16px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Status
                    </th>
                    <th style={{ 
                      padding: '20px 16px', 
                      textAlign: 'left',
                      fontWeight: '700',
                      color: '#0f766e',
                      fontSize: '16px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Approval
                    </th>
                    <th style={{ 
                      padding: '20px 16px', 
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
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ 
                        textAlign: 'center', 
                        padding: '64px 48px', 
                        color: '#64748b',
                        fontSize: '17px',
                        fontWeight: '500'
                      }}>
                        {users.length === 0 ? '📭 No users found' : '🔍 No users match your current filters'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr 
                        key={u.id}
                        style={{ 
                          borderBottom: '2px solid #ccfbf1',
                          transition: 'background-color 0.2s ease',
                          backgroundColor: u.id === user?.id ? '#d1fae5' : 'white'
                        }}
                        onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = u.id === user?.id ? '#d1fae5' : '#f0fdfa'}
                        onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = u.id === user?.id ? '#d1fae5' : 'white'}
                      >
                        <td style={{ padding: '20px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '17px',
                              border: '2px solid white',
                              boxShadow: '0 2px 8px rgba(20,184,166,0.2)'
                            }}>
                              {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', color: '#0f766e', fontSize: '17px' }}>
                                {u.firstName} {u.lastName}
                                {u.id === user?.id && (
                                  <span style={{ 
                                    marginLeft: '10px',
                                    background: '#14b8a6',
                                    color: 'white',
                                    fontSize: '12px',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontWeight: '700'
                                  }}>
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>
                                ID: {u.userID || u.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '20px 16px', color: '#0f766e', fontSize: '16px', fontWeight: '500' }}>
                          {u.email || "No email"}
                        </td>
                        <td style={{ padding: '20px 16px' }}>
                          {u.id === user?.id ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '10px 16px',
                              background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
                              color: 'white',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {u.role}
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) =>
                                updateUser(u.id, "role", { role: e.target.value })
                              }
                              className="form-input"
                              style={{
                                padding: '10px 14px',
                                fontSize: '15px',
                                minWidth: '140px'
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
                        <td style={{ padding: '20px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: '700',
                            borderRadius: '20px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            ...(u.isActive 
                              ? { 
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                                  color: 'white',
                                  border: '2px solid #059669'
                                }
                              : { 
                                  background: '#fee2e2', 
                                  color: '#dc2626',
                                  border: '2px solid #dc2626'
                                }
                            )
                          }}>
                            {u.isActive ? "✅ Active" : "❌ Inactive"}
                          </span>
                        </td>
                        <td style={{ padding: '20px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: '700',
                            borderRadius: '20px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            ...(u.isApproved 
                              ? { 
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                                  color: 'white',
                                  border: '2px solid #059669'
                                }
                              : { 
                                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                                  color: 'white',
                                  border: '2px solid #d97706'
                                }
                            )
                          }}>
                            {u.isApproved ? "✓ Approved" : "⏳ Pending"}
                          </span>
                        </td>
                        <td style={{ padding: '20px 16px' }}>
                          {u.id !== user?.id && (
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                              {!u.isApproved && (
                                <button
                                  onClick={() =>
                                    updateUser(u.id, "approve", { approve: true })
                                  }
                                  style={{
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    border: '2px solid #059669',
                                    padding: '10px 18px',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 6px rgba(5,150,105,0.3)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(5,150,105,0.4)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 2px 6px rgba(5,150,105,0.3)';
                                  }}
                                >
                                  ✓ Approve
                                </button>
                              )}
                              {u.isActive ? (
                                <button
                                  onClick={() =>
                                    handleConfirmUserAction(u.id, "status", { isApproved: false }, u)
                                  }
                                  style={{
                                    background: 'white',
                                    color: '#dc2626',
                                    border: '2px solid #dc2626',
                                    padding: '10px 18px',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.background = '#dc2626';
                                    e.target.style.color = 'white';
                                    e.target.style.transform = 'translateY(-2px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = 'white';
                                    e.target.style.color = '#dc2626';
                                    e.target.style.transform = 'translateY(0)';
                                  }}
                                >
                                  🔒 Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    updateUser(u.id, "status", { isApproved: true })
                                  }
                                  style={{
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    border: '2px solid #059669',
                                    padding: '10px 18px',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 6px rgba(5,150,105,0.3)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(5,150,105,0.4)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 2px 6px rgba(5,150,105,0.3)';
                                  }}
                                >
                                  🔓 Activate
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

        {/* Confirmation Modal */}
        {showConfirm && confirmAction && (
          <ConfirmModal
            isOpen={showConfirm}
            title={confirmAction.title}
            message={confirmAction.message}
            confirmLabel={confirmAction.confirmLabel}
            onConfirm={() => updateUser(confirmAction.userId, confirmAction.action, confirmAction.payload)}
            onCancel={() => {
              setShowConfirm(false);
              setConfirmAction(null);
            }}
          />
        )}
      </div>
    </MainLayout>
  );
}
