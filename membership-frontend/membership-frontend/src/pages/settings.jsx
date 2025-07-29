import { useState, useEffect } from "react";
import MainLayout from "../components/mainlayout";

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
    fetch("http://localhost:5000/api/admin/settings", {
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
      const res = await fetch("http://localhost:5000/api/admin/settings", {
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
          <div className="dashboard-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 className="dashboard-title">⚙️ System Settings</h1>
                <p className="dashboard-subtitle">
                  Configure system preferences and global settings
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary"
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
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
            <div className="alert alert-error" style={{ marginBottom: '24px' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" style={{ marginBottom: '24px' }}>
              {success}
            </div>
          )}

          {/* General Settings */}
          <div className="dashboard-card" style={{ marginBottom: '24px' }}>
            <h2 className="dashboard-card-title">🏢 General Settings</h2>
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
          <div className="dashboard-card" style={{ marginBottom: '24px' }}>
            <h2 className="dashboard-card-title">👥 User Management</h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    🌐 Public Registration
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    Allow new users to register accounts
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.publicRegistration}
                    onChange={(e) => handleChange('publicRegistration', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  <div style={{
                    width: '48px',
                    height: '24px',
                    background: settings.publicRegistration ? '#14b8a6' : '#e2e8f0',
                    borderRadius: '12px',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: 'white',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '2px',
                      left: settings.publicRegistration ? '26px' : '2px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}></div>
                  </div>
                </label>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    ⚡ Auto-Approval
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    Automatically approve new user registrations
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.autoApproval}
                    onChange={(e) => handleChange('autoApproval', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  <div style={{
                    width: '48px',
                    height: '24px',
                    background: settings.autoApproval ? '#14b8a6' : '#e2e8f0',
                    borderRadius: '12px',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: 'white',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '2px',
                      left: settings.autoApproval ? '26px' : '2px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* System Configuration */}
          <div className="dashboard-card" style={{ marginBottom: '24px' }}>
            <h2 className="dashboard-card-title">🔧 System Configuration</h2>
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
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    📧 Email Notifications
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    Send system notifications via email
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  <div style={{
                    width: '48px',
                    height: '24px',
                    background: settings.emailNotifications ? '#14b8a6' : '#e2e8f0',
                    borderRadius: '12px',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: 'white',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '2px',
                      left: settings.emailNotifications ? '26px' : '2px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}></div>
                  </div>
                </label>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                background: settings.maintenanceMode ? '#fef3f2' : '#f8fafc',
                borderRadius: '8px',
                border: settings.maintenanceMode ? '1px solid #fecaca' : '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{ 
                    fontWeight: '600', 
                    marginBottom: '4px',
                    color: settings.maintenanceMode ? '#dc2626' : '#374151'
                  }}>
                    🚧 Maintenance Mode
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    Temporarily disable public access to the system
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  <div style={{
                    width: '48px',
                    height: '24px',
                    background: settings.maintenanceMode ? '#dc2626' : '#e2e8f0',
                    borderRadius: '12px',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: 'white',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '2px',
                      left: settings.maintenanceMode ? '26px' : '2px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="dashboard-card" style={{ border: '2px solid #fecaca', background: '#fef2f2' }}>
            <h2 style={{ color: '#dc2626', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              ⚠️ Danger Zone
            </h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '16px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #fecaca'
              }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    🗄️ Export All Data
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    Download a complete backup of all system data
                  </div>
                </div>
                <button
                  onClick={() => alert('Export functionality coming soon!')}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Export Data
                </button>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '16px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #fecaca'
              }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    🗑️ Reset System
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
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
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Reset System
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
