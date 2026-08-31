import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useauth";
import { useStickyScrollbar } from "../../hooks/useStickyScrollbar";
import MainLayout from "../../components/mainlayout";
import { API_BASE_URL } from '../../utils/api';
import { T, card, thStyle, tdStyle, btn, filterBar, pageHeader } from '../../utils/theme';

export default function ExpiredMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [countyFilter, setCountyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("lastName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { tableWrapRef, mirrorScrollbar } = useStickyScrollbar([members]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/members/expired`, { credentials: "include" })
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => { setMembers(Array.isArray(data) ? data : []); setIsLoading(false); })
      .catch(() => { setError("Failed to load expired members"); setIsLoading(false); });
  }, []);

  const handleSort = (column) => {
    if (sortBy === column) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(column); setSortOrder("asc"); }
  };

  const SortableHeader = ({ column, children }) => {
    const isActive = sortBy === column;
    return (
      <th
        style={{ ...thStyle, cursor: 'pointer', userSelect: 'none',
          color: isActive ? T.primaryLight : T.textMain,
          background: isActive ? '#e0f2fe' : T.primaryBg }}
        onClick={() => handleSort(column)}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = T.primaryLight; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = T.textMain; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {children}
          <span style={{ opacity: isActive ? 1 : 0.35, fontSize: '11px' }}>
            {isActive ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}
          </span>
        </div>
      </th>
    );
  };

  const countyOptions = [...new Set(members.map(m => m.county).filter(Boolean))].sort();
  const hasFilters = search || countyFilter !== "all" || sortBy !== "lastName" || sortOrder !== "asc";

  const filtered = members.filter(m => {
    const matchesSearch = [m.firstName, m.lastName, m.county].join(" ").toLowerCase().includes(search.toLowerCase());
    const matchesCounty = countyFilter === "all" || m.county === countyFilter;
    return matchesSearch && matchesCounty;
  }).sort((a, b) => {
    let aVal, bVal;
    if (sortBy === "membershipEndDate") { aVal = new Date(a.membershipEndDate || "1900-01-01"); bVal = new Date(b.membershipEndDate || "1900-01-01"); }
    else { aVal = (a[sortBy] || "").toLowerCase(); bVal = (b[sortBy] || "").toLowerCase(); }
    if (sortOrder === "asc") return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return bVal < aVal ? -1 : bVal > aVal ? 1 : 0;
  });

  const inputStyle = { fontSize: T.fontBase, padding: '9px 12px', border: `2px solid ${T.primaryBorder}`, borderRadius: T.radiusMd, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };

  if (isLoading) return (
    <MainLayout>
      <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={pageHeader.wrapper}>
            <div>
              <h1 style={pageHeader.title}>Expired Memberships</h1>
              <p style={pageHeader.subtitle}>Members whose memberships require renewal</p>
            </div>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

          <div style={filterBar}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Search by name or county..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, flex: '1', minWidth: '220px' }} />
              {hasFilters && (
                <button onClick={() => { setSearch(""); setCountyFilter("all"); setSortBy("lastName"); setSortOrder("asc"); }} style={btn.ghost}>✕ Clear</button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: T.fontSm, fontWeight: '600', color: T.textMain, marginBottom: '5px' }}>County</label>
                <select value={countyFilter} onChange={e => setCountyFilter(e.target.value)} style={inputStyle}>
                  <option value="all">All Counties</option>
                  {countyOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: T.fontBase, fontWeight: '600', color: T.textMain }}>
              <strong style={{ color: T.primaryLight }}>{filtered.length}</strong>{' '}
              {filtered.length === members.length ? `expired ${filtered.length === 1 ? 'membership' : 'memberships'}` : `of ${members.length} expired memberships`}
            </span>
          </div>

          <div ref={tableWrapRef} style={{ ...card, overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: T.fontBase, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.primaryBorder}` }}>
                  <SortableHeader column="lastName">Last Name</SortableHeader>
                  <SortableHeader column="firstName">First Name</SortableHeader>
                  <SortableHeader column="membershipEndDate">Expiry Date</SortableHeader>
                  <SortableHeader column="county">County</SortableHeader>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '60px 32px', color: T.textMuted }}>
                      <div style={{ fontSize: '36px', marginBottom: '10px' }}>⏰</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: T.textMain, marginBottom: '6px' }}>
                        {members.length === 0 ? 'No Expired Members' : 'No Members Found'}
                      </div>
                      <div style={{ fontSize: T.fontBase }}>{members.length === 0 ? 'All memberships are current!' : 'Try adjusting your search or filters.'}</div>
                    </td>
                  </tr>
                ) : filtered.map((m, i) => (
                  <tr key={m.id || i}
                    style={{ background: T.white, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.primaryBg}
                    onMouseLeave={e => e.currentTarget.style.background = T.white}
                  >
                    <td style={{ ...tdStyle, fontWeight: '700', color: T.textMain, whiteSpace: 'nowrap' }}>{m.lastName || '—'}</td>
                    <td style={{ ...tdStyle, fontWeight: '600', color: T.textMain, whiteSpace: 'nowrap' }}>{m.firstName || '—'}</td>
                    <td style={{ ...tdStyle, fontWeight: '500', color: T.red, whiteSpace: 'nowrap' }}>
                      {m.membershipEndDate ? m.membershipEndDate.split('-').reverse().join('/') : '—'}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: '500', color: T.textMuted, whiteSpace: 'nowrap' }}>{m.county || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {mirrorScrollbar}
        </div>
      </div>
    </MainLayout>
  );
}