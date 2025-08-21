import React from "react";
import CreatableSelect from "./creatableselect.jsx";

export default function MemberForm({ formData, lookups, onChange, onAddressChange, addAddress, removeAddress, isLoading, error, success, onSubmit, submitLabel, onCreateLookup }) {
  return (
    <form onSubmit={onSubmit} aria-label="Member Form">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Personal Information Card */}
        <div className="dashboard-card" style={{ padding: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(20,184,166,0.06)', border: '1px solid #e5e7eb' }}>
          <h2 className="dashboard-card-title" style={{ marginBottom: '16px', fontSize: '1.25rem', fontWeight: '600', color: '#14b8a6' }}>Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label htmlFor="firstName">First Name</label><input name="firstName" id="firstName" value={formData.firstName || ""} onChange={onChange} className="form-input" /></div>
            <div><label htmlFor="lastName">Last Name</label><input name="lastName" id="lastName" value={formData.lastName || ""} onChange={onChange} className="form-input" /></div>
            <div><label htmlFor="dateOfBirth">Date of Birth</label><input name="dateOfBirth" id="dateOfBirth" value={formData.dateOfBirth || ""} onChange={onChange} className="form-input" type="date" /></div>
            <div><label htmlFor="placeOfBirth">Place of Birth</label><input name="placeOfBirth" id="placeOfBirth" value={formData.placeOfBirth || ""} onChange={onChange} className="form-input" /></div>
            <div><label htmlFor="occupationId">Occupation</label><CreatableSelect label="" name="occupationId" value={formData.occupationId || ""} options={lookups.occupations || []} onChange={onChange} onCreate={val => onCreateLookup('occupation', val)} placeholder="Type or select..." /></div>
          </div>
        </div>

        {/* Irish Connections Card */}
        <div className="dashboard-card" style={{ padding: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(20,184,166,0.06)', border: '1px solid #e5e7eb' }}>
          <h2 className="dashboard-card-title" style={{ marginBottom: '16px', fontSize: '1.25rem', fontWeight: '600', color: '#14b8a6' }}>Irish Connections</h2>
          {(formData.irishConnections || [{ type: "", countyId: "", surnameId: "" }]).map((ic, idx) => (
            <div key={idx} className="border p-4 mb-4 rounded">
              <div className="grid grid-cols-3 gap-4 mb-2">
                <div>
                  <label htmlFor={`irishConnections-type-${idx}`}>Irish Connection Type</label>
                  <select 
                    id={`irishConnections-type-${idx}`}
                    name={`irishConnections[${idx}].type`}
                    value={ic.type || ""}
                    onChange={e => {
                      const arr = [...(formData.irishConnections || [])];
                      arr[idx] = { ...arr[idx], type: e.target.value };
                      onChange({ target: { name: "irishConnections", value: arr } });
                    }}
                    className="form-input"
                  >
                    <option value="">Select Connection Type</option>
                    <option value="Paternal">Paternal</option>
                    <option value="Maternal">Maternal</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`irishConnections-county-${idx}`}>County Name</label>
                  <select 
                    id={`irishConnections-county-${idx}`}
                    name={`irishConnections[${idx}].countyId`}
                    value={ic.countyId || ""}
                    onChange={e => {
                      const arr = [...(formData.irishConnections || [])];
                      arr[idx] = { ...arr[idx], countyId: e.target.value };
                      onChange({ target: { name: "irishConnections", value: arr } });
                    }}
                    className="form-input"
                  >
                    <option value="">Select County</option>
                    {lookups.counties && lookups.counties.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor={`irishConnections-surname-${idx}`}>Surname</label>
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
                className="text-red-600"
                aria-label={`Delete Irish Connection ${idx + 1}`}
                onClick={() => {
                  const arr = [...(formData.irishConnections || [])];
                  arr.splice(idx, 1);
                  onChange({ target: { name: "irishConnections", value: arr } });
                }}
                disabled={formData.irishConnections.length === 1}
              >Remove Irish Connection</button>
            </div>
          ))}
          <button type="button" className="text-blue-600 mt-2" onClick={() => onChange({ target: { name: "irishConnections", value: [...(formData.irishConnections || [{ type: "", countyId: "", surnameId: "" }]), { type: "", countyId: "", surnameId: "" }] } })}>+ Add another Irish Connection</button>
        </div>

        {/* Contact Information Card */}
        <div className="dashboard-card" style={{ padding: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(20,184,166,0.06)', border: '1px solid #e5e7eb' }}>
          <h2 className="dashboard-card-title" style={{ marginBottom: '16px', fontSize: '1.25rem', fontWeight: '600', color: '#14b8a6' }}>Contact Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label htmlFor="email">Email</label><input name="email" id="email" value={formData.email || ""} onChange={onChange} className="form-input" type="email" /></div>
            <div><label htmlFor="phoneNumber">Phone Number</label><input name="phoneNumber" id="phoneNumber" value={formData.phoneNumber || ""} onChange={onChange} className="form-input" /></div>
          </div>
        </div>

        {/* Address Information Card */}
        <div className="dashboard-card" style={{ padding: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(20,184,166,0.06)', border: '1px solid #e5e7eb' }}>
          <h2 className="dashboard-card-title" style={{ marginBottom: '16px', fontSize: '1.25rem', fontWeight: '600', color: '#14b8a6' }}>Address Information</h2>
          {/* Dynamic Province/State options based on country */}
          {(formData.addresses && formData.addresses.length > 0 ? formData.addresses : [{
            street: "", addressLine2: "", city: "", province: "", country: "", postalCode: "", dateInResidence: "", isCurrent: true
          }]).map((addr, idx) => {
            const getProvinceOptions = (country) => {
              switch (country) {
                case "Canada":
                  return [
                    "Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba", "Nova Scotia", "New Brunswick", "Newfoundland and Labrador", "Prince Edward Island", "Saskatchewan", "Northwest Territories", "Yukon", "Nunavut"
                  ];
                case "United States":
                  return [
                    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
                  ];
                case "Ireland":
                  return [
                    "Leinster", "Munster", "Connacht", "Ulster"
                  ];
                case "United Kingdom":
                  return [
                    "England", "Scotland", "Wales", "Northern Ireland"
                  ];
                default:
                  return ["Other"];
              }
            };
            return (
              <div key={idx} className="grid grid-cols-3 gap-2 mb-2">
                <div>
                  <label>Address Line 1</label>
                  <input value={addr.street} onChange={e => onAddressChange(idx, "street", e.target.value)} placeholder="Address Line 1" className="form-input" aria-label="Address Line 1" />
                </div>
                <div>
                  <label>Address Line 2</label>
                  <input value={addr.addressLine2} onChange={e => onAddressChange(idx, "addressLine2", e.target.value)} placeholder="Address Line 2" className="form-input" aria-label="Address Line 2" />
                </div>
                <div>
                  <label>City/Town</label>
                  <input value={addr.city} onChange={e => onAddressChange(idx, "city", e.target.value)} placeholder="City/Town" className="form-input" aria-label="City/Town" />
                </div>
                <div>
                  <label>Province/State</label>
                  <select value={addr.province} onChange={e => onAddressChange(idx, "province", e.target.value)} className="form-input" aria-label="Province/State">
                    <option value="">Province/State</option>
                    {getProvinceOptions(addr.country).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Country</label>
                  <select value={addr.country} onChange={e => onAddressChange(idx, "country", e.target.value)} className="form-input" aria-label="Country">
                    <option value="">Country</option>
                    <option value="Canada">Canada</option>
                    <option value="United States">United States</option>
                    <option value="Ireland">Ireland</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label>Postal Code</label>
                  <input value={addr.postalCode} onChange={e => onAddressChange(idx, "postalCode", e.target.value)} placeholder="Postal Code" className="form-input" aria-label="Postal Code" />
                </div>
                <div>
                  <label>Date in Residence</label>
                  <input type="date" value={addr.dateInResidence} onChange={e => onAddressChange(idx, "dateInResidence", e.target.value)} className="form-input" aria-label="Date in Residence" placeholder="Date in Residence" />
                </div>
                <div className="flex items-center mt-6">
                  <input type="checkbox" checked={addr.isCurrent} onChange={e => onAddressChange(idx, "isCurrent", e.target.checked)} aria-label="Current Address" />
                  <span className="ml-2">Current Address</span>
                </div>
                <div className="flex items-center mt-6">
                  <button type="button" onClick={() => removeAddress(idx)} className="text-red-600 ml-2">Delete Address</button>
                </div>
              </div>
            );
          })}
          <button type="button" onClick={addAddress} className="text-blue-600 mt-2">+ Add another Address</button>
        </div>

        {/* Membership Details Card */}
        <div className="dashboard-card" style={{ padding: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(20,184,166,0.06)', border: '1px solid #e5e7eb' }}>
          <h2 className="dashboard-card-title" style={{ marginBottom: '16px', fontSize: '1.25rem', fontWeight: '600', color: '#14b8a6' }}>Membership Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label htmlFor="otherSocieties">Other Societies Affiliated With</label><CreatableSelect label="" name="otherSocieties" value={formData.otherSocieties || ""} options={lookups.otherSocieties || []} onChange={onChange} onCreate={val => onCreateLookup('otherSocieties', val)} placeholder="Type or select..." /></div>
            <div><label htmlFor="categoryId">Member Category</label>
              <select name="categoryId" id="categoryId" value={formData.categoryId || ""} onChange={onChange} className="form-input">
                <option value="">Select Category</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Deceased">Deceased</option>
              </select>
            </div>
            <div><label htmlFor="dateJoined">Membership Start Date</label><input name="dateJoined" id="dateJoined" type="date" value={formData.dateJoined || ""} onChange={onChange} className="form-input" /></div>
            <div><label htmlFor="dateEnded">Membership End Date</label><input name="dateEnded" id="dateEnded" type="date" value={formData.dateEnded || ""} onChange={onChange} className="form-input" /></div>
            <div><label htmlFor="applicationDate">Application Date</label><input name="applicationDate" id="applicationDate" type="date" value={formData.applicationDate || ""} onChange={onChange} className="form-input" /></div>
            <div><label htmlFor="approvalDate">Date Approved</label><input name="approvalDate" id="approvalDate" type="date" value={formData.approvalDate || ""} onChange={onChange} className="form-input" /></div>
            <div><label htmlFor="approvedBy">Approved By</label><input name="approvedBy" id="approvedBy" value={formData.approvedBy || ""} onChange={onChange} className="form-input" /></div>
            <div><label htmlFor="signedBy">Signed By</label><input name="signedBy" id="signedBy" value={formData.signedBy || ""} onChange={onChange} className="form-input" /></div>
            <div><label htmlFor="proposer">Proposer</label><input name="proposer" id="proposer" value={formData.proposer || ""} onChange={onChange} className="form-input" /></div>
            <div><label htmlFor="seconder">Seconder(s)</label><input name="seconder" id="seconder" value={formData.seconder || ""} onChange={onChange} className="form-input" /></div>
            <div><label htmlFor="proposalDate">Proposal Date</label><input name="proposalDate" id="proposalDate" type="date" value={formData.proposalDate || ""} onChange={onChange} className="form-input" /></div>
          </div>
        </div>

        {/* Roles & Fiscal Year Card */}
        <div className="dashboard-card" style={{ padding: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(20,184,166,0.06)', border: '1px solid #e5e7eb' }}>
          <h2 className="dashboard-card-title" style={{ marginBottom: '16px', fontSize: '1.25rem', fontWeight: '600', color: '#14b8a6' }}>Roles & Fiscal Year</h2>
          {(formData.roleFiscalYears && formData.roleFiscalYears.length > 0 ? formData.roleFiscalYears : [{ role: "", fiscalYear: "" }]).map((rf, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-4 mb-2">
              <div>
                <label htmlFor={`roleFiscalYears-role-${idx}`}>Role</label>
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
                <label htmlFor={`roleFiscalYears-fiscalYear-${idx}`}>Fiscal Year</label>
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
              <button
                type="button"
                className="text-red-600"
                aria-label={`Delete Role/Fiscal Year ${idx + 1}`}
                onClick={() => {
                  const arr = [...(formData.roleFiscalYears || [])];
                  arr.splice(idx, 1);
                  onChange({ target: { name: "roleFiscalYears", value: arr } });
                }}
                disabled={formData.roleFiscalYears.length === 1}
              >Remove</button>
            </div>
          ))}
          <button type="button" className="text-blue-600 mt-2" onClick={() => onChange({ target: { name: "roleFiscalYears", value: [...(formData.roleFiscalYears || [{ role: "", fiscalYear: "" }]), { role: "", fiscalYear: "" }] } })}>+ Add another Role/Fiscal Year</button>
        </div>

        {/* Notes, IsActive, Photo Upload, Submit Card */}
        <div className="dashboard-card" style={{ padding: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(20,184,166,0.06)', border: '1px solid #e5e7eb' }}>
          <h2 className="dashboard-card-title" style={{ marginBottom: '16px', fontSize: '1.25rem', fontWeight: '600', color: '#14b8a6' }}>Other Details</h2>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div><label htmlFor="notes">Notes</label><textarea name="notes" id="notes" value={formData.notes || ""} onChange={onChange} className="form-input" /></div>
            <div><label htmlFor="isActive">Is Active</label><input name="isActive" id="isActive" type="checkbox" checked={!!formData.isActive} onChange={e => onChange({ target: { name: 'isActive', value: e.target.checked } })} className="form-checkbox" /></div>
            <div><label htmlFor="photo">Photo</label><input name="photo" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => onChange({ target: { name: "photo", value: e.target.files[0] } })} className="form-input" aria-label="Photo Upload" /></div>
          </div>
          {/* Error/Success/Submit */}
          {error && <div className="alert alert-error" style={{ marginBottom: '24px' }}>{error}</div>}
          {success && <div className="alert alert-success" style={{ marginBottom: '24px' }}>{success}</div>}
          <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={isLoading} 
              aria-label="Submit Member Form"
            >
              {submitLabel}
            </button>
            <button type="button" className="btn-secondary" onClick={() => window.history.back()} aria-label="Cancel">Cancel</button>
          </div>
        </div>
      </div>
  </form>
  );
}
