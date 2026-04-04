import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useauth";
import MainLayout from "../components/mainlayout";
import ConfirmModal from "../components/confirmmodal";
import React from 'react';
import { API_BASE_URL } from '../utils/api';

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
          {/* Header */}
          <div className="dashboard-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 className="dashboard-title" style={{ fontSize: '38px', fontWeight: '700', color: '#0f766e' }}>👤 My Profile</h1>
                <p className="dashboard-subtitle" style={{ fontSize: '20px', fontWeight: '600', color: '#64748b' }}>
                  Manage your personal information and account settings
                </p>
              </div>
              <Link
                to={authUser?.role === 'admin' ? '/dashboard' : authUser?.role === 'private' ? '/dashboard/private' : '/public'}
                className="btn-primary"
                style={{ 
                  textDecoration: 'none',
                  background: '#64748b',
                  padding: '18px 28px',
                  fontSize: '16px',
                  fontWeight: '700',
                  borderRadius: '8px'
                }}
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '32px' }}>
              {error}
            </div>
          )}

          {user && user.notification && (
            <div className="alert alert-warning" style={{ marginBottom: '32px', background: '#fef3c7', color: '#92400e', padding: '12px', borderRadius: '8px' }}>
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
            padding: '36px',
            background: '#f0fdfa',
            borderRadius: '12px',
            border: '2px solid #5eead4',
            boxShadow: '0 2px 12px rgba(20,184,166,0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 className="dashboard-card-title" style={{ fontSize: '24px', fontWeight: '700', color: '#0f766e' }}>📋 Profile Information</h2>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="btn-primary"
                  style={{ 
                    fontSize: '16px', 
                    padding: '16px 28px',
                    fontWeight: '700',
                    borderRadius: '8px'
                  }}
                >
                  ✏️ Edit Profile
                </button>
              )}
            </div>

            {editMode ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '20px',
                  marginBottom: '32px'
                }}>
                  <div>
                    <label className="form-label" htmlFor="firstName" style={{ fontSize: '16px', fontWeight: '700', color: '#0f766e', marginBottom: '8px', display: 'block' }}>First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter your first name"
                      style={{ fontSize: '17px', fontWeight: '500', padding: '16px', border: '2px solid #5eead4', borderRadius: '8px' }}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label" htmlFor="lastName" style={{ fontSize: '16px', fontWeight: '700', color: '#0f766e', marginBottom: '8px', display: 'block' }}>Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter your last name"
                      style={{ fontSize: '17px', fontWeight: '500', padding: '16px', border: '2px solid #5eead4', borderRadius: '8px' }}
                    />
                  </div>

                  <div>
                    <label className="form-label" htmlFor="username" style={{ fontSize: '16px', fontWeight: '700', color: '#0f766e', marginBottom: '8px', display: 'block' }}>Username *</label>
                    <input
                      id="username"
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      required
                      className="form-input"
                      placeholder="Enter your username"
                      style={{ fontSize: '17px', fontWeight: '500', padding: '16px', border: '2px solid #5eead4', borderRadius: '8px' }}
                    />
                  </div>

                  <div>
                    <label className="form-label" htmlFor="email" style={{ fontSize: '16px', fontWeight: '700', color: '#0f766e', marginBottom: '8px', display: 'block' }}>Email Address</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter your email"
                      style={{ fontSize: '17px', fontWeight: '500', padding: '16px', border: '2px solid #5eead4', borderRadius: '8px' }}
                    />
                  </div>

                  <div>
                    <label className="form-label" htmlFor="phoneNumber" style={{ fontSize: '16px', fontWeight: '700', color: '#0f766e', marginBottom: '8px', display: 'block' }}>Phone Number</label>
                    <input
                      id="phoneNumber"
                      type="tel"
                      name="phoneNumber"
                      value={form.phoneNumber}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="+353 87 123 4567"
                      style={{ fontSize: '17px', fontWeight: '500', padding: '16px', border: '2px solid #5eead4', borderRadius: '8px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setError("");
                      setSuccess("");
                      // Reset form to original values
                      setForm({
                        username: user.username || "",
                        email: user.email || "",
                        phoneNumber: user.phoneNumber || "",
                        firstName: user.firstName || "",
                        lastName: user.lastName || "",
                      });
                    }}
                    className="btn-primary"
                    style={{ 
                      background: '#64748b',
                      border: 'none',
                      fontSize: '16px',
                      padding: '18px 32px',
                      fontWeight: '700',
                      borderRadius: '8px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary"
                    style={{
                      fontSize: '16px',
                      padding: '18px 32px',
                      fontWeight: '700',
                      borderRadius: '8px'
                    }}
                  >
                    {isSaving ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                        Saving...
                      </div>
                    ) : (
                      "💾 Save Changes"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '28px' 
              }}>
                <div className="info-item">
                  <div className="info-label" style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Full Name</div>
                  <div className="info-value" style={{ fontSize: '17px', fontWeight: '500', color: '#1e293b' }}>
                    {[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-label" style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Username</div>
                  <div className="info-value" style={{ fontSize: '17px', fontWeight: '500', color: '#1e293b' }}>{user.username || "—"}</div>
                </div>

                <div className="info-item">
                  <div className="info-label" style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Email Address</div>
                  <div className="info-value" style={{ fontSize: '17px', fontWeight: '500' }}>
                    {user.email ? (
                      <a href={`mailto:${user.email}`} style={{ color: '#14b8a6', textDecoration: 'none', fontWeight: '600' }}>
                        {user.email}
                      </a>
                    ) : "—"}
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-label" style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Phone Number</div>
                  <div className="info-value" style={{ fontSize: '17px', fontWeight: '500', color: '#1e293b' }}>{user.phoneNumber || "—"}</div>
                </div>

                <div className="info-item">
                  <div className="info-label" style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>ACCOUNT ROLE</div>
                  <div className="info-value">
                    <span style={{
                      display: 'inline-block',
                      padding: '12px 20px',
                      fontSize: '15px',
                      fontWeight: '700',
                      borderRadius: '20px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      background: user.role === 'admin'
                        ? '#0d9488'
                        : user.role === 'private' && user.isApproved === false
                          ? '#f59e0b'
                          : user.role === 'private' && user.isApproved === true
                            ? '#6366f1'
                            : '#10b981',
                      color: 'white'
                    }}>
                      {user.role === 'admin'
                        ? 'ADMINISTRATOR'
                        : user.role === 'private' && user.isApproved === false
                          ? 'PENDING APPROVAL'
                          : user.role === 'private' && user.isApproved === true
                            ? 'PRIVATE MEMBER'
                            : 'PUBLIC USER'}
                    </span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-label" style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Last Login</div>
                  <div className="info-value" style={{ fontSize: '17px', fontWeight: '500', color: '#1e293b' }}>
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "—"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Account Actions */}
          {!editMode && (
            <div className="dashboard-card" style={{ 
              padding: '36px',
              background: '#f0fdfa',
              borderRadius: '12px',
              border: '2px solid #5eead4',
              boxShadow: '0 2px 12px rgba(20,184,166,0.08)'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f766e', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>🔧 Account Actions</h2>
              <div className="account-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {user.role === 'admin' ? (
                  <>
                    <button 
                      className="action-btn" 
                      onClick={() => setShowChangePassword(true)} 
                      style={{ 
                        padding: '14px 24px', 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        border: '2px solid #14b8a6', 
                        borderRadius: '8px', 
                        background: 'white', 
                        color: '#14b8a6', 
                        cursor: 'pointer', 
                        transition: 'all 0.2s ease' 
                      }}
                    >
                      🔑 Change Password
                    </button>
                    <button 
                      className="action-btn" 
                      onClick={() => setShowExportData(true)} 
                      style={{ 
                        padding: '14px 24px', 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        border: '2px solid #059669', 
                        borderRadius: '8px', 
                        background: 'white', 
                        color: '#059669', 
                        cursor: 'pointer', 
                        transition: 'all 0.2s ease' 
                      }}
                    >
                      📄 Export My Data
                    </button>
                    <button
                      className="action-btn delete-account-btn"
                      style={{ 
                        padding: '14px 24px',
                        fontSize: '16px',
                        fontWeight: '600',
                        border: '2px solid #dc2626', 
                        color: '#dc2626', 
                        background: 'white',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setShowDeleteModal(true)}
                    >
                      🗑️ Delete Account
                    </button>
                  </>
                ) : (user.role === 'private' && user.isApproved === true) ? (
                  <>
                    <button 
                      className="action-btn" 
                      onClick={() => setShowChangePassword(true)} 
                      style={{ 
                        padding: '14px 24px', 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        border: '2px solid #14b8a6', 
                        borderRadius: '8px', 
                        background: 'white', 
                        color: '#14b8a6', 
                        cursor: 'pointer', 
                        transition: 'all 0.2s ease' 
                      }}
                    >
                      🔑 Change Password
                    </button>
                    <button 
                      className="action-btn" 
                      onClick={() => setShowExportData(true)} 
                      style={{ 
                        padding: '14px 24px', 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        border: '2px solid #059669', 
                        borderRadius: '8px', 
                        background: 'white', 
                        color: '#059669', 
                        cursor: 'pointer', 
                        transition: 'all 0.2s ease' 
                      }}
                    >
                      📄 Export My Data
                    </button>
                    <button
                      className="action-btn delete-account-btn"
                      style={{ 
                        padding: '14px 24px',
                        fontSize: '16px',
                        fontWeight: '600',
                        border: '2px solid #dc2626', 
                        color: '#dc2626', 
                        background: 'white',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setShowDeleteModal(true)}
                    >
                      🗑️ Delete Account
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setShowPrivateAccessConfirm(true)} 
                    disabled={requestingPrivateAccess} 
                    style={{ 
                      padding: '14px 28px', 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      border: '2px solid #6366f1', 
                      borderRadius: '8px', 
                      background: 'white', 
                      color: '#6366f1', 
                      cursor: requestingPrivateAccess ? 'not-allowed' : 'pointer', 
                      opacity: requestingPrivateAccess ? 0.6 : 1, 
                      transition: 'all 0.2s ease' 
                    }}
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
                  background: '#f0f9ff',
                  border: '2px solid #0891b2',
                  borderRadius: '8px',
                  fontSize: '15px',
                  color: '#0c4a6e'
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
          zIndex: 9999
        }}>
          <div className="modal-content" style={{
            background: 'white',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            minWidth: '400px',
            maxWidth: '90vw',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>Permanently Delete Account</h3>
            <p style={{ fontSize: '17px', marginBottom: '28px', color: '#64748b', lineHeight: '1.6' }}>
              Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={handleDeleteAccount} 
                disabled={deleting} 
                style={{
                  background: '#dc2626', 
                  color: 'white', 
                  padding: '14px 28px', 
                  borderRadius: '8px', 
                  fontWeight: 600,
                  fontSize: '16px',
                  border: 'none',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {deleting ? '⏳ Deleting...' : '🗑️ Delete Account'}
              </button>
              <button 
                onClick={() => setShowDeleteModal(false)} 
                disabled={deleting} 
                style={{
                  background: '#64748b', 
                  color: 'white', 
                  padding: '14px 28px', 
                  borderRadius: '8px', 
                  fontWeight: 600,
                  fontSize: '16px',
                  border: 'none',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
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
          zIndex: 9999
        }}>
          <div className="modal-content" style={{
            background: 'white',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            minWidth: '400px',
            maxWidth: '90vw',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>Export My Data</h3>
            <p style={{ fontSize: '17px', marginBottom: '28px', color: '#64748b', lineHeight: '1.6' }}>
              Download a PDF containing all personal data we have on file for your account.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  window.open(`${API_BASE_URL}/api/my-data/export`, '_blank');
                  setShowExportData(false);
                }}
                style={{
                  background: '#059669', 
                  color: 'white', 
                  padding: '14px 28px', 
                  borderRadius: '8px', 
                  fontWeight: 600,
                  fontSize: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                📥 Download PDF
              </button>
              <button 
                onClick={() => setShowExportData(false)} 
                style={{
                  background: '#64748b', 
                  color: 'white', 
                  padding: '14px 28px', 
                  borderRadius: '8px', 
                  fontWeight: 600,
                  fontSize: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
