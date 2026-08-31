import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useauth";
import { T } from '../utils/theme';

const linksByRole = {
  admin: [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/admin/users", label: "User Management", icon: "👥" },
    { to: "/admin/approvals", label: "User Approvals", icon: "🔍" },
    { to: "/admin/support-tickets", label: "Support Tickets", icon: "🎫" },
    { to: "/members", label: "All Members", icon: "👤" },
    { to: "/admin/import", label: "Bulk Import", icon: "📥" },
    { to: "/members/statistics", label: "Statistics", icon: "📈" },
    { to: "/my-profile", label: "My Profile", icon: "👤" },
    { to: "/app-settings", label: "App Settings", icon: "⚙️" },
  ],
  private: [
    { to: "/dashboard/private", label: "Dashboard", icon: "📊" },
    { to: "/members", label: "Member Directory", icon: "📋" },
    { to: "/support", label: "Support", icon: "🎧" },
    { to: "/members/statistics", label: "Statistics", icon: "📈" },
    { to: "/my-profile", label: "My Profile", icon: "👤" },
    { to: "/app-settings", label: "App Settings", icon: "⚙️" },
  ],
  public: [
    { to: "/public", label: "Public Dashboard", icon: "🌐" },
    { to: "/members/historical", label: "Member Directory", icon: "📋" },
    { to: "/members/statistics", label: "Statistics", icon: "📈" },
    { to: "/my-profile", label: "My Profile", icon: "👤" },
    { to: "/app-settings", label: "App Settings", icon: "⚙️" },
  ],
};

export default function Sidebar({ isOpen, onClose, collapsed }) {
  const { user } = useAuth();
  const location = useLocation();
  const userRole = user?.role || "public";
  const links = linksByRole[userRole] || [];
  return (
    <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}${collapsed ? ' sidebar--collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <img src={`${import.meta.env.BASE_URL}favicon.png`} alt="BIS Logo" style={{ width: '48px', height: '48px', flexShrink: 0, borderRadius: T.radiusMd, objectFit: 'contain' }} />
          <span className="sidebar-brand-text" style={{ fontSize: '14px', lineHeight: '1.3' }}>BIS Membership Database</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className={`sidebar-link ${location.pathname === link.to ? 'active' : ''}`} onClick={onClose} title={link.label}>
            <span className="sidebar-link-icon">{link.icon}</span>
            <span className="sidebar-link-label">{link.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
