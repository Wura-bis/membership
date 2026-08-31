// ─── BIS Design System ───────────────────────────────────────────────────────
// Import this in every page: import { T, badge, btn } from '../../utils/theme';

export const T = {
  // Colours
  primary:      '#4e5d2e',
  primaryLight: '#6b8040',
  primaryBg:    'var(--bg-secondary)',   // responds to dark mode
  primaryBorder:'var(--border-primary)', // responds to dark mode
  primaryMid:   'var(--border-primary)', // responds to dark mode

  textMain:   'var(--text-primary)',     // responds to dark mode
  textMuted:  'var(--text-secondary)',   // responds to dark mode
  textLight:  '#94a3b8',

  white:   '#ffffff',   // always white — use for button text, avatars
  surface: 'var(--card-bg)',   // card/panel surfaces — responds to dark mode
  pageBg:  'var(--bg-primary)', // page background — responds to dark mode

  // Semantic colours
  green:       '#16a34a',
  greenLight:  '#dcfce7',
  greenBorder: '#86efac',

  amber:       '#d97706',
  amberLight:  '#fef3c7',
  amberBorder: '#fcd34d',

  red:         '#dc2626',
  redLight:    '#fef2f2',
  redBorder:   '#fca5a5',

  slate:       '#64748b',
  slateLight:  '#f1f5f9',
  slateBorder: '#cbd5e1',

  // Typography — rem so app-settings font size changes scale these
  fontSm:   '0.857rem',   // ~12px at 14px base
  fontBase: '1rem',       // 14px at 14px base
  fontMd:   '1.071rem',   // ~15px at 14px base
  fontLg:   '1.143rem',   // ~16px at 14px base
  fontXl:   '1.25rem',    // ~17.5px at 14px base — form inputs, auth pages

  // Spacing
  radiusSm: '6px',
  radiusMd: '8px',
  radiusLg: '12px',

  // Shadows
  shadowSm: '0 1px 3px rgba(0,0,0,0.07)',
  shadowMd: '0 4px 8px rgba(0,0,0,0.08)',
};

// ─── Card wrapper ─────────────────────────────────────────────────────────────
export const card = {
  background: 'var(--card-bg)',
  border: `1px solid var(--border-primary)`,
  borderRadius: T.radiusLg,
  boxShadow: T.shadowMd,
};

// ─── Table header cell ────────────────────────────────────────────────────────
export const thStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: '700',
  color: T.textMain,
  fontSize: T.fontSm,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  whiteSpace: 'nowrap',
  background: T.primaryBg,
};

// ─── Table data cell ──────────────────────────────────────────────────────────
export const tdStyle = {
  padding: '14px 16px',
  verticalAlign: 'middle',
  borderBottom: `1px solid ${T.primaryMid}`,
};

// ─── Buttons ──────────────────────────────────────────────────────────────────
// Usage: style={btn.primary}
export const btn = {
  // Teal filled — primary action
  primary: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px', fontSize: T.fontBase, fontWeight: '700',
    borderRadius: T.radiusMd, border: `1.5px solid ${T.primary}`,
    background: `linear-gradient(135deg, ${T.primaryLight} 0%, ${T.primary} 100%)`,
    color: T.white, cursor: 'pointer', fontFamily: 'inherit',
    textDecoration: 'none', whiteSpace: 'nowrap',
  },
  // Green filled — approve / confirm
  success: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px', fontSize: T.fontBase, fontWeight: '700',
    borderRadius: T.radiusMd, border: `1.5px solid ${T.green}`,
    background: T.green, color: T.white,
    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  },
  // Red outline — destructive
  danger: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px', fontSize: T.fontBase, fontWeight: '700',
    borderRadius: T.radiusMd, border: `1.5px solid ${T.red}`,
    background: 'var(--btn-danger-bg)', color: T.red,
    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  },
  // Amber outline — edit / secondary action
  warning: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px', fontSize: T.fontBase, fontWeight: '700',
    borderRadius: T.radiusMd, border: `1.5px solid ${T.amberBorder}`,
    background: 'var(--btn-warning-bg)', color: T.amber,
    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  },
  // Ghost — cancel / clear
  ghost: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px', fontSize: T.fontBase, fontWeight: '600',
    borderRadius: T.radiusMd, border: `1.5px solid ${T.slateBorder}`,
    background: 'var(--btn-ghost-bg)', color: T.textMuted,
    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  },
  // Green outline — CSV export
  exportCsv: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px', fontSize: T.fontBase, fontWeight: '600',
    borderRadius: T.radiusMd, border: `1.5px solid ${T.greenBorder}`,
    background: 'var(--btn-export-bg)', color: T.green,
    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  },
  // Red outline — PDF export
  exportPdf: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px', fontSize: T.fontBase, fontWeight: '600',
    borderRadius: T.radiusMd, border: `1.5px solid ${T.redBorder}`,
    background: 'var(--btn-danger-bg)', color: T.red,
    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  },
};

