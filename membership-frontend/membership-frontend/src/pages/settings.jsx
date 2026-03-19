import { useState, useEffect } from "react";
import MainLayout from "../components/mainlayout";
import { API_BASE_URL } from '../utils/api';

export default function Settings() {
  const [settings, setSettings] = useState({
    systemName: "BIS Membership System",
    adminEmail: "",
    maxUploadSize: "10",
    autoApproval: false,
    emailNotifications: true,
    maintenanceMode: false,
    publicRegistration: true,
    defaultRole: "public",
    sessionTimeout: "30",
    backupFrequency: "daily"
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Simulate loading settings from backend
    fetch(`${API_BASE_URL}/api/admin/settings`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setSettings(prev => ({ ...prev, ...data }));
        setIsLoading(false);
      })
      .catch(() => {
        // If endpoint doesn't exist, just use defaults
        setIsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSuccess("Settings saved successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (err) {
      setError("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <h1 style={{ 
                  fontSize: '38px', 
                  fontWeight: '700', 
                  color: '#0f766e', 
                  marginBottom: '12px',
                  margin: 0 
                }}>
                  🔧 System Settings
                </h1>
                <p style={{ 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: '#64748b',
                  margin: 0 
                }}>
                  Configure system preferences and global settings
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 32px',
                  fontSize: '15px',
                  fontWeight: '700',
                  borderRadius: '12px',
                  background: isSaving ? '#9ca3af' : 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
                  color: 'white',
                  border: '2px solid ' + (isSaving ? '#6b7280' : '#0f766e'),
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  boxShadow: isSaving ? 'none' : '0 2px 8px rgba(20, 184, 166, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSaving) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(20, 184, 166, 0.3)';
                  }
                }}
              >
                {isSaving ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                    Saving...
                  </>
                ) : (
                  <>
                    💾 Save Settings
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ 
              marginBottom: '32px',
              padding: '20px 28px',
              background: '#fff1f2',
              border: '2px solid #fecaca',
              borderRadius: '12px',
              color: '#dc2626',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div style={{ 
              marginBottom: '32px',
              padding: '20px 28px',
              background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
              border: '2px solid #059669',
              borderRadius: '12px',
              color: '#065f46',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}>
              <span style={{ fontSize: '24px' }}>✅</span>
              {success}
            </div>
          )}

          {/* General Settings */}
          <div style={{ 
            marginBottom: '32px',
            padding: '36px',
            background: '#f0fdfa',
            borderRadius: '16px',
            border: '2px solid #5eead4',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.15)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#0f766e',
              marginBottom: '28px',
              margin: 0,
              marginBottom: '28px'
            }}>
              🏢 General Settings
            </h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label className="form-label">System Name</label>
                <input
                  type="text"
                  value={settings.systemName}
                  onChange={(e) => handleChange('systemName', e.target.value)}
                  className="form-input"
                  placeholder="Enter system name"
                />
              </div>
              
              <div>
                <label className="form-label">Administrator Email</label>
                <input
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => handleChange('adminEmail', e.target.value)}
                  className="form-input"
                  placeholder="admin@example.com"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Default User Role</label>
                  <select
                    value={settings.defaultRole}
                    onChange={(e) => handleChange('defaultRole', e.target.value)}
                    className="form-input"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleChange('sessionTimeout', e.target.value)}
                    className="form-input"
                    min="5"
                    max="480"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* User Management Settings */}
          <div style={{ 
            marginBottom: '32px',
            padding: '36px',
            background: 'white',
            borderRadius: '16px',
            border: '2px solid #5eead4',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.15)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#0f766e',
              marginBottom: '28px',
              margin: 0,
              marginBottom: '28px'
            }}>
              👥 User Management
            </h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                background: '#f0fdfa',
                borderRadius: '12px',
                border: '2px solid #ccfbf1'
              }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: '700', marginBottom: '6px', color: '#0f766e' }}>
                    🌐 Public Registration
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#64748b' }}>
                    Allow new users to register accounts
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.publicRegistration}
                    onChange={(e) => handleChange('publicRegistration', e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: '56px',
                    height: '28px',
                    background: settings.publicRegistration ? 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)' : '#cbd5e1',
                    borderRadius: '14px',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    border: '2px solid ' + (settings.publicRegistration ? '#0f766e' : '#94a3b8')
                  }}>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      background: 'white',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '1px',
                      left: settings.publicRegistration ? '29px' : '1px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                    }}></div>
                  </div>
                </label>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                background: '#f0fdfa',
                borderRadius: '12px',
                border: '2px solid #ccfbf1'
              }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: '700', marginBottom: '6px', color: '#0f766e' }}>
                    ⚡ Auto-Approval
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#64748b' }}>
                    Automatically approve new user registrations
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.autoApproval}
                    onChange={(e) => handleChange('autoApproval', e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: '56px',
                    height: '28px',
                    background: settings.autoApproval ? 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)' : '#cbd5e1',
                    borderRadius: '14px',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    border: '2px solid ' + (settings.autoApproval ? '#0f766e' : '#94a3b8')
                  }}>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      background: 'white',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '1px',
                      left: settings.autoApproval ? '29px' : '1px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                    }}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* System Configuration */}
          <div style={{ 
            marginBottom: '32px',
            padding: '36px',
            background: '#f0fdfa',
            borderRadius: '16px',
            border: '2px solid #5eead4',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.15)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#0f766e',
              marginBottom: '28px',
              margin: 0,
              marginBottom: '28px'
            }}>
              🔧 System Configuration
            </h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label className="form-label">Maximum Upload Size (MB)</label>
                <input
                  type="number"
                  value={settings.maxUploadSize}
                  onChange={(e) => handleChange('maxUploadSize', e.target.value)}
                  className="form-input"
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <label className="form-label">Backup Frequency</label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) => handleChange('backupFrequency', e.target.value)}
                  className="form-input"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                background: '#f0fdfa',
                borderRadius: '12px',
                border: '2px solid #ccfbf1'
              }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: '700', marginBottom: '6px', color: '#0f766e' }}>
                    📧 Email Notifications
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#64748b' }}>
                    Send system notifications via email
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: '56px',
                    height: '28px',
                    background: settings.emailNotifications ? 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)' : '#cbd5e1',
                    borderRadius: '14px',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    border: '2px solid ' + (settings.emailNotifications ? '#0f766e' : '#94a3b8')
                  }}>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      background: 'white',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '1px',
                      left: settings.emailNotifications ? '29px' : '1px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                    }}></div>
                  </div>
                </label>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                background: settings.maintenanceMode ? '#fff1f2' : '#f0fdfa',
                borderRadius: '12px',
                border: '2px solid ' + (settings.maintenanceMode ? '#fecaca' : '#ccfbf1')
              }}>
                <div>
                  <div style={{ 
                    fontSize: '17px',
                    fontWeight: '700', 
                    marginBottom: '6px',
                    color: settings.maintenanceMode ? '#dc2626' : '#0f766e'
                  }}>
                    🚧 Maintenance Mode
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#64748b' }}>
                    Temporarily disable public access to the system
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: '56px',
                    height: '28px',
                    background: settings.maintenanceMode ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : '#cbd5e1',
                    borderRadius: '14px',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    border: '2px solid ' + (settings.maintenanceMode ? '#dc2626' : '#94a3b8')
                  }}>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      background: 'white',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '1px',
                      left: settings.maintenanceMode ? '29px' : '1px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                    }}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div style={{ 
            padding: '36px',
            border: '3px solid #fecaca', 
            background: '#fff1f2',
            borderRadius: '16px',
            boxShadow: '0 6px 20px rgba(220, 38, 38, 0.15)'
          }}>
            <h2 style={{ 
              color: '#dc2626', 
              fontSize: '24px', 
              fontWeight: '700', 
              marginBottom: '24px',
              margin: 0,
              marginBottom: '24px'
            }}>
              ⚠️ Danger Zone
            </h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '20px 24px',
                background: 'white',
                borderRadius: '12px',
                border: '2px solid #fecaca'
              }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: '700', marginBottom: '6px', color: '#dc2626' }}>
                    🗄️ Export All Data
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#64748b' }}>
                    Download a complete backup of all system data
                  </div>
                </div>
                <button
                  onClick={() => alert('Export functionality coming soon!')}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    border: '2px solid #d97706',
                    padding: '10px 24px',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
                  }}
                >
                  📥 Export Data
                </button>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '20px 24px',
                background: 'white',
                borderRadius: '12px',
                border: '2px solid #fecaca'
              }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: '700', marginBottom: '6px', color: '#dc2626' }}>
                    🗑️ Reset System
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#64748b' }}>
                    This will permanently delete all data and reset the system
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to reset the entire system? This action cannot be undone.')) {
                      alert('System reset functionality would be implemented here.');
                    }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    color: 'white',
                    border: '2px solid #b91c1c',
                    padding: '10px 24px',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.3)';
                  }}
                >
                  💣 Reset System
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
