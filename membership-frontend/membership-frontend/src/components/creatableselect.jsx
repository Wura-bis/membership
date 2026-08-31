import React, { useState } from "react";
import { T } from '../utils/theme';

export default function CreatableSelect({ label, name, value, options, onChange, onCreate, placeholder, isMulti }) {
  const [input, setInput] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const safeOptions = Array.isArray(options) ? options : [];
  const filtered = safeOptions.filter(opt => (opt.label || "").toLowerCase().includes((input || "").toLowerCase()));

  // Multi-select logic
  const multiValue = Array.isArray(value) ? value : [];
  const singleValue = !Array.isArray(value) ? value : "";

  const handleSelect = (val) => {
    setInput("");
    setShowOptions(false);
    if (isMulti) {
      if (!multiValue.includes(val)) {
        onChange({ target: { name, value: [...multiValue, val] } });
      }
    } else {
      onChange({ target: { name, value: val } });
    }
  };

  const handleRemove = (val) => {
    if (isMulti) {
      onChange({ target: { name, value: multiValue.filter(v => v !== val) } });
    }
  };

  const handleCreate = async () => {
    if (input.trim()) {
      const newItem = await onCreate(input.trim());
      setInput("");
      setShowOptions(false);
      if (newItem && newItem.value !== undefined) {
        handleSelect(newItem.value);
      }
    }
  };

  // Find the label for the current value
  const getDisplayValue = () => {
    if (isMulti) return input;
    if (showOptions) return input;  // User is actively searching — show what they're typing
    if (!singleValue) return "";
    const selectedOption = safeOptions.find(opt => opt.value == singleValue);
    return selectedOption ? selectedOption.label : "";
  };

  return (
    <div style={{ position: "relative" }}>
      <label htmlFor={name}>{label}</label>
      {isMulti && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {multiValue.map(val => {
            const opt = safeOptions.find(o => o.value === val);
            return (
              <span key={val} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                background: `linear-gradient(135deg, ${T.primaryBg} 0%, ${T.primaryMid} 100%)`,
                border: `2px solid ${T.primaryLight}`,
                borderRadius: 20,
                fontSize: T.fontSm,
                fontWeight: 600,
                color: T.primary
              }}>
                {opt ? opt.label : val}
                <button
                  type="button"
                  onClick={() => handleRemove(val)}
                  aria-label="Remove"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#4e5d2e',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1,
                    padding: 0,
                    flexShrink: 0
                  }}
                >×</button>
              </span>
            );
          })}
        </div>
      )}
      <input
        id={name}
        name={name}
        value={getDisplayValue()}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setShowOptions(true)}
        onChange={e => {
          setInput(e.target.value);
          setShowOptions(true);
        }}
        onKeyDown={e => {
          if (isMulti && (e.key === 'Enter' || e.key === 'Tab') && input.trim()) {
            e.preventDefault();
            handleCreate();
          }
        }}
        onBlur={() => setTimeout(() => setShowOptions(false), 150)}
        style={{
          width: '100%',
          padding: '8px 10px',
          border: `2px solid ${T.primaryBorder}`,
          borderRadius: T.radiusMd,
          fontSize: T.fontBase,
          fontWeight: '500',
          background: T.white,
          outline: 'none',
          transition: 'border-color 0.2s'
        }}
        onMouseOver={(e) => e.target.style.borderColor = T.primaryLight}
        onMouseOut={(e) => e.target.style.borderColor = T.primaryBorder}
      />
      {showOptions && (
        <div style={{
          position: "absolute",
          zIndex: 10,
          background: T.white,
          border: `2px solid ${T.primaryBorder}`,
          borderRadius: T.radiusMd,
          width: "100%",
          maxHeight: 200,
          overflowY: "auto",
          marginTop: '4px',
          boxShadow: '0 4px 12px rgba(78,93,46,0.15)'
        }}>
          {filtered.map(opt => (
            <div
              key={opt.value}
              style={{
                padding: '8px 12px',
                cursor: "pointer",
                fontSize: T.fontBase,
                fontWeight: '500',
                color: T.primary,
                borderBottom: `1px solid ${T.primaryBg}`,
                transition: 'background 0.2s'
              }}
              onMouseDown={() => handleSelect(opt.value)}
              onMouseOver={(e) => e.target.style.background = T.primaryBg}
              onMouseOut={(e) => e.target.style.background = T.white}
            >
              {opt.label}
            </div>
          ))}
          {input && !filtered.some(opt => opt.label.toLowerCase() === input.toLowerCase()) && (
            <div
              style={{
                padding: '8px 12px',
                cursor: "pointer",
                color: T.primaryLight,
                fontSize: T.fontBase,
                fontWeight: '700',
                background: T.primaryBg,
                borderTop: `2px solid ${T.primaryBorder}`
              }}
              onMouseDown={handleCreate}
            >
              ➕ Add "{input}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
