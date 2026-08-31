import React from "react";
import CreatableSelect from "./creatableselect.jsx";
import DateInput from "./DateInput.jsx";
import { T, btn } from '../utils/theme';

function calcAge(dobStr) {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export default function MemberForm({ formData, lookups, onChange, onAddressChange, addAddress, removeAddress, isLoading, error, success, onSubmit, submitLabel, onCreateLookup }) {
  const dobAge = calcAge(formData.dateOfBirth);
  const dobError = dobAge !== null && dobAge < 18
    ? `Member must be at least 18 years old (current age: ${dobAge})`
    : null;

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: T.fontBase,
    fontWeight: '700',
    color: T.textMain
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: `2px solid ${T.primaryBorder}`,
    borderRadius: T.radiusMd,
    fontSize: T.fontBase,
    fontWeight: '500',
    background: 'white'
  };

  return (
    <form onSubmit={onSubmit} aria-label="Member Form" autoComplete="off">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Personal Information Card */}
        <div style={{ 
          padding: '24px',
          background: '#f8f9fa',
          borderRadius: '12px', 
          boxShadow: '0 2px 12px rgba(78,93,46,0.08)', 
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ 
            marginBottom: '16px',
            fontSize: T.fontLg,
            fontWeight: '700',
            color: T.textMain 
          }}>
            👤 Personal Information
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <label htmlFor="firstName" style={labelStyle}>First Name</label>
              <input name="firstName" id="firstName" value={formData.firstName || ""} onChange={onChange} style={inputStyle} autoComplete="off" />
            </div>
            <div>
              <label htmlFor="lastName" style={labelStyle}>Last Name</label>
              <input name="lastName" id="lastName" value={formData.lastName || ""} onChange={onChange} style={inputStyle} autoComplete="off" />
            </div>
            <div>
              <label htmlFor="dateOfBirth" style={labelStyle}>Date of Birth</label>
              <DateInput name="dateOfBirth" id="dateOfBirth" value={formData.dateOfBirth || ""} onChange={onChange} style={{ ...inputStyle, borderColor: dobError ? '#dc2626' : '#d1d5db' }} />
              {dobError && <p style={{ color: '#dc2626', fontSize: T.fontSm, fontWeight: '600', marginTop: '6px' }}>{dobError}</p>}
            </div>
            <div>
              <label htmlFor="placeOfBirth" style={labelStyle}>Place of Birth</label>
              <input name="placeOfBirth" id="placeOfBirth" value={formData.placeOfBirth || ""} onChange={onChange} style={inputStyle} autoComplete="off" />
            </div>
            <div>
              <label htmlFor="occupationId" style={labelStyle}>Occupation</label>
              <CreatableSelect label="" name="occupationId" value={formData.occupationId || ""} options={lookups.occupations || []} onChange={onChange} onCreate={val => onCreateLookup('occupation', val)} placeholder="Type or select..." />
            </div>
          </div>
        </div>

        {/* Irish Connections Card */}
        <div style={{ 
          padding: '24px',
          background: '#f8f9fa',
          borderRadius: '12px', 
          boxShadow: '0 2px 12px rgba(78,93,46,0.08)', 
          border: '1px solid #e5e7eb',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            marginBottom: '16px',
            fontSize: T.fontLg,
            fontWeight: '700',
            color: T.textMain 
          }}>
            🍀 Irish Connections
          </h2>
          {(formData.irishConnections || []).map((ic, idx) => (
            <div key={idx} style={{ 
              padding: '24px', 
              marginBottom: '20px', 
              background: 'white', 
              borderRadius: '10px', 
              border: '2px solid #e5e7eb' 
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '16px' }}>
                <div>
                  <label htmlFor={`irishConnections-type-${idx}`} style={labelStyle}>Irish Connection Type</label>
                  <select 
                    id={`irishConnections-type-${idx}`}
                    name={`irishConnections[${idx}].type`}
                    value={ic.type || ""}
                    onChange={e => {
                      const arr = [...(formData.irishConnections || [])];
                      arr[idx] = { ...arr[idx], type: e.target.value };
                      onChange({ target: { name: "irishConnections", value: arr } });
                    }}
                    style={inputStyle}
                  >
                    <option value="">Select Connection Type</option>
                    <option value="Paternal">Paternal</option>
                    <option value="Maternal">Maternal</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`irishConnections-county-${idx}`} style={labelStyle}>County Name</label>
                  <select 
                    id={`irishConnections-county-${idx}`}
                    name={`irishConnections[${idx}].countyId`}
                    value={ic.countyId || ""}
                    onChange={e => {
                      const arr = [...(formData.irishConnections || [])];
                      arr[idx] = { ...arr[idx], countyId: e.target.value };
                      onChange({ target: { name: "irishConnections", value: arr } });
                    }}
                    style={inputStyle}
                  >
                    <option value="">Select County</option>
                    {lookups.counties && lookups.counties.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor={`irishConnections-surname-${idx}`} style={labelStyle}>Surname</label>
                  <CreatableSelect 
                    label=""
                    name={`irishConnections[${idx}].surnameId`}
                    value={ic.surnameId || ""}
                    options={lookups.surnames || []}
                    onChange={e => {
                      const arr = [...(formData.irishConnections || [])];
                      arr[idx] = { ...arr[idx], surnameId: e.target.value };
                      onChange({ target: { name: "irishConnections", value: arr } });
                    }}
                    onCreate={val => onCreateLookup('surname', val)}
                    placeholder="Type or select..."
                  />
                </div>
              </div>
              <button
                type="button"
                aria-label={`Delete Irish Connection ${idx + 1}`}
                onClick={() => {
                  const arr = [...(formData.irishConnections || [])];
                  arr.splice(idx, 1);
                  onChange({ target: { name: "irishConnections", value: arr } });
                }}
                style={btn.danger}
              >
                🗑️ Remove Connection
              </button>
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => onChange({ target: { name: "irishConnections", value: [...(formData.irishConnections || [{ type: "", countyId: "", surnameId: "" }]), { type: "", countyId: "", surnameId: "" }] } })}
            style={{ ...btn.primary, marginTop: '8px' }}
          >
            ➕ Add Another Irish Connection
          </button>
        </div>

        {/* Contact Information Card */}
        <div style={{ 
          padding: '24px',
          background: '#f8f9fa',
          borderRadius: '12px', 
          boxShadow: '0 2px 12px rgba(78,93,46,0.08)', 
          border: '1px solid #e5e7eb',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            marginBottom: '16px',
            fontSize: T.fontLg,
            fontWeight: '700',
            color: T.textMain 
          }}>
            📧 Contact Information
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div>
              <label htmlFor="email" style={labelStyle}>Email</label>
              <input name="email" id="email" value={formData.email || ""} onChange={onChange} style={inputStyle} type="email" autoComplete="off" />
            </div>
          </div>

          {/* Phone Numbers Section */}
          <div style={{ borderTop: '2px solid #4e5d2e', paddingTop: '28px' }}>
            <h3 style={{
              marginBottom: '16px',
              fontSize: T.fontMd,
              fontWeight: '700',
              color: T.textMain,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📱 Phone Numbers
            </h3>
          {(formData.phoneNumbers || [{ type: "", number: "", isPreferred: false }]).map((phone, idx) => (
            <div key={idx} style={{ 
              padding: '24px', 
              marginBottom: '20px', 
              background: 'white', 
              borderRadius: '10px', 
              border: '2px solid #e5e7eb' 
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '16px' }}>
                <div>
                  <label htmlFor={`phoneNumbers-type-${idx}`} style={labelStyle}>Phone Type</label>
                  <select 
                    id={`phoneNumbers-type-${idx}`}
                    name={`phoneNumbers[${idx}].type`}
                    value={phone.type || ""}
                    onChange={e => {
                      const arr = [...(formData.phoneNumbers || [])];
                      arr[idx] = { ...arr[idx], type: e.target.value };
                      onChange({ target: { name: "phoneNumbers", value: arr } });
                    }}
                    style={inputStyle}
                  >
                    <option value="">Select Phone Type</option>
                    <option value="Home">Home</option>
                    <option value="Cell">Cell</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`phoneNumbers-number-${idx}`} style={labelStyle}>Phone Number</label>
                  <input 
                    id={`phoneNumbers-number-${idx}`}
                    type="tel"
                    value={phone.number || ""}
                    onChange={e => {
                      const arr = [...(formData.phoneNumbers || [])];
                      arr[idx] = { ...arr[idx], number: e.target.value };
                      onChange({ target: { name: "phoneNumbers", value: arr } });
                    }}
                    style={inputStyle}
                    placeholder="(123) 456-7890"
                    autoComplete="off"
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={phone.isPreferred || false}
                      onChange={e => {
                        const arr = [...(formData.phoneNumbers || [])];
                        arr[idx] = { ...arr[idx], isPreferred: e.target.checked };
                        onChange({ target: { name: "phoneNumbers", value: arr } });
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ color: '#4e5d2e', fontWeight: '500' }}>Preferred</span>
                  </label>
                </div>
              </div>
              <button
                type="button"
                aria-label={`Delete phone number ${idx + 1}`}
                onClick={() => {
                  const arr = [...(formData.phoneNumbers || [])];
                  arr.splice(idx, 1);
                  onChange({ target: { name: "phoneNumbers", value: arr } });
                }}
                disabled={formData.phoneNumbers.length === 1}
                style={{
                  ...btn.danger,
                  opacity: formData.phoneNumbers.length === 1 ? 0.4 : 1,
                  cursor: formData.phoneNumbers.length === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                🗑️ Remove Phone
              </button>
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => onChange({ target: { name: "phoneNumbers", value: [...(formData.phoneNumbers || [{ type: "", number: "", isPreferred: false }]), { type: "", number: "", isPreferred: false }] } })}
            style={{ ...btn.primary, marginTop: '8px' }}
          >
            ➕ Add Phone Number
          </button>
          </div>
        </div>

        {/* Address Information Card */}
        <div style={{ 
          padding: '24px',
          background: '#f8f9fa',
          borderRadius: '12px', 
          boxShadow: '0 2px 12px rgba(78,93,46,0.08)', 
          border: '1px solid #e5e7eb',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            marginBottom: '16px',
            fontSize: T.fontLg,
            fontWeight: '700',
            color: T.textMain 
          }}>
            🏠 Address Information
          </h2>
          {/* Province/State and Country options from global Provinces table */}
          {(formData.addresses && formData.addresses.length > 0 ? formData.addresses : [{
            street: "", city: "", province: "", country: "", postalCode: "", isCurrent: true
          }]).map((addr, idx) => {
            // Country list: Canada, United States, Ireland only
            const allCountries = [
              "Canada", "United States", "Ireland"
            ];
            const countryOptions = allCountries.map(c => ({ label: c, value: c }));
            // For Ireland use the IrishCounties table; for other countries use Provinces
            const provinceOptions = addr.country === 'Ireland'
              ? (lookups.counties || []).map(c => ({ label: c.label, value: c.label, countryName: 'Ireland' }))
              : (lookups.provinces || []).filter(p => p.countryName === addr.country);
            return (
              <div key={idx} style={{ 
                padding: '24px', 
                marginBottom: '20px', 
                background: 'white', 
                borderRadius: '10px', 
                border: '2px solid #e5e7eb' 
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>Address Line 1</label>
                    <input value={addr.street} onChange={e => onAddressChange(idx, "street", e.target.value)} placeholder="Address Line 1" style={inputStyle} aria-label="Address Line 1" autoComplete="off" />
                  </div>
                  <div>
                    <label style={labelStyle}>City/Town</label>
                    <input value={addr.city} onChange={e => onAddressChange(idx, "city", e.target.value)} placeholder="City/Town" style={inputStyle} aria-label="City/Town" autoComplete="off" />
                  </div>
                  <div>
                    <label style={labelStyle}>Province/State</label>
                    <CreatableSelect
                      label=""
                      name={`addresses[${idx}].province`}
                      value={addr.province || ""}
                      options={provinceOptions.map(opt => ({ label: opt.label, value: opt.label }))}
                      onChange={e => onAddressChange(idx, "province", e.target.value)}
                      onCreate={val => {
                        onAddressChange(idx, "province", val);
                        if (onCreateLookup) onCreateLookup('province', val);
                      }}
                      placeholder="Type or select province/state..."
                    />
                  </div>
                <div>
                  <label style={labelStyle}>Country</label>
                  <select 
                    value={addr.country || ""} 
                    onChange={e => onAddressChange(idx, "country", e.target.value)} 
                    style={inputStyle} 
                    aria-label="Country"
                  >
                    <option value="">Select Country</option>
                    {countryOptions.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Postal Code</label>
                  <input value={addr.postalCode} onChange={e => onAddressChange(idx, "postalCode", e.target.value)} placeholder="Postal Code" style={inputStyle} aria-label="Postal Code" autoComplete="off" />
                </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: T.fontBase, fontWeight: '700', color: T.primary }}>
                    <input type="checkbox" checked={addr.isCurrent} onChange={e => onAddressChange(idx, "isCurrent", e.target.checked)} aria-label="Current Address" style={{ width: '22px', height: '22px', cursor: 'pointer' }} />
                    Current Address
                  </label>
                  <button 
                    type="button" 
                    onClick={() => removeAddress(idx)} 
                    style={btn.danger}
                  >
                    🗑️ Delete Address
                  </button>
                </div>
              </div>
            );
          })}
          <button 
            type="button" 
            onClick={addAddress} 
            style={{ ...btn.primary, marginTop: '8px' }}
          >
            ➕ Add Another Address
          </button>
        </div>

        {/* Membership Details Card */}
        <div style={{ 
          padding: '24px',
          background: '#f8f9fa',
          borderRadius: '12px', 
          boxShadow: '0 2px 12px rgba(78,93,46,0.08)', 
          border: '1px solid #e5e7eb',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            marginBottom: '16px',
            fontSize: T.fontLg,
            fontWeight: '700',
            color: T.textMain 
          }}>
            📋 Membership Details
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <label htmlFor="otherSocieties" style={labelStyle}>Other Societies Affiliated With</label>
              <CreatableSelect label="" name="otherSocieties" isMulti value={Array.isArray(formData.otherSocieties) ? formData.otherSocieties : (formData.otherSocieties ? [formData.otherSocieties] : [])} options={(lookups.societies || []).map(s => ({ value: s.label || s.name, label: s.label || s.name }))} onChange={onChange} onCreate={val => onCreateLookup('otherSocieties', val)} placeholder="Type or add a society..." />
            </div>
            <div>
              <label htmlFor="memberCategoryId" style={labelStyle}>Member Category</label>
              <select name="memberCategoryId" id="memberCategoryId" value={formData.memberCategoryId || ""} onChange={onChange} style={inputStyle}>
                <option value="">Select Category</option>
                {lookups.categories && lookups.categories
                  .filter(cat => cat.value !== null && cat.value !== undefined && cat.value !== "")
                  .map((cat, idx) => (
                    <option key={String(cat.value) !== 'null' && cat.value !== '' ? cat.value : `cat-${idx}`} value={cat.value}>{cat.label}</option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor="dateJoined" style={labelStyle}>Membership Start Date</label>
              <DateInput name="dateJoined" id="dateJoined" value={formData.dateJoined || ""} onChange={onChange} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="dateEnded" style={labelStyle}>Membership End Date</label>
              <DateInput name="dateEnded" id="dateEnded" value={formData.dateEnded || ""} onChange={onChange} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="applicationDate" style={labelStyle}>Application Date</label>
              <DateInput name="applicationDate" id="applicationDate" value={formData.applicationDate || ""} onChange={onChange} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="approvalDate" style={labelStyle}>Date Approved</label>
              <DateInput name="approvalDate" id="approvalDate" value={formData.approvalDate || ""} onChange={onChange} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="approvedBy" style={labelStyle}>Approved By</label>
              <input name="approvedBy" id="approvedBy" value={formData.approvedBy || ""} onChange={onChange} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="signedBy" style={labelStyle}>Signed By</label>
              <input name="signedBy" id="signedBy" value={formData.signedBy || ""} onChange={onChange} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="proposer" style={labelStyle}>Proposer</label>
              <input name="proposer" id="proposer" value={formData.proposer || ""} onChange={onChange} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="seconder" style={labelStyle}>Seconder(s)</label>
              <input name="seconder" id="seconder" value={formData.seconder || ""} onChange={onChange} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="proposalDate" style={labelStyle}>Proposal Date</label>
              <DateInput name="proposalDate" id="proposalDate" value={formData.proposalDate || ""} onChange={onChange} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Roles & Fiscal Year Card */}
        <div style={{ 
          padding: '24px',
          background: '#f8f9fa',
          borderRadius: '12px', 
          boxShadow: '0 2px 12px rgba(78,93,46,0.08)', 
          border: '1px solid #e5e7eb',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            marginBottom: '16px',
            fontSize: T.fontLg,
            fontWeight: '700',
            color: T.textMain 
          }}>
            👔 Roles & Fiscal Year
          </h2>
          {(formData.roleFiscalYears || []).map((rf, idx) => (
            <div key={idx} style={{ 
              padding: '24px', 
              marginBottom: '20px', 
              background: 'white', 
              borderRadius: '10px', 
              border: '2px solid #e5e7eb' 
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '16px' }}>
                <div>
                  <label htmlFor={`roleFiscalYears-role-${idx}`} style={labelStyle}>Role</label>
                  <CreatableSelect
                    label=""
                    name={`roleFiscalYears[${idx}].role`}
                    value={rf.role || ""}
                    options={lookups.roles || []}
                    onChange={e => {
                      const arr = [...(formData.roleFiscalYears || [])];
                      arr[idx] = { ...arr[idx], role: e.target.value };
                      onChange({ target: { name: "roleFiscalYears", value: arr } });
                    }}
                    onCreate={val => onCreateLookup('role', val)}
                    placeholder="Type or select..."
                    id={`roleFiscalYears-role-${idx}`}
                  />
                </div>
                <div>
                  <label htmlFor={`roleFiscalYears-fiscalYear-${idx}`} style={labelStyle}>Fiscal Year</label>
                <CreatableSelect
                  label=""
                  name={`roleFiscalYears[${idx}].fiscalYear`}
                  value={rf.fiscalYear || ""}
                  options={lookups.fiscalYears || []}
                  onChange={e => {
                    const arr = [...(formData.roleFiscalYears || [])];
                    arr[idx] = { ...arr[idx], fiscalYear: e.target.value };
                    onChange({ target: { name: "roleFiscalYears", value: arr } });
                  }}
                  onCreate={val => onCreateLookup('fiscalYear', val)}
                  placeholder="Type or select..."
                  id={`roleFiscalYears-fiscalYear-${idx}`}
                />
              </div>
              </div>
              <button
                type="button"
                aria-label={`Delete Role/Fiscal Year ${idx + 1}`}
                onClick={() => {
                  const arr = [...(formData.roleFiscalYears || [])];
                  arr.splice(idx, 1);
                  onChange({ target: { name: "roleFiscalYears", value: arr } });
                }}
                style={btn.danger}
              >
                🗑️ Remove
              </button>
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => onChange({ target: { name: "roleFiscalYears", value: [...(formData.roleFiscalYears || [{ role: "", fiscalYear: "" }]), { role: "", fiscalYear: "" }] } })}
            style={{ ...btn.primary, marginTop: '8px' }}
          >
            ➕ Add Another Role/Fiscal Year
          </button>
        </div>

        {/* Volunteering Interests Card - Internal Info (Private/Admin only) */}
        <div style={{ 
          padding: '24px',
          background: '#f8f9fa',
          borderRadius: '12px', 
          boxShadow: '0 2px 12px rgba(78,93,46,0.08)', 
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ 
            marginBottom: '16px',
            fontSize: T.fontLg,
            fontWeight: '700',
            color: T.textMain 
          }}>
            🤝 Volunteering Interests
          </h2>
          <p style={{
            marginBottom: '20px',
            fontSize: T.fontBase,
            color: T.textMuted,
            fontStyle: 'italic'
          }}>
            Select or add the areas where this member is interested in volunteering (Private/Admin only)
          </p>
          <CreatableSelect
            label="Volunteering Interests"
            name="volunteeringInterests"
            isMulti
            options={(lookups.volunteeringInterests || []).map(interest => ({ 
              value: interest, 
              label: interest 
            }))}
            value={formData.volunteeringInterests || []}
            onChange={onChange}
            onCreate={(input) => {
              const trimmed = input.trim();
              if (trimmed) {
                const current = formData.volunteeringInterests || [];
                if (!current.includes(trimmed)) {
                  onChange({ target: { name: "volunteeringInterests", value: [...current, trimmed] } });
                }
              }
            }}
            placeholder="Type or select volunteering interests..."
          />
        </div>

        {/* Notes, IsActive, Photo Upload, Submit Card */}
        <div style={{ 
          padding: '24px',
          background: '#f8f9fa',
          borderRadius: '12px', 
          boxShadow: '0 2px 12px rgba(78,93,46,0.08)', 
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ 
            marginBottom: '16px',
            fontSize: T.fontLg,
            fontWeight: '700',
            color: T.textMain 
          }}>
            📝 Other Details
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label htmlFor="notes" style={labelStyle}>Notes</label>
              <textarea 
                name="notes" 
                id="notes" 
                value={formData.notes || ""} 
                onChange={onChange} 
                rows="5"
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  lineHeight: '1.6'
                }}
              />
            </div>
            <div>
              <label htmlFor="photo" style={labelStyle}>Member Photo</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input 
                    name="photo" 
                    id="photo"
                    type="file" 
                    accept=".jpg,.jpeg,.png,.pdf" 
                    onChange={e => onChange({ target: { name: "photo", value: e.target.files[0] } })} 
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer'
                    }}
                    aria-label="Photo Upload" 
                  />
                  <div style={{
                    ...inputStyle,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    background: formData.photo ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : 'linear-gradient(135deg, #f8f9fa 0%, #e5e7eb 100%)',
                    borderStyle: 'dashed',
                    borderWidth: '2px',
                    borderColor: formData.photo ? '#059669' : '#4e5d2e',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#4e5d2e',
                    transition: 'all 0.2s',
                    height: '100%',
                    minHeight: '54px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = formData.photo ? 'linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%)' : 'linear-gradient(135deg, #e5e7eb 0%, #99f6e4 100%)';
                    e.currentTarget.style.borderColor = '#4e5d2e';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = formData.photo ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : 'linear-gradient(135deg, #f8f9fa 0%, #e5e7eb 100%)';
                    e.currentTarget.style.borderColor = formData.photo ? '#059669' : '#4e5d2e';
                  }}
                  >
                    {formData.photo ? (
                      <>✅ {formData.photo.name || formData.photo}</>
                    ) : (
                      <>📸 Choose Photo</>
                    )}
                  </div>
                </div>
                {formData.photo && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ target: { name: "photo", value: null } });
                      // Reset the file input
                      const fileInput = document.getElementById('photo');
                      if (fileInput) fileInput.value = '';
                    }}
                    style={btn.danger}
                  >
                    🗑️ Remove
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* Error/Success/Submit */}
          {error && (
            <div style={{ marginTop: '16px', padding: '12px 14px', background: T.redLight, border: `1.5px solid ${T.redBorder}`, borderRadius: T.radiusMd, color: T.red, fontSize: T.fontBase, fontWeight: '600' }}>
              ❌ {error}
            </div>
          )}
          {success && (
            <div style={{ marginTop: '16px', padding: '12px 14px', background: T.greenLight, border: `1.5px solid ${T.greenBorder}`, borderRadius: T.radiusMd, color: T.green, fontSize: T.fontBase, fontWeight: '600' }}>
              ✅ {success}
            </div>
          )}
          <div style={{ marginTop: '24px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={isLoading}
              aria-label="Submit Member Form"
              style={{ ...btn.primary, opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              {isLoading ? '⏳ Saving...' : submitLabel}
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              aria-label="Cancel"
              style={btn.ghost}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
  </form>
  );
}
