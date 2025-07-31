import { useState } from "react";
import { Link } from "react-router-dom";

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
      const res = await fetch("http://localhost:5000/api/reset-password-noemail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userID, password: password, confirm_password: confirm }),
      });

      if (res.ok) {
        setMessage("Password reset successful. You can now log in.");
        setUserID("");
        setPassword("");
        setConfirm("");
      } else {
        const err = await res.json();
        setError(err.message || "Reset failed");
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#0f172a', 
            marginBottom: '8px',
            letterSpacing: '-0.02em'
          }}>
            Reset Password
          </h1>
          <p style={{ 
            color: '#64748b', 
            fontSize: '16px',
            fontWeight: '400'
          }}>
            Enter your User ID and new password
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

          <form onSubmit={handleReset}>
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label" htmlFor="userID">
                User ID
              </label>
              <input
                id="userID"
                type="text"
                required
                value={userID}
                onChange={(e) => setUserID(e.target.value)}
                className="form-input"
                placeholder="Enter your User ID"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label className="form-label" htmlFor="password">
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="Enter new password"
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    fontSize: '14px'
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <p style={{ 
                fontSize: '12px', 
                color: '#94a3b8', 
                marginTop: '4px' 
              }}>
                At least 8 characters with a number
              </p>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label className="form-label" htmlFor="confirm">
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="form-input"
                  placeholder="Confirm new password"
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    fontSize: '14px'
                  }}
                >
                  {showConfirm ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
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
                  Resetting password...
                </div>
              ) : (
                "Reset Password"
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
              Have email access?{" "}
              <Link to="/forgot-password/email" className="link">
                Reset via email
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
