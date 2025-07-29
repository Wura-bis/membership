import { useState } from "react";
import { Link } from "react-router-dom";

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
      const res = await fetch("http://localhost:5000/api/forgot-password", {
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
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="icon-container">
            <svg style={{ width: '40px', height: '40px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#0f172a', 
            marginBottom: '8px',
            letterSpacing: '-0.02em'
          }}>
            Forgot Password?
          </h1>
          <p style={{ 
            color: '#64748b', 
            fontSize: '16px',
            fontWeight: '400'
          }}>
            We'll send you a reset link to your email
          </p>
        </div>

        {/* Reset Card */}
        <div className="card" style={{ padding: '40px' }}>
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {message && (
            <div className="alert alert-success">
              {message}
            </div>
          )}

          <form onSubmit={handleRequest}>
            <div style={{ marginBottom: '32px' }}>
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email address"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{ width: '100%', marginBottom: '24px' }}
            >
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="spinner" style={{ marginRight: '8px' }}></div>
                  Sending reset link...
                </div>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              Remember your password?{" "}
              <Link to="/login" className="link">
                Back to sign in
              </Link>
            </p>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>
              Don't have email access?{" "}
              <Link to="/forgot-password/manual" className="link">
                Reset manually
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: '32px', 
          textAlign: 'center' 
        }}>
          <p style={{ 
            fontSize: '12px', 
            color: '#94a3b8' 
          }}>
            © 2024 Membership System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
