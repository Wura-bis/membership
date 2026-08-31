import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useauth";
import MainLayout from "../components/mainlayout";
import ConfirmModal from "../components/confirmmodal";
import React from 'react';
import { API_BASE_URL } from '../utils/api';
import { T, card, btn, badge, pageHeader } from '../utils/theme';

export default function MyProfile() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPrivateAccessConfirm, setShowPrivateAccessConfirm] = useState(false);
  const [showDataExportConfirm, setShowDataExportConfirm] = useState(false);
  const [requestingPrivateAccess, setRequestingPrivateAccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showExportData, setShowExportData] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNew, setShowPwNew] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/my-profile`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          const userWithLowerRole = { ...data, role: data.role?.toLowerCase() };
          setUser(userWithLowerRole);
          setForm({
            username: data.username || "",
            email: data.email || "",
            phoneNumber: data.phoneNumber || "",
            firstName: data.firstName || "",
            lastName: data.lastName || "",
          });
        }
        setIsLoading(false);
      })
      .catch(() => {
        setError("Failed to load profile");
        setIsLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setIsSaving(true);
    if (!form.username) {
      setError("Username is required.");
      setIsSaving(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/my-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setSuccess("Profile updated successfully!");
      setEditMode(false);
      setUser((prev) => ({ ...prev, ...form, role: prev.role }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestPrivateAccess = async () => {
    setRequestingPrivateAccess(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/my-profile/request-private-access`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setUser(prev => ({ ...prev, role: 'private', isApproved: false }));
      } else {
        setError(data.error || 'Failed to submit private access request');
      }
    } catch (err) {
      setError('Error submitting request: ' + err.message);
    } finally {
      setRequestingPrivateAccess(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/delete_account', {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        // Log out and redirect to home/login
        window.location.href = '/login';
      } else {
        alert('Error deleting account');
      }
    } catch (err) {
      alert('Error deleting account');
    }
    setDeleting(false);
    setShowDeleteModal(false);
  };

  const handleChangePassword = async () => {
    setPwError(""); setPwSuccess("");
    if (!pwForm.currentPassword || !pwForm.newPassword) { setPwError("All fields are required."); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError("New passwords do not match."); return; }
    if (pwForm.newPassword.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    setPwLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/my-profile/change-password`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error || 'Failed to change password.'); return; }
      setPwSuccess("Password changed successfully!");
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch { setPwError("Network error. Please try again."); }
    finally { setPwLoading(false); }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="dashboard-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
            <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="dashboard-container">
          <div className="alert alert-error" style={{ maxWidth: '600px', margin: '0 auto' }}>
            Failed to load profile information
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={pageHeader.wrapper}>
            <div>
              <h1 style={pageHeader.title}>👤 My Profile</h1>
              <p style={pageHeader.subtitle}>Manage your personal information and account settings</p>
            </div>
            <Link
              to={authUser?.role === 'admin' ? '/dashboard' : authUser?.role === 'private' ? '/dashboard/private' : '/public'}
              style={{ ...btn.ghost, textDecoration: 'none' }}
            >
              ← Back to Dashboard
            </Link>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '32px' }}>
              {error}
            </div>
          )}

          {user && user.notification && (
            <div style={{ marginBottom: '32px', background: 'var(--btn-warning-bg)', border: `2px solid ${T.amberBorder}`, color: T.amber, padding: '10px 14px', borderRadius: T.radiusMd, fontSize: T.fontBase, fontWeight: '600' }}>
              {user.notification}
            </div>
          )}

          {success && (
            <div className="alert alert-success" style={{ marginBottom: '32px' }}>
              {success}
            </div>
          )}

          {/* Profile Card */}
          <div className="dashboard-card" style={{
            ...card,
            padding: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 className="dashboard-card-title" style={{ fontSize: T.fontLg, fontWeight: '700', color: T.textMain, margin: '0' }}>📋 Profile Information</h2>
              {!editMode && (
                <button onClick={() => setEditMode(true)} style={btn.primary}>
                  ✏️ Edit Profile
                </button>
              )}
            </div>

            {editMode ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '16px',
                  marginBottom: '32px'
                }} className="mobile-grid">
                  <div>
                    <label className="form-label" htmlFor="firstName" style={{ fontSize: T.fontBase, fontWeight: '700', color: T.textMain, marginBottom: '6px', display: 'block' }}>First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter your first name"
                      style={{ fontSize: T.fontBase, fontWeight: '500', padding: '8px 10px', border: `2px solid ${T.primaryBorder}`, borderRadius: T.radiusMd, width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label" htmlFor="lastName" style={{ fontSize: T.fontBase, fontWeight: '700', color: T.textMain, marginBottom: '6px', display: 'block' }}>Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter your last name"
                      style={{ fontSize: T.fontBase, fontWeight: '500', padding: '8px 10px', border: `2px solid ${T.primaryBorder}`, borderRadius: T.radiusMd, width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label className="form-label" htmlFor="username" style={{ fontSize: T.fontBase, fontWeight: '700', color: T.textMain, marginBottom: '6px', display: 'block' }}>Username *</label>
                    <input
                      id="username"
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      required
                      className="form-input"
                      placeholder="Enter your username"
                      style={{ fontSize: T.fontBase, fontWeight: '500', padding: '8px 10px', border: `2px solid ${T.primaryBorder}`, borderRadius: T.radiusMd, width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label className="form-label" htmlFor="email" style={{ fontSize: T.fontBase, fontWeight: '700', color: T.textMain, marginBottom: '6px', display: 'block' }}>Email Address</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter your email"
                      style={{ fontSize: T.fontBase, fontWeight: '500', padding: '8px 10px', border: `2px solid ${T.primaryBorder}`, borderRadius: T.radiusMd, width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label className="form-label" htmlFor="phoneNumber" style={{ fontSize: T.fontBase, fontWeight: '700', color: T.textMain, marginBottom: '6px', display: 'block' }}>Phone Number</label>
                    <input
                      id="phoneNumber"
                      type="tel"
                      name="phoneNumber"
                      value={form.phoneNumber}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="+353 87 123 4567"
                      style={{ fontSize: T.fontBase, fontWeight: '500', padding: '8px 10px', border: `2px solid ${T.primaryBorder}`, borderRadius: T.radiusMd, width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setError("");
                      setSuccess("");
                      setForm({
                        username: user.username || "",
                        email: user.email || "",
                        phoneNumber: user.phoneNumber || "",
                        firstName: user.firstName || "",
                        lastName: user.lastName || "",
                      });
                    }}
                    style={btn.ghost}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    style={{ ...btn.primary, opacity: isSaving ? 0.7 : 1 }}
                  >
                    {isSaving ? "Saving..." : "💾 Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
                gap: '20px' 
              }}>
                <div className="info-item">
                  <div className="info-label" style={{ fontSize: T.fontSm, fontWeight: '600', color: T.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>Full Name</div>
                  <div className="info-value" style={{ fontSize: T.fontBase, fontWeight: '500', color: T.textMain }}>
                    {[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-label" style={{ fontSize: T.fontSm, fontWeight: '600', color: T.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>Username</div>
                  <div className="info-value" style={{ fontSize: T.fontBase, fontWeight: '500', color: T.textMain }}>{user.username || "\u2014"}</div>
                </div>

                <div className="info-item">
                  <div className="info-label" style={{ fontSize: T.fontSm, fontWeight: '600', color: T.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>Email Address</div>
                  <div className="info-value" style={{ fontSize: T.fontBase, fontWeight: '500' }}>
                    {user.email ? (
                      <a href={`mailto:${user.email}`} style={{ color: T.primaryLight, textDecoration: 'none', fontWeight: '600' }}>
                        {user.email}
                      </a>
                    ) : "—"}
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-label" style={{ fontSize: T.fontSm, fontWeight: '600', color: T.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>Phone Number</div>
                  <div className="info-value" style={{ fontSize: T.fontBase, fontWeight: '500', color: T.textMain }}>{user.phoneNumber || "\u2014"}</div>
                </div>

                <div className="info-item">
                  <div className="info-label" style={{ fontSize: T.fontSm, fontWeight: '600', color: T.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>ACCOUNT ROLE</div>
                  <div className="info-value">
                    <span style={
                      user.role === 'admin' ? badge.admin :
                      user.role === 'private' && user.isApproved === false ? badge.pending :
                      user.role === 'private' && user.isApproved === true ? badge.private :
                      badge.public
                    }>
                      {user.role === 'admin'
                        ? 'ADMINISTRATOR'
                        : user.role === 'private' && user.isApproved === false
                          ? 'PENDING APPROVAL'
                          : user.role === 'private' && user.isApproved === true
                            ? 'PRIVATE USER'
                            : 'PUBLIC USER'}
                    </span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-label" style={{ fontSize: T.fontSm, fontWeight: '600', color: T.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>Last Login</div>
                  <div className="info-value" style={{ fontSize: T.fontBase, fontWeight: '500', color: T.textMain }}>
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "—"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Account Actions */}
          {!editMode && (
            <div className="dashboard-card" style={{
              ...card,
              padding: '24px',
            }}>
              <h2 style={{ fontSize: T.fontLg, fontWeight: '700', color: T.textMain, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>🔧 Account Actions</h2>
              <div className="account-actions" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '10px' }}>
                {user.role === 'admin' ? (
                  <>
                    <button className="action-btn" onClick={() => setShowChangePassword(true)} style={btn.primary}>
                      🔑 Change Password
                    </button>
                    <button className="action-btn" onClick={() => setShowExportData(true)} style={btn.exportCsv}>
                      📄 Export My Data
                    </button>
                    <button className="action-btn delete-account-btn" onClick={() => setShowDeleteModal(true)} style={btn.danger}>
                      🗑️ Delete Account
                    </button>
                  </>
                ) : (user.role === 'private' && user.isApproved === true) ? (
                  <>
                    <button className="action-btn" onClick={() => setShowChangePassword(true)} style={btn.primary}>
                      🔑 Change Password
                    </button>
                    <button className="action-btn" onClick={() => setShowExportData(true)} style={btn.exportCsv}>
                      📄 Export My Data
                    </button>
                    <button className="action-btn delete-account-btn" onClick={() => setShowDeleteModal(true)} style={btn.danger}>
                      🗑️ Delete Account
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowPrivateAccessConfirm(true)}
                    disabled={requestingPrivateAccess}
                    style={{ ...btn.primary, opacity: requestingPrivateAccess ? 0.6 : 1, cursor: requestingPrivateAccess ? 'not-allowed' : 'pointer' }}
                  >
                    {requestingPrivateAccess ? '⏳ Requesting...' : '🔐 Request Private Access'}
                  </button>
                )}
              </div>
              
              {/* Info message for public users */}
              {user.role === 'public' && (
                <div style={{
                  marginTop: '24px',
                  padding: '16px 20px',
                  background: T.primaryBg,
                  border: `2px solid ${T.primaryBorder}`,
                  borderRadius: T.radiusMd,
                  fontSize: T.fontBase,
                  color: T.primary
                }}>
                  <strong>ℹ️ Public Account:</strong> You're using a shared public account. To get individual account features like password management and data export, request private access above.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Private Access Confirmation Modal */}
      {showPrivateAccessConfirm && (
        <ConfirmModal
          isOpen={showPrivateAccessConfirm}
          title="🔒 Request Private Member Access"
          message="Are you sure you want to request private member access? This will require administrator approval and may take some time to process."
          confirmLabel="Request Access"
          onConfirm={() => { setShowPrivateAccessConfirm(false); handleRequestPrivateAccess(); }}
          onCancel={() => setShowPrivateAccessConfirm(false)}
        />
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div className="modal-content" style={{
            background: 'var(--card-bg)',
            padding: '24px',
            borderRadius: T.radiusLg,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            minWidth: '280px',
            maxWidth: '90vw',
            textAlign: 'center',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ fontSize: T.fontLg, fontWeight: '700', marginBottom: '16px', color: T.textMain }}>Permanently Delete Account</h3>
            <p style={{ fontSize: T.fontBase, marginBottom: '28px', color: T.textMuted, lineHeight: '1.6' }}>
              Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                style={{ ...btn.danger, opacity: deleting ? 0.6 : 1, cursor: deleting ? 'not-allowed' : 'pointer' }}
              >
                {deleting ? '⏳ Deleting...' : '🗑️ Delete Account'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={btn.ghost}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export My Data Modal */}
      {showExportData && (
        <div className="modal" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div className="modal-content" style={{
            background: 'var(--card-bg)',
            padding: '24px',
            borderRadius: T.radiusLg,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            minWidth: '280px',
            maxWidth: '90vw',
            textAlign: 'center',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>📄</div>
            <h3 style={{ fontSize: T.fontLg, fontWeight: '700', marginBottom: '16px', color: T.textMain }}>Export My Data</h3>
            <p style={{ fontSize: T.fontBase, marginBottom: '28px', color: T.textMuted, lineHeight: '1.6' }}>
              Download a PDF containing all personal data we have on file for your account.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => { window.open(`${API_BASE_URL}/api/my-data/export`, '_blank'); setShowExportData(false); }}
                style={btn.success}
              >
                📥 Download PDF
              </button>
              <button onClick={() => setShowExportData(false)} style={btn.ghost}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Change Password Modal */}
      {showChangePassword && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: 'var(--card-bg)', padding: '28px', borderRadius: T.radiusLg, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', width: '100%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: T.fontLg, fontWeight: '700', color: T.textMain, marginBottom: '6px' }}>🔑 Change Password</h3>
            <p style={{ fontSize: T.fontBase, color: T.textMuted, marginBottom: '20px' }}>Enter your current password and choose a new one.</p>

            {pwError && <div style={{ background: T.redLight, border: `2px solid ${T.redBorder}`, color: T.red, padding: '10px 14px', borderRadius: T.radiusMd, marginBottom: '14px', fontSize: T.fontBase }}>{pwError}</div>}
            {pwSuccess && <div style={{ background: T.greenLight, border: `2px solid ${T.greenBorder}`, color: T.green, padding: '10px 14px', borderRadius: T.radiusMd, marginBottom: '14px', fontSize: T.fontBase }}>{pwSuccess}</div>}

            {[
              { key: 'currentPassword', label: 'Current Password', show: showPwCurrent, toggle: setShowPwCurrent },
              { key: 'newPassword',     label: 'New Password',     show: showPwNew,     toggle: setShowPwNew },
              { key: 'confirmPassword', label: 'Confirm New Password', show: showPwNew, toggle: null },
            ].map(({ key, label, show, toggle }) => (
              <div key={key} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: T.fontBase, fontWeight: '700', color: T.textMain, marginBottom: '6px' }}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={show ? "text" : "password"}
                    autoComplete={key === 'currentPassword' ? 'current-password' : 'new-password'}
                    value={pwForm[key]}
                    onChange={e => { setPwForm(p => ({ ...p, [key]: e.target.value })); setPwError(""); setPwSuccess(""); }}
                    style={{ width: '100%', padding: '9px 36px 9px 12px', border: `2px solid ${T.primaryBorder}`, borderRadius: T.radiusMd, fontSize: T.fontBase, fontFamily: 'inherit', background: 'var(--card-bg)', color: T.textMain, boxSizing: 'border-box' }}
                  />
                  {toggle && (
                    <button type="button" onClick={() => toggle(v => !v)} tabIndex={-1}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: T.textMuted, padding: '2px' }}>
                      {show ? "👁️" : "👁️‍🗨️"}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowChangePassword(false); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPwError(""); setPwSuccess(""); setShowPwCurrent(false); setShowPwNew(false); }} style={btn.ghost}>Cancel</button>
              <button type="button" onClick={handleChangePassword} disabled={pwLoading} style={{ ...btn.primary, opacity: pwLoading ? 0.6 : 1, cursor: pwLoading ? 'not-allowed' : 'pointer' }}>
                {pwLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