// ─── Status / approval badges ─────────────────────────────────────────────────
// Usage: <span style={badge.active}>Active</span>
export const badge = {
  active: {
    display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
    fontSize: T.fontSm, fontWeight: '700', whiteSpace: 'nowrap',
    background: 'var(--badge-green-bg)', color: T.green, border: `1px solid ${T.greenBorder}`,
  },
  inactive: {
    display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
    fontSize: T.fontSm, fontWeight: '700', whiteSpace: 'nowrap',
    background: 'var(--badge-slate-bg)', color: T.slate, border: `1px solid ${T.slateBorder}`,
  },
  approved: {
    display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
    fontSize: T.fontSm, fontWeight: '700', whiteSpace: 'nowrap',
    background: 'var(--badge-green-bg)', color: T.green, border: `1px solid ${T.greenBorder}`,
  },
  pending: {
    display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
    fontSize: T.fontSm, fontWeight: '700', whiteSpace: 'nowrap',
    background: 'var(--btn-warning-bg)', color: T.amber, border: `1px solid ${T.amberBorder}`,
  },
  private: {
    display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
    fontSize: T.fontSm, fontWeight: '700', whiteSpace: 'nowrap',
    background: 'var(--badge-primary-bg)', color: T.primary, border: `1px solid ${T.primaryLight}`,
  },
  public: {
    display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
    fontSize: T.fontSm, fontWeight: '700', whiteSpace: 'nowrap',
    background: 'var(--badge-green-bg)', color: T.green, border: `1px solid ${T.greenBorder}`,
  },
  admin: {
    display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
    fontSize: T.fontSm, fontWeight: '700', whiteSpace: 'nowrap',
    background: 'var(--badge-primary-bg)', color: T.primary, border: `1px solid ${T.primaryLight}`,
  },
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
export const avatarStyle = {
  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
  background: `linear-gradient(135deg, ${T.primaryLight} 0%, ${T.primary} 100%)`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: T.white, fontWeight: '700', fontSize: T.fontBase,
};

// ─── Page header ──────────────────────────────────────────────────────────────
export const pageHeader = {
  wrapper: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' },
  title:   { fontSize: '1.571rem', fontWeight: '700', color: T.textMain, margin: 0 },
  subtitle:{ fontSize: T.fontMd, fontWeight: '500', color: T.textMuted, margin: '4px 0 0' },
};

// ─── Filter bar ───────────────────────────────────────────────────────────────
export const filterBar = {
  ...card,
  padding: '20px 24px',
  marginBottom: '20px',
};

// ─── Pagination button ────────────────────────────────────────────────────────
export const pageBtn = (active, disabled) => ({
  padding: '8px 14px', fontSize: T.fontBase, fontWeight: '700',
  border: active ? `2px solid ${T.primaryLight}` : `2px solid #e5e7eb`,
  borderRadius: T.radiusMd,
  background: active ? T.primaryLight : disabled ? T.slateLight : T.white,
  color: active ? T.white : disabled ? T.textLight : T.textMuted,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.5 : 1, minWidth: '40px',
});
