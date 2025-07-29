import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useauth";
import MainLayout from "../components/mainlayout";

export default function MyProfile() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/my-profile", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setUser(data);
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
    if (error) setError(""); // Clear error when user starts typing
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
      const res = await fetch("http://localhost:5000/api/my-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setSuccess("Profile updated successfully!");
      setEditMode(false);
      setUser((prev) => ({ ...prev, ...form }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    setPasswordError("");
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords don't match.");
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      const res = await fetch("http://localhost:5000/api/me/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        }),
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }
      
      setSuccess("Password changed successfully!");
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle export my data
  const handleExportMyData = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/my-data/export", {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to export data");
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess("Your data has been exported successfully!");
    } catch (err) {
      setError("Failed to export data: " + err.message);
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
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Header */}
          <div className="dashboard-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 className="dashboard-title">👤 My Profile</h1>
                <p className="dashboard-subtitle">
                  Manage your personal information and account settings
                </p>
              </div>
              <Link 
                to="/dashboard" 
                className="btn-primary" 
                style={{ 
                  textDecoration: 'none',
                  background: '#64748b'
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

          {success && (
            <div className="alert alert-success" style={{ marginBottom: '32px' }}>
              {success}
            </div>
          )}

          {/* Profile Card */}
          <div className="dashboard-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="dashboard-card-title">📋 Profile Information</h2>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="btn-primary"
                  style={{ fontSize: '14px', padding: '8px 16px' }}
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
                    <label className="form-label" htmlFor="firstName">First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter your first name"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label" htmlFor="lastName">Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter your last name"
                    />
                  </div>

                  <div>
                    <label className="form-label" htmlFor="username">Username *</label>
                    <input
                      id="username"
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      required
                      className="form-input"
                      placeholder="Enter your username"
                    />
                  </div>

                  <div>
                    <label className="form-label" htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label className="form-label" htmlFor="phoneNumber">Phone Number</label>
                    <input
                      id="phoneNumber"
                      type="tel"
                      name="phoneNumber"
                      value={form.phoneNumber}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="+353 87 123 4567"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
                      border: 'none'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary"
                  >
                    {isSaving ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '24px' 
              }}>
                <div className="info-item">
                  <div className="info-label">Full Name</div>
                  <div className="info-value">
                    {[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-label">Username</div>
                  <div className="info-value">{user.username || "—"}</div>
                </div>

                <div className="info-item">
                  <div className="info-label">Email Address</div>
                  <div className="info-value">
                    {user.email ? (
                      <a href={`mailto:${user.email}`} style={{ color: '#14b8a6', textDecoration: 'none' }}>
                        {user.email}
                      </a>
                    ) : "—"}
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-label">Phone Number</div>
                  <div className="info-value">{user.phoneNumber || "—"}</div>
                </div>

                <div className="info-item">
                  <div className="info-label">Account Role</div>
                  <div className="info-value">
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      borderRadius: '20px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      background: user.role === 'admin' 
                        ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' 
                        : user.role === 'private'
                        ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white'
                    }}>
                      {user.role === 'admin' ? '👑 Administrator' : 
                       user.role === 'private' ? '🔒 Private Member' : 
                       '🌐 Public Member'}
                    </span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-label">Member Since</div>
                  <div className="info-value">
                    {user.createdDate ? new Date(user.createdDate).toLocaleDateString() : "—"}
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-label">Last Login</div>
                  <div className="info-value">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "—"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Account Actions */}
          {!editMode && (
            <div className="dashboard-card">
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🔧 Account Actions
              </h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '16px' 
              }}>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  style={{ 
                    background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(13, 148, 136, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(13, 148, 136, 0.3)';
                  }}
                >
                  🔑 Change Password
                </button>
                
                <button
                  onClick={() => {
                    if (confirm("Download your personal data as a PDF? This will include your profile information and activity history.")) {
                      handleExportMyData();
                    }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(5, 150, 105, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)';
                  }}
                >
                  📄 Export My Data (PDF)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '1000',
          padding: '20px'
        }} onClick={() => setShowPasswordModal(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                margin: '0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🔑 Change Password
              </h3>
              <button 
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px',
                  borderRadius: '4px'
                }}
                onClick={() => setShowPasswordModal(false)}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              {passwordError && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '14px'
                }}>
                  {passwordError}
                </div>
              )}
              
              <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Current Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px 40px 12px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: '#6b7280'
                      }}
                    >
                      {showCurrentPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px 40px 12px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        boxSizing: 'border-box'
                      }}
                      minLength="6"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: '#6b7280'
                      }}
                    >
                      {showNewPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginTop: '6px',
                    lineHeight: '1.4'
                  }}>
                    <strong>Password Requirements:</strong><br/>
                    • Minimum 6 characters<br/>
                    • Mix of letters and numbers recommended<br/>
                    • Avoid using personal information
                  </div>
                </div>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px 40px 12px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: '#6b7280'
                      }}
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    style={{
                      padding: '12px 24px',
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      color: '#374151',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    disabled={passwordLoading}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'white';
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      backgroundColor: passwordLoading ? '#9ca3af' : '#059669',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: passwordLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    disabled={passwordLoading}
                    onMouseEnter={(e) => {
                      if (!passwordLoading) {
                        e.target.style.backgroundColor = '#047857';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!passwordLoading) {
                        e.target.style.backgroundColor = '#059669';
                      }
                    }}
                  >
                    {passwordLoading ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
