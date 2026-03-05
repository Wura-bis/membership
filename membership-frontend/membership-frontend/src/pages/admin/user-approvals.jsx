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
      // Show confirmation modal for rejecting private access request
      setConfirmAction({
        userID,
        action,
        user,
        title: "❌ Reject Private Access Request",
        message: `Are you sure you want to REJECT the private access request for "${user.name}"? This will revert their account to public status.`,
        confirmLabel: "Reject Request"
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
              🔍 Pending User Approvals
            </h1>
            <p style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#64748b',
              margin: 0
            }}>
              Review and approve new user registration requests
            </p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '32px' }}>
              {error}
            </div>
          )}

          {/* Stats Card */}
          <div style={{ 
            padding: '36px', 
            background: '#f0fdfa', 
            borderRadius: '12px', 
            boxShadow: '0 2px 12px rgba(20,184,166,0.08)', 
            border: '2px solid #5eead4',
            marginBottom: '24px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}>
              <div>
                <h2 style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#0f766e',
                  marginBottom: '12px'
                }}>
                  📊 Approval Queue
                </h2>
                <p style={{ 
                  color: '#0f766e', 
                  fontSize: '17px',
                  fontWeight: '500',
                  margin: 0
                }}>
                  <strong style={{ fontWeight: '700' }}>{pending.length}</strong> user{pending.length !== 1 ? 's' : ''} awaiting approval
                </p>
              </div>
              <div style={{
                background: pending.length > 0 
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '20px 32px',
                borderRadius: '16px',
                fontSize: '48px',
                fontWeight: '800',
                minWidth: '100px',
                textAlign: 'center',
                boxShadow: pending.length > 0 
                  ? '0 6px 20px rgba(245, 158, 11, 0.4)'
                  : '0 6px 20px rgba(16, 185, 129, 0.4)',
                border: '3px solid white'
              }}>
                {pending.length}
              </div>
            </div>
          </div>

          {/* Pending Users Table */}
          <div style={{ 
            padding: '36px', 
            background: '#f0fdfa', 
            borderRadius: '12px', 
            boxShadow: '0 2px 12px rgba(20,184,166,0.08)', 
            border: '2px solid #5eead4'
          }}>
            {pending.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '80px 48px',
                color: '#0f766e'
              }}>
                <div style={{ 
                  fontSize: '80px', 
                  marginBottom: '24px' 
                }}>
                  ✅
                </div>
                <h3 style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  marginBottom: '12px',
                  color: '#0f766e'
                }}>
                  All caught up!
                </h3>
                <p style={{ 
                  fontSize: '17px',
                  fontWeight: '500',
                  color: '#64748b'
                }}>
                  No pending user approvals at this time.
                </p>
              </div>
            ) : (
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
                        Contact
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
                        Requested Access
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
                        Signup Date
                      </th>
                      <th style={{ 
                        padding: '20px 16px', 
                        textAlign: 'center',
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
                    {pending.map((user) => (
                      <tr 
                        key={user.userID}
                        style={{ 
                          borderBottom: '2px solid #ccfbf1',
                          transition: 'background-color 0.2s ease',
                          backgroundColor: 'white'
                        }}
                        onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#d1fae5'}
                        onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 'white'}
                      >
                        <td style={{ padding: '20px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '20px',
                              border: '3px solid white',
                              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                            }}>
                              {user.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', color: '#0f766e', fontSize: '17px' }}>
                                {user.name}
                              </div>
                              <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>
                                ID: {user.userID}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '20px 16px' }}>
                          <div>
                            {user.email ? (
                              <div>
                                <div style={{ fontWeight: '600', color: '#0f766e', fontSize: '16px' }}>
                                  {user.email}
                                </div>
                                <div style={{ fontSize: '14px', color: '#059669', marginTop: '4px', fontWeight: '500' }}>
                                  📧 Email provided
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div style={{ fontWeight: '600', color: '#f59e0b', fontSize: '16px' }}>
                                  No email
                                </div>
                                <div style={{ fontSize: '14px', color: '#d97706', marginTop: '4px', fontWeight: '500' }}>
                                  ⚠️ Email not provided
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '20px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '10px 18px',
                            fontSize: '14px',
                            fontWeight: '700',
                            borderRadius: '20px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            ...(user.access === 'private' 
                              ? { 
                                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', 
                                  color: 'white',
                                  border: '2px solid #4f46e5'
                                }
                              : { 
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                                  color: 'white',
                                  border: '2px solid #059669'
                                }
                            )
                          }}>
                            {user.access === 'private' ? '🔒 Private' : '🌐 Public'}
                          </span>
                        </td>
                        <td style={{ padding: '20px 16px' }}>
                          {user.createdAt ? (
                            <div>
                              <div style={{ fontWeight: '600', color: '#0f766e', fontSize: '16px' }}>
                                {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                              <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>
                                {new Date(user.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '16px' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '20px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleConfirmAction(user.userID, "approve", user)}
                              disabled={processingId === user.userID}
                              style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                border: '2px solid #059669',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontSize: '15px',
                                fontWeight: '700',
                                cursor: processingId === user.userID ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: processingId === user.userID ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                              }}
                              onMouseEnter={(e) => {
                                if (processingId !== user.userID) {
                                  e.target.style.transform = 'translateY(-2px)';
                                  e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.5)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                              }}
                            >
                              {processingId === user.userID ? (
                                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                              ) : (
                                <span style={{ fontSize: '18px' }}>✓</span>
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleConfirmAction(user.userID, "reject", user)}
                              disabled={processingId === user.userID}
                              style={{
                                background: 'white',
                                color: '#dc2626',
                                border: '2px solid #dc2626',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontSize: '15px',
                                fontWeight: '700',
                                cursor: processingId === user.userID ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: processingId === user.userID ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                              onMouseEnter={(e) => {
                                if (processingId !== user.userID) {
                                  e.target.style.background = '#dc2626';
                                  e.target.style.color = 'white';
                                  e.target.style.transform = 'translateY(-2px)';
                                  e.target.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.4)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'white';
                                e.target.style.color = '#dc2626';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                              }}
                            >
                              {processingId === user.userID ? (
                                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                              ) : (
                                <span style={{ fontSize: '18px' }}>✕</span>
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
