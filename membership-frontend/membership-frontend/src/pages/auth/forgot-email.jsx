import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from '../../utils/api';
import { T, btn } from '../../utils/theme';

export default function ForgotEmail() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, lastName }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(data.message || "A reset link has been sent to your email.");
        setEmail(""); setFirstName(""); setLastName("");
      } else {
        setError(data.error || data.message || "Failed to send reset link");
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
            🔑
          </div>
          <h1 style={{ 
            fontSize: 'clamp(20px, 3.5vw, 26px)', 
            fontWeight: '800', 
            color: '#0f172a', 
            marginBottom: '10px',
            letterSpacing: '-0.02em'
          }}>
            Forgot Password?
          </h1>
          <p style={{ 
            color: T.textMuted,
            fontSize: T.fontXl,
            fontWeight: '600'
          }}>
            Enter your name and email to look up your User ID
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
              alignItems: 'flex-start',
              gap: '8px',
            }}>
              <span>✅</span> {message}
            </div>
          )}

          <form onSubmit={handleRequest}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: T.fontXl, fontWeight: '700', color: '#0f172a', marginBottom: '10px' }} htmlFor="firstName">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  style={{ width: '100%', padding: '14px 16px', border: '2px solid #4e5d2e', borderRadius: '10px', fontSize: T.fontXl, fontWeight: '600', outline: 'none', backgroundColor: '#f9fafb', boxSizing: 'border-box' }}
                  onFocus={(e) => { e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(78,93,46,0.1)'; }}
                  onBlur={(e) => { e.target.style.backgroundColor = '#f9fafb'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: T.fontXl, fontWeight: '700', color: '#0f172a', marginBottom: '10px' }} htmlFor="lastName">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  style={{ width: '100%', padding: '14px 16px', border: '2px solid #4e5d2e', borderRadius: '10px', fontSize: T.fontXl, fontWeight: '600', outline: 'none', backgroundColor: '#f9fafb', boxSizing: 'border-box' }}
                  onFocus={(e) => { e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(78,93,46,0.1)'; }}
                  onBlur={(e) => { e.target.style.backgroundColor = '#f9fafb'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: T.fontXl,
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '10px'
              }} htmlFor="email">
                📧 Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
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
                  Sending reset link...
                </div>
              ) : (
                "📨 Send Reset Link"
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
              Don't have email access?{" "}
              <Link to="/forgot-password/manual" style={{
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
                🔧 Reset manually
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
