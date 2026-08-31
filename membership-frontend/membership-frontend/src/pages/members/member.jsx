import { useEffect, useState } from "react";
import { useStickyScrollbar } from "../../hooks/useStickyScrollbar";
import { Link, useSearchParams } from "react-router-dom";
import MainLayout from "../../components/mainlayout";
import DeactivateConfirm from "../../components/deactivateconfirm";
import { useAuth } from "../../hooks/useauth";
import { API_BASE_URL } from '../../utils/api';
import { T, card, thStyle, tdStyle, btn, badge, avatarStyle, pageHeader, filterBar, pageBtn } from '../../utils/theme';

function _getCachedMembers() {
  try {
    const item = sessionStorage.getItem('memberListCache');
    if (!item) return null;
    const { data, ts } = JSON.parse(item);
    if (Date.now() - ts > 5 * 60 * 1000) return null;
    return data;
  } catch { return null; }
}

const EXPORT_COLUMN_GROUPS = [
  { label: 'Personal',           cols: ['First Name', 'Last Name', 'Date of Birth', 'Place of Birth', 'Occupation'] },
  { label: 'Contact',            cols: ['Email', 'Phone (Primary)', 'Phone (Cell)', 'Phone (Home)', 'Phone (Work)', 'Phone (Other)'] },
  { label: 'Address',            cols: ['Current Street', 'Current City', 'Current Province', 'Current Country', 'Current Postal Code', 'Previous Addresses'] },
  { label: 'Irish Connections',  cols: ['Irish Connections'] },
  { label: 'Membership',         cols: ['Category', 'Active', 'Date Joined', 'Date Ended', 'Other Societies', 'Roles', 'Volunteering Interests'] },
  { label: 'Administrative',     cols: ['Application Date', 'Proposal Date', 'Approval Date', 'Approved By', 'Signed By', 'Proposer', 'Seconder', 'Notes'] },
];
const ALL_EXPORT_COLS = EXPORT_COLUMN_GROUPS.flatMap(g => g.cols);

