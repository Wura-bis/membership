import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useauth";
import MainLayout from "../../components/mainlayout";
import { API_BASE_URL } from '../../utils/api';
import { T, card, thStyle, tdStyle, filterBar, pageHeader } from '../../utils/theme';

const CATEGORIES = ['Historical', 'Active', 'Inactive', 'Honorary', 'All'];

function StatCard({ title, footer, children }) {
  return (
    <div style={{ ...card, padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <h2 style={{ margin: 0, fontSize: T.fontLg, fontWeight: '700', color: T.textMain }}>{title}</h2>
      {children}
      {footer && <div style={{ fontSize: T.fontSm, color: T.textMuted }}>{footer}</div>}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '8px 12px', border: `1.5px solid ${T.primaryBorder}`,
        borderRadius: T.radiusMd, fontSize: T.fontBase, color: T.textMain,
        outline: 'none', boxSizing: 'border-box', background: 'var(--card-bg)', fontFamily: 'inherit',
      }}
    />
  );
}

function StatsTable({ columns, rows, emptyText, maxHeight = '420px' }) {
  return (
    <div style={{ overflowY: maxHeight ? 'auto' : 'visible', maxHeight: maxHeight || 'none' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{ ...thStyle, ...(col.style || {}), ...(col.onClick ? { cursor: 'pointer', userSelect: 'none' } : {}) }}
                onClick={col.onClick}>
                {col.label}{col.arrow}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={columns.length} style={{ ...tdStyle, textAlign: 'center', color: T.textMuted }}>{emptyText}</td></tr>
            : rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'var(--card-bg)' : 'var(--bg-secondary)' }}>
                {row.map((cell, j) => <td key={j} style={{ ...tdStyle, ...(columns[j]?.cellStyle || {}) }}>{cell}</td>)}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

export default function Statistics() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('Historical');
  const [lnSearch, setLnSearch] = useState('');
  const [lnSort, setLnSort] = useState({ field: 'count', dir: 'desc' });
  const [placeSearch, setPlaceSearch] = useState('');
  const [countySearch, setCountySearch] = useState('');

  if (!user) return <Navigate to="/login" />;
  const isPublic = user.role === 'public';
  const effectiveCategory = isPublic ? 'Historical' : category;

  useEffect(() => {
    setIsLoading(true);
    setError('');
    fetch(`${API_BASE_URL}/api/members/statistics?category=${encodeURIComponent(effectiveCategory)}`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setData(d); setIsLoading(false); })
      .catch(() => { setError('Failed to load statistics.'); setIsLoading(false); });
  }, [category]);

  const toggleLnSort = (field) => {
    setLnSort(s => s.field === field
      ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: field === 'count' ? 'desc' : 'asc' }
    );
  };

  const arrow = (field) => {
    if (lnSort.field !== field) return <span style={{ opacity: 0.3 }}> ↕</span>;
    return <span> {lnSort.dir === 'asc' ? '↑' : '↓'}</span>;
  };

  const sortedLastNames = (data?.lastNames || [])
    .filter(r => !lnSearch || r.name.toLowerCase().includes(lnSearch.toLowerCase()))
    .sort((a, b) => {
      const d = lnSort.dir === 'asc' ? 1 : -1;
      return lnSort.field === 'count' ? (a.count - b.count) * d : a.name.localeCompare(b.name) * d;
    });

  const filteredCounties = (data?.irishCounties || [])
    .filter(r => !countySearch || r.county.toLowerCase().includes(countySearch.toLowerCase()));

  const filteredPlaces = (data?.placesOfBirth || [])
    .filter(r => !placeSearch || r.place.toLowerCase().includes(placeSearch.toLowerCase()));

  const countText = (n, word, plural) => `${n} ${n !== 1 ? (plural ?? word + 's') : word} shown`;

  return (
    <MainLayout>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={pageHeader.wrapper}>
          <div>
            <h1 style={pageHeader.title}>Member Statistics</h1>
            <p style={pageHeader.subtitle}>Aggregated data across the membership database</p>
          </div>
        </div>

        {!isPublic && (
          <div style={{ ...filterBar, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <span style={{ fontWeight: '600', color: T.textMain, fontSize: T.fontBase, marginRight: '4px' }}>Category:</span>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} style={{
                padding: '6px 16px', fontSize: T.fontSm, fontWeight: '600',
                borderRadius: T.radiusMd, border: `1.5px solid ${cat === category ? T.primary : T.slateBorder}`,
                background: cat === category ? T.primary : T.white,
                color: cat === category ? T.white : T.textMuted,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: T.textMuted, fontSize: T.fontLg }}>
            Loading statistics...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: T.red, fontWeight: '600' }}>{error}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px' }}>

            {/* Last Name Frequency */}
            <StatCard
              title={`Surname Frequency — ${data.category}`}
              footer={countText(sortedLastNames.length, 'surname')}
            >
              <SearchInput value={lnSearch} onChange={setLnSearch} placeholder="Search surnames..." />
              <StatsTable
                emptyText="No results"
                columns={[
                  { label: 'Surname', arrow: arrow('name'), onClick: () => toggleLnSort('name') },
                  { label: 'Count', arrow: arrow('count'), onClick: () => toggleLnSort('count'),
                    style: { textAlign: 'right' }, cellStyle: { textAlign: 'right', fontWeight: '700', color: T.primary } },
                ]}
                rows={sortedLastNames.map(r => [r.name, r.count])}
              />
            </StatCard>

            {/* Oldest Members */}
            <StatCard title={`Oldest Members by Date of Birth — ${data.category}`}>
              <StatsTable
                emptyText="No date of birth data available"
                maxHeight={null}
                columns={[
                  { label: 'Name' },
                  { label: 'Date of Birth' },
                  { label: 'Category' },
                ]}
                rows={data.oldestMembers.map(m => [
                  <Link to={`/members/${m.id}`} style={{ color: T.primary, fontWeight: '600', textDecoration: 'none' }}>
                    {m.name}
                  </Link>,
                  m.dateOfBirth || '—',
                  m.category || '—',
                ])}
              />
            </StatCard>

            {/* Irish County Connections */}
            <StatCard
              title={`Irish County Connections — ${data.category}`}
              footer={countText(filteredCounties.length, 'county', 'counties')}
            >
              <SearchInput value={countySearch} onChange={setCountySearch} placeholder="Search counties..." />
              <StatsTable
                emptyText="No Irish county connection data available"
                columns={[
                  { label: 'County' },
                  { label: 'Members', style: { textAlign: 'right' }, cellStyle: { textAlign: 'right', fontWeight: '700', color: T.primary } },
                ]}
                rows={filteredCounties.map(r => [`County ${r.county}`, r.count])}
              />
            </StatCard>

            {/* Places of Birth */}
            <StatCard
              title={`Places of Birth — ${data.category}`}
              footer={countText(filteredPlaces.length, 'place')}
            >
              <SearchInput value={placeSearch} onChange={setPlaceSearch} placeholder="Search places..." />
              <StatsTable
                emptyText="No place of birth data available"
                columns={[
                  { label: 'Place' },
                  { label: 'Members', style: { textAlign: 'right' }, cellStyle: { textAlign: 'right', fontWeight: '700', color: T.primary } },
                ]}
                rows={filteredPlaces.map(r => [r.place, r.count])}
              />
            </StatCard>

          </div>
        )}
      </div>
    </MainLayout>
  );
}
