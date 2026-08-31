import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useauth";
import MainLayout from "../components/mainlayout";
import { T, card, btn, pageHeader } from '../utils/theme';

export default function AppSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    theme: 'light',
    fontSize: 'small',
    contrast: 'normal',
    animations: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      applySettings(parsed); // Apply on load
    }
    setIsLoading(false);
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setSuccess("");

    // Small delay for visual feedback
    setTimeout(() => {
      try {
        // Apply and save settings
        applySettings(settings);
        
        setSuccess("✅ Settings saved successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        console.error("Failed to save settings:", err);
        setSuccess("❌ Failed to save settings. Please try again.");
        setTimeout(() => setSuccess(""), 3000);
      } finally {
        setIsSaving(false);
      }
    }, 300);
  };

  const applySettings = (settings) => {
    // Apply font size to body
    const fontSizes = {
      'compact': '13px',
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'extra-large': '22px'
    };
    const zooms = {
      'compact': '1.0',
      'small': '1.0',
      'medium': '1.1',
      'large': '1.2',
      'extra-large': '1.4'
    };
    document.documentElement.style.fontSize = fontSizes[settings.fontSize] || '14px';
    const rootEl = document.getElementById('root');
    if (rootEl) rootEl.style.zoom = zooms[settings.fontSize] || '1.0';
    
    // Apply theme colors
    const themes = {
      light: {
        '--bg-primary': '#ffffff',
        '--bg-secondary': '#f8fafc',
        '--bg-gradient-start': '#f8f9fa',
        '--bg-gradient-mid': '#f8f9fa',
        '--bg-gradient-end': '#f8f9fa',
        '--text-primary': '#1e293b',
        '--text-secondary': '#64748b',
        '--text-accent': '#4e5d2e',
        '--border-primary': '#e2e8f0',
        '--border-accent': '#a4b870',
        '--card-bg': '#ffffff',
        '--card-hover': '#f8fafc'
      },
      dark: {
        '--bg-primary': '#111827',
        '--bg-secondary': '#1f2937',
        '--bg-gradient-start': '#111827',
        '--bg-gradient-mid': '#1a2332',
        '--bg-gradient-end': '#111827',
        '--text-primary': '#e2e8f0',
        '--text-secondary': '#9ca3af',
        '--text-accent': '#8fb147',
        '--border-primary': '#374151',
        '--border-accent': '#6b8040',
        '--card-bg': '#1f2937',
        '--card-hover': '#374151'
      },
      'high-contrast': {
        '--bg-primary': '#ffffff',
        '--bg-secondary': '#f8fafc',
        '--bg-gradient-start': '#ffffff',
        '--bg-gradient-mid': '#f8fafc',
        '--bg-gradient-end': '#ffffff',
        '--text-primary': '#000000',
        '--text-secondary': '#334155',
        '--text-accent': '#047857',
        '--border-primary': '#000000',
        '--border-accent': '#047857',
        '--card-bg': '#ffffff',
        '--card-hover': '#f1f5f9'
      }
    };
    
    const themeColors = themes[settings.theme] || themes.light;
    Object.entries(themeColors).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });
    document.documentElement.setAttribute('data-theme', settings.theme);
    
    // Apply contrast
    if (settings.contrast === 'high') {
      document.documentElement.style.setProperty('--text-weight-normal', '600');
      document.documentElement.style.setProperty('--text-weight-bold', '800');
      document.documentElement.style.setProperty('--border-width', '3px');
    } else {
      document.documentElement.style.setProperty('--text-weight-normal', '500');
      document.documentElement.style.setProperty('--text-weight-bold', '700');
      document.documentElement.style.setProperty('--border-width', '2px');
    }
    
    // Apply animations preference
    if (!settings.animations) {
      document.documentElement.style.setProperty('--animation-duration', '0s');
    } else {
      document.documentElement.style.setProperty('--animation-duration', '0.2s');
    }
    
    // Store in localStorage for persistence
    localStorage.setItem('appSettings', JSON.stringify(settings));
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (success) setSuccess("");
  };

  const handlePreview = () => {
    applySettings(settings);
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
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={pageHeader.wrapper}>
            <div>
              <h1 style={pageHeader.title}>🎨 App Settings</h1>
              <p style={pageHeader.subtitle}>Customize your viewing experience</p>
            </div>
          </div>

          {success && (
            <div style={{ background: T.greenLight, border: `2px solid ${T.greenBorder}`, color: T.green, padding: '12px 16px', borderRadius: T.radiusMd, marginBottom: '24px', fontSize: T.fontBase, fontWeight: '600' }}>
              {success}
            </div>
          )}

          {/* Settings Form */}
          <div style={{
            ...card,
            padding: '24px',
            marginBottom: '28px',
          }}>
            
            {/* Font Size Setting */}
            <div style={{ marginBottom: '36px' }}>
              <h2 style={{
                fontSize: T.fontLg,
                fontWeight: '700',
                color: T.textMain,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                🔤 Font Size
              </h2>

              <div style={{ marginBottom: '16px' }}>
                <p style={{
                  fontSize: T.fontLg,
                  fontWeight: '500',
                  color: T.textMuted,
                  marginBottom: '16px',
                  lineHeight: '1.6'
                }}>
                  Choose a comfortable text size for reading
                </p>
                
                <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { value: 'compact', label: 'Compact (85%)', example: 'Smaller size — fits more content on screen' },
                    { value: 'small', label: 'Normal (Default)', example: 'Standard size — suits most screens' },
                    { value: 'medium', label: 'Medium (110%)', example: 'Slightly larger — good for larger screens' },
                    { value: 'large', label: 'Large (120%)', example: 'Larger — ideal for wide/high-res screens' },
                    { value: 'extra-large', label: 'Extra Large (140%)', example: 'Maximum size — best for very large screens or accessibility' }
                  ].map(option => (
                    <label
                      key={option.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px 20px',
                        background: settings.fontSize === option.value ? '#ffffff' : '#ffffff',
                        border: settings.fontSize === option.value ? `2px solid ${T.primaryBorder}` : `2px solid ${T.slateBorder}`,
                        borderRadius: T.radiusMd,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name="fontSize"
                        value={option.value}
                        checked={settings.fontSize === option.value}
                        onChange={(e) => handleChange('fontSize', e.target.value)}
                        style={{
                          width: '20px',
                          height: '20px',
                          marginRight: '16px',
                          accentColor: T.primaryLight
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: T.fontBase,
                          fontWeight: '700',
                          color: settings.fontSize === option.value ? T.textMain : T.textMuted,
                          marginBottom: '4px'
                        }}>
                          {option.label}
                        </div>
                        <div style={{
                          fontSize: T.fontMd,
                          color: T.textMuted,
                          fontWeight: '500'
                        }}>
                          {option.example}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Theme Setting */}
            <div style={{ marginBottom: '36px' }}>
              <h2 style={{
                fontSize: T.fontLg,
                fontWeight: '700',
                color: T.textMain,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                🎨 Color Theme
              </h2>

              <p style={{
                fontSize: T.fontBase,
                fontWeight: '500',
                color: T.textMuted,
                marginBottom: '12px',
                lineHeight: '1.6'
              }}>
                Select your preferred color scheme
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {[
                  { value: 'light', label: '☀️ Light Mode', desc: 'Default bright theme', gradient: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' },
                  { value: 'dark', label: '🌙 Dark Mode', desc: 'Easy on the eyes', gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }
                ].map(theme => (
                  <label
                    key={theme.value}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '20px',
                      background: T.white,
                      border: settings.theme === theme.value ? `2px solid ${T.primaryBorder}` : `2px solid ${T.slateBorder}`,
                      borderRadius: T.radiusMd,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '100%',
                      height: '80px',
                      background: theme.gradient,
                      borderRadius: T.radiusMd,
                      marginBottom: '12px',
                      border: `2px solid ${T.slateBorder}`,
                      boxShadow: T.shadowSm
                    }}></div>
                    <input
                      type="radio"
                      name="theme"
                      value={theme.value}
                      checked={settings.theme === theme.value}
                      onChange={(e) => handleChange('theme', e.target.value)}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      fontSize: T.fontLg,
                      fontWeight: '700',
                      color: settings.theme === theme.value ? T.textMain : T.textMuted,
                      marginBottom: '4px'
                    }}>
                      {theme.label}
                    </div>
                    <div style={{
                      fontSize: T.fontBase,
                      color: T.textMuted,
                      fontWeight: '500'
                    }}>
                      {theme.desc}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Contrast Setting */}
            <div style={{ marginBottom: '36px' }}>
              <h2 style={{
                fontSize: T.fontLg,
                fontWeight: '700',
                color: T.textMain,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                ⚡ Contrast
              </h2>

              <p style={{
                fontSize: T.fontBase,
                fontWeight: '500',
                color: T.textMuted,
                marginBottom: '12px',
                lineHeight: '1.6'
              }}>
                Adjust text contrast for better visibility
              </p>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                {[
                  { value: 'normal', label: 'Normal Contrast', desc: 'Standard colors' },
                  { value: 'high', label: 'High Contrast', desc: 'Stronger colors for better visibility' }
                ].map(option => (
                  <label
                    key={option.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '16px 20px',
                      background: T.white,
                      border: settings.contrast === option.value ? `2px solid ${T.primaryBorder}` : `2px solid ${T.slateBorder}`,
                      borderRadius: T.radiusMd,
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="contrast"
                      value={option.value}
                      checked={settings.contrast === option.value}
                      onChange={(e) => handleChange('contrast', e.target.value)}
                      style={{
                        width: '20px',
                        height: '20px',
                        marginRight: '16px',
                        accentColor: T.primaryLight
                      }}
                    />
                    <div>
                      <div style={{
                        fontSize: T.fontLg,
                        fontWeight: '700',
                        color: settings.contrast === option.value ? T.textMain : T.textMuted,
                        marginBottom: '4px'
                      }}>
                        {option.label}
                      </div>
                      <div style={{
                        fontSize: T.fontMd,
                        color: T.textMuted,
                        fontWeight: '500'
                      }}>
                        {option.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Animations Setting */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: T.fontLg,
                fontWeight: '700',
                color: T.textMain,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                ✨ Animations
              </h2>
              
              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                background: T.white,
                border: `2px solid ${T.slateBorder}`,
                borderRadius: T.radiusMd,
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={settings.animations}
                  onChange={(e) => handleChange('animations', e.target.checked)}
                  style={{
                    width: '22px',
                    height: '22px',
                    marginRight: '16px',
                    accentColor: '#4e5d2e'
                  }}
                />
                <div>
                  <div style={{
                    fontSize: T.fontBase,
                    fontWeight: '700',
                    color: T.textMuted,
                    marginBottom: '4px'
                  }}>
                    Enable Animations
                  </div>
                  <div style={{
                    fontSize: T.fontMd,
                    color: T.textMuted,
                    fontWeight: '500',
                    lineHeight: '1.5'
                  }}>
                    Turn off animations if they cause discomfort or distraction
                  </div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', paddingTop: '24px', borderTop: `2px solid ${T.primaryMid}`, flexWrap: 'wrap' }}>
              <button onClick={handlePreview} style={btn.ghost}>
                👁️ Preview Changes
              </button>
              <button onClick={handleSave} disabled={isSaving} style={{ ...btn.primary, opacity: isSaving ? 0.6 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                {isSaving ? '💾 Saving...' : '💾 Save Settings'}
              </button>
              <button
                onClick={() => {
                  const defaultSettings = { theme: 'light', fontSize: 'small', contrast: 'normal', animations: true };
                  setSettings(defaultSettings);
                  applySettings(defaultSettings);
                  setSuccess("✅ Reset to default settings!");
                  setTimeout(() => setSuccess(""), 3000);
                }}
                style={btn.ghost}
              >
                🔄 Reset to Default
              </button>
            </div>
          </div>

          <div style={{ background: T.amberLight, border: `2px solid ${T.amberBorder}`, borderRadius: T.radiusMd, padding: '16px', fontSize: T.fontBase, fontWeight: '500', color: T.amber, lineHeight: '1.6' }}>
            <strong>💡 Tip:</strong> These settings are saved to your browser. If you use a different device or browser, you'll need to set your preferences again.
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
