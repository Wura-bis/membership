import { useEffect, useState } from "react";
import MainLayout from "../../components/mainlayout";
import { useStickyScrollbar } from "../../hooks/useStickyScrollbar";
import ConfirmModal from "../../components/confirmmodal";
import { useToast } from "../../components/toast";
import { API_BASE_URL } from '../../utils/api';
import { T, card, thStyle, tdStyle, btn, badge, avatarStyle, pageHeader } from '../../utils/theme';
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useauth";

export default function AdminApprovals() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [pending, setPending] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const { tableWrapRef, mirrorScrollbar } = useStickyScrollbar([pending]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/approvals`, { credentials: "include" })
      .then(res => res.json())
      .then(data => { setPending(data); setIsLoading(false); })
      .catch(() => { setError("Failed to fetch pending users"); setIsLoading(false); });
  }, []);

  const loadAllUsers = () => {
    if (allUsers.length > 0) { setShowAllUsers(v => !v); return; }
    setAllUsersLoading(true);
    fetch(`${API_BASE_URL}/api/users`, { credentials: "include" })
      .then(res => res.json())
      .then(data => { setAllUsers(Array.isArray(data) ? data : []); setShowAllUsers(true); setAllUsersLoading(false); })
      .catch(() => { showToast("Failed to load users", "error"); setAllUsersLoading(false); });
  };

  const handleDeleteUser = async (uid, name) => {
    setDeleteConfirm({ uid, name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { uid, name } = deleteConfirm;
    setDeleteConfirm(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${uid}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setAllUsers(prev => prev.filter(u => u.id !== uid));
        showToast(`User "${name}" deleted.`, "info");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to delete user", "error");
      }
    } catch { showToast("Failed to delete user", "error"); }
  };

  const handleAction = async (userID, action) => {
    setProcessingId(userID);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/approvals`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ userID, action }),
      });
      if (res.ok) {
        setPending(prev => prev.filter(u => u.userID !== userID));
        showToast(`User ${action === 'approve' ? 'approved' : 'rejected'} successfully!`, action === 'approve' ? 'success' : 'info');
      } else { throw new Error('Action failed'); }
    } catch { showToast(`Failed to ${action} user. Please try again.`, 'error'); }
    finally { setProcessingId(null); setShowConfirm(false); setConfirmAction(null); }
  };

  const handleConfirmAction = (userID, action, user) => {
    if (action === 'reject') {
      setConfirmAction({ userID, action, user, title: "Reject Access Request", message: `Reject the private access request for "${user.name}"? This will revert their account to public status.`, confirmLabel: "Reject" });
      setShowConfirm(true);
    } else {
      handleAction(userID, action);
    }
  };

  if (isLoading) return (
    <MainLayout>
      <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          <div style={pageHeader.wrapper}>
            <div>
              <h1 style={pageHeader.title}>Pending User Approvals</h1>
              <p style={pageHeader.subtitle}>Review and approve new user registration requests</p>
            </div>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

          <div style={{ ...card, padding: '20px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Approval Queue</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: T.textMain }}>
                {pending.length}
                <span style={{ fontSize: T.fontMd, fontWeight: '500', color: T.textMuted, marginLeft: '8px' }}>
                  {pending.length === 1 ? 'user' : 'users'} awaiting approval
                </span>
              </div>
            </div>
            <span style={{ ...(pending.length > 0 ? badge.pending : badge.active), fontSize: '20px', fontWeight: '800', padding: '8px 18px', borderRadius: T.radiusMd }}>
              {pending.length}
            </span>
          </div>

          <div ref={tableWrapRef} style={{ ...card, overflowX: 'auto' }}>
            {pending.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 32px', color: T.textMuted }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: T.textMain, marginBottom: '8px' }}>All caught up!</div>
                <div style={{ fontSize: T.fontBase }}>No pending user approvals at this time.</div>
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: T.fontBase, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.primaryBorder}` }}>
                    {['User', 'Contact', 'Requested Access', 'Signup Date', 'Actions'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pending.map(u => (
                    <tr key={u.userID}
                      style={{ background: 'var(--card-bg)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--card-bg)'}
                    >
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ ...avatarStyle, background: `linear-gradient(135deg, ${T.amber} 0%, #b45309 100%)` }}>
                            {u.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: T.textMain }}>{u.name}</div>
                            <div style={{ fontSize: T.fontSm, color: T.textMuted, marginTop: '2px' }}>ID: {u.userID}</div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        {u.email ? (
                          <>
                            <div style={{ fontWeight: '600', color: T.textMain }}>{u.email}</div>
                            <div style={{ fontSize: T.fontSm, color: T.green, marginTop: '2px' }}>📧 Email provided</div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontWeight: '600', color: T.amber }}>No email</div>
                            <div style={{ fontSize: T.fontSm, color: T.amber, marginTop: '2px' }}>⚠️ Email not provided</div>
                          </>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span style={u.access === 'private' ? badge.private : badge.public}>
                          {u.access === 'private' ? '🔒 Private' : '🌐 Public'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {u.createdAt ? (
                          <>
                            <div style={{ fontWeight: '600', color: T.textMain }}>{new Date(u.createdAt.replace(' ', 'T')).toLocaleDateString()}</div>
                            <div style={{ fontSize: T.fontSm, color: T.textMuted, marginTop: '2px' }}>{new Date(u.createdAt.replace(' ', 'T')).toLocaleTimeString()}</div>
                          </>
                        ) : <span style={{ color: T.textLight }}>—</span>}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleConfirmAction(u.userID, "approve", u)}
                            disabled={processingId === u.userID}
                            style={{ ...btn.success, opacity: processingId === u.userID ? 0.6 : 1, cursor: processingId === u.userID ? 'not-allowed' : 'pointer' }}
                          >
                            {processingId === u.userID ? <div className="spinner" style={{ width: '14px', height: '14px' }} /> : '✓'} Approve
                          </button>
                          <button
                            onClick={() => handleConfirmAction(u.userID, "reject", u)}
                            disabled={processingId === u.userID}
                            style={{ ...btn.danger, opacity: processingId === u.userID ? 0.6 : 1, cursor: processingId === u.userID ? 'not-allowed' : 'pointer' }}
                          >
                            {processingId === u.userID ? <div className="spinner" style={{ width: '14px', height: '14px' }} /> : '✕'} Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {mirrorScrollbar}

          {/* Manage All Users */}
          <div style={{ marginTop: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: T.fontLg, fontWeight: '700', color: T.textMain, margin: 0 }}>Manage All Users</h2>
              <button onClick={loadAllUsers} style={{ ...btn.ghost }} disabled={allUsersLoading}>
                {allUsersLoading ? 'Loading...' : showAllUsers ? 'Hide' : 'Show All Users'}
              </button>
            </div>

            {showAllUsers && (
              <div style={{ ...card, overflowX: 'auto' }}>
                {allUsers.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: T.textMuted }}>No users found.</div>
                ) : (
                  <table style={{ width: '100%', fontSize: T.fontBase, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${T.primaryBorder}` }}>
                        {['ID', 'Name', 'Username / Email', 'Role', 'Status', 'Actions'].map(h => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((u, i) => (
                        <tr key={u.id}
                          style={{ background: i % 2 === 0 ? 'var(--card-bg)' : 'var(--bg-secondary)', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f0f4e8'}
                          onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--card-bg)' : 'var(--bg-secondary)'}
                        >
                          <td style={{ ...tdStyle, fontWeight: '700', color: T.textMuted }}>{u.userID}</td>
                          <td style={{ ...tdStyle, fontWeight: '700', color: T.textMain }}>
                            {u.firstName} {u.lastName}
                          </td>
                          <td style={tdStyle}>
                            <div style={{ color: T.textMain }}>{u.username}</div>
                            {u.email && <div style={{ fontSize: T.fontSm, color: T.textMuted }}>{u.email}</div>}
                          </td>
                          <td style={tdStyle}>
                            <span style={u.role === 'admin' ? badge.admin : u.role === 'private' ? badge.private : badge.public}>
                              {u.role}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span style={u.isApproved ? badge.active : badge.pending}>
                              {u.isApproved ? 'Approved' : 'Pending'}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <button
                              onClick={() => handleDeleteUser(u.id, `${u.firstName} ${u.lastName}`.trim() || u.username)}
                              style={{ ...btn.danger, padding: '5px 12px', fontSize: T.fontSm }}
                              disabled={u.id === user?.id}
                              title={u.id === user?.id ? "You cannot delete your own account" : "Delete user"}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>

        {showConfirm && confirmAction && (
          <ConfirmModal
            isOpen={showConfirm}
            title={confirmAction.title}
            message={confirmAction.message}
            confirmLabel={confirmAction.confirmLabel}
            onConfirm={() => handleAction(confirmAction.userID, confirmAction.action)}
            onCancel={() => { setShowConfirm(false); setConfirmAction(null); }}
          />
        )}

        {deleteConfirm && (
          <ConfirmModal
            isOpen={!!deleteConfirm}
            title="Delete User"
            message={`Permanently delete "${deleteConfirm.name}"? This cannot be undone.`}
            confirmLabel="Delete"
            onConfirm={confirmDelete}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </div>
    </MainLayout>
  );
}