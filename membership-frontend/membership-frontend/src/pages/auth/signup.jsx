import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from '../../utils/api';
import { T, btn } from '../../utils/theme';

export default function Signup() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    requestPrivate: false,
    noEmail: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: type === "checkbox" ? checked : value };
      // Keep username in sync with firstName until the user edits it independently
      if (name === 'firstName' && prev.username === prev.firstName) {
        next.username = value;
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Validation
    if (!form.username.trim()) {
      setError("Please choose a username.");
      setIsLoading(false);
      return;
    }

    if (!form.noEmail && !form.email) {
      setError("Email is required.");
      setIsLoading(false);
      return;
    }

    if (!form.password || !form.confirmPassword) {
      setError("Password and confirmation are required.");
      setIsLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(form.password)) {
      setError("Password must be at least 8 characters and include a number.");
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username.trim(),
        email: form.noEmail ? null : form.email,
        password: form.password,
        requestPrivate: form.requestPrivate,
        noEmail: form.noEmail,
      };

      const res = await fetch(`${API_BASE_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Signup failed");

      const msg = form.noEmail
        ? `Account created! Your username is "${form.username.trim()}". Use it to log in.`
        : "Account created successfully!";
      setSuccess(msg);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.message);
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
        maxWidth: '580px',
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
            ✨
          </div>
          <h1 style={{ 
            fontSize: 'clamp(20px, 3.5vw, 26px)', 
            fontWeight: '800', 
            color: '#0f172a', 
            marginBottom: '10px',
            letterSpacing: '-0.02em'
          }}>
            Create Account
          </h1>
          <p style={{
            color: T.textMuted,
            fontSize: T.fontXl,
            fontWeight: '600'
          }}>
            Join our membership community
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

          {success && (
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
              <span>✅</span> {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Name Fields */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '20px',
              marginBottom: '28px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: T.fontXl,
                  fontWeight: '700',
                  color: '#0f172a',
                  marginBottom: '10px'
                }} htmlFor="firstName">
                  👤 First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Enter first name"
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
              <div>
                <label style={{
                  display: 'block',
                  fontSize: T.fontXl,
                  fontWeight: '700',
                  color: '#0f172a',
                  marginBottom: '10px'
                }} htmlFor="lastName">
                  👤 Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Enter last name"
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
            </div>

            {/* Username */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                fontSize: T.fontXl,
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '10px'
              }} htmlFor="username">
                🪪 Username
              </label>
              <input
                id="username"
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                placeholder="Choose a username"
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
              <p style={{ fontSize: T.fontBase, fontWeight: '600', color: '#64748b', marginTop: '8px' }}>
                💡 This is what you'll use to log in
              </p>
            </div>

            {/* Email Toggle */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center',
                fontSize: T.fontLg,
                fontWeight: '600',
                color: '#475569',
                cursor: 'pointer',
                marginBottom: '20px',
                padding: '14px 18px',
                backgroundColor: '#f8f9fa',
                borderRadius: '10px',
                border: '2px solid #e5e7eb',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6fcf9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}>
                <input
                  type="checkbox"
                  name="noEmail"
                  checked={form.noEmail}
                  onChange={handleChange}
                  style={{ 
                    marginRight: '12px',
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                📧 I don't have an email address
              </label>

              {form.noEmail ? null : (
                <div>
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
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
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
              )}
            </div>

            {/* Password Fields */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '20px',
              marginBottom: '28px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: T.fontXl,
                  fontWeight: '700',
                  color: '#0f172a',
                  marginBottom: '10px'
                }} htmlFor="password">
                  🔒 Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter password"
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
                    onClick={() => setShowPassword(v => !v)}
                    style={{ 
                      position: 'absolute', 
                      right: '16px', 
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: T.primaryLight,
                      cursor: 'pointer',
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
                  color: '#64748b', 
                  marginTop: '8px'
                }}>
                  💡 At least 8 characters with a number
                </p>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: T.fontXl,
                  fontWeight: '700',
                  color: '#0f172a',
                  marginBottom: '10px'
                }} htmlFor="confirmPassword">
                  🔒 Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm password"
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
                    onClick={() => setShowConfirmPassword(v => !v)}
                    style={{ 
                      position: 'absolute', 
                      right: '16px', 
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: T.primaryLight,
                      cursor: 'pointer',
                      fontSize: 'clamp(14px, 1.8vw, 17px)',
                      padding: '8px',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease'
                    }}
                    tabIndex={-1}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            </div>

            {/* Access Level */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                fontSize: T.fontLg,
                fontWeight: '600',
                color: '#475569',
                cursor: 'pointer',
                padding: '18px 20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '10px',
                border: '2px solid #e5e7eb',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6fcf9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}>
                <input
                  type="checkbox"
                  name="requestPrivate"
                  checked={form.requestPrivate}
                  onChange={handleChange}
                  style={{ 
                    marginRight: '12px', 
                    marginTop: '2px',
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                <div>
                  🔐 Request Private Access
                  <div style={{
                    fontSize: T.fontBase,
                    fontWeight: '500',
                    color: T.textMuted,
                    marginTop: '6px'
                  }}>
                    Private access requires admin approval
                  </div>
                </div>
              </label>
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
                  Creating account...
                </div>
              ) : (
                "✨ Create Account"
              )}
            </button>
          </form>

          <div style={{ 
            textAlign: 'center',
            padding: '24px',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            border: '2px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(78, 93, 46, 0.1)'
          }}>
            <p style={{ 
              color: '#475569', 
              fontSize: T.fontXl,
              fontWeight: '600',
              margin: '0 0 12px 0'
            }}>
              Already have an account?
            </p>
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
              🚀 Sign in
            </Link>
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
