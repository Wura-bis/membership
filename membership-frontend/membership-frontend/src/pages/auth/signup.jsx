import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    userID: "",
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
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Validation
    if (form.noEmail) {
      if (!form.userID) {
        setError("User ID is required.");
        setIsLoading(false);
        return;
      }
    } else {
      if (!form.email) {
        setError("Email is required.");
        setIsLoading(false);
        return;
      }
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
        email: form.noEmail ? null : form.email,
        password: form.password,
        userID: form.noEmail ? form.userID : null,
        requestPrivate: form.requestPrivate,
        noEmail: form.noEmail,
      };

      const res = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");

      setSuccess("Account created successfully!");
      setTimeout(() => navigate("/login"), 1500);
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
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)'
    }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="icon-container">
            <svg style={{ width: '40px', height: '40px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#0f172a', 
            marginBottom: '8px',
            letterSpacing: '-0.02em'
          }}>
            Create Account
          </h1>
          <p style={{ 
            color: '#64748b', 
            fontSize: '16px',
            fontWeight: '400'
          }}>
            Join our membership community
          </p>
        </div>

        {/* Signup Card */}
        <div className="card" style={{ padding: '40px' }}>
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Name Fields */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div>
                <label className="form-label" htmlFor="firstName">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="form-label" htmlFor="lastName">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            {/* Email Toggle */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '14px',
                color: '#64748b',
                cursor: 'pointer',
                marginBottom: '16px'
              }}>
                <input
                  type="checkbox"
                  name="noEmail"
                  checked={form.noEmail}
                  onChange={handleChange}
                  className="checkbox"
                  style={{ marginRight: '8px' }}
                />
                I don't have an email address
              </label>

              {form.noEmail ? (
                <div>
                  <label className="form-label" htmlFor="userID">
                    User ID
                  </label>
                  <input
                    id="userID"
                    type="text"
                    name="userID"
                    value={form.userID}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="Choose a unique user ID"
                  />
                </div>
              ) : (
                <div>
                  <label className="form-label" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="Enter your email address"
                  />
                </div>
              )}
            </div>

            {/* Password Fields */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div>
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="Enter password"
                    style={{ paddingRight: '50px' }}
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
                      color: '#64748b',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    tabIndex={-1}
                    onMouseEnter={(e) => {
                      e.target.style.color = '#14b8a6';
                      e.target.style.backgroundColor = '#f0fdfa';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = '#64748b';
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    {showPassword ? '👁️‍🗨️' : '👁️'}
                  </button>
                </div>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#94a3b8', 
                  marginTop: '4px',
                  margin: '4px 0 0 0'
                }}>
                  At least 8 characters with a number
                </p>
              </div>
              <div>
                <label className="form-label" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="Confirm password"
                    style={{ paddingRight: '50px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    tabIndex={-1}
                    onMouseEnter={(e) => {
                      e.target.style.color = '#14b8a6';
                      e.target.style.backgroundColor = '#f0fdfa';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = '#64748b';
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
                  </button>
                </div>
              </div>
            </div>

            {/* Access Level */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                fontSize: '14px',
                color: '#64748b',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  name="requestPrivate"
                  checked={form.requestPrivate}
                  onChange={handleChange}
                  className="checkbox"
                  style={{ marginRight: '8px', marginTop: '2px' }}
                />
                <div>
                  Request Private Access
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#94a3b8',
                    marginTop: '2px'
                  }}>
                    Private access requires admin approval
                  </div>
                </div>
              </label>
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
                  Creating account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              Already have an account?{" "}
              <Link to="/login" className="link">
                Sign in
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
            © 2025 Membership System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
