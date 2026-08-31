import { useAuth } from "../hooks/useauth";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from '../utils/api';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setBellOpen(false);
      }
    }
    if (bellOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [bellOpen]);

  // Poll notifications every 30 s (admin only)
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const fetchNotifications = () => {
      fetch(`${API_BASE_URL}/api/admin/notifications`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setNotifications(data.notifications || []);
            setUnread(data.unread || 0);
          }
        })
        .catch(() => {});
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.role]);

  if (!user) return <div>Loading...</div>;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markRead = (id) => {
    fetch(`${API_BASE_URL}/api/admin/notifications/${id}/read`, {
      method: 'PUT', credentials: 'include',
    }).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const markAllRead = (e) => {
    e.stopPropagation();
    fetch(`${API_BASE_URL}/api/admin/notifications/read-all`, {
      method: 'POST', credentials: 'include',
    }).catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead) markRead(n.id);
    setBellOpen(false);
    if (n.type === 'support_ticket') navigate('/admin/support');
    else if (n.type === 'new_signup') navigate('/admin/users');
  };

  const typeIcon = (type) => type === 'support_ticket' ? '🎫' : type === 'new_signup' ? '👤' : '🔔';

  const relativeTime = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr.replace(' ', 'T'))) / 1000);
    if (diff < 60)   return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
        <button className="sidebar-toggle" onClick={onMenuToggle} aria-label="Toggle navigation">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="navbar-title" style={{ margin: 0 }}>BIS Membership System</h1>
      </div>

      <div className="navbar-user">
        <span className="navbar-role-badge">
          {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)} User
        </span>

        {/* Notification bell — admin only */}
        {user.role === 'admin' && (
          <div ref={bellRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setBellOpen(o => !o)}
              aria-label="Notifications"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '6px', borderRadius: '8px', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'inherit',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unread > 0 && (
                <span style={{
                  position: 'absolute', top: '2px', right: '2px',
                  background: '#dc2626', color: '#fff',
                  fontSize: '10px', fontWeight: '800',
                  width: '16px', height: '16px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1,
                }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {bellOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                width: '340px', maxHeight: '420px',
                background: '#fff', border: '1.5px solid #e2e8f0',
                borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.13)',
                zIndex: 1000, display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderBottom: '1.5px solid #e2e8f0',
                  background: '#f8fafc', flexShrink: 0,
                }}>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                    Notifications {unread > 0 && <span style={{ color: '#dc2626' }}>({unread})</span>}
                  </span>
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '12px', color: '#4e5d2e', fontWeight: '600',
                        padding: '2px 6px', borderRadius: '4px',
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(n => (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: '10px',
                          width: '100%', padding: '12px 16px', border: 'none',
                          borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left',
                          background: n.isRead ? '#fff' : '#f0f4e8',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = n.isRead ? '#fff' : '#f0f4e8'}
                      >
                        <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>{typeIcon(n.type)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: n.isRead ? '600' : '700', fontSize: '13px', color: '#1e293b', marginBottom: '2px' }}>
                            {n.title}
                          </div>
                          {n.body && (
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {n.body}
                            </div>
                          )}
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{relativeTime(n.createdAt)}</div>
                        </div>
                        {!n.isRead && (
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4e5d2e', flexShrink: 0, marginTop: '5px' }} />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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
