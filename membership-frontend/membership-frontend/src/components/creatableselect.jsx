import React, { useState } from "react";

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
    if (isMulti) return input;  // Show input text for multi-select instead of empty string
    if (!singleValue) return input;
    const selectedOption = safeOptions.find(opt => opt.value == singleValue);
    return selectedOption ? selectedOption.label : input;
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
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                border: '2px solid #14b8a6',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 600,
                color: '#0f766e'
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
                    background: '#14b8a6',
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
        onBlur={() => setTimeout(() => setShowOptions(false), 150)}
        style={{
          width: '100%',
          padding: '14px 16px',
          border: '2px solid #5eead4',
          borderRadius: '10px',
          fontSize: '17px',
          fontWeight: '500',
          background: 'white',
          outline: 'none',
          transition: 'border-color 0.2s'
        }}
        onMouseOver={(e) => e.target.style.borderColor = '#14b8a6'}
        onMouseOut={(e) => e.target.style.borderColor = '#5eead4'}
      />
      {showOptions && (
        <div style={{ 
          position: "absolute", 
          zIndex: 10, 
          background: "#fff", 
          border: "2px solid #5eead4", 
          borderRadius: '10px',
          width: "100%", 
          maxHeight: 200, 
          overflowY: "auto",
          marginTop: '4px',
          boxShadow: '0 4px 12px rgba(20,184,166,0.15)'
        }}>
          {filtered.map(opt => (
            <div 
              key={opt.value} 
              style={{ 
                padding: '12px 16px', 
                cursor: "pointer",
                fontSize: '16px',
                fontWeight: '500',
                color: '#0f766e',
                borderBottom: '1px solid #f0fdfa',
                transition: 'background 0.2s'
              }} 
              onMouseDown={() => handleSelect(opt.value)}
              onMouseOver={(e) => e.target.style.background = '#f0fdfa'}
              onMouseOut={(e) => e.target.style.background = 'white'}
            >
              {opt.label}
            </div>
          ))}
          {input && !filtered.some(opt => opt.label.toLowerCase() === input.toLowerCase()) && (
            <div 
              style={{ 
                padding: '12px 16px', 
                cursor: "pointer", 
                color: '#14b8a6',
                fontSize: '16px',
                fontWeight: '700',
                background: '#f0fdfa',
                borderTop: '2px solid #5eead4'
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
