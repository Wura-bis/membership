import { useEffect } from "react";
import { T, btn, card } from '../utils/theme';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = "Delete", loading = false, error = "" }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onCancel();
    };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
      <div style={{ ...card, padding: '24px', maxWidth: '440px', width: '100%' }}>
        <h2 style={{ fontSize: T.fontLg, fontWeight: '700', color: T.textMain, margin: '0 0 8px 0' }}>{title}</h2>
        <p style={{ fontSize: T.fontBase, color: T.textMuted, margin: '0 0 16px 0' }}>{message}</p>
        {error && (
          <div style={{ fontSize: T.fontBase, color: T.red, background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: T.radiusSm, padding: '8px 12px', marginBottom: '16px' }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onCancel} style={btn.ghost} disabled={loading}>Cancel</button>
          <button
            onClick={onConfirm}
            style={{ ...btn.danger, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
