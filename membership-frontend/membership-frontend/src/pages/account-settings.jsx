import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useauth";
import MainLayout from "../components/mainlayout";

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

  if (isLoading) {
    return (
      <MainLayout>
        <div style={{ 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f0fdfa 0%, #e6fffa 50%, #f0fdfa 100%)',
          padding: '32px 24px'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '400px'
            }}>
              <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #e6fffa 50%, #f0fdfa 100%)',
        padding: '32px 24px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
              ⚙️ Account Settings
            </h1>
            <p style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#64748b',
              margin: '0'
            }}>
              Manage your account preferences and privacy settings
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#166534',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              {success}
            </div>
          )}

          {/* Settings Form */}
          <div style={{
            background: '#f0fdfa',
            border: '2px solid #5eead4',
            borderRadius: '12px',
            padding: '36px',
            marginBottom: '28px',
            boxShadow: '0 2px 12px rgba(20,184,166,0.08)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#0f766e',
              marginBottom: '28px'
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
                    accentColor: '#14b8a6'
                  }}
                />
                <span style={{
                  fontSize: '17px',
                  color: '#1e293b',
                  fontWeight: '600'
                }}>
                  Email Notifications
                </span>
              </label>
              <p style={{
                fontSize: '16px',
                fontWeight: '500',
                color: '#64748b',
                margin: '10px 0 0 30px',
                lineHeight: '1.6'
              }}>
                Receive updates about society events, news, and important announcements
              </p>
            </div>

            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#0f766e',
              marginBottom: '28px',
              marginTop: '36px'
            }}>
              Privacy Settings
            </h2>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '700',
                color: '#0f766e',
                marginBottom: '10px'
              }}>
                Profile Visibility
              </label>
              <select
                value={settings.profileVisibility}
                onChange={(e) => handleChange('profileVisibility', e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  padding: '16px',
                  border: '2px solid #5eead4',
                  borderRadius: '10px',
                  fontSize: '17px',
                  fontWeight: '500',
                  background: 'white'
                }}
              >
                <option value="private">Private (Members only)</option>
                <option value="public">Public</option>
              </select>
              <p style={{
                fontSize: '16px',
                fontWeight: '500',
                color: '#64748b',
                margin: '10px 0 0 0',
                lineHeight: '1.6'
              }}>
                Control who can view your profile information
              </p>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '700',
                color: '#0f766e',
                marginBottom: '10px'
              }}>
                Preferred Contact Method
              </label>
              <select
                value={settings.contactPreference}
                onChange={(e) => handleChange('contactPreference', e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  padding: '16px',
                  border: '2px solid #5eead4',
                  borderRadius: '10px',
                  fontSize: '17px',
                  fontWeight: '500',
                  background: 'white'
                }}
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="mail">Physical Mail</option>
              </select>
              <p style={{
                fontSize: '16px',
                fontWeight: '500',
                color: '#64748b',
                margin: '8px 0 0 0'
              }}>
                How the society should contact you for important matters
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '16px',
              paddingTop: '32px',
              borderTop: '3px solid #ccfbf1'
            }}>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  background: isSaving ? '#94a3b8' : '#14b8a6',
                  color: 'white',
                  border: '2px solid ' + (isSaving ? '#94a3b8' : '#0f766e'),
                  padding: '18px 32px',
                  fontSize: '16px',
                  fontWeight: '700',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '16px'
            }}>
              Quick Actions
            </h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a 
                href="/my-profile"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#1e293b',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f1f5f9';
                  e.target.style.borderColor = '#14b8a6';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f8fafc';
                  e.target.style.borderColor = '#e2e8f0';
                }}
              >
                👤 Edit Profile
              </a>
              <a 
                href="/support"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#1e293b',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f1f5f9';
                  e.target.style.borderColor = '#14b8a6';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f8fafc';
                  e.target.style.borderColor = '#e2e8f0';
                }}
              >
                🎧 Get Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
