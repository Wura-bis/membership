import { useEffect, useState } from "react";
import MainLayout from "../../components/mainlayout";
import ConfirmModal from "../../components/confirmmodal";

export default function AdminApprovals() {
  const [pending, setPending] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/admin/approvals", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setPending(data);
        setIsLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch pending users");
        setIsLoading(false);
      });
  }, []);

  const handleAction = async (userID, action) => {
    setProcessingId(userID);
    try {
      const res = await fetch("http://localhost:5000/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userID, action }),
      });
      
      if (res.ok) {
        setPending((prev) => prev.filter((u) => u.userID !== userID));
        // Show success feedback
        const actionText = action === 'approve' ? 'approved' : 'rejected';
        alert(`User ${actionText} successfully!`);
      } else {
        throw new Error('Action failed');
      }
    } catch (err) {
      alert(`Failed to ${action} user. Please try again.`);
    } finally {
      setProcessingId(null);
      setShowConfirm(false);
      setConfirmAction(null);
    }
  };

  const handleConfirmAction = (userID, action, user) => {
    if (action === 'reject') {
      // Show confirmation modal for dangerous rejection action
      setConfirmAction({
        userID,
        action,
        user,
        title: "⚠️ Permanently Delete User Account",
        message: `Are you sure you want to PERMANENTLY DELETE the account for "${user.name}"? This action cannot be undone and will remove all user data from the system.`,
        confirmLabel: "Delete Forever"
      });
      setShowConfirm(true);
    } else {
      // Approve action doesn't need confirmation
      handleAction(userID, action);
    }
  };

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
              <h1 className="dashboard-title">🔍 Pending User Approvals</h1>
              <p className="dashboard-subtitle">
                Review and approve new user registration requests
              </p>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '32px' }}>
              {error}
            </div>
          )}

          {/* Stats Card */}
          <div className="dashboard-card" style={{ marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}>
              <div>
                <h2 className="dashboard-card-title">📊 Approval Queue</h2>
                <p style={{ color: '#64748b', fontSize: '14px' }}>
                  {pending.length} user{pending.length !== 1 ? 's' : ''} awaiting approval
                </p>
              </div>
              <div style={{
                background: pending.length > 0 
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '12px',
                fontSize: '24px',
                fontWeight: '700',
                minWidth: '60px',
                textAlign: 'center'
              }}>
                {pending.length}
              </div>
            </div>
          </div>

          {/* Pending Users Table */}
          <div className="dashboard-card">
            {pending.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '64px 32px',
                color: '#64748b'
              }}>
                <div style={{ 
                  fontSize: '48px', 
                  marginBottom: '16px' 
                }}>
                  ✅
                </div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  All caught up!
                </h3>
                <p style={{ fontSize: '14px' }}>
                  No pending user approvals at this time.
                </p>
              </div>
            ) : (
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
                        Contact
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
                        Requested Access
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
                        Signup Date
                      </th>
                      <th style={{ 
                        padding: '16px', 
                        textAlign: 'center',
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
                    {pending.map((user) => (
                      <tr 
                        key={user.userID}
                        style={{ 
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '600',
                              fontSize: '16px'
                            }}>
                              {user.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div style={{ fontWeight: '500', color: '#0f172a' }}>
                                {user.name}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>
                                ID: {user.userID}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ color: '#64748b' }}>
                            {user.email ? (
                              <div>
                                <div style={{ fontWeight: '500', color: '#374151' }}>
                                  {user.email}
                                </div>
                                <div style={{ fontSize: '12px' }}>
                                  📧 Email provided
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div style={{ fontWeight: '500', color: '#f59e0b' }}>
                                  No email
                                </div>
                                <div style={{ fontSize: '12px' }}>
                                  🚫 Email not provided
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            borderRadius: '20px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            ...(user.access === 'private' 
                              ? { 
                                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', 
                                  color: 'white'
                                }
                              : { 
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                                  color: 'white'
                                }
                            )
                          }}>
                            {user.access === 'private' ? '🔒 Private' : '🌐 Public'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#64748b' }}>
                          {user.createdAt ? (
                            <div>
                              <div style={{ fontWeight: '500', color: '#374151' }}>
                                {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                              <div style={{ fontSize: '12px' }}>
                                {new Date(user.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleConfirmAction(user.userID, "approve", user)}
                              disabled={processingId === user.userID}
                              style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: processingId === user.userID ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: processingId === user.userID ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              onMouseEnter={(e) => {
                                if (processingId !== user.userID) {
                                  e.target.style.transform = 'translateY(-1px)';
                                  e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                              }}
                            >
                              {processingId === user.userID ? (
                                <div className="spinner" style={{ width: '12px', height: '12px' }}></div>
                              ) : (
                                '✓'
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleConfirmAction(user.userID, "reject", user)}
                              disabled={processingId === user.userID}
                              style={{
                                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: processingId === user.userID ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: processingId === user.userID ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              onMouseEnter={(e) => {
                                if (processingId !== user.userID) {
                                  e.target.style.transform = 'translateY(-1px)';
                                  e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                              }}
                            >
                              {processingId === user.userID ? (
                                <div className="spinner" style={{ width: '12px', height: '12px' }}></div>
                              ) : (
                                '✕'
                              )}
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirm && confirmAction && (
          <ConfirmModal
            isOpen={showConfirm}
            title={confirmAction.title}
            message={confirmAction.message}
            confirmLabel={confirmAction.confirmLabel}
            onConfirm={() => handleAction(confirmAction.userID, confirmAction.action)}
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