export default function Members() {
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
  const [members, setMembers] = useState(() => _getCachedMembers() || []);
  const [search, setSearch] = useState(() => sessionStorage.getItem('memberSearch') || "");
  const [searchField, setSearchField] = useState(() => sessionStorage.getItem('memberSearchField') || "all");
  const [roleFilter, setRoleFilter] = useState(() => sessionStorage.getItem('memberRoleFilter') || "all");
  const [roleOptions, setRoleOptions] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState(() => sessionStorage.getItem('memberCategoryFilter') || "all");
  const [countyFilter, setCountyFilter] = useState(() => sessionStorage.getItem('memberCountyFilter') || "all");
  const [volunteeringFilter, setVolunteeringFilter] = useState(() => sessionStorage.getItem('memberVolunteeringFilter') || "all");
  const [volunteeringOptions, setVolunteeringOptions] = useState([]);
  const [sortBy, setSortBy] = useState(() => sessionStorage.getItem('memberSortBy') || "lastName");
  const [sortOrder, setSortOrder] = useState(() => sessionStorage.getItem('memberSortOrder') || "asc");
  const [error, setError] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergePrimary, setMergePrimary] = useState(null);
  const [mergeSecondary, setMergeSecondary] = useState(null);
  const [mergeSearchPrimary, setMergeSearchPrimary] = useState("");
  const [mergeSearchSecondary, setMergeSearchSecondary] = useState("");
  const [mergeDetails, setMergeDetails] = useState({ primary: null, secondary: null });
  const [isLoading, setIsLoading] = useState(() => !_getCachedMembers());
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [countyOptions, setCountyOptions] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [bulkExportLoading, setBulkExportLoading] = useState(false);
  const [bulkDeactivateLoading, setBulkDeactivateLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [pendingExport, setPendingExport] = useState(null);
  const [exportColumns, setExportColumns] = useState(() => Object.fromEntries(ALL_EXPORT_COLS.map(c => [c, true])));
  const [exportScope, setExportScope] = useState('all');
  const { tableWrapRef, mirrorScrollbar } = useStickyScrollbar([members]);

  useEffect(() => { sessionStorage.setItem('memberSearch', search); }, [search]);
  useEffect(() => { sessionStorage.setItem('memberSearchField', searchField); }, [searchField]);
  useEffect(() => { sessionStorage.setItem('memberRoleFilter', roleFilter); }, [roleFilter]);
  useEffect(() => { sessionStorage.setItem('memberCategoryFilter', categoryFilter); }, [categoryFilter]);
  useEffect(() => { sessionStorage.setItem('memberCountyFilter', countyFilter); }, [countyFilter]);
  useEffect(() => { sessionStorage.setItem('memberVolunteeringFilter', volunteeringFilter); }, [volunteeringFilter]);
  useEffect(() => { sessionStorage.setItem('memberSortBy', sortBy); }, [sortBy]);
  useEffect(() => { sessionStorage.setItem('memberSortOrder', sortOrder); }, [sortOrder]);
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/members?sortBy=${sortBy}&sortOrder=${sortOrder}`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setMembers(arr);
        if (arr.length) {
          try { sessionStorage.setItem('memberListCache', JSON.stringify({ data: arr, ts: Date.now() })); } catch {}
          setVolunteeringOptions([...new Set(arr.flatMap(m => m.volunteeringInterests || []))].sort());
          setRoleOptions([...new Set(arr.map(m => m.role).filter(Boolean))].sort());
        }
        if (!Array.isArray(data) && data.error) setError(data.error);
        setIsLoading(false);
      })
      .catch(() => { setError("Failed to load members"); setIsLoading(false); });
  }, [sortBy, sortOrder]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/lookups`, { credentials: "include" })
      .then(res => res.json())
      .then(data => { setCategoryOptions(data.categories || []); setCountyOptions(data.counties || []); })
      .catch(() => { setCategoryOptions([]); setCountyOptions([]); });
  }, []);


  const handleConfirmDeactivate = async () => {
    if (!selectedMember) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/members/${selectedMember.id}/deactivate`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (data.success) {
        alert("Member deactivated.");
        setMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, isActive: false } : m));
      } else { alert("Failed to deactivate: " + data.message); }
    } catch { alert("Error deactivating member."); }
    finally { setSelectedMember(null); setShowConfirm(false); }
  };

  const handleMergeFromSelection = () => {
    const selectedIds = Array.from(selectedMembers);
    if (selectedIds.length !== 2) return;
    const [a, b] = selectedIds.map(id => members.find(m => m.id === id));
    setMergePrimary(a); setMergeSecondary(b);
    setMergeSearchPrimary(""); setMergeSearchSecondary("");
    setMergeMode(true);
  };

  useEffect(() => {
    if (!mergePrimary) { setMergeDetails(d => ({ ...d, primary: null })); return; }
    fetch(`${API_BASE_URL}/api/members/${mergePrimary.id}`, { credentials: 'include' })
      .then(r => r.json()).then(d => setMergeDetails(prev => ({ ...prev, primary: d })));
  }, [mergePrimary?.id]);

  useEffect(() => {
    if (!mergeSecondary) { setMergeDetails(d => ({ ...d, secondary: null })); return; }
    fetch(`${API_BASE_URL}/api/members/${mergeSecondary.id}`, { credentials: 'include' })
      .then(r => r.json()).then(d => setMergeDetails(prev => ({ ...prev, secondary: d })));
  }, [mergeSecondary?.id]);


  const handleMergeMembers = async () => {
    if (!mergePrimary || !mergeSecondary) return;
    if (mergePrimary.id === mergeSecondary.id) { alert("Please select two different members."); return; }
    if (!window.confirm(`Merge ${mergeSecondary.firstName} ${mergeSecondary.lastName} into ${mergePrimary.firstName} ${mergePrimary.lastName}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/members/merge`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryMemberId: mergePrimary.id, secondaryMemberId: mergeSecondary.id, keepData: "primary" })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Members merged successfully!");
        setMembers(prev => prev.filter(m => m.id !== mergeSecondary.id));
        setMergeMode(false); setMergePrimary(null); setMergeSecondary(null);
        setMergeDetails({ primary: null, secondary: null });
        setMergeSearchPrimary(""); setMergeSearchSecondary("");
      } else { alert("Failed to merge: " + data.message); }
    } catch { alert("Error merging members."); }
  };

  const handleMemberSelect = (memberId) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) newSelected.delete(memberId);
    else newSelected.add(memberId);
    setSelectedMembers(newSelected); setSelectAll(false);
  };

  const handleSelectAllChange = () => {
    if (selectAll) { setSelectedMembers(new Set()); setSelectAll(false); }
    else { setSelectedMembers(new Set(paginatedMembers.map(m => m.id))); setSelectAll(true); }
  };

  const openExportModal = (type) => {
    let defaultScope = 'all';
    if (selectedMembers.size > 0) defaultScope = 'selected';
    else if (hasFilters) defaultScope = 'filtered';
    setExportScope(defaultScope);
    setPendingExport({ type });
    setShowExportModal(true);
  };

  const doExport = async () => {
    const { type } = pendingExport;
    const selectedCols = ALL_EXPORT_COLS.filter(c => exportColumns[c]);
    if (selectedCols.length === 0) return;
    const ids = exportScope === 'selected' ? Array.from(selectedMembers)
              : exportScope === 'filtered'  ? filtered.map(m => m.id)
              : null;
    setShowExportModal(false);
    if (type === 'pdf') {
      const colParam = encodeURIComponent(selectedCols.join(','));
      let url = `${API_BASE_URL}/api/export/members/pdf?columns=${colParam}`;
      if (ids) url += `&ids=${ids.join(',')}`;
      window.open(url, '_blank');
      return;
    }
    try {
      setBulkExportLoading(true);
      const body = { columns: selectedCols };
      if (ids) body.ids = ids;
      const res = await fetch(`${API_BASE_URL}/api/export/members/csv`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(body)
      });
      if (!res.ok) { alert(`Export failed: ${res.status}`); return; }
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `members_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); window.URL.revokeObjectURL(link.href);
    } catch { alert('Failed to export.'); }
    finally { setBulkExportLoading(false); }
  };

  const handleBulkDeactivate = async () => {
    if (selectedMembers.size === 0) { alert("Please select members to deactivate."); return; }
    if (!window.confirm(`Deactivate ${selectedMembers.size} member(s)?`)) return;
    try {
      setBulkDeactivateLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/members/bulk-deactivate`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: Array.from(selectedMembers) })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Deactivated ${selectedMembers.size} member(s).`);
        setMembers(prev => prev.map(m => selectedMembers.has(m.id) ? { ...m, isActive: false } : m));
        setSelectedMembers(new Set()); setSelectAll(false);
      } else { alert("Failed to deactivate: " + data.message); }
    } catch { alert("Error deactivating members."); }
    finally { setBulkDeactivateLoading(false); }
  };

  const handleSort = (column) => {
    if (sortBy === column) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(column); setSortOrder("asc"); }
    setCurrentPage(1);
  };

  const SortableHeader = ({ column, children, minWidth }) => {
    const isActive = sortBy === column;
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
            {isActive ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}
          </span>
        </div>
      </th>
    );
  };

  const filtered = members.filter(m => {
    const libraryEmail = 'bisofpeilibrary@gmail.com';
    const q = search.toLowerCase();
    let matchesSearch = true;
    if (search) {
      const has = (v) => (v || '').toLowerCase().includes(q);
      switch (searchField) {
        case 'lastName':    matchesSearch = has(m.lastName); break;
        case 'firstName':   matchesSearch = has(m.firstName); break;
        case 'placeOfBirth':matchesSearch = has(m.placeOfBirth); break;
        case 'email':       matchesSearch = m.email !== libraryEmail && has(m.email); break;
        case 'phone':       matchesSearch = [...(m.allPhones || []), m.phoneNumber].filter(Boolean).some(p => p.toLowerCase().includes(q)); break;
        case 'county':      matchesSearch = [...(m.allCounties || []), m.county].filter(Boolean).some(c => c.toLowerCase().includes(q)); break;
        case 'irishSurname':matchesSearch = (m.irishSurnames || []).some(s => s.toLowerCase().includes(q)); break;
        case 'both':        matchesSearch = has(m.firstName) || has(m.lastName) || `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) || `${m.lastName} ${m.firstName}`.toLowerCase().includes(q); break;
        default:
          matchesSearch = [
            m.firstName, m.lastName, m.address, m.addressSearch, m.role,
            m.placeOfBirth, m.dateOfBirth, m.category, m.dateJoined, m.dateEnded,
            m.email !== libraryEmail ? m.email : '', m.phoneNumber,
            m.approvedBy, m.signedBy, m.proposer, m.seconder,
            m.occupation, m.otherSocieties, m.notes,
            ...(m.volunteeringInterests || []), ...(m.irishSurnames || []),
            ...(m.allPhones || []), ...(m.allCounties || [])
          ].filter(Boolean).join(' ').toLowerCase().includes(q);
      }
    }
    const matchesRole = roleFilter === "all" || m.role === roleFilter;
    const matchesCategory = categoryFilter === "all" || m.category === categoryFilter;
    const matchesCounty = countyFilter === "all" || (m.allCounties || [m.county]).includes(countyFilter);
    const matchesVolunteering = volunteeringFilter === "all" || (m.volunteeringInterests || []).includes(volunteeringFilter);
    return matchesSearch && matchesRole && matchesCategory && matchesCounty && matchesVolunteering;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMembers = filtered.slice(startIndex, startIndex + itemsPerPage);
  const hasFilters = search || searchField !== "all" || roleFilter !== "all" || categoryFilter !== "all" || countyFilter !== "all" || volunteeringFilter !== "all";

  const clearFilters = () => {
    setSearch(""); setSearchField("all"); setRoleFilter("all"); setCategoryFilter("all");
    setCountyFilter("all"); setVolunteeringFilter("all");
    setSortBy("lastName"); setSortOrder("asc");
    ['memberSearch','memberSearchField','memberRoleFilter','memberCategoryFilter','memberCountyFilter','memberVolunteeringFilter','memberSortBy','memberSortOrder']
      .forEach(k => sessionStorage.removeItem(k));
    setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('page', '1'); n.set('ipp', '25'); return n; }, { replace: true });
  };

  const inputStyle = { fontSize: T.fontBase, padding: '9px 12px', border: `2px solid ${T.primaryBorder}`, borderRadius: T.radiusMd, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', outline: 'none', background: 'var(--card-bg)', color: T.textMain };

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

          {/* Header */}
          <div style={pageHeader.wrapper}>
            <div>
              <h1 style={pageHeader.title}>Member Directory</h1>
              <p style={pageHeader.subtitle}>Browse all membership records</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {user && (user.role === "private" || user.role === "admin") && (
                <>
                  <button onClick={() => openExportModal('csv')} style={btn.exportCsv}>📊 CSV</button>
                  <button onClick={() => openExportModal('pdf')} style={btn.exportPdf}>📄 PDF</button>
                </>
              )}
              {user && user.role === "admin" && (
                <Link to="/members/new" style={btn.primary}>➕ Add Member</Link>
              )}
            </div>
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
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="all">All Fields</option>
              </select>
              <input
                type="text"
                placeholder={searchField === 'both' ? 'Search by name...' : searchField === 'lastName' ? 'Search last name...' : searchField === 'firstName' ? 'Search first name...' : searchField === 'placeOfBirth' ? 'Search place of birth...' : searchField === 'county' ? 'Search Irish county...' : searchField === 'irishSurname' ? 'Search Irish surname...' : searchField === 'email' ? 'Search email...' : searchField === 'phone' ? 'Search phone...' : 'Search all fields...'}
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                style={{ ...inputStyle, flex: '1', minWidth: '200px' }}
              />
              {hasFilters && <button onClick={clearFilters} style={btn.ghost}>✕ Clear</button>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: T.fontSm, fontWeight: '600', color: T.textMain, marginBottom: '5px' }}>Category</label>
                <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }} style={inputStyle}>
                  <option value="all">All Categories</option>
                  {categoryOptions.map(c => <option key={c.value} value={c.label}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: T.fontSm, fontWeight: '600', color: T.textMain, marginBottom: '5px' }}>County</label>
                <select value={countyFilter} onChange={e => { setCountyFilter(e.target.value); setCurrentPage(1); }} style={inputStyle}>
                  <option value="all">All Counties</option>
                  {countyOptions.map(c => <option key={c.id} value={c.label}>{c.label}</option>)}
                </select>
              </div>
              {user && (user.role === 'admin' || user.role === 'private') && volunteeringOptions.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: T.fontSm, fontWeight: '600', color: T.textMain, marginBottom: '5px' }}>Volunteering</label>
                  <select value={volunteeringFilter} onChange={e => { setVolunteeringFilter(e.target.value); setCurrentPage(1); }} style={inputStyle}>
                    <option value="all">All Interests</option>
                    {volunteeringOptions.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Results row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: T.fontBase, fontWeight: '600', color: T.textMain }}>
              <strong style={{ color: T.primaryLight }}>{filtered.length}</strong>{' '}
              {filtered.length === members.length ? 'members' : `of ${members.length} members`}
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

          {/* Bulk actions */}
          {selectedMembers.size > 0 && (
            <div style={{ ...card, padding: '12px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: T.fontBase, fontWeight: '700', color: T.textMain }}>{selectedMembers.size} selected</span>
              {user && (user.role === 'private' || user.role === 'admin') && (
                <>
                  <button onClick={() => openExportModal('csv')} disabled={bulkExportLoading} style={{ ...btn.exportCsv, opacity: bulkExportLoading ? 0.6 : 1 }}>
                    {bulkExportLoading ? '⏳ Exporting...' : '📥 Export CSV'}
                  </button>
                  <button onClick={() => openExportModal('pdf')} style={btn.exportPdf}>📄 Export PDF</button>
                </>
              )}
              {user && user.role === 'admin' && (
                <button onClick={handleBulkDeactivate} disabled={bulkDeactivateLoading} style={{ ...btn.danger, opacity: bulkDeactivateLoading ? 0.6 : 1 }}>
                  {bulkDeactivateLoading ? '⏳ Deactivating...' : '🚫 Deactivate'}
                </button>
              )}
              {user && user.role === 'admin' && selectedMembers.size === 2 && (
                <button onClick={handleMergeFromSelection} style={btn.warning}>🔗 Merge Selected</button>
              )}
              <button onClick={() => { setSelectedMembers(new Set()); setSelectAll(false); }} style={{ ...btn.ghost, marginLeft: 'auto' }}>Clear</button>
            </div>
          )}

          {/* Table */}
          <div ref={tableWrapRef} style={{ ...card, overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: T.fontBase, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.primaryBorder}` }}>
                  <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}>
                    <input type="checkbox" checked={selectAll && paginatedMembers.length > 0} onChange={handleSelectAllChange}
                      style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: T.primaryLight }} />
                  </th>
                  <SortableHeader column="lastName" minWidth="130px">Last Name</SortableHeader>
                  <SortableHeader column="firstName" minWidth="110px">First Name</SortableHeader>
                  <SortableHeader column="dateJoined" minWidth="110px">Joined</SortableHeader>
                  <SortableHeader column="category" minWidth="110px">Category</SortableHeader>
                  <th style={{ ...thStyle, minWidth: '90px' }}>Status</th>
                  <th style={{ ...thStyle, minWidth: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '60px 32px', color: T.textMuted }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{members.length === 0 ? '👥' : '🔍'}</div>
                      <div style={{ fontSize: T.fontLg, fontWeight: '600', color: T.textMain, marginBottom: '6px' }}>
                        {members.length === 0 ? 'No Members Found' : 'No Matching Members'}
                      </div>
                      <div style={{ fontSize: T.fontBase }}>{members.length === 0 ? 'No members in the database' : 'Try adjusting your filters'}</div>
                    </td>
                  </tr>
                ) : paginatedMembers.map(m => (
                  <tr key={m.id}
                    style={{ background: selectedMembers.has(m.id) ? 'rgba(78, 93, 46, 0.12)' : 'var(--card-bg)', transition: 'background 0.15s' }}
                    onMouseEnter={e => { if (!selectedMembers.has(m.id)) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                    onMouseLeave={e => { if (!selectedMembers.has(m.id)) e.currentTarget.style.background = 'var(--card-bg)'; }}
                  >
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <input type="checkbox" checked={selectedMembers.has(m.id)} onChange={() => handleMemberSelect(m.id)}
                        style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: T.primaryLight }} />
                    </td>
                    <td style={{ ...tdStyle, fontWeight: '700', color: T.textMain, whiteSpace: 'nowrap' }}>{m.lastName}</td>
                    <td style={{ ...tdStyle, fontWeight: '600', color: T.textMain, whiteSpace: 'nowrap' }}>{m.firstName}</td>
                    <td style={{ ...tdStyle, fontWeight: '500', color: T.textMuted, whiteSpace: 'nowrap' }}>{m.dateJoined ? m.dateJoined.split('-').reverse().join('/') : '—'}</td>
                    <td style={{ ...tdStyle, fontWeight: '500', color: T.textMuted, whiteSpace: 'nowrap' }}>{m.category || '—'}</td>
                    <td style={tdStyle}>
                      <span style={m.isActive ? badge.active : badge.inactive}>{m.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <Link to={`/members/${m.id}`} style={btn.primary}>View</Link>
                        {user && user.role === "admin" && (
                          <Link to={`/members/edit/${m.id}`} style={btn.warning}>Edit</Link>
                        )}
                        {user && user.role === "admin" && m.isActive && (
                          <button onClick={() => { setSelectedMember(m); setShowConfirm(true); }} style={btn.danger}>Deactivate</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {mirrorScrollbar}

          {/* Pagination */}
          {filtered.length > 0 && totalPages > 1 && (
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '16px 20px', background: 'var(--card-bg)', borderRadius: T.radiusLg, border: `2px solid ${T.primaryMid}` }}>
              <span style={{ fontSize: T.fontBase, fontWeight: '600', color: T.textMain }}>
                Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} style={pageBtn(false, currentPage === 1)}>← Prev</button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let p;
                  if (totalPages <= 7) p = i + 1;
                  else if (currentPage <= 4) p = i + 1;
                  else if (currentPage >= totalPages - 3) p = totalPages - 6 + i;
                  else p = currentPage - 3 + i;
                  return <button key={p} onClick={() => setCurrentPage(p)} style={pageBtn(currentPage === p, false)}>{p}</button>;
                })}
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} style={pageBtn(false, currentPage === totalPages)}>Next →</button>
              </div>
            </div>
          )}

        </div>
      </div>

      {showConfirm && selectedMember && (
        <DeactivateConfirm
          memberName={`${selectedMember.firstName} ${selectedMember.lastName}`}
          onCancel={() => { setShowConfirm(false); setSelectedMember(null); }}
          onConfirm={handleConfirmDeactivate}
        />
      )}

      {mergeMode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ ...card, maxWidth: '660px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: T.fontLg, fontWeight: '700', color: T.textMain, margin: '0 0 8px' }}>🔗 Merge Duplicate Members</h2>
            <p style={{ fontSize: T.fontBase, color: T.textMuted, marginBottom: '24px' }}>The secondary member will be deleted. This cannot be undone.</p>
            {[
              { label: 'Primary Member (Keep)', search: mergeSearchPrimary, setSearch: setMergeSearchPrimary, selected: mergePrimary, setSelected: setMergePrimary, filterFn: () => true, color: T.primaryLight },
              { label: 'Secondary Member (Delete)', search: mergeSearchSecondary, setSearch: setMergeSearchSecondary, selected: mergeSecondary, setSelected: setMergeSecondary, filterFn: m => m.id !== mergePrimary?.id, color: T.amber }
            ].map(({ label, search: s, setSearch: ss, selected, setSelected, filterFn, color }) => (
              <div key={label} style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: T.fontBase, fontWeight: '700', color: T.textMain, marginBottom: '8px' }}>{label}:</label>
                <input type="text" placeholder="Search..." value={s} onChange={e => ss(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: T.fontBase, border: `2px solid ${T.primaryBorder}`, borderRadius: T.radiusMd, marginBottom: '8px', boxSizing: 'border-box' }} />
                <div style={{ border: `1px solid ${T.slateBorder}`, borderRadius: T.radiusMd, maxHeight: '180px', overflowY: 'auto', background: 'var(--bg-secondary)' }}>
                  {members.filter(filterFn).filter(m => `${m.firstName} ${m.lastName} ${m.email || ''}`.toLowerCase().includes(s.toLowerCase())).slice(0, 20).map(m => (
                    <div key={m.id} onClick={() => setSelected(m)}
                      style={{ padding: '9px 12px', borderBottom: `1px solid ${T.slateBorder}`, cursor: 'pointer', fontSize: T.fontBase, fontWeight: '600',
                        background: selected?.id === m.id ? color : 'var(--card-bg)', color: selected?.id === m.id ? T.white : T.textMain }}
                      onMouseEnter={e => { if (selected?.id !== m.id) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                      onMouseLeave={e => { if (selected?.id !== m.id) e.currentTarget.style.background = 'var(--card-bg)'; }}>
                      {m.firstName} {m.lastName} {m.email && `(${m.email})`}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {mergePrimary && mergeSecondary && (
              <div style={{ border: `1px solid ${T.primaryBorder}`, borderRadius: T.radiusMd, marginBottom: '16px', overflow: 'hidden', fontSize: T.fontBase }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  <div style={{ background: T.primaryBg, padding: '10px 14px', borderBottom: `1px solid ${T.primaryBorder}`, borderRight: `1px solid ${T.primaryBorder}` }}>
                    <div style={{ fontSize: '0.7rem', color: T.textMuted, fontWeight: '700', letterSpacing: '0.06em', marginBottom: 2 }}>KEEP</div>
                    <div style={{ fontWeight: '700', color: T.textMain }}>{mergePrimary.firstName} {mergePrimary.lastName}</div>
                  </div>
                  <div style={{ background: '#FFF8E7', padding: '10px 14px', borderBottom: `1px solid ${T.primaryBorder}` }}>
                    <div style={{ fontSize: '0.7rem', color: T.textMuted, fontWeight: '700', letterSpacing: '0.06em', marginBottom: 2 }}>DELETE</div>
                    <div style={{ fontWeight: '700', color: T.textMain }}>{mergeSecondary.firstName} {mergeSecondary.lastName}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  {[
                    { detail: mergeDetails.primary, color: T.primaryBg },
                    { detail: mergeDetails.secondary, color: '#FFF8E7' }
                  ].map(({ detail, color }, idx) => (
                    <div key={idx} style={{ padding: '10px 14px', background: color, borderRight: idx === 0 ? `1px solid ${T.primaryBorder}` : 'none' }}>
                      <div style={{ fontSize: '0.7rem', color: T.textMuted, fontWeight: '700', letterSpacing: '0.06em', marginBottom: 6 }}>ROLES BY FISCAL YEAR</div>
                      {detail === null
                        ? <div style={{ color: T.textMuted, fontSize: T.fontSm }}>Loading…</div>
                        : (detail.roleFiscalYears?.length > 0
                            ? [...detail.roleFiscalYears]
                                .sort((a, b) => (a.yearLabel || '').localeCompare(b.yearLabel || ''))
                                .map((r, i) => (
                                  <div key={i} style={{ fontSize: T.fontSm, color: T.textMain, marginBottom: 3 }}>
                                    <span style={{ color: T.textMuted, marginRight: 4 }}>{r.yearLabel || '—'}</span>
                                    {r.roleName || '—'}
                                  </div>
                                ))
                            : <span style={{ fontSize: T.fontSm, color: T.textMuted }}>No roles</span>
                          )
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setMergeMode(false); setMergePrimary(null); setMergeSecondary(null); setMergeDetails({ primary: null, secondary: null }); }} style={btn.ghost}>Cancel</button>
              <button onClick={handleMergeMembers} disabled={!mergePrimary || !mergeSecondary}
                style={{ ...btn.warning, opacity: (!mergePrimary || !mergeSecondary) ? 0.5 : 1, cursor: (!mergePrimary || !mergeSecondary) ? 'not-allowed' : 'pointer' }}>
                Merge Members
              </button>
            </div>
          </div>
        </div>
      )}

      {showExportModal && pendingExport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ ...card, maxWidth: '560px', width: '100%', padding: 0, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: `2px solid ${T.primaryBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: T.fontLg, fontWeight: '700', color: T.textMain }}>Export Options</h2>
                <p style={{ margin: '4px 0 0', fontSize: T.fontSm, color: T.textMuted }}>
                  Choose scope and columns for your {pendingExport.type.toUpperCase()} export
                </p>
              </div>
              <button onClick={() => setShowExportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: T.textMuted, lineHeight: 1, padding: '4px' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              <div style={{ marginBottom: '16px', padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: T.radiusMd, border: `1px solid ${T.primaryBorder}` }}>
                <div style={{ fontSize: T.fontSm, fontWeight: '700', color: T.textMain, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Who to export</div>
                {[
                  { value: 'all',      label: 'All members',        count: members.length,        disabled: false },
                  { value: 'filtered', label: 'Currently filtered', count: filtered.length,        disabled: !hasFilters },
                  { value: 'selected', label: 'Selected',           count: selectedMembers.size,   disabled: selectedMembers.size === 0 },
                ].map(opt => (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', cursor: opt.disabled ? 'default' : 'pointer', opacity: opt.disabled ? 0.38 : 1 }}>
                    <input type="radio" name="exportScope" value={opt.value} checked={exportScope === opt.value}
                      disabled={opt.disabled}
                      onChange={() => setExportScope(opt.value)}
                      style={{ cursor: opt.disabled ? 'default' : 'pointer', accentColor: T.primaryLight }} />
                    <span style={{ fontSize: T.fontBase, color: T.textMain }}>{opt.label}</span>
                    <span style={{ fontSize: T.fontSm, color: T.textMuted, fontWeight: '600' }}>({opt.count})</span>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: T.fontSm, color: T.textMuted }}>
                  <strong style={{ color: T.primaryLight }}>{ALL_EXPORT_COLS.filter(c => exportColumns[c]).length}</strong> of {ALL_EXPORT_COLS.length} columns selected
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setExportColumns(Object.fromEntries(ALL_EXPORT_COLS.map(c => [c, true])))} style={{ ...btn.ghost, padding: '4px 10px', fontSize: T.fontSm }}>Select All</button>
                  <button onClick={() => setExportColumns(Object.fromEntries(ALL_EXPORT_COLS.map(c => [c, false])))} style={{ ...btn.ghost, padding: '4px 10px', fontSize: T.fontSm }}>Clear All</button>
                </div>
              </div>
              {EXPORT_COLUMN_GROUPS.map(group => {
                const allChecked = group.cols.every(c => exportColumns[c]);
                const someChecked = group.cols.some(c => exportColumns[c]);
                return (
                  <div key={group.label} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <input type="checkbox" checked={allChecked}
                        ref={el => { if (el) el.indeterminate = !allChecked && someChecked; }}
                        onChange={e => setExportColumns(prev => ({ ...prev, ...Object.fromEntries(group.cols.map(c => [c, e.target.checked])) }))}
                        style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: T.primaryLight }} />
                      <span style={{ fontSize: T.fontBase, fontWeight: '700', color: T.primaryLight }}>{group.label}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '6px', paddingLeft: '24px' }}>
                      {group.cols.map(col => (
                        <label key={col} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: T.fontBase, color: T.textMain }}>
                          <input type="checkbox" checked={!!exportColumns[col]}
                            onChange={e => setExportColumns(prev => ({ ...prev, [col]: e.target.checked }))}
                            style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: T.primaryLight }} />
                          {col}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '16px 24px', borderTop: `2px solid ${T.primaryBorder}`, display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowExportModal(false)} style={btn.ghost}>Cancel</button>
              <button onClick={doExport}
                disabled={ALL_EXPORT_COLS.filter(c => exportColumns[c]).length === 0}
                style={{ ...(pendingExport.type === 'pdf' ? btn.exportPdf : btn.exportCsv), opacity: ALL_EXPORT_COLS.filter(c => exportColumns[c]).length === 0 ? 0.5 : 1 }}>
                Export {pendingExport.type.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}