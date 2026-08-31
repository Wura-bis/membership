import { useState } from "react";

export function FormField({ 
  label, 
  name, 
  type = "text", 
  value, 
  onChange, 
  error, 
  success,
  required = false,
  placeholder,
  disabled = false,
  options = [], // for select
  ...props 
}) {
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  const handleBlur = () => {
    setFocused(false);
    setTouched(true);
  };

  const showError = error && touched;
  const showSuccess = success && touched && !error;

  return (
    <div className="form-field" style={{ marginBottom: '20px' }}>
      <label 
        htmlFor={name}
        className="form-label"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginBottom: '8px'
        }}
      >
        {label}
        {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      
      {type === "select" ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          disabled={disabled}
          className={`form-input ${showError ? 'error' : ''} ${showSuccess ? 'success' : ''}`}
          style={{
            borderColor: showError ? '#ef4444' : showSuccess ? '#10b981' : focused ? '#4e5d2e' : '#e2e8f0'
          }}
          {...props}
        >
          <option value="">{placeholder || `Select ${label.toLowerCase()}...`}</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={`form-input ${showError ? 'error' : ''} ${showSuccess ? 'success' : ''}`}
          style={{
            borderColor: showError ? '#ef4444' : showSuccess ? '#10b981' : focused ? '#4e5d2e' : '#e2e8f0',
            minHeight: '100px',
            resize: 'vertical'
          }}
          {...props}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={`form-input ${showError ? 'error' : ''} ${showSuccess ? 'success' : ''}`}
          style={{
            borderColor: showError ? '#ef4444' : showSuccess ? '#10b981' : focused ? '#4e5d2e' : '#e2e8f0'
          }}
          {...props}
        />
      )}
      
      {showError && (
        <div className="form-error">
          {error}
        </div>
      )}
      
      {showSuccess && (
        <div className="form-success">
          {success}
        </div>
      )}
    </div>
  );
}

export function ActionButton({ 
  children, 
  variant = "primary", 
  size = "medium",
  loading = false, 
  disabled = false,
  icon,
  ...props 
}) {
  const sizeClasses = {
    small: { padding: '8px 16px', fontSize: '14px' },
    medium: { padding: '12px 24px', fontSize: '16px' },
    large: { padding: '16px 32px', fontSize: '18px' }
  };

  const buttonStyle = {
    ...sizeClasses[size],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    position: 'relative',
    opacity: (loading || disabled) ? 0.6 : 1,
    cursor: (loading || disabled) ? 'not-allowed' : 'pointer'
  };

  return (
    <button
      className={`btn-${variant}`}
      disabled={loading || disabled}
      style={buttonStyle}
      {...props}
    >
      {loading && (
        <div 
          className="spinner"
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTop: '2px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
      )}
      {icon && !loading && <span>{icon}</span>}
      {children}
    </button>
  );
}

export function StatusBadge({ status, children }) {
  const isActive = status === 'active' || status === true;
  const className = isActive ? 'status-active' : 'status-inactive';
  
  return (
    <span className={className}>
      {children || (isActive ? 'Active' : 'Inactive')}
    </span>
  );
}
