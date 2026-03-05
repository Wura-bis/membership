import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useauth";
import { useToast } from "../../components/toast";
import { ActionButton } from "../../components/ui";

export default function Login() {
  const [userID, setUserID] = useState("");
  const [password, setPassword] = useState("");
  const [accessLevel, setAccessLevel] = useState("private");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

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
      showToast("Welcome back!", "success");
      
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
      showToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(20, 184, 166, 0.15)',
        padding: '56px',
        width: '100%',
        maxWidth: '480px',
        border: '3px solid #14b8a6'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '100px',
            height: '100px',
            background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            fontSize: '42px',
            color: 'white',
            fontWeight: '800',
            boxShadow: '0 8px 20px rgba(20, 184, 166, 0.3)'
          }}>
            BIS
          </div>
          <h1 style={{
            fontSize: '38px',
            fontWeight: '800',
            color: '#0f172a',
            margin: '0 0 12px 0'
          }}>Welcome Back</h1>
          <p style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#64748b',
            margin: 0
          }}>Sign in to your membership account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* User ID Field */}
          <div>
            <label htmlFor="userID" style={{
              display: 'block',
              fontSize: '17px',
              fontWeight: '700',
              color: '#0f172a',
              marginBottom: '10px'
            }}>👤 User ID or Email</label>
            <input
              id="userID"
              type="text"
              value={userID}
              onChange={e => handleFieldChange('userID', e.target.value)}
              autoComplete="username"
              placeholder="Enter your user ID or email"
              style={{
                width: '100%',
                padding: '16px 20px',
                border: fieldErrors.userID ? '2px solid #ef4444' : '2px solid #14b8a6',
                borderRadius: '10px',
                fontSize: '17px',
                fontWeight: '600',
                outline: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: '#f9fafb',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0f766e';
                e.target.style.backgroundColor = 'white';
                e.target.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.1)';
              }}
              onBlur={(e) => {
                handleFieldBlur('userID');
                e.target.style.boxShadow = 'none';
                if (!fieldErrors.userID) {
                  e.target.style.borderColor = '#14b8a6';
                  e.target.style.backgroundColor = '#f9fafb';
                }
              }}
            />
            {fieldErrors.userID && (
              <div style={{
                color: '#ef4444',
                fontSize: '15px',
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
              fontSize: '17px',
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
                  border: fieldErrors.password ? '2px solid #ef4444' : '2px solid #14b8a6',
                  borderRadius: '10px',
                  fontSize: '17px',
                  fontWeight: '600',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  backgroundColor: '#f9fafb',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#0f766e';
                  e.target.style.backgroundColor = 'white';
                  e.target.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.1)';
                }}
                onBlur={(e) => {
                  handleFieldBlur('password');
                  e.target.style.boxShadow = 'none';
                  if (!fieldErrors.password) {
                    e.target.style.borderColor = '#14b8a6';
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
                  color: '#14b8a6',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f0fdfa'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                tabIndex={-1}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {fieldErrors.password && (
              <div style={{
                color: '#ef4444',
                fontSize: '15px',
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
              width: '100%',
              background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '18px',
              padding: '18px 24px',
              letterSpacing: '0.5px',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)'
            }}
          >
            🚀 Sign In
          </ActionButton>

          {/* Links */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link 
              to="/forgot-password/email"
              style={{
                color: '#14b8a6',
                textDecoration: 'none',
                fontSize: '17px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
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
              🔑 Forgot your password?
            </Link>
          </div>

          {/* Signup Link */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '28px',
            padding: '24px',
            backgroundColor: '#f0fdfa',
            borderRadius: '12px',
            border: '2px solid #ccfbf1',
            boxShadow: '0 2px 8px rgba(20, 184, 166, 0.1)'
          }}>
            <p style={{ 
              margin: '0 0 12px 0', 
              color: '#475569', 
              fontSize: '17px',
              fontWeight: '600'
            }}>
              Don't have an account?
            </p>
            <Link 
              to="/signup"
              style={{
                color: '#14b8a6',
                textDecoration: 'none',
                fontSize: '18px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
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
    </div>
  );
}
