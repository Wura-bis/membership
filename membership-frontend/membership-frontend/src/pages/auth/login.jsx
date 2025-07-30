import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useauth";

export default function Login() {
  const [userID, setUserID] = useState("");
  const [password, setPassword] = useState("");
  const [accessLevel, setAccessLevel] = useState("private");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();
  const { login } = useAuth();

  // Real-time validation
  const validateField = (name, value) => {
    const errors = {};

    if (name === 'userID') {
      if (!value.trim()) {
        errors.userID = 'User ID or email is required';
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

    // Clear server error when user starts typing
    if (error) setError("");

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
    setError("");
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
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userID, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      
      // Update AuthContext with user data
      login(data.user);
      
      // Role-based redirect (use lowercase for comparison)
      const userRole = data.user.role.toLowerCase();
      if (userRole === "admin") {
        navigate("/dashboard");
      } else if (userRole === "private") {
        navigate("/dashboard/private");
      } else {
        navigate("/public");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        padding: '48px',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            fontSize: '32px',
            color: 'white',
            fontWeight: 'bold'
          }}>
            BIS
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1f2937',
            margin: '0 0 8px 0'
          }}>Welcome Back</h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: 0
          }}>Sign in to your membership account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* User ID Field */}
          <div>
            <label htmlFor="userID" style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px'
            }}>User ID or Email</label>
            <input
              id="userID"
              type="text"
              value={userID}
              onChange={e => handleFieldChange('userID', e.target.value)}
              autoComplete="username"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: fieldErrors.userID ? '2px solid #ef4444' : '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                backgroundColor: '#f9fafb',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#14b8a6';
                e.target.style.backgroundColor = 'white';
              }}
              onBlur={(e) => {
                handleFieldBlur('userID');
                if (!fieldErrors.userID) {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.backgroundColor = '#f9fafb';
                }
              }}
            />
            {fieldErrors.userID && (
              <div style={{
                color: '#ef4444',
                fontSize: '14px',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>⚠</span> {fieldErrors.userID}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px'
            }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => handleFieldChange('password', e.target.value)}
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingRight: '50px',
                  border: fieldErrors.password ? '2px solid #ef4444' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  backgroundColor: '#f9fafb',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#14b8a6';
                  e.target.style.backgroundColor = 'white';
                }}
                onBlur={(e) => {
                  handleFieldBlur('password');
                  if (!fieldErrors.password) {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.backgroundColor = '#f9fafb';
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px'
                }}
                tabIndex={-1}
              >
                {showPassword ? "👁" : "👁‍🗨"}
              </button>
            </div>
            {fieldErrors.password && (
              <div style={{
                color: '#ef4444',
                fontSize: '14px',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>⚠</span> {fieldErrors.password}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px',
              color: '#dc2626',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>❌</span> {error}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {isLoading && (
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            )}
            {isLoading ? "Signing in..." : "Sign In"}
          </button>

          {/* Links */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link 
              to="/forgot-password/email"
              style={{
                color: '#14b8a6',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            >
              Forgot your password?
            </Link>
          </div>

          {/* Signup Link */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#f0fdfa',
            borderRadius: '8px',
            border: '1px solid #a7f3d0'
          }}>
            <p style={{ 
              margin: '0 0 8px 0', 
              color: '#374151', 
              fontSize: '14px' 
            }}>
              Don't have an account?
            </p>
            <Link 
              to="/signup"
              style={{
                color: '#14b8a6',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.target.style.textDecoration = 'underline';
                e.target.style.color = '#0f766e';
              }}
              onMouseLeave={(e) => {
                e.target.style.textDecoration = 'none';
                e.target.style.color = '#14b8a6';
              }}
            >
              <span>👤</span>
              Create New Account
            </Link>
          </div>
        </form>

        {/* Additional styling for spinner animation */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
