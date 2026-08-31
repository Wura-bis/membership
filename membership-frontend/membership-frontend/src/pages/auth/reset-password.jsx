import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../../utils/api';
import { T, btn } from '../../utils/theme';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e5e7eb 100%)' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '56px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 40px rgba(78,93,46,0.15)', border: '3px solid #ef4444', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>Invalid Reset Link</h1>
          <p style={{ color: T.textMuted, marginBottom: '24px' }}>This link is missing a token. Please request a new password reset.</p>
          <Link to="/forgot-password/email" style={{ ...btn.primary, textDecoration: 'none' }}>Request Reset Link</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm)  { setError("Passwords do not match."); return; }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        navigate("/login", { state: { message: "Password reset successfully. You can now sign in." } });
      } else {
        setError(data.error || "Reset failed. The link may have expired.");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '16px 20px', border: '2px solid #4e5d2e', borderRadius: '10px',
    fontSize: T.fontXl, fontWeight: '600', outline: 'none', backgroundColor: '#f9fafb', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e5e7eb 100%)' }}>
      <div style={{ width: '100%', maxWidth: '480px', backgroundColor: 'white', borderRadius: '16px', padding: '56px', boxShadow: '0 20px 40px rgba(78,93,46,0.15)', border: '3px solid #4e5d2e' }}>

        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ width: '100px', height: '100px', margin: '0 auto 20px', background: 'linear-gradient(135deg, #4e5d2e, #0d9488)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
            🔑
          </div>
          <h1 style={{ fontSize: 'clamp(20px, 3.5vw, 26px)', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>Set New Password</h1>
          <p style={{ color: T.textMuted, fontSize: T.fontXl, fontWeight: '600' }}>Enter your new password below</p>
        </div>

        {error && (
          <div style={{ padding: '16px 20px', backgroundColor: '#fee', border: '2px solid #ef4444', borderRadius: '10px', marginBottom: '24px', fontSize: T.fontLg, fontWeight: '600', color: T.red, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: T.fontXl, fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
              🔒 New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                style={{ ...inputStyle, paddingRight: '60px' }}
                onFocus={(e) => { e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(78,93,46,0.1)'; }}
                onBlur={(e) => { e.target.style.backgroundColor = '#f9fafb'; e.target.style.boxShadow = 'none'; }}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '8px' }}>
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: T.fontXl, fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
              🔒 Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              style={inputStyle}
              onFocus={(e) => { e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(78,93,46,0.1)'; }}
              onBlur={(e) => { e.target.style.backgroundColor = '#f9fafb'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <button type="submit" disabled={isLoading}
            style={{ ...btn.primary, width: '100%', padding: '18px 24px', borderRadius: '12px', fontSize: T.fontXl, justifyContent: 'center', opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: '8px' }}>
            {isLoading ? "Saving..." : "🔑 Reset Password"}
          </button>
        </form>

        <div style={{ marginTop: '28px', textAlign: 'center' }}>
          <Link to="/forgot-password/manual" style={{ color: T.primaryLight, textDecoration: 'none', fontSize: T.fontXl, fontWeight: '600' }}>
            Don't have email access? Reset manually
          </Link>
        </div>
      </div>
    </div>
  );
}
