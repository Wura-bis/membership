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
      if (newItem && newItem.value !== undefined && newItem.value !== null) {
        handleSelect(newItem.value);
      } else {
        setInput("");
        setShowOptions(false);
      }
    }
  };

  // Find the label for the current value
  const getDisplayValue = () => {
    if (isMulti) return "";
    if (!singleValue) return input;
    const selectedOption = safeOptions.find(opt => opt.value == singleValue);
    return selectedOption ? selectedOption.label : input;
  };

  return (
    <div style={{ position: "relative" }}>
      <label htmlFor={name}>{label}</label>
      {isMulti && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
          {multiValue.map(val => {
            const opt = safeOptions.find(o => o.value === val);
            return (
              <span key={val} style={{ background: "#e5e7eb", borderRadius: 12, padding: "2px 8px", display: "flex", alignItems: "center", marginRight: 4 }}>
                {opt ? opt.label : val}
                <button type="button" style={{ marginLeft: 4, color: "#888", background: "none", border: "none", cursor: "pointer" }} onClick={() => handleRemove(val)} aria-label="Remove">×</button>
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
        className="form-input"
        autoComplete="off"
        onFocus={() => setShowOptions(true)}
        onChange={e => {
          setInput(e.target.value);
          setShowOptions(true);
        }}
        onBlur={() => setTimeout(() => setShowOptions(false), 150)}
      />
      {showOptions && (
        <div style={{ position: "absolute", zIndex: 10, background: "#fff", border: "1px solid #ccc", width: "100%", maxHeight: 150, overflowY: "auto" }}>
          {filtered.map(opt => (
            <div key={opt.value} style={{ padding: 8, cursor: "pointer" }} onMouseDown={() => handleSelect(opt.value)}>
              {opt.label}
            </div>
          ))}
          {input && !filtered.some(opt => opt.label.toLowerCase() === input.toLowerCase()) && (
            <div style={{ padding: 8, cursor: "pointer", color: "#007bff" }} onMouseDown={handleCreate}>
              + Add "{input}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
