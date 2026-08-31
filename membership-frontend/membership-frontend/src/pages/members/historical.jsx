import { useEffect, useState } from "react";
import { useStickyScrollbar } from "../../hooks/useStickyScrollbar";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useauth";
import MainLayout from "../../components/mainlayout";
import { API_BASE_URL } from '../../utils/api';
import { T, card, thStyle, tdStyle, btn, filterBar, pageHeader } from '../../utils/theme';

export default function HistoricalMembers() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const itemsPerPage = parseInt(searchParams.get('ipp') || '25', 10);
  const setCurrentPage = (pageOrFn) => {
    const next = typeof pageOrFn === 'function' ? pageOrFn(currentPage) : pageOrFn;
    setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('page', String(next)); return n; }, { replace: true });
  };
  const setItemsPerPage = (ipp) => {
    setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('ipp', String(ipp)); n.set('page', '1'); return n; }, { replace: true });
  };
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState("");
  const [search, setSearch] = useState(() => sessionStorage.getItem('historicalSearch') || "");
  const [searchField, setSearchField] = useState(() => sessionStorage.getItem('historicalSearchField') || "all");
  const [sortField, setSortField] = useState(() => sessionStorage.getItem('historicalSortField') || "lastName");
  const [sortDirection, setSortDirection] = useState(() => sessionStorage.getItem('historicalSortDirection') || "asc");
  const [filterCounty, setFilterCounty] = useState(() => sessionStorage.getItem('historicalCountyFilter') || "all");
  const [countyOptions, setCountyOptions] = useState([]);
  const { tableWrapRef, mirrorScrollbar } = useStickyScrollbar([members]);

  useEffect(() => { sessionStorage.setItem('historicalSearch', search); }, [search]);
  useEffect(() => { sessionStorage.setItem('historicalSearchField', searchField); }, [searchField]);
  useEffect(() => { sessionStorage.setItem('historicalSortField', sortField); }, [sortField]);
  useEffect(() => { sessionStorage.setItem('historicalSortDirection', sortDirection); }, [sortDirection]);
  useEffect(() => { sessionStorage.setItem('historicalCountyFilter', filterCounty); }, [filterCounty]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/members`, { credentials: "include" })
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setMembers(arr.filter(m => m.category === 'Historical'));
        setIsLoading(false);
      })
      .catch(() => { setMembers([]); setIsLoading(false); });
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/lookups`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setCountyOptions(data.counties || []))
      .catch(() => setCountyOptions([]));
  }, []);

  if (!user) return <Navigate to="/login" />;

  const hasFilters = search || searchField !== "all" || filterCounty !== "all" || sortField !== "lastName" || sortDirection !== "asc";

  const filtered = members
    .filter(m => {
      if (search) {
        const q = search.toLowerCase();
        const has = (v) => (v || '').toLowerCase().includes(q);
        let match;
        if (searchField === 'lastName')     match = has(m.lastName);
        else if (searchField === 'firstName')    match = has(m.firstName);
        else if (searchField === 'placeOfBirth') match = has(m.placeOfBirth);
        else if (searchField === 'county')       match = has(m.county);
        else if (searchField === 'irishSurname') match = (m.irishSurnames || []).some(s => s.toLowerCase().includes(q));
        else if (searchField === 'both')         match = has(m.firstName) || has(m.lastName)
          || `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
          || `${m.lastName} ${m.firstName}`.toLowerCase().includes(q);
        else match = [m.firstName, m.lastName, m.placeOfBirth, m.county, m.dateOfBirth, ...(m.irishSurnames || [])]
          .filter(Boolean).join(' ').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterCounty !== "all" && m.county !== filterCounty) return false;
      return true;
    })
    .sort((a, b) => {
      let aVal = a[sortField] || "", bVal = b[sortField] || "";
      if (sortField === "dateOfBirth") { aVal = new Date(aVal || "1900-01-01"); bVal = new Date(bVal || "1900-01-01"); }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pagedMembers = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) setSortDirection(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDirection("asc"); }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch(""); setSearchField("all"); setFilterCounty("all");
    setSortField("lastName"); setSortDirection("asc");
    ['historicalSearch','historicalSearchField','historicalSortField','historicalSortDirection','historicalCountyFilter']
      .forEach(k => sessionStorage.removeItem(k));
    setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('page', '1'); n.set('ipp', '25'); return n; }, { replace: true });
  };

  const SortableHeader = ({ column, children, minWidth }) => {
    const isActive = sortField === column;
    return (
      <th
        style={{ ...thStyle, cursor: 'pointer', userSelect: 'none', minWidth: minWidth || '120px',
          color: isActive ? T.primaryLight : T.textMain,
          background: isActive ? 'rgba(78, 93, 46, 0.12)' : T.primaryBg }}
        onClick={() => handleSort(column)}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = T.primaryLight; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = T.textMain; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {children}
          <span style={{ opacity: isActive ? 1 : 0.35, fontSize: T.fontSm }}>
            {isActive ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
          </span>
        </div>
      </th>
    );
  };

  const inputStyle = {
    fontSize: T.fontBase, padding: '9px 12px', border: `2px solid ${T.primaryBorder}`,
    borderRadius: T.radiusMd, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
    outline: 'none', background: 'var(--card-bg)', color: T.textMain
  };

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
        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>

          <div style={pageHeader.wrapper}>
            <div>
              <h1 style={pageHeader.title}>Historical Members</h1>
              <p style={pageHeader.subtitle}>Browse memorial and historical member records</p>
            </div>
            <Link to="/members/statistics" style={{ ...btn.primary, textDecoration: 'none' }}>
              📊 View Statistics
            </Link>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

          {/* Filters */}
          <div style={filterBar}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <select
                value={searchField}
                onChange={e => { setSearchField(e.target.value); setCurrentPage(1); }}
                style={{ ...inputStyle, width: 'auto', minWidth: '140px', flexShrink: 0 }}
              >
                <option value="both">Name (Both)</option>
                <option value="lastName">Last Name</option>
                <option value="firstName">First Name</option>
                <option value="placeOfBirth">Place of Birth</option>
                <option value="county">Irish County</option>
                <option value="irishSurname">Irish Surname</option>
                <option value="all">All Fields</option>
              </select>
              <input
                type="text"
                placeholder={
                  searchField === 'both'        ? 'Search by name...' :
                  searchField === 'lastName'    ? 'Search last name...' :
                  searchField === 'firstName'   ? 'Search first name...' :
                  searchField === 'placeOfBirth'? 'Search place of birth...' :
                  searchField === 'county'      ? 'Search Irish county...' :
                  searchField === 'irishSurname'? 'Search Irish surname...' :
                  'Search all fields...'
                }
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                style={{ ...inputStyle, flex: '1', minWidth: '200px' }}
              />
              {hasFilters && <button onClick={clearFilters} style={btn.ghost}>✕ Clear</button>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: T.fontSm, fontWeight: '600', color: T.textMain, marginBottom: '5px' }}>County</label>
                <select value={filterCounty} onChange={e => { setFilterCounty(e.target.value); setCurrentPage(1); }} style={inputStyle}>
                  <option value="all">All Counties</option>
                  {countyOptions.map(c => <option key={c.id} value={c.label}>{c.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Results row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: T.fontBase, fontWeight: '600', color: T.textMain }}>
              <strong style={{ color: T.primaryLight }}>{filtered.length}</strong>{' '}
              {filtered.length === members.length ? 'historical records' : `of ${members.length} historical records`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: T.fontBase, color: T.textMuted }}>Show:</span>
              <select value={itemsPerPage} onChange={e => setItemsPerPage(Number(e.target.value))}
                style={{ padding: '7px 10px', fontSize: T.fontBase, border: `2px solid ${T.primaryBorder}`, borderRadius: T.radiusMd, fontWeight: '600', cursor: 'pointer', background: 'var(--card-bg)', color: T.textMain }}>
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                <option value={filtered.length}>All ({filtered.length})</option>
              </select>
            </div>
          </div>

          <div ref={tableWrapRef} style={{ ...card, overflowX: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 32px', color: T.textMuted }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>🕊️</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: T.textMain, marginBottom: '6px' }}>
                  {hasFilters ? 'No Results Found' : 'No Records Available'}
                </div>
                <div style={{ fontSize: T.fontBase }}>
                  {hasFilters ? 'Try adjusting your search or filters.' : 'There are no historical member records in the database.'}
                </div>
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: T.fontBase, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.primaryBorder}` }}>
                    <SortableHeader column="lastName">Last Name</SortableHeader>
                    <SortableHeader column="firstName">First Name</SortableHeader>
                    <SortableHeader column="dateOfBirth">Date of Birth</SortableHeader>
                    <SortableHeader column="placeOfBirth">Place of Birth</SortableHeader>
                    <SortableHeader column="county">County</SortableHeader>
                    <th style={thStyle}>Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedMembers.map((m, i) => (
                    <tr key={m.id || i}
                      style={{ background: i % 2 === 0 ? T.white : T.primaryBg, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f4e8'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? T.white : T.primaryBg}
                    >
                      <td style={{ ...tdStyle, fontWeight: '700', color: T.textMain, whiteSpace: 'nowrap' }}>{m.lastName || '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: '600', color: T.textMain, whiteSpace: 'nowrap' }}>{m.firstName || '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: '500', color: T.textMuted, whiteSpace: 'nowrap' }}>{m.dateOfBirth || '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: '500', color: T.textMuted, whiteSpace: 'nowrap' }}>{m.placeOfBirth || '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: '500', color: T.textMuted, whiteSpace: 'nowrap' }}>{m.county || '—'}</td>
                      <td style={tdStyle}>
                        <Link to={`/members/${m.id}`} style={{ ...btn.primary, padding: '5px 12px', fontSize: T.fontSm }}>View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {mirrorScrollbar}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                style={{ ...btn.ghost, padding: '6px 14px', opacity: currentPage === 1 ? 0.4 : 1 }}>← Prev</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pg = totalPages <= 7 ? i + 1 : currentPage <= 4 ? i + 1 : currentPage >= totalPages - 3 ? totalPages - 6 + i : currentPage - 3 + i;
                return (
                  <button key={pg} onClick={() => setCurrentPage(pg)} style={{
                    padding: '6px 12px', fontWeight: '700', fontSize: T.fontBase, borderRadius: T.radiusMd,
                    border: pg === currentPage ? `2px solid ${T.primary}` : '2px solid #e5e7eb',
                    background: pg === currentPage ? T.primary : T.white,
                    color: pg === currentPage ? T.white : T.textMuted, cursor: 'pointer'
                  }}>{pg}</button>
                );
              })}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                style={{ ...btn.ghost, padding: '6px 14px', opacity: currentPage === totalPages ? 0.4 : 1 }}>Next →</button>
            </div>
          )}

        </div>
      </div>
    </MainLayout>
  );
}
