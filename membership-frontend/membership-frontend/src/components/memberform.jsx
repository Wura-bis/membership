import React from "react";
import CreatableSelect from "./creatableselect.jsx";

export default function MemberForm({ formData, lookups, onChange, onAddressChange, addAddress, removeAddress, isLoading, error, success, onSubmit, submitLabel, onCreateLookup }) {
  const labelStyle = {
    display: 'block',
    marginBottom: '10px',
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f766e'
  };
  
  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #5eead4',
    borderRadius: '10px',
    fontSize: '17px',
    fontWeight: '500',
    background: 'white'
  };

  return (
    <form onSubmit={onSubmit} aria-label="Member Form" autoComplete="off">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Personal Information Card */}
        <div style={{ 
          padding: '36px', 
          background: '#f0fdfa', 
          borderRadius: '12px', 
          boxShadow: '0 2px 12px rgba(20,184,166,0.08)', 
          border: '2px solid #5eead4' 
        }}>
          <h2 style={{ 
            marginBottom: '28px', 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#0f766e' 
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
              <input name="dateOfBirth" id="dateOfBirth" value={formData.dateOfBirth || ""} onChange={onChange} style={inputStyle} type="date" />
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
          padding: '36px', 
          background: '#f0fdfa', 
          borderRadius: '12px', 
          boxShadow: '0 2px 12px rgba(20,184,166,0.08)', 
          border: '2px solid #5eead4',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            marginBottom: '28px', 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#0f766e' 
          }}>
            🍀 Irish Connections
          </h2>
          {(formData.irishConnections || [{ type: "", countyId: "", surnameId: "" }]).map((ic, idx) => (
            <div key={idx} style={{ 
              padding: '24px', 
              marginBottom: '20px', 
              background: 'white', 
              borderRadius: '10px', 
              border: '2px solid #ccfbf1' 
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
                disabled={formData.irishConnections.length === 1}
                style={{
                  padding: '12px 20px',
                  background: formData.irishConnections.length === 1 ? '#f3f4f6' : 'white',
                  color: formData.irishConnections.length === 1 ? '#9ca3af' : '#dc2626',
                  border: '2px solid',
                  borderColor: formData.irishConnections.length === 1 ? '#d1d5db' : '#dc2626',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: formData.irishConnections.length === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                🗑️ Remove Connection
              </button>
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => onChange({ target: { name: "irishConnections", value: [...(formData.irishConnections || [{ type: "", countyId: "", surnameId: "" }]), { type: "", countyId: "", surnameId: "" }] } })}
            style={{
              padding: '14px 24px',
              background: '#14b8a6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              marginTop: '12px'
            }}
          >
            ➕ Add Another Irish Connection
          </button>
        </div>

        {/* Contact Information Card */}
        <div style={{ 
          padding: '36px', 
          background: '#f0fdfa', 
          borderRadius: '12px', 
          boxShadow: '0 2px 12px rgba(20,184,166,0.08)', 
          border: '2px solid #5eead4',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            marginBottom: '28px', 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#0f766e' 
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
          <div style={{ borderTop: '2px solid #14b8a6', paddingTop: '28px' }}>
            <h3 style={{ 
              marginBottom: '20px', 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#0f766e',
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
              border: '2px solid #ccfbf1' 
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
                    <span style={{ color: '#0f766e', fontWeight: '500' }}>Preferred</span>
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
                  padding: '12px 20px',
                  background: formData.phoneNumbers.length === 1 ? '#f3f4f6' : 'white',
                  color: formData.phoneNumbers.length === 1 ? '#9ca3af' : '#dc2626',
                  border: '2px solid',
                  borderColor: formData.phoneNumbers.length === 1 ? '#d1d5db' : '#dc2626',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
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
            style={{
              padding: '14px 24px',
              background: '#14b8a6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              marginTop: '12px'
            }}
          >
            ➕ Add Phone Number
          </button>
          </div>
        </div>

        {/* Address Information Card */}
        <div style={{ 
          padding: '36px', 
          background: '#f0fdfa', 
          borderRadius: '12px', 
          boxShadow: '0 2px 12px rgba(20,184,166,0.08)', 
          border: '2px solid #5eead4',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            marginBottom: '28px', 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#0f766e' 
          }}>
            🏠 Address Information
          </h2>
          {/* Province/State and Country options from global Provinces table */}
          {(formData.addresses && formData.addresses.length > 0 ? formData.addresses : [{
            street: "", city: "", province: "", country: "", postalCode: "", isCurrent: true
          }]).map((addr, idx) => {
            // Universal country list — Canada, United States, Ireland pinned first, rest alphabetical
            const allCountries = [
              "Canada", "United States", "Ireland",
              "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
              "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
              "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
              "Cameroon", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
              "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
              "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
              "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
              "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Israel",
              "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait",
              "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
              "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico",
              "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru",
              "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman",
              "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
              "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
              "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
              "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
              "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey",
              "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "Uruguay", "Uzbekistan", "Vanuatu",
              "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
            ];
            const countryOptions = allCountries.map(c => ({ label: c, value: c }));
            // Get provinces for selected country (use countryName property)
            const provinceOptions = (lookups.provinces || []).filter(p => p.countryName === addr.country);
            return (
              <div key={idx} style={{ 
                padding: '24px', 
                marginBottom: '20px', 
                background: 'white', 
                borderRadius: '10px', 
                border: '2px solid #ccfbf1' 
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
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: '600', color: '#0f766e' }}>
                    <input type="checkbox" checked={addr.isCurrent} onChange={e => onAddressChange(idx, "isCurrent", e.target.checked)} aria-label="Current Address" style={{ width: '22px', height: '22px', cursor: 'pointer' }} />
                    Current Address
                  </label>
                  <button 
                    type="button" 
                    onClick={() => removeAddress(idx)} 
                    style={{
                      padding: '12px 20px',
                      background: 'white',
                      color: '#dc2626',
                      border: '2px solid #dc2626',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
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
            style={{
              padding: '14px 24px',
              background: '#14b8a6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              marginTop: '12px'
            }}
          >
            ➕ Add Another Address
          </button>
        </div>

        {/* Membership Details Card */}
        <div style={{ 
          padding: '36px', 
          background: '#f0fdfa', 
          borderRadius: '12px', 
          boxShadow: '0 2px 12px rgba(20,184,166,0.08)', 
          border: '2px solid #5eead4',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            marginBottom: '28px', 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#0f766e' 
          }}>
            📋 Membership Details
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <label htmlFor="otherSocieties" style={labelStyle}>Other Societies Affiliated With</label>
              <CreatableSelect label="" name="otherSocieties" value={formData.otherSocieties || ""} options={lookups.otherSocieties || []} onChange={onChange} onCreate={val => onCreateLookup('otherSocieties', val)} placeholder="Type or select..." />
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
              <input name="dateJoined" id="dateJoined" type="date" value={formData.dateJoined || ""} onChange={onChange} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="dateEnded" style={labelStyle}>Membership End Date</label>
              <input name="dateEnded" id="dateEnded" type="date" value={formData.dateEnded || ""} onChange={onChange} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="applicationDate" style={labelStyle}>Application Date</label>
              <input name="applicationDate" id="applicationDate" type="date" value={formData.applicationDate || ""} onChange={onChange} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="approvalDate" style={labelStyle}>Date Approved</label>
              <input name="approvalDate" id="approvalDate" type="date" value={formData.approvalDate || ""} onChange={onChange} style={inputStyle} />
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
              <input name="proposalDate" id="proposalDate" type="date" value={formData.proposalDate || ""} onChange={onChange} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Roles & Fiscal Year Card */}
        <div style={{ 
          padding: '36px', 
          background: '#f0fdfa', 
          borderRadius: '12px', 
          boxShadow: '0 2px 12px rgba(20,184,166,0.08)', 
          border: '2px solid #5eead4',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            marginBottom: '28px', 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#0f766e' 
          }}>
            👔 Roles & Fiscal Year
          </h2>
          {(formData.roleFiscalYears && formData.roleFiscalYears.length > 0 ? formData.roleFiscalYears : [{ role: "", fiscalYear: "" }]).map((rf, idx) => (
            <div key={idx} style={{ 
              padding: '24px', 
              marginBottom: '20px', 
              background: 'white', 
              borderRadius: '10px', 
              border: '2px solid #ccfbf1' 
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
                disabled={formData.roleFiscalYears.length === 1}
                style={{
                  padding: '12px 20px',
                  background: formData.roleFiscalYears.length === 1 ? '#f3f4f6' : 'white',
                  color: formData.roleFiscalYears.length === 1 ? '#9ca3af' : '#dc2626',
                  border: '2px solid',
                  borderColor: formData.roleFiscalYears.length === 1 ? '#d1d5db' : '#dc2626',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: formData.roleFiscalYears.length === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                🗑️ Remove
              </button>
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => onChange({ target: { name: "roleFiscalYears", value: [...(formData.roleFiscalYears || [{ role: "", fiscalYear: "" }]), { role: "", fiscalYear: "" }] } })}
            style={{
              padding: '14px 24px',
              background: '#14b8a6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              marginTop: '12px'
            }}
          >
            ➕ Add Another Role/Fiscal Year
          </button>
        </div>

        {/* Volunteering Interests Card - Internal Info (Private/Admin only) */}
        <div style={{ 
          padding: '36px', 
          background: '#f0fdfa', 
          borderRadius: '12px', 
          boxShadow: '0 2px 12px rgba(20,184,166,0.08)', 
          border: '2px solid #5eead4' 
        }}>
          <h2 style={{ 
            marginBottom: '28px', 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#0f766e' 
          }}>
            🤝 Volunteering Interests
          </h2>
          <p style={{ 
            marginBottom: '20px', 
            fontSize: '14px', 
            color: '#64748b',
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
          padding: '36px', 
          background: '#f0fdfa', 
          borderRadius: '12px', 
          boxShadow: '0 2px 12px rgba(20,184,166,0.08)', 
          border: '2px solid #5eead4' 
        }}>
          <h2 style={{ 
            marginBottom: '28px', 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#0f766e' 
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
                    background: formData.photo ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                    borderStyle: 'dashed',
                    borderWidth: '2px',
                    borderColor: formData.photo ? '#059669' : '#14b8a6',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#0f766e',
                    transition: 'all 0.2s',
                    height: '100%',
                    minHeight: '54px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = formData.photo ? 'linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%)' : 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)';
                    e.currentTarget.style.borderColor = '#0f766e';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = formData.photo ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)';
                    e.currentTarget.style.borderColor = formData.photo ? '#059669' : '#14b8a6';
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
                    style={{
                      padding: '14px 20px',
                      background: 'white',
                      color: '#dc2626',
                      border: '2px solid #dc2626',
                      borderRadius: '10px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#dc2626';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#dc2626';
                    }}
                  >
                    🗑️ Remove
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* Error/Success/Submit */}
          {error && (
            <div style={{
              marginTop: '24px',
              padding: '18px',
              background: '#fef2f2',
              border: '2px solid #fecaca',
              borderRadius: '10px',
              color: '#dc2626',
              fontSize: '17px',
              fontWeight: '600'
            }}>
              ❌ {error}
            </div>
          )}
          {success && (
            <div style={{
              marginTop: '24px',
              padding: '18px',
              background: '#f0fdf4',
              border: '2px solid #bbf7d0',
              borderRadius: '10px',
              color: '#166534',
              fontSize: '17px',
              fontWeight: '600'
            }}>
              ✅ {success}
            </div>
          )}
          <div style={{ marginTop: '32px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button 
              type="submit" 
              disabled={isLoading} 
              aria-label="Submit Member Form"
              style={{
                background: isLoading ? '#94a3b8' : '#14b8a6',
                color: 'white',
                border: '2px solid ' + (isLoading ? '#94a3b8' : '#0f766e'),
                padding: '18px 32px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '200px'
              }}
            >
              {isLoading ? '⏳ Saving...' : submitLabel}
            </button>
            <button 
              type="button" 
              onClick={() => window.history.back()} 
              aria-label="Cancel"
              style={{
                background: '#ffffff',
                color: '#64748b',
                border: '2px solid #e2e8f0',
                padding: '18px 32px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '150px'
              }}
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      </div>
  </form>
  );
}
