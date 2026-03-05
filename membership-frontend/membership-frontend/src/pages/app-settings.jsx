import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useauth";
import MainLayout from "../components/mainlayout";

export default function AppSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    theme: 'light',
    fontSize: 'medium',
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
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'extra-large': '22px'
    };
    document.documentElement.style.fontSize = fontSizes[settings.fontSize] || '16px';
    
    // Apply theme colors
    const themes = {
      light: {
        '--bg-primary': '#ffffff',
        '--bg-secondary': '#f8fafc',
        '--bg-gradient-start': '#f0fdfa',
        '--bg-gradient-mid': '#e6fffa',
        '--bg-gradient-end': '#f0fdfa',
        '--text-primary': '#1e293b',
        '--text-secondary': '#64748b',
        '--text-accent': '#0f766e',
        '--border-primary': '#e2e8f0',
        '--border-accent': '#5eead4',
        '--card-bg': '#ffffff',
        '--card-hover': '#f8fafc'
      },
      dark: {
        '--bg-primary': '#0f172a',
        '--bg-secondary': '#1e293b',
        '--bg-gradient-start': '#0f172a',
        '--bg-gradient-mid': '#1e293b',
        '--bg-gradient-end': '#0f172a',
        '--text-primary': '#f1f5f9',
        '--text-secondary': '#94a3b8',
        '--text-accent': '#5eead4',
        '--border-primary': '#334155',
        '--border-accent': '#14b8a6',
        '--card-bg': '#1e293b',
        '--card-hover': '#334155'
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
        <div style={{ 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f0fdfa 0%, #e6fffa 50%, #f0fdfa 100%)',
          padding: '32px 24px'
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
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
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
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
              🎨 App Settings
            </h1>
            <p style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#64748b',
              margin: '0'
            }}>
              Customize your viewing experience
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div style={{
              background: '#f0fdf4',
              border: '2px solid #bbf7d0',
              color: '#166534',
              padding: '18px',
              borderRadius: '10px',
              marginBottom: '24px',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              ✅ {success}
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
            
            {/* Font Size Setting */}
            <div style={{ marginBottom: '36px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#0f766e',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                🔤 Font Size
              </h2>
              
              <div style={{ marginBottom: '16px' }}>
                <p style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#64748b',
                  marginBottom: '16px',
                  lineHeight: '1.6'
                }}>
                  Choose a comfortable text size for reading
                </p>
                
                <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { value: 'small', label: 'Small', example: '14px - Best for large screens' },
                    { value: 'medium', label: 'Medium (Default)', example: '16px - Balanced and comfortable' },
                    { value: 'large', label: 'Large', example: '18px - Easier to read' },
                    { value: 'extra-large', label: 'Extra Large', example: '22px - Maximum readability' }
                  ].map(option => (
                    <label
                      key={option.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px 20px',
                        background: settings.fontSize === option.value ? '#ffffff' : '#ffffff',
                        border: settings.fontSize === option.value ? '3px solid #14b8a6' : '2px solid #e2e8f0',
                        borderRadius: '10px',
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
                          accentColor: '#14b8a6'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '17px',
                          fontWeight: '700',
                          color: settings.fontSize === option.value ? '#0f766e' : '#1e293b',
                          marginBottom: '4px'
                        }}>
                          {option.label}
                        </div>
                        <div style={{
                          fontSize: '15px',
                          color: '#64748b',
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
                fontSize: '24px',
                fontWeight: '700',
                color: '#0f766e',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                🎨 Color Theme
              </h2>
              
              <p style={{
                fontSize: '16px',
                fontWeight: '500',
                color: '#64748b',
                marginBottom: '16px',
                lineHeight: '1.6'
              }}>
                Select your preferred color scheme
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {[
                  { value: 'light', label: '☀️ Light Mode', desc: 'Default bright theme', gradient: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)' },
                  { value: 'dark', label: '🌙 Dark Mode', desc: 'Easy on the eyes', gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }
                ].map(theme => (
                  <label
                    key={theme.value}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '20px',
                      background: '#ffffff',
                      border: settings.theme === theme.value ? '3px solid #14b8a6' : '2px solid #e2e8f0',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '100%',
                      height: '80px',
                      background: theme.gradient,
                      borderRadius: '8px',
                      marginBottom: '12px',
                      border: '2px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
                      fontSize: '16px',
                      fontWeight: '700',
                      color: settings.theme === theme.value ? '#0f766e' : '#1e293b',
                      marginBottom: '4px'
                    }}>
                      {theme.label}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#64748b',
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
                fontSize: '24px',
                fontWeight: '700',
                color: '#0f766e',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                ⚡ Contrast
              </h2>
              
              <p style={{
                fontSize: '16px',
                fontWeight: '500',
                color: '#64748b',
                marginBottom: '16px',
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
                      background: settings.contrast === option.value ? '#ffffff' : '#ffffff',
                      border: settings.contrast === option.value ? '3px solid #14b8a6' : '2px solid #e2e8f0',
                      borderRadius: '10px',
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
                        accentColor: '#14b8a6'
                      }}
                    />
                    <div>
                      <div style={{
                        fontSize: '17px',
                        fontWeight: '700',
                        color: settings.contrast === option.value ? '#0f766e' : '#1e293b',
                        marginBottom: '4px'
                      }}>
                        {option.label}
                      </div>
                      <div style={{
                        fontSize: '15px',
                        color: '#64748b',
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
                fontSize: '24px',
                fontWeight: '700',
                color: '#0f766e',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                ✨ Animations
              </h2>
              
              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 20px',
                background: '#ffffff',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
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
                    accentColor: '#14b8a6'
                  }}
                />
                <div>
                  <div style={{
                    fontSize: '17px',
                    fontWeight: '700',
                    color: '#1e293b',
                    marginBottom: '4px'
                  }}>
                    Enable Animations
                  </div>
                  <div style={{
                    fontSize: '15px',
                    color: '#64748b',
                    fontWeight: '500',
                    lineHeight: '1.5'
                  }}>
                    Turn off animations if they cause discomfort or distraction
                  </div>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '16px',
              paddingTop: '32px',
              borderTop: '3px solid #ccfbf1',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={handlePreview}
                style={{
                  background: '#ffffff',
                  color: '#0f766e',
                  border: '2px solid #14b8a6',
                  padding: '18px 32px',
                  fontSize: '16px',
                  fontWeight: '700',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                👁️ Preview Changes
              </button>
              
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
                  borderRadius: '10px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSaving ? '💾 Saving...' : '💾 Save Settings'}
              </button>
              
              <button
                onClick={() => {
                  const defaultSettings = {
                    theme: 'light',
                    fontSize: 'medium',
                    contrast: 'normal',
                    animations: true
                  };
                  setSettings(defaultSettings);
                  applySettings(defaultSettings);
                  setSuccess("✅ Reset to default settings!");
                  setTimeout(() => setSuccess(""), 3000);
                }}
                style={{
                  background: '#ffffff',
                  color: '#64748b',
                  border: '2px solid #e2e8f0',
                  padding: '18px 32px',
                  fontSize: '16px',
                  fontWeight: '700',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                🔄 Reset to Default
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div style={{
            background: '#fffbeb',
            border: '2px solid #fde68a',
            borderRadius: '10px',
            padding: '20px',
            fontSize: '16px',
            fontWeight: '500',
            color: '#92400e',
            lineHeight: '1.6'
          }}>
            <strong>💡 Tip:</strong> These settings are saved to your browser. If you use a different device or browser, you'll need to set your preferences again.
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
