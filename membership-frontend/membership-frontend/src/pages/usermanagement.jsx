import { useState, useEffect } from "react";
import { useStickyScrollbar } from "../hooks/useStickyScrollbar";
import MainLayout from "../components/mainlayout";
import ConfirmModal from "../components/confirmmodal";
import { useAuth } from "../hooks/useauth";
import { API_BASE_URL } from '../utils/api';
import { T, card, thStyle, tdStyle, btn, badge, avatarStyle, pageHeader, filterBar } from '../utils/theme';

const roleBadge = (role) => {
  if (role === 'admin')   return badge.admin;
  if (role === 'private') return badge.private;
  return badge.public;
};

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

  // Modal state
  const [selected, setSelected] = useState(null);
  const [panelRole, setPanelRole] = useState("");
  const [panelPw, setPanelPw] = useState("");
  const [panelPwError, setPanelPwError] = useState("");
  const [panelPwSuccess, setPanelPwSuccess] = useState("");
  const [showPanelPw, setShowPanelPw] = useState(false);
  const [actionMsg, setActionMsg] = useState({ text: "", ok: true });

  const myId = user?.user_id ?? user?.id;
  const { tableWrapRef, mirrorScrollbar } = useStickyScrollbar([users]);

  const inputStyle = {
    fontSize: T.fontBase, padding: '9px 12px',
    border: `1.5px solid var(--border-primary)`,
    borderRadius: T.radiusMd, fontFamily: 'inherit',
    width: '100%', boxSizing: 'border-box',
    background: 'var(--card-bg)', color: T.textMain,
  };

  if (!user || user.role !== "admin") {
    return (
      <MainLayout>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <h1 style={{ color: T.red, marginBottom: '16px' }}>Access Denied</h1>
          <p>You must be an administrator to access user management.</p>
        </div>
      </MainLayout>
    );
  }

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/users`, { credentials: "include" })
      .then(res => res.json())
      .then(data => { setUsers(data); setFilteredUsers(data); setIsLoading(false); })
      .catch(() => { setError("Failed to load users"); setIsLoading(false); });
  }, []);

  useEffect(() => {
    setFilteredUsers(users.filter(u => {
      const matchesSearch = `${u.firstName} ${u.lastName} ${u.email || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? u.isActive : !u.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    }));
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Keep modal in sync when list updates
  useEffect(() => {
    if (selected) {
      const fresh = users.find(u => u.id === selected.id);
      if (fresh) setSelected(fresh);
    }
  }, [users]);

  const patchUser = (id, changes) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...changes } : u));
    setSelected(prev => prev && prev.id === id ? { ...prev, ...changes } : prev);
  };

  const openModal = (u) => {
    setSelected(u);
    setPanelRole(u.role);
    setPanelPw("");
    setPanelPwError("");
    setPanelPwSuccess("");
    setShowPanelPw(false);
    setActionMsg({ text: "", ok: true });
  };

  const closeModal = () => {
    setSelected(null);
    setPanelPw("");
    setPanelPwError("");
    setPanelPwSuccess("");
    setActionMsg({ text: "", ok: true });
  };

  const handleRoleChange = async () => {
    setActionMsg({ text: "", ok: true });
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${selected.id}/role`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: panelRole }), credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      patchUser(selected.id, { role: panelRole });
      setActionMsg({ text: "Role updated successfully.", ok: true });
    } catch (err) {
      setActionMsg({ text: err.message, ok: false });
    }
  };

  const handleApprove = async () => {
    setActionMsg({ text: "", ok: true });
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${selected.id}/status`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: true }), credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      patchUser(selected.id, { isApproved: true, isActive: true });
      setActionMsg({ text: "Account approved.", ok: true });
    } catch (err) {
      setActionMsg({ text: err.message, ok: false });
    }
  };

  const requestDeactivate = () => {
    setConfirmAction({
      userId: selected.id,
      title: "Deactivate User Account",
      message: `Deactivate the account for "${selected.firstName} ${selected.lastName}"? They will not be able to log in.`,
      confirmLabel: "Deactivate",
    });
    setShowConfirm(true);
  };

  const handleConfirmDeactivate = async () => {
    setActionMsg({ text: "", ok: true });
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${confirmAction.userId}/status`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: false }), credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      patchUser(confirmAction.userId, { isApproved: false, isActive: false });
      setActionMsg({ text: "Account deactivated.", ok: true });
    } catch (err) {
      setActionMsg({ text: err.message, ok: false });
    } finally {
      setShowConfirm(false);
      setConfirmAction(null);
    }
  };

  const handleSetPassword = async () => {
    setPanelPwError("");
    setPanelPwSuccess("");
    if (panelPw.length < 8) { setPanelPwError("Password must be at least 8 characters."); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${selected.id}/password`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: panelPw }), credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPanelPw("");
      setShowPanelPw(false);
      setPanelPwSuccess("Password updated successfully.");
    } catch (err) {
      setPanelPwError(err.message);
    }
  };

  const isSelf = selected && selected.id === myId;

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
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          <div style={pageHeader.wrapper}>
            <div>
              <h1 style={pageHeader.title}>User Management</h1>
              <p style={pageHeader.subtitle}>Click any user to view details and manage their account</p>
            </div>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

          <div style={filterBar}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: T.fontSm, fontWeight: '600', color: T.textMain, marginBottom: '5px' }}>Search Users</label>
                <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoComplete="off" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: T.fontSm, fontWeight: '600', color: T.textMain, marginBottom: '5px' }}>Filter by Role</label>
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={inputStyle}>
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: T.fontSm, fontWeight: '600', color: T.textMain, marginBottom: '5px' }}>Filter by Status</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: '14px', fontSize: T.fontBase, fontWeight: '500', color: T.textMain }}>
              Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> users
            </div>
          </div>

          <div ref={tableWrapRef} style={{ ...card, overflowX: 'auto', padding: 0 }}>
            <table style={{ width: '100%', fontSize: T.fontBase, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid var(--border-primary)` }}>
                  {['User', 'Email', 'Role', 'Status', ''].map((h, i) => (
                    <th key={i} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '60px 32px', color: T.textMuted }}>
                      {users.length === 0 ? 'No users found' : 'No users match your filters'}
                    </td>
                  </tr>
                ) : filteredUsers.map(u => {
                  const isMine = u.id === myId;
                  return (
                    <tr
                      key={u.id}
                      onClick={() => openModal(u)}
                      style={{ cursor: 'pointer', transition: 'background 0.12s', background: isMine ? 'rgba(22,163,74,0.07)' : 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = isMine ? 'rgba(22,163,74,0.13)' : 'var(--bg-secondary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = isMine ? 'rgba(22,163,74,0.07)' : 'transparent'; }}
                    >
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={avatarStyle}>{u.firstName?.charAt(0)}{u.lastName?.charAt(0)}</div>
                          <div>
                            <div style={{ fontWeight: '700', color: T.textMain, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {u.firstName} {u.lastName}
                              {isMine && <span style={{ ...badge.active, fontSize: '10px', padding: '1px 6px' }}>You</span>}
                            </div>
                            <div style={{ fontSize: T.fontSm, color: T.textMuted, marginTop: '1px' }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, color: T.textMuted }}>{u.email || '—'}</td>
                      <td style={tdStyle}>
                        <span style={{ ...roleBadge(u.role), textTransform: 'capitalize' }}>{u.role}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={u.isApproved ? badge.approved : badge.pending}>{u.isApproved ? 'Approved' : 'Pending'}</span>
                      </td>
                      <td style={{ ...tdStyle, color: T.textMuted, fontSize: T.fontSm, whiteSpace: 'nowrap' }}>
                        View details →
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {mirrorScrollbar}
        </div>

        {/* ── User detail modal ─────────────────────────────────────────── */}
        {selected && (
          <div
            onClick={closeModal}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '16px',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                ...card,
                background: 'var(--card-bg)',
                width: '100%', maxWidth: '520px',
                maxHeight: '90vh', overflowY: 'auto',
                padding: '28px',
              }}
            >
              {/* Modal header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ ...avatarStyle, width: '56px', height: '56px', fontSize: '20px', flexShrink: 0 }}>
                    {selected.firstName?.charAt(0)}{selected.lastName?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: T.fontLg, fontWeight: '700', color: T.textMain, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {selected.firstName} {selected.lastName}
                      {isSelf && <span style={{ ...badge.active, fontSize: '10px', padding: '2px 7px' }}>You</span>}
                    </div>
                    <div style={{ fontSize: T.fontSm, color: T.textMuted, marginTop: '2px' }}>@{selected.username} · ID {selected.userID || selected.id}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: T.textMuted, lineHeight: 1, padding: '0 4px', marginTop: '-4px' }}
                >×</button>
              </div>

              {/* Info grid */}
              <div style={{ background: 'var(--bg-secondary)', borderRadius: T.radiusMd, padding: '16px', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                {[
                  ['User ID',    selected.userID || selected.id],
                  ['Username',   '@' + (selected.username || '—')],
                  ['First Name', selected.firstName || '—'],
                  ['Last Name',  selected.lastName  || '—'],
                  ['Email',      selected.email || '—'],
                  ['Role',       <span style={{ ...roleBadge(selected.role), textTransform: 'capitalize', fontSize: '11px' }}>{selected.role}</span>],
                  ['Status',     <span style={selected.isApproved ? badge.approved : badge.pending}>{selected.isApproved ? 'Approved' : 'Pending'}</span>],
                  ['Password',   <span style={{ fontSize: T.fontSm, color: T.textMuted, fontStyle: 'italic' }}>Hidden — use Set New Password below</span>],
                  ['Joined',     selected.createdDate || '—'],
                  ['Last Login', selected.lastLogin   || '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: T.fontSm, color: T.textMuted, fontWeight: '600', marginBottom: '2px' }}>{label}</div>
                    <div style={{ fontSize: T.fontBase, color: T.textMain }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {isSelf ? (
                <p style={{ fontSize: T.fontSm, color: T.textMuted, textAlign: 'center', margin: 0 }}>
                  You cannot modify your own account here. Use Account Settings instead.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Role */}
                  <div>
                    <label style={{ display: 'block', fontSize: T.fontSm, fontWeight: '700', color: T.textMain, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Change Role</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <select value={panelRole} onChange={e => { setPanelRole(e.target.value); setActionMsg({ text: "", ok: true }); }} style={{ ...inputStyle, flex: 1 }}>
                        {["admin", "private", "public"].map(r => (
                          <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleRoleChange}
                        disabled={panelRole === selected.role}
                        style={{ ...btn.primary, opacity: panelRole === selected.role ? 0.45 : 1, flexShrink: 0 }}
                      >Save</button>
                    </div>
                  </div>

                  {/* Divider */}
                  <hr style={{ border: 'none', borderTop: `1px solid var(--border-primary)`, margin: 0 }} />

                  {/* Approve / Deactivate */}
                  <div>
                    <label style={{ display: 'block', fontSize: T.fontSm, fontWeight: '700', color: T.textMain, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Account Status</label>
                    {selected.isApproved ? (
                      <button type="button" onClick={requestDeactivate} style={{ ...btn.danger, width: '100%', justifyContent: 'center' }}>
                        Deactivate Account
                      </button>
                    ) : (
                      <button type="button" onClick={handleApprove} style={{ ...btn.success, width: '100%', justifyContent: 'center' }}>
                        Approve Account
                      </button>
                    )}
                  </div>

                  {/* Divider */}
                  <hr style={{ border: 'none', borderTop: `1px solid var(--border-primary)`, margin: 0 }} />

                  {/* Set password */}
                  <div>
                    <label style={{ display: 'block', fontSize: T.fontSm, fontWeight: '700', color: T.textMain, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Set New Password</label>
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                      <input
                        type={showPanelPw ? "text" : "password"}
                        placeholder="New password (minimum 8 characters)"
                        value={panelPw}
                        autoComplete="new-password"
                        onChange={e => { setPanelPw(e.target.value); setPanelPwError(""); setPanelPwSuccess(""); }}
                        style={{ ...inputStyle, paddingRight: '42px' }}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPanelPw(v => !v)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: T.textMuted, padding: 0 }}
                      >{showPanelPw ? "👁️" : "👁️‍🗨️"}</button>
                    </div>
                    {panelPwError   && <p style={{ fontSize: T.fontSm, color: T.red,   margin: '0 0 8px', padding: '6px 10px', background: T.redLight,   borderRadius: T.radiusSm }}>{panelPwError}</p>}
                    {panelPwSuccess && <p style={{ fontSize: T.fontSm, color: T.green, margin: '0 0 8px', padding: '6px 10px', background: T.greenLight, borderRadius: T.radiusSm }}>{panelPwSuccess}</p>}
                    <button type="button" onClick={handleSetPassword} style={{ ...btn.primary, width: '100%', justifyContent: 'center' }}>
                      Update Password
                    </button>
                  </div>

                  {/* General action feedback */}
                  {actionMsg.text && (
                    <p style={{
                      fontSize: T.fontSm, margin: 0, padding: '8px 12px', borderRadius: T.radiusMd,
                      color: actionMsg.ok ? T.green : T.red,
                      background: actionMsg.ok ? T.greenLight : T.redLight,
                    }}>{actionMsg.text}</p>
                  )}
                </div>
              )}

              {/* Close */}
              <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <button type="button" onClick={closeModal} style={btn.ghost}>Close</button>
              </div>
            </div>
          </div>
        )}

        {showConfirm && confirmAction && (
          <ConfirmModal
            isOpen={showConfirm}
            title={confirmAction.title}
            message={confirmAction.message}
            confirmLabel={confirmAction.confirmLabel}
            onConfirm={handleConfirmDeactivate}
            onCancel={() => { setShowConfirm(false); setConfirmAction(null); }}
          />
        )}
      </div>
    </MainLayout>
  );
}
