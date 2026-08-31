import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useauth";
import { useToast } from "../../components/toast";
import { ActionButton } from "../../components/ui";
import { API_BASE_URL } from '../../utils/api';
import { T, btn } from '../../utils/theme';

export default function Login() {
  const [userID, setUserID] = useState("");
  const [password, setPassword] = useState("");
  const [accessLevel, setAccessLevel] = useState("private");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const resetMessage = location.state?.message || "";
  const { login } = useAuth();
  const { showToast } = useToast();

  // Real-time validation
  const validateField = (name, value) => {
    const errors = {};

    if (name === 'userID') {
      if (!value.trim()) {
        errors.userID = 'Username or email is required';
      } else if (value.includes('@') && !/\S+@\S+\.\S+/.test(value)) {
        errors.userID = 'Please enter a valid email address';
      }
    }

    if (name === 'password') {
      if (!value) {
        errors.password = 'Password is required';
      } else if (value.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
    }

    return errors;
  };

  const handleFieldChange = (name, value) => {
    if (name === 'userID') setUserID(value);
    if (name === 'password') setPassword(value);

    // Validate if field has been touched
    if (touched[name]) {
      const errors = validateField(name, value);
      setFieldErrors(prev => ({ ...prev, ...errors, [name]: errors[name] || null }));
    }
  };

  const handleFieldBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const value = name === 'userID' ? userID : password;
    const errors = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, ...errors }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    const errors = {
      ...validateField('userID', userID),
      ...validateField('password', password),
    };
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userID, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      
      // Update AuthContext with user data
      login(data);
      showToast("Welcome back!", "success");

      // Return to saved page only if the same account is logging back in
      const savedRedirect = sessionStorage.getItem("redirectAfterLogin");
      const savedUserId = sessionStorage.getItem("redirectUserId");
      const incomingId = String(data.user_id ?? "");
      if (savedRedirect && savedRedirect.startsWith("/") && !savedRedirect.startsWith("//") && (!savedUserId || savedUserId === incomingId)) {
        sessionStorage.removeItem("redirectAfterLogin");
        sessionStorage.removeItem("redirectUserId");
        navigate(savedRedirect);
        return;
      }
      sessionStorage.removeItem("redirectAfterLogin");
      sessionStorage.removeItem("redirectUserId");

      // Role-based redirect (use lowercase for comparison)
      const userRole = data.role.toLowerCase();
      if (userRole === "admin") {
        navigate("/dashboard");
      } else if (userRole === "private") {
        navigate("/dashboard/private");
      } else {
        navigate("/public");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e5e7eb 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.09)',
        padding: '56px',
        width: '100%',
        maxWidth: '480px',
        border: '1px solid #e5e7eb'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '100px',
            height: '100px',
            background: '#4e5d2e',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            fontSize: 'clamp(22px, 4vw, 28px)',
            color: 'white',
            fontWeight: '800',
            boxShadow: '0 8px 20px rgba(78, 93, 46, 0.3)'
          }}>
            BIS
          </div>
          <h1 style={{
            fontSize: 'clamp(20px, 3.5vw, 26px)',
            fontWeight: '800',
            color: '#0f172a',
            margin: '0 0 12px 0'
          }}>Welcome Back</h1>
          <p style={{
            fontSize: T.fontXl,
            fontWeight: '600',
            color: T.textMuted,
            margin: 0
          }}>Sign in to your membership account</p>
        </div>

        {resetMessage && (
          <div style={{ padding: '14px 18px', backgroundColor: '#f0fdf4', border: '2px solid #22c55e', borderRadius: '10px', marginBottom: '20px', fontSize: T.fontLg, fontWeight: '600', color: '#16a34a', display: 'flex', gap: '8px' }}>
            <span>✅</span> {resetMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* User ID Field */}
          <div>
            <label htmlFor="userID" style={{
              display: 'block',
              fontSize: T.fontXl,
              fontWeight: '700',
              color: '#0f172a',
              marginBottom: '10px'
            }}>👤 Username or Email</label>
            <input
              id="userID"
              type="text"
              value={userID}
              onChange={e => handleFieldChange('userID', e.target.value)}
              autoComplete="username"
              placeholder="Enter your username or email"
              style={{
                width: '100%',
                padding: '16px 20px',
                border: fieldErrors.userID ? '1.5px solid #ef4444' : '1.5px solid #d1d5db',
                borderRadius: '10px',
                fontSize: T.fontXl,
                fontWeight: '600',
                outline: 'none',
                transition: 'all 0.15s ease',
                backgroundColor: '#f9fafb',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4e5d2e';
                e.target.style.backgroundColor = 'white';
                e.target.style.boxShadow = '0 0 0 3px rgba(78,93,46,0.1)';
              }}
              onBlur={(e) => {
                handleFieldBlur('userID');
                e.target.style.boxShadow = 'none';
                if (!fieldErrors.userID) {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.backgroundColor = '#f9fafb';
                }
              }}
            />
            {fieldErrors.userID && (
              <div style={{
                color: '#ef4444',
                fontSize: T.fontMd,
                fontWeight: '600',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>⚠️</span> {fieldErrors.userID}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" style={{
              display: 'block',
              fontSize: T.fontXl,
              fontWeight: '700',
              color: '#0f172a',
              marginBottom: '10px'
            }}>🔒 Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => handleFieldChange('password', e.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  paddingRight: '60px',
                  border: fieldErrors.password ? '1.5px solid #ef4444' : '1.5px solid #d1d5db',
                  borderRadius: '10px',
                  fontSize: T.fontXl,
                  fontWeight: '600',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                  backgroundColor: '#f9fafb',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4e5d2e';
                  e.target.style.backgroundColor = 'white';
                  e.target.style.boxShadow = '0 0 0 3px rgba(78,93,46,0.1)';
                }}
                onBlur={(e) => {
                  handleFieldBlur('password');
                  e.target.style.boxShadow = 'none';
                  if (!fieldErrors.password) {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.backgroundColor = '#f9fafb';
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: T.primaryLight,
                  fontSize: 'clamp(14px, 1.8vw, 17px)',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                tabIndex={-1}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {fieldErrors.password && (
              <div style={{
                color: '#ef4444',
                fontSize: T.fontMd,
                fontWeight: '600',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>⚠️</span> {fieldErrors.password}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <ActionButton
            type="submit"
            variant="primary"
            size="large"
            loading={isLoading}
            style={{
              ...btn.primary,
              width: '100%',
              borderRadius: '12px',
              fontSize: T.fontXl,
              padding: '18px 24px',
              letterSpacing: '0.5px',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(78, 93, 46, 0.3)',
              justifyContent: 'center'
            }}
          >
            🚀 Sign In
          </ActionButton>

          {/* Links */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link 
              to="/forgot-password/email"
              style={{
                color: T.primaryLight,
                textDecoration: 'none',
                fontSize: T.fontXl,
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.textDecoration = 'underline';
                e.target.style.color = T.textMain;
              }}
              onMouseLeave={(e) => {
                e.target.style.textDecoration = 'none';
                e.target.style.color = T.primaryLight;
              }}
            >
              🔑 Forgot your password?
            </Link>
          </div>

          {/* Signup Link */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '28px',
            padding: '24px',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{ 
              margin: '0 0 12px 0', 
              color: '#475569', 
              fontSize: T.fontXl,
              fontWeight: '600'
            }}>
              Don't have an account?
            </p>
            <Link 
              to="/signup"
              style={{
                color: T.primaryLight,
                textDecoration: 'none',
                fontSize: T.fontXl,
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.textDecoration = 'underline';
                e.target.style.color = T.textMain;
              }}
              onMouseLeave={(e) => {
                e.target.style.textDecoration = 'none';
                e.target.style.color = T.primaryLight;
              }}
            >
              <span>✨</span>
              Create New Account
            </Link>
          </div>
        </form>

        {/* Additional styling for spinner animation */}
  <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>

      {/* Copyright */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: T.fontSm, color: '#9ca3af', margin: 0 }}>
          © 2026 Benevolent Irish Society of PEI · Designed &amp; developed by Wuraola
        </p>
      </div>
    </div>
  );
}
