import { useState, useEffect } from "react";
import MainLayout from "../components/mainlayout";
import { API_BASE_URL } from '../utils/api';
import { T, card, btn, pageHeader } from '../utils/theme';

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
    backupFrequency: "daily",
    contactEmail: "",
    contactPhone: "",
    contactHours: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/settings`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => { setSettings(prev => ({ ...prev, ...data })); setIsLoading(false); })
      .catch(() => { setIsLoading(false); });
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
        throw new Error();
      }
    } catch {
      setError("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

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

  const toggleRow = (icon, title, description, settingKey, danger = false) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px', background: 'var(--bg-secondary)',
      borderRadius: T.radiusMd,
      border: danger
        ? `1.5px solid ${T.redBorder}`
        : `1.5px solid var(--border-primary)`,
    }}>
      <div>
        <div style={{ fontSize: T.fontMd, fontWeight: '700', marginBottom: '4px', color: danger ? T.red : T.textMain }}>
          {icon} {title}
        </div>
        <div style={{ fontSize: T.fontBase, color: T.textMuted }}>{description}</div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0, marginLeft: '16px' }}>
        <input
          type="checkbox"
          checked={settings[settingKey]}
          onChange={(e) => handleChange(settingKey, e.target.checked)}
          style={{ display: 'none' }}
        />
        <div style={{
          width: '48px', height: '26px',
          background: settings[settingKey]
            ? (danger ? T.red : T.primary)
            : 'var(--border-primary)',
          borderRadius: '13px', position: 'relative',
          transition: 'background 0.2s ease',
        }}>
          <div style={{
            width: '20px', height: '20px', background: 'white', borderRadius: '50%',
            position: 'absolute', top: '3px',
            left: settings[settingKey] ? '25px' : '3px',
            transition: 'left 0.2s ease',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          }} />
        </div>
      </label>
    </div>
  );

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ ...pageHeader.wrapper, marginBottom: '32px' }}>
            <div>
              <h1 style={pageHeader.title}>🔧 System Settings</h1>
              <p style={pageHeader.subtitle}>Configure system preferences and global settings</p>
            </div>
            <button onClick={handleSave} disabled={isSaving} style={{ ...btn.primary, opacity: isSaving ? 0.6 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
              {isSaving ? <><div className="spinner" style={{ width: '14px', height: '14px' }} />Saving…</> : '💾 Save Settings'}
            </button>
          </div>

          {error && (
            <div style={{ marginBottom: '24px', padding: '14px 18px', background: 'var(--btn-danger-bg)', border: `1.5px solid ${T.redBorder}`, borderRadius: T.radiusMd, color: T.red, fontSize: T.fontBase, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={{ marginBottom: '24px', padding: '14px 18px', background: 'var(--badge-green-bg)', border: `1.5px solid ${T.greenBorder}`, borderRadius: T.radiusMd, color: T.green, fontSize: T.fontBase, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
              ✅ {success}
            </div>
          )}

          {/* General Settings */}
          <div style={{ ...card, marginBottom: '24px', padding: '24px' }}>
            <h2 style={{ fontSize: T.fontLg, fontWeight: '700', color: T.textMain, margin: '0 0 20px' }}>🏢 General Settings</h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label className="form-label">System Name</label>
                <input type="text" value={settings.systemName} onChange={(e) => handleChange('systemName', e.target.value)} className="form-input" placeholder="Enter system name" />
              </div>
              <div>
                <label className="form-label">Administrator Email</label>
                <input type="email" value={settings.adminEmail} onChange={(e) => handleChange('adminEmail', e.target.value)} className="form-input" placeholder="admin@example.com" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Default User Role</label>
                  <select value={settings.defaultRole} onChange={(e) => handleChange('defaultRole', e.target.value)} className="form-input">
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Session Timeout (minutes)</label>
                  <input type="number" value={settings.sessionTimeout} onChange={(e) => handleChange('sessionTimeout', e.target.value)} className="form-input" min="5" max="1440" />
                </div>
              </div>
            </div>
          </div>

          {/* User Management */}
          <div style={{ ...card, marginBottom: '24px', padding: '24px' }}>
            <h2 style={{ fontSize: T.fontLg, fontWeight: '700', color: T.textMain, margin: '0 0 20px' }}>👥 User Management</h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {toggleRow('🌐', 'Public Registration', 'Allow new users to register accounts', 'publicRegistration')}
              {toggleRow('⚡', 'Auto-Approval', 'Automatically approve new user registrations', 'autoApproval')}
            </div>
          </div>

          {/* System Configuration */}
          <div style={{ ...card, marginBottom: '24px', padding: '24px' }}>
            <h2 style={{ fontSize: T.fontLg, fontWeight: '700', color: T.textMain, margin: '0 0 20px' }}>🔧 System Configuration</h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label className="form-label">Maximum Upload Size (MB)</label>
                <input type="number" value={settings.maxUploadSize} onChange={(e) => handleChange('maxUploadSize', e.target.value)} className="form-input" min="1" max="100" />
              </div>
              <div>
                <label className="form-label">Backup Frequency</label>
                <select value={settings.backupFrequency} onChange={(e) => handleChange('backupFrequency', e.target.value)} className="form-input">
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              {toggleRow('📧', 'Email Notifications', 'Send system notifications via email', 'emailNotifications')}
              {toggleRow('🚧', 'Maintenance Mode', 'Temporarily disable public access to the system', 'maintenanceMode', true)}
            </div>
          </div>

          {/* Contact Information */}
          <div style={{ ...card, marginBottom: '24px', padding: '24px' }}>
            <h2 style={{ fontSize: T.fontLg, fontWeight: '700', color: T.textMain, margin: '0 0 20px' }}>📧 Contact Information</h2>
            <p style={{ fontSize: T.fontBase, color: T.textMuted, marginBottom: '16px' }}>Displayed to members on the Support &gt; Resources tab.</p>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label className="form-label">Email Address</label>
                <input type="email" value={settings.contactEmail} onChange={(e) => handleChange('contactEmail', e.target.value)} className="form-input" placeholder="e.g. contact@bisofpei.com" />
              </div>
              <div>
                <label className="form-label">Phone Number</label>
                <input type="text" value={settings.contactPhone} onChange={(e) => handleChange('contactPhone', e.target.value)} className="form-input" placeholder="e.g. (902) 887-2106" />
              </div>
              <div>
                <label className="form-label">Office Hours</label>
                <input type="text" value={settings.contactHours} onChange={(e) => handleChange('contactHours', e.target.value)} className="form-input" placeholder="e.g. Mon-Fri 10AM-2PM AST" />
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div style={{ ...card, padding: '24px', border: `1.5px solid ${T.redBorder}` }}>
            <h2 style={{ fontSize: T.fontLg, fontWeight: '700', color: T.red, margin: '0 0 20px' }}>⚠️ Danger Zone</h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '16px 20px', background: 'var(--bg-secondary)', borderRadius: T.radiusMd, border: `1.5px solid var(--border-primary)` }}>
                <div>
                  <div style={{ fontSize: T.fontMd, fontWeight: '700', marginBottom: '4px', color: T.textMain }}>🗄️ Export All Data</div>
                  <div style={{ fontSize: T.fontBase, color: T.textMuted }}>Download a complete backup of all system data</div>
                </div>
                <button onClick={() => window.location.href = `${API_BASE_URL}/api/export/members/csv`} style={{ ...btn.warning, flexShrink: 0 }}>
                  📥 Export Data
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '16px 20px', background: 'var(--bg-secondary)', borderRadius: T.radiusMd, border: `1.5px solid ${T.redBorder}` }}>
                <div>
                  <div style={{ fontSize: T.fontMd, fontWeight: '700', marginBottom: '4px', color: T.red }}>🗑️ Reset System</div>
                  <div style={{ fontSize: T.fontBase, color: T.textMuted }}>Server-level operation — contact the system administrator</div>
                </div>
                <button disabled style={{ ...btn.danger, flexShrink: 0, opacity: 0.4, cursor: 'not-allowed' }}>
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
