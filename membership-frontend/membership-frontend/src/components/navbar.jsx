import { useAuth } from "../hooks/useauth";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [dropdownOpen]);

  // Add a safety check in case user is null
  if (!user) {
    return <div>Loading...</div>;
  }

  const handleLogout = () => {
    logout();
    if (user.role === "public") {
      navigate("/login");
    } else {
      navigate("/login");
    }
  };

  return (
    <header className="navbar">
      <h1 className="navbar-title">BIS Membership System</h1>

      <div className="navbar-user">
        <span className="navbar-role-badge">
          {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)} User
        </span>

        <div className="navbar-dropdown" ref={dropdownRef}>
          <button 
            className="navbar-user-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {user.name || `${user.firstName} ${user.lastName}`}
            <svg style={{ width: '16px', height: '16px', marginLeft: '8px', display: 'inline-block' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {dropdownOpen && (
            <div className="navbar-dropdown-menu">
              <Link to="/my-profile" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                👤 My Account
              </Link>
              {user.role === 'admin' && (
                <Link to="/settings" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                  ⚙️ Settings
                </Link>
              )}
              <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
              <button 
                onClick={handleLogout} 
                className="navbar-dropdown-item danger"
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
