import { useRef, useState, useEffect } from 'react';
import { T } from '../utils/theme';

function parse(value) {
  if (!value) return { dd: '', mm: '', yyyy: '' };
  const parts = String(value).split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return { yyyy: parts[0], mm: parts[1], dd: parts[2] };
  }
  return { dd: '', mm: '', yyyy: '' };
}

function compose({ dd, mm, yyyy }) {
  if (dd.length === 2 && mm.length === 2 && yyyy.length === 4) {
    const d = parseInt(dd, 10), m = parseInt(mm, 10), y = parseInt(yyyy, 10);
    if (d >= 1 && m >= 1 && y >= 1) {
      const date = new Date(y, m - 1, d);
      if (date.getFullYear() === y && date.getMonth() + 1 === m && date.getDate() === d) {
        return `${yyyy}-${mm}-${dd}`;
      }
      return 'INVALID';
    }
  }
  return '';
}

export default function DateInput({ name, id, value, onChange, style }) {
  const [parts, setParts] = useState(() => parse(value));
  const [dateInvalid, setDateInvalid] = useState(false);
  const mmRef = useRef(null);
  const yyyyRef = useRef(null);

  useEffect(() => {
    setParts(parse(value));
    setDateInvalid(false);
  }, [value]);

  const emit = (newParts) => {
    const composed = compose(newParts);
    const allEmpty = !newParts.dd && !newParts.mm && !newParts.yyyy;
    const invalid = composed === 'INVALID';
    setDateInvalid(invalid);
    if (invalid) return;
    if (composed || allEmpty) {
      onChange({ target: { name, value: composed } });
    }
  };

  const handleDD = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
    const newParts = { ...parts, dd: v };
    setParts(newParts);
    emit(newParts);
    if (v.length === 2) mmRef.current?.focus();
  };

  const handleMM = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
    const newParts = { ...parts, mm: v };
    setParts(newParts);
    emit(newParts);
    if (v.length === 2) yyyyRef.current?.focus();
  };

  const handleYYYY = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
    const newParts = { ...parts, yyyy: v };
    setParts(newParts);
    emit(newParts);
  };

  const handleBlur = (field) => (e) => {
    const v = e.target.value;
    if (!v) return;
    if (field === 'dd') {
      const clamped = String(Math.min(Math.max(parseInt(v, 10), 1), 31)).padStart(2, '0');
      const newParts = { ...parts, dd: clamped };
      setParts(newParts);
      emit(newParts);
    } else if (field === 'mm') {
      const clamped = String(Math.min(Math.max(parseInt(v, 10), 1), 12)).padStart(2, '0');
      const newParts = { ...parts, mm: clamped };
      setParts(newParts);
      emit(newParts);
    }
  };

  const segStyle = {
    ...style,
    width: undefined,
    textAlign: 'center',
    padding: '14px 6px',
    ...(dateInvalid ? { borderColor: T.red, outline: `1px solid ${T.red}` } : {}),
  };

  const sepStyle = {
    fontWeight: 700,
    color: T.primary,
    fontSize: T.fontBase,
    userSelect: 'none',
    lineHeight: 1,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: style?.width ?? '100%' }}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="DD"
        maxLength={2}
        value={parts.dd}
        onChange={handleDD}
        onBlur={handleBlur('dd')}
        style={{ ...segStyle, width: '56px' }}
        aria-label="Day"
        autoComplete="off"
      />
      <span style={sepStyle}>-</span>
      <input
        ref={mmRef}
        type="text"
        inputMode="numeric"
        placeholder="MM"
        maxLength={2}
        value={parts.mm}
        onChange={handleMM}
        onBlur={handleBlur('mm')}
        style={{ ...segStyle, width: '56px' }}
        aria-label="Month"
        autoComplete="off"
      />
      <span style={sepStyle}>-</span>
      <input
        ref={yyyyRef}
        type="text"
        inputMode="numeric"
        placeholder="YYYY"
        maxLength={4}
        value={parts.yyyy}
        onChange={handleYYYY}
        style={{ ...segStyle, flex: 1 }}
        aria-label="Year"
        autoComplete="off"
      />
    </div>
  );
}
