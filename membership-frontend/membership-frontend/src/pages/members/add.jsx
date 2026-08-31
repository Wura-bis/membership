import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../components/mainlayout";
import MemberForm from "../../components/memberform";
import { useAuth } from "../../hooks/useauth";
import { useToast } from "../../components/toast";
import { API_BASE_URL } from '../../utils/api';
import { T, card, btn, pageHeader } from '../../utils/theme';

export default function AddMember() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  if (!user || user.role !== "admin") {
    return (
      <MainLayout>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <h1 style={{ color: T.red, marginBottom: '16px' }}>Access Denied</h1>
          <p>You must be an administrator to add new members.</p>
          <button onClick={() => navigate("/members")} style={{ ...btn.primary, marginTop: '16px' }}>
            ← Back to Members
          </button>
        </div>
      </MainLayout>
    );
  }

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", dateOfBirth: "", placeOfBirth: "", occupationId: "",
    irishConnections: [{ type: "", countyId: "", surnameId: "" }],
    email: "bisofpeilibrary@gmail.com",
    phoneNumbers: [{ type: "", number: "", isPreferred: true }],
    addresses: [{ street: "", city: "", province: "", country: "", postalCode: "", isCurrent: true }],
    otherSocieties: [], memberCategoryId: "", dateJoined: "", dateEnded: "",
    applicationDate: "", approvalDate: "", approvedBy: "", signedBy: "",
    proposer: "", seconder: "", proposalDate: "",
    roleFiscalYears: [{ role: "", fiscalYear: "" }],
    volunteeringInterests: [], notes: "", isActive: true, photo: null
  });
  const [lookups, setLookups] = useState({ counties: [], categories: [], roles: [], fiscalYears: [], societies: [], connections: [], occupations: [], volunteeringInterests: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dobTouched, setDobTouched] = useState(false);

  useEffect(() => {
    const watch = async () => {
      const LIBRARY_EMAIL = 'bisofpeilibrary@gmail.com';
      const first = (formData.firstName || '').trim();
      const last = (formData.lastName || '').trim();
      const rawEmail = (formData.email || '').trim();
      const email = rawEmail && rawEmail !== LIBRARY_EMAIL ? rawEmail : '';
      const phone = (formData.phoneNumbers?.[0]?.number || '').trim();
      const dob = (formData.dateOfBirth || '').trim();
      if (!first || !last || (!email && !phone && !dob)) return;
      const qs = new URLSearchParams();
      qs.set('firstName', first); qs.set('lastName', last);
      if (email) qs.set('email', email);
      if (phone) qs.set('phone', phone);
      if (dob) qs.set('dateOfBirth', dob);
      try {
        const res = await fetch(`${API_BASE_URL}/api/members/lookup?` + qs.toString(), { credentials: 'include' });
        if (!res.ok) return;
        const matches = await res.json();
        if (Array.isArray(matches) && matches.length > 0) {
          const names = matches.map(m => `${m.firstName} ${m.lastName} (${m.email || m.phoneNumber || m.dateOfBirth || 'no contact'})`).slice(0, 5).join('\n');
          const go = window.confirm(`Possible existing member(s) found:\n\n${names}\n\nOpen the first match instead of creating a duplicate?`);
          if (go) {
            const id = matches[0].id || matches[0].memberID || matches[0].MemberID;
            if (id) navigate(`/members/${id}`);
          }
        }
      } catch (e) {}
    };
    const t = setTimeout(watch, 650);
    return () => clearTimeout(t);
  }, [formData.firstName, formData.lastName, formData.email, formData.phoneNumbers?.[0]?.number, formData.dateOfBirth]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/lookups`, { credentials: "include" })
      .then(res => res.json())
      .then(setLookups)
      .catch(() => setError("Failed to load form data"));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let mappedName = name;
    if (name === "county") mappedName = "countyId";
    if (name === "surname") mappedName = "surnameId";
    if (name === "irishConnection") mappedName = "irishConnectionId";
    setFormData(prev => ({ ...prev, [mappedName]: type === "checkbox" ? checked : value }));
    if (mappedName === "dateOfBirth") setDobTouched(true);
  };

  const handleAddressChange = (index, field, value) => {
    const updated = [...formData.addresses];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, addresses: updated }));
  };

  const addAddress = () => {
    setFormData(prev => ({
      ...prev,
      addresses: [...prev.addresses, { street: "", city: "", province: "", country: "", postalCode: "", isCurrent: false, fiscalYear: "" }]
    }));
  };

  const removeAddress = (index) => {
    if (formData.addresses.length > 1) {
      setFormData(prev => ({ ...prev, addresses: prev.addresses.filter((_, i) => i !== index) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const incompleteRoles = (formData.roleFiscalYears || []).filter(rf => {
      const hasRole = rf.role !== "" && rf.role != null;
      const hasFY = rf.fiscalYear !== "" && rf.fiscalYear != null;
      return (hasRole && !hasFY) || (!hasRole && hasFY);
    });
    if (incompleteRoles.length > 0) {
      showToast("Some role entries are incomplete — both a role and fiscal year are required.", "warning", 6000);
    }
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      if (!isNaN(dob.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const mo = today.getMonth() - dob.getMonth();
        if (mo < 0 || (mo === 0 && today.getDate() < dob.getDate())) age--;
        if (age < 18) { showToast("Member must be at least 18 years old.", "error"); return; }
      }
    }
    setIsLoading(true);
    try {
      const toNull = v => v === "" ? null : v;
      const toInt = v => (v === "" || v == null) ? null : parseInt(v, 10);
      const toBool = v => v === true || v === "true" || v === 1;
      const cleanData = {
        ...formData,
        memberCategoryId: toInt(formData.memberCategoryId),
        countyId: toInt(formData.countyId),
        surnameId: toInt(formData.surnameId),
        occupationId: toInt(formData.occupationId),
        isActive: toBool(formData.isActive),
        dateOfBirth: toNull(formData.dateOfBirth),
        dateJoined: toNull(formData.dateJoined),
        dateEnded: toNull(formData.dateEnded),
        applicationDate: toNull(formData.applicationDate),
        approvalDate: toNull(formData.approvalDate),
        proposalDate: toNull(formData.proposalDate),
      };
      const { photo, ...jsonData } = cleanData;
      const res = await fetch(`${API_BASE_URL}/api/members`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(jsonData), credentials: "include" });
      if (res.ok) {
        const result = await res.json();
        if (photo) {
          const photoForm = new FormData();
          photoForm.append("file", photo);
          await fetch(`${API_BASE_URL}/api/members/${result.member_id}/photos`, { method: "POST", body: photoForm, credentials: "include" });
        }
        showToast("Member added successfully!", "success");
        setTimeout(() => navigate(`/members/${result.member_id}`), 1500);
      } else if (res.status === 409) {
        const errorData = await res.json();
        showToast(errorData.message || "A duplicate member already exists.", "warning", 8000);
      } else {
        const errorData = await res.json();
        showToast(errorData.message || "Failed to add member", "error");
      }
    } catch (err) {
      showToast("Error adding member: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLookup = async (type, value) => {
    try {
      let endpoint = '', payload = {};
      switch (type) {
        case 'fiscalYear': endpoint = '/api/lookups/fiscal-years'; payload = { yearLabel: value }; break;
        case 'category': endpoint = '/api/lookups/categories'; payload = { categoryName: value }; break;
        case 'role': endpoint = '/api/lookups/roles'; payload = { roleName: value }; break;
        case 'society': endpoint = '/api/lookups/societies'; payload = { societyName: value }; break;
        case 'otherSocieties': endpoint = '/api/lookups/societies'; payload = { societyName: value }; break;
        case 'occupation': endpoint = '/api/lookups/occupations'; payload = { occupationName: value }; break;
        case 'surname': endpoint = '/api/lookups/surnames'; payload = { surname: value }; break;
        default: return { value, label: value };
      }
      const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include' });
      const result = await response.json();
      if (response.ok) {
        if (type === 'otherSocieties') {
          const newItem = { id: result.id, name: value, label: value, value: value };
          setLookups(prev => ({ ...prev, societies: [...(prev.societies || []), newItem] }));
          return newItem;
        }
        const newItem = { id: result.id, name: value, label: value, value: result.id };
        const lookupKey = type === 'fiscalYear' ? 'fiscalYears' : type === 'occupation' ? 'occupations' : type === 'surname' ? 'surnames' : type + 's';
        setLookups(prev => ({ ...prev, [lookupKey]: [...(prev[lookupKey] || []), newItem] }));
        return newItem;
      } else {
        if (response.status === 409) {
          if (type === 'otherSocieties') {
            const existing = (lookups.societies || []).find(item => item.name === value || item.label === value);
            if (existing) return { value: existing.label || existing.name, label: existing.label || existing.name };
          } else {
            const lookupKey = type === 'fiscalYear' ? 'fiscalYears' : type === 'occupation' ? 'occupations' : type === 'surname' ? 'surnames' : type + 's';
            const existingItem = (lookups[lookupKey] || []).find(item => item.name === value || item.label === value);
            if (existingItem) return existingItem;
          }
        }
        if (response.status !== 409) setError(`Failed to create ${type}: ${result.error}`);
        return { value, label: value };
      }
    } catch (error) {
      setError(`Error creating ${type}: ${error.message}`);
      return { value, label: value };
    }
  };

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={pageHeader.wrapper}>
            <div>
              <h1 style={pageHeader.title}>Add New Member</h1>
              <p style={pageHeader.subtitle}>Create a new member record in the database</p>
            </div>
          </div>
          <div style={{ ...card, padding: '24px', marginTop: '24px' }}>
            <MemberForm
              formData={formData}
              lookups={lookups}
              onChange={handleChange}
              onAddressChange={handleAddressChange}
              addAddress={addAddress}
              removeAddress={removeAddress}
              isLoading={isLoading}
              error={error}
              success={success}
              onSubmit={handleSubmit}
              submitLabel="Add Member"
              onCreateLookup={handleCreateLookup}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}