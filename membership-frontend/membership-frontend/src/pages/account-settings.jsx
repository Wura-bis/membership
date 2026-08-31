import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useauth";
import MainLayout from "../components/mainlayout";
import { API_BASE_URL } from '../utils/api';
import { T, card, btn, pageHeader } from '../utils/theme';

export default function AccountSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    profileVisibility: 'private',
    contactPreference: 'email'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  useEffect(() => {
    // Load user settings (for now, use defaults)
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess("Settings saved successfully!");
    } catch (err) {
      setError("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (error) setError("");
    if (success) setSuccess("");
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
      setPwSuccess("Password changed successfully.");
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

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={pageHeader.wrapper}>
            <div>
              <h1 style={pageHeader.title}>⚙️ Account Settings</h1>
              <p style={pageHeader.subtitle}>Manage your account preferences and privacy settings</p>
            </div>
          </div>

          {error && (
            <div style={{ background: T.redLight, border: `2px solid ${T.redBorder}`, color: T.red, padding: '10px 14px', borderRadius: T.radiusMd, marginBottom: '16px', fontSize: T.fontBase }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: T.greenLight, border: `2px solid ${T.greenBorder}`, color: T.green, padding: '10px 14px', borderRadius: T.radiusMd, marginBottom: '16px', fontSize: T.fontBase }}>
              {success}
            </div>
          )}

          {/* User ID card */}
          <div style={{ ...card, padding: '20px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Your User ID</div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: T.textMain, letterSpacing: '1px' }}>{user?.id || '—'}</div>
              <div style={{ fontSize: T.fontSm, color: T.textMuted, marginTop: '4px' }}>Use this ID to reset your password if you ever lose access to your email.</div>
            </div>
          </div>

          {/* Settings Form */}
          <div style={{
            ...card,
            padding: '24px',
            marginBottom: '28px',
          }}>
            <h2 style={{
              fontSize: T.fontLg,
              fontWeight: '700',
              color: T.textMain,
              marginBottom: '16px'
            }}>
              Notification Preferences
            </h2>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: T.primaryLight
                  }}
                />
                <span style={{ fontSize: T.fontBase, color: T.textMuted, fontWeight: '600' }}>
                  Email Notifications
                </span>
              </label>
              <p style={{
                fontSize: T.fontBase,
                fontWeight: '500',
                color: T.textMuted,
                margin: '8px 0 0 30px',
                lineHeight: '1.6'
              }}>
                Receive updates about society events, news, and important announcements
              </p>
            </div>

            <h2 style={{
              fontSize: T.fontLg,
              fontWeight: '700',
              color: T.textMain,
              marginBottom: '16px',
              marginTop: '36px'
            }}>
              Privacy Settings
            </h2>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                fontSize: T.fontBase,
                fontWeight: '700',
                color: T.textMain,
                marginBottom: '6px'
              }}>
                Profile Visibility
              </label>
              <select
                value={settings.profileVisibility}
                onChange={(e) => handleChange('profileVisibility', e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  padding: '8px 10px',
                  border: `2px solid ${T.primaryBorder}`,
                  borderRadius: T.radiusMd,
                  fontSize: T.fontBase,
                  fontWeight: '500',
                  background: 'var(--card-bg)'
                }}
              >
                <option value="private">Private (Members only)</option>
                <option value="public">Public</option>
              </select>
              <p style={{
                fontSize: T.fontBase,
                fontWeight: '500',
                color: T.textMuted,
                margin: '10px 0 0 0',
                lineHeight: '1.6'
              }}>
                Control who can view your profile information
              </p>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: T.fontBase,
                fontWeight: '700',
                color: T.textMain,
                marginBottom: '6px'
              }}>
                Preferred Contact Method
              </label>
              <select
                value={settings.contactPreference}
                onChange={(e) => handleChange('contactPreference', e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  padding: '8px 10px',
                  border: `2px solid ${T.primaryBorder}`,
                  borderRadius: T.radiusMd,
                  fontSize: T.fontBase,
                  fontWeight: '500',
                  background: 'var(--card-bg)'
                }}
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="mail">Physical Mail</option>
              </select>
              <p style={{
                fontSize: T.fontBase,
                fontWeight: '500',
                color: T.textMuted,
                margin: '8px 0 0 0'
              }}>
                How the society should contact you for important matters
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', paddingTop: '24px', borderTop: `2px solid ${T.primaryMid}` }}>
              <button onClick={handleSave} disabled={isSaving} style={{ ...btn.primary, opacity: isSaving ? 0.6 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>

          {/* Change Password — hidden for public/shared accounts */}
          {user?.role !== 'public' && <div style={{ ...card, padding: '24px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: T.fontLg, fontWeight: '700', color: T.textMain, marginBottom: '4px' }}>Change Password</h2>
            <p style={{ fontSize: T.fontBase, color: T.textMuted, marginBottom: '20px' }}>Update your login password. You'll need your current password to do this.</p>

            {pwError && <div style={{ background: T.redLight, border: `2px solid ${T.redBorder}`, color: T.red, padding: '10px 14px', borderRadius: T.radiusMd, marginBottom: '14px', fontSize: T.fontBase }}>{pwError}</div>}
            {pwSuccess && <div style={{ background: T.greenLight, border: `2px solid ${T.greenBorder}`, color: T.green, padding: '10px 14px', borderRadius: T.radiusMd, marginBottom: '14px', fontSize: T.fontBase }}>{pwSuccess}</div>}

            {[
              { key: 'currentPassword', label: 'Current Password' },
              { key: 'newPassword',     label: 'New Password' },
              { key: 'confirmPassword', label: 'Confirm New Password' },
            ].map(({ key, label }) => (
              <div key={key} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: T.fontBase, fontWeight: '700', color: T.textMain, marginBottom: '6px' }}>{label}</label>
                <input
                  type="password"
                  value={pwForm[key]}
                  onChange={e => { setPwForm(p => ({ ...p, [key]: e.target.value })); setPwError(""); setPwSuccess(""); }}
                  style={{ width: '100%', maxWidth: '400px', padding: '9px 12px', border: `2px solid ${T.primaryBorder}`, borderRadius: T.radiusMd, fontSize: T.fontBase, fontFamily: 'inherit', background: 'var(--card-bg)', color: T.textMain, boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            ))}

            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: `2px solid ${T.primaryMid}` }}>
              <button onClick={handleChangePassword} disabled={pwLoading} style={{ ...btn.primary, opacity: pwLoading ? 0.6 : 1, cursor: pwLoading ? 'not-allowed' : 'pointer' }}>
                {pwLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>}

          <div style={{ ...card, padding: '24px' }}>
            <h2 style={{ fontSize: T.fontLg, fontWeight: '700', color: T.textMain, marginBottom: '16px' }}>
              Quick Actions
            </h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a href="/my-profile" style={{ ...btn.ghost, textDecoration: 'none' }}>👤 Edit Profile</a>
              <a href="/support" style={{ ...btn.ghost, textDecoration: 'none' }}>🎧 Get Support</a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
