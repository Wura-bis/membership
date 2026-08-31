import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from '../../utils/api';
import { T, btn } from '../../utils/theme';

export default function ForgotNoEmail() {
  const [userID, setUserID] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setIsLoading(true);

    if (password !== confirm) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("Password must be at least 8 characters and include a number.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/reset-password-noemail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: userID, password: password }),
      });

      if (res.ok) {
        setMessage("Password reset successful. You can now log in.");
        setUserID("");
        setPassword("");
        setConfirm("");
      } else {
        const err = await res.json();
        setError(err.error || err.message || "Reset failed");
      }
    } catch {
      setError("Server error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e5e7eb 100%)'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '480px',
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '56px',
        boxShadow: '0 20px 40px rgba(78, 93, 46, 0.15)',
        border: '3px solid #4e5d2e'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '100px',
            height: '100px',
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #4e5d2e, #0d9488)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(78, 93, 46, 0.3)',
            fontSize: 'clamp(22px, 4vw, 28px)',
            fontWeight: '800',
            color: 'white'
          }}>
            🔧
          </div>
          <h1 style={{ 
            fontSize: 'clamp(20px, 3.5vw, 26px)', 
            fontWeight: '800', 
            color: '#0f172a', 
            marginBottom: '10px',
            letterSpacing: '-0.02em'
          }}>
            Reset Password
          </h1>
          <p style={{ 
            color: T.textMuted,
            fontSize: T.fontXl,
            fontWeight: '600'
          }}>
            Enter your User ID and new password
          </p>
        </div>

        {/* Form Section */}
        <div>
          {error && (
            <div style={{
              padding: '16px 20px',
              backgroundColor: '#fee',
              border: '2px solid #ef4444',
              borderRadius: '10px',
              marginBottom: '24px',
              fontSize: T.fontLg,
              fontWeight: '600',
              color: T.red,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {message && (
            <div style={{
              padding: '16px 20px',
              backgroundColor: '#f0fdf4',
              border: '2px solid #22c55e',
              borderRadius: '10px',
              marginBottom: '24px',
              fontSize: T.fontLg,
              fontWeight: '600',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>✅</span> {message}
            </div>
          )}

          <form onSubmit={handleReset}>
            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                fontSize: T.fontXl,
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '10px'
              }} htmlFor="userID">
                🆔 User ID
              </label>
              <input
                id="userID"
                type="text"
                required
                value={userID}
                onChange={(e) => setUserID(e.target.value)}
                placeholder="Enter your User ID"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  border: '2px solid #4e5d2e',
                  borderRadius: '10px',
                  fontSize: T.fontXl,
                  fontWeight: '600',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  backgroundColor: '#f9fafb',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4e5d2e';
                  e.target.style.backgroundColor = 'white';
                  e.target.style.boxShadow = '0 0 0 3px rgba(78, 93, 46, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#4e5d2e';
                  e.target.style.backgroundColor = '#f9fafb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                fontSize: T.fontXl,
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '10px'
              }} htmlFor="password">
                🔒 New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    paddingRight: '60px',
                    border: '2px solid #4e5d2e',
                    borderRadius: '10px',
                    fontSize: T.fontXl,
                    fontWeight: '600',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: '#f9fafb',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4e5d2e';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(78, 93, 46, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#4e5d2e';
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: T.primaryLight,
                    fontSize: 'clamp(14px, 1.8vw, 17px)',
                    padding: '8px',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  tabIndex={-1}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <p style={{ 
                fontSize: T.fontBase,
                fontWeight: '600',
                color: T.textMuted,
                marginTop: '8px'
              }}>
                💡 At least 8 characters with a number
              </p>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: T.fontXl,
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '10px'
              }} htmlFor="confirm">
                🔒 Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    paddingRight: '60px',
                    border: '2px solid #4e5d2e',
                    borderRadius: '10px',
                    fontSize: T.fontXl,
                    fontWeight: '600',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: '#f9fafb',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4e5d2e';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(78, 93, 46, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#4e5d2e';
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: T.primaryLight,
                    fontSize: 'clamp(14px, 1.8vw, 17px)',
                    padding: '8px',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  tabIndex={-1}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  {showConfirm ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...btn.primary,
                width: '100%',
                marginBottom: '28px',
                padding: '18px 24px',
                borderRadius: '12px',
                fontSize: T.fontXl,
                justifyContent: 'center',
                letterSpacing: '0.5px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(78, 93, 46, 0.3)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
              onMouseEnter={(e) => !isLoading && (e.target.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => !isLoading && (e.target.style.transform = 'translateY(0)')}
            >
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '3px solid rgba(255,255,255,0.3)',
                    borderTop: '3px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Resetting password...
                </div>
              ) : (
                "🔐 Reset Password"
              )}
            </button>
          </form>

          <div style={{ 
            padding: '24px',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            border: '2px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(78, 93, 46, 0.1)'
          }}>
            <p style={{ 
              color: '#475569', 
              fontSize: T.fontLg,
              fontWeight: '600',
              margin: '0 0 12px 0'
            }}>
              Remember your password?{" "}
              <Link to="/login" style={{
                color: T.primaryLight,
                textDecoration: 'none',
                fontSize: T.fontXl,
                fontWeight: '700',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = T.textMain;
                e.target.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = T.primaryLight;
                e.target.style.textDecoration = 'none';
              }}>
                🚀 Back to sign in
              </Link>
            </p>
            <p style={{
              color: '#475569',
              fontSize: T.fontLg,
              fontWeight: '600',
              margin: '12px 0 0 0'
            }}>
              Have email access?{" "}
              <Link to="/forgot-password/email" style={{
                color: T.primaryLight,
                textDecoration: 'none',
                fontSize: T.fontXl,
                fontWeight: '700',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = T.textMain;
                e.target.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = T.primaryLight;
                e.target.style.textDecoration = 'none';
              }}>
                📧 Reset via email
              </Link>
            </p>
          </div>

          {/* Footer Note */}
          <div style={{ 
            marginTop: '24px', 
            textAlign: 'center' 
          }}>
            <p style={{ 
              fontSize: T.fontBase,
              fontWeight: '600',
              color: '#94a3b8' 
            }}>
              © 2026 Benevolent Irish Society of PEI · Designed &amp; developed by Wuraola
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
