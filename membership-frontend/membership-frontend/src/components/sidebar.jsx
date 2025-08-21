import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useauth";

const linksByRole = {
  admin: [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/admin/users", label: "User Management", icon: "👥" },
    { to: "/admin/approvals", label: "User Approvals", icon: "🔍" },
    { to: "/admin/support-tickets", label: "Support Tickets", icon: "🎫" },
    { to: "/members", label: "All Members", icon: "👤" },
    { to: "/admin/import", label: "Bulk Import", icon: "📥" },
    { to: "/settings", label: "System Settings", icon: "⚙️" },
  ],
  private: [
    { to: "/dashboard/private", label: "Dashboard", icon: "📊" },
    { to: "/members", label: "Member Directory", icon: "📋" },
    { to: "/support", label: "Support", icon: "🎧" },
    { to: "/my-profile", label: "My Profile", icon: "👤" },
  ],
  public: [
    { to: "/public", label: "Public Dashboard", icon: "🌐" },
    { to: "/members/deceased", label: "Member Directory", icon: "📋" },
    { to: "/my-profile", label: "My Profile", icon: "👤" },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const userRole = user?.role || "public";
  const links = linksByRole[userRole] || [];
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '16px', fontWeight: '700' }}>B</div>
          BIS
        </div>
      </div>
      <nav className="sidebar-nav">
            {links.filter(link => link.label !== "Recognitions").map((link) => (
          <Link key={link.to} to={link.to} className={`sidebar-link ${location.pathname === link.to ? 'active' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '16px' }}>{link.icon}</span>
              {link.label}
            </div>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
