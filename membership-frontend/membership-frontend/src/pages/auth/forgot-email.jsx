import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from '../../utils/api';

export default function ForgotEmail() {
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setMessage("Reset link sent to your email.");
        setEmail("");
      } else {
        const err = await res.json();
        setError(err.message || "Failed to send reset link");
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
      background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '480px',
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '56px',
        boxShadow: '0 20px 40px rgba(20, 184, 166, 0.15)',
        border: '3px solid #14b8a6'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '100px',
            height: '100px',
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(20, 184, 166, 0.3)',
            fontSize: '42px',
            fontWeight: '800',
            color: 'white'
          }}>
            🔑
          </div>
          <h1 style={{ 
            fontSize: '38px', 
            fontWeight: '800', 
            color: '#0f172a', 
            marginBottom: '10px',
            letterSpacing: '-0.02em'
          }}>
            Forgot Password?
          </h1>
          <p style={{ 
            color: '#64748b', 
            fontSize: '18px',
            fontWeight: '600'
          }}>
            We'll send you a reset link to your email
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
              fontSize: '16px',
              fontWeight: '600',
              color: '#dc2626',
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
              fontSize: '16px',
              fontWeight: '600',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>✅</span> {message}
            </div>
          )}

          <form onSubmit={handleRequest}>
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: '17px',
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
                  border: '2px solid #14b8a6',
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
                  e.target.style.borderColor = '#14b8a6';
                  e.target.style.backgroundColor = '#f9fafb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{ 
                width: '100%', 
                marginBottom: '28px',
                padding: '18px 24px',
                background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '700',
                color: 'white',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.5px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)',
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
            backgroundColor: '#f0fdfa',
            borderRadius: '12px',
            border: '2px solid #ccfbf1',
            boxShadow: '0 2px 8px rgba(20, 184, 166, 0.1)'
          }}>
            <p style={{ 
              color: '#475569', 
              fontSize: '16px',
              fontWeight: '600',
              margin: '0 0 12px 0'
            }}>
              Remember your password?{" "}
              <Link to="/login" style={{
                color: '#14b8a6',
                textDecoration: 'none',
                fontSize: '17px',
                fontWeight: '700',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#0f766e';
                e.target.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#14b8a6';
                e.target.style.textDecoration = 'none';
              }}>
                🚀 Back to sign in
              </Link>
            </p>
            <p style={{ 
              color: '#475569', 
              fontSize: '16px',
              fontWeight: '600',
              margin: '12px 0 0 0'
            }}>
              Don't have email access?{" "}
              <Link to="/forgot-password/manual" style={{
                color: '#14b8a6',
                textDecoration: 'none',
                fontSize: '17px',
                fontWeight: '700',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#0f766e';
                e.target.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#14b8a6';
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
              fontSize: '14px',
              fontWeight: '600',
              color: '#94a3b8' 
            }}>
              © 2025 Membership System. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
