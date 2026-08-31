import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../../components/mainlayout";
import MemberForm from "../../components/memberform";
import { useAuth } from "../../hooks/useauth";
import { useToast } from "../../components/toast";
import { API_BASE_URL } from '../../utils/api';
import { T, card, btn, pageHeader } from '../../utils/theme';

export default function EditMember() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", dateOfBirth: "", placeOfBirth: "", occupationId: "",
    irishConnections: [{ type: "", countyId: "", surnameId: "" }],
    email: "",
    phoneNumbers: [{ type: "", number: "", isPreferred: false }],
    addresses: [{ street: "", city: "", province: "", country: "", postalCode: "", isCurrent: true }],
    otherSocieties: [], memberCategoryId: "", dateJoined: "", dateEnded: "",
    applicationDate: "", approvalDate: "", approvedBy: "", signedBy: "",
    proposer: "", seconder: "", proposalDate: "",
    roleFiscalYears: [{ role: "", fiscalYear: "" }],
    volunteeringInterests: [], notes: "", isActive: true, photo: null
  });
  const [lookups, setLookups] = useState({ counties: [], categories: [], roles: [], fiscalYears: [], societies: [], connections: [], occupations: [], volunteeringInterests: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [draftData, setDraftData] = useState(null);
  const [hasUserEdited, setHasUserEdited] = useState(false);

  const formDataRef = useRef(formData);
  const hasUserEditedRef = useRef(false);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    fetch(`${API_BASE_URL}/api/members/${id}`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        const safe = {
          firstName: data.firstName ?? "", lastName: data.lastName ?? "",
          dateOfBirth: data.dateOfBirth ?? "", placeOfBirth: data.placeOfBirth ?? "",
          occupationId: data.occupationID ?? "",
          email: data.email || "bisofpeilibrary@gmail.com",
          phoneNumbers: Array.isArray(data.phoneNumbers) && data.phoneNumbers.length > 0
            ? data.phoneNumbers.map((p, i) => ({ type: p.type ?? "", number: p.number ?? "", isPreferred: typeof p.isPreferred === "boolean" ? p.isPreferred : i === 0 }))
            : [{ type: "", number: "", isPreferred: true }],
          cellPhone: "",
          irishConnections: Array.isArray(data.irishConnections) && data.irishConnections.length > 0
            ? data.irishConnections.map(ic => ({ type: ic.type ?? "", countyId: ic.countyId ?? "", surnameId: ic.surnameId ?? "" }))
            : [{ type: "", countyId: "", surnameId: "" }],
          addresses: Array.isArray(data.addresses) && data.addresses.length > 0
            ? data.addresses.map(a => ({ street: a.street ?? "", city: a.city ?? "", province: a.province ?? "", country: a.country ?? "", postalCode: a.postalCode ?? "", isCurrent: typeof a.isCurrent === "boolean" ? a.isCurrent : false }))
            : [{ street: "", city: "", province: "", country: "", postalCode: "", isCurrent: false }],
          otherSocieties: data.otherSocieties ? data.otherSocieties.split(',').map(s => s.trim()).filter(Boolean) : [],
          memberCategoryId: data.memberCategoryID ?? "", dateJoined: data.dateJoined ?? "",
          dateEnded: data.dateEnded ?? "", applicationDate: data.applicationDate ?? "",
          approvalDate: data.approvalDate ?? "", approvedBy: data.approvedBy ?? "",
          signedBy: data.signedBy ?? "", proposer: data.proposer ?? "",
          seconder: data.seconder ?? "", proposalDate: data.proposalDate ?? "",
          roleFiscalYears: Array.isArray(data.roleFiscalYears) && data.roleFiscalYears.length > 0
            ? data.roleFiscalYears.map(rf => ({ role: rf.roleID ? rf.roleID.toString() : "", fiscalYear: rf.fiscalYearID ? rf.fiscalYearID.toString() : "" }))
            : [{ role: "", fiscalYear: "" }],
          volunteeringInterests: Array.isArray(data.volunteeringInterests) ? data.volunteeringInterests : [],
          notes: data.notes ?? "", isActive: typeof data.isActive === "boolean" ? data.isActive : true, photo: null
        };
        setFormData(safe);
        setIsLoading(false);
      })
      .catch(() => { setError("Failed to load member"); setIsLoading(false); });

    fetch(`${API_BASE_URL}/api/lookups`, { credentials: "include" })
      .then(res => res.json())
      .then(setLookups)
      .catch(() => setError("Failed to load lookup data"));
  }, [id, user?.role]);

  useEffect(() => {
    if (!id) return;
    try {
      const rawDraft = localStorage.getItem(`draft_member_${id}`);
      if (rawDraft) {
        const { data: savedData, savedAt } = JSON.parse(rawDraft);
        setDraftData(savedData); setDraftSavedAt(savedAt); setHasDraft(true);
      }
    } catch (_) {}
  }, [id]);

  useEffect(() => {
    if (!hasUserEdited || !id) return;
    const timer = setTimeout(() => {
      try { localStorage.setItem(`draft_member_${id}`, JSON.stringify({ data: formData, savedAt: new Date().toISOString() })); } catch (_) {}
    }, 2000);
    return () => clearTimeout(timer);
  }, [formData, hasUserEdited, id]);

  useEffect(() => { formDataRef.current = formData; }, [formData]);
  useEffect(() => { hasUserEditedRef.current = hasUserEdited; }, [hasUserEdited]);

  useEffect(() => {
    return () => {
      if (hasUserEditedRef.current && id) {
        try { localStorage.setItem(`draft_member_${id}`, JSON.stringify({ data: formDataRef.current, savedAt: new Date().toISOString() })); } catch (_) {}
      }
    };
  }, [id]);

  const handleChange = (e) => {
    if (!hasUserEdited) setHasUserEdited(true);
    const { name, value, type, checked } = e.target;
    const arrayFields = { phoneNumbers: p => ({ type: p.type ?? "", number: p.number ?? "", isPreferred: typeof p.isPreferred === "boolean" ? p.isPreferred : false }),
      irishConnections: ic => ({ type: ic.type ?? "", countyId: ic.countyId ?? "", surnameId: ic.surnameId ?? "" }),
      addresses: a => ({ street: a.street ?? "", city: a.city ?? "", province: a.province ?? "", country: a.country ?? "", postalCode: a.postalCode ?? "", isCurrent: typeof a.isCurrent === "boolean" ? a.isCurrent : false }),
      roleFiscalYears: rf => ({ role: rf.role ?? "", fiscalYear: rf.fiscalYear ?? "" })
    };
    if (arrayFields[name]) {
      const arr = Array.isArray(value) ? value : [];
      setFormData(prev => ({ ...prev, [name]: arr.map(arrayFields[name]) }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleAddressChange = (index, field, value) => {
    if (!hasUserEdited) setHasUserEdited(true);
    setFormData(prev => ({ ...prev, addresses: prev.addresses.map((a, i) => i === index ? { ...a, [field]: value } : a) }));
  };

  const addAddress = () => {
    if (!hasUserEdited) setHasUserEdited(true);
    setFormData(prev => ({ ...prev, addresses: [...prev.addresses, { street: "", city: "", province: "", country: "", postalCode: "", isCurrent: false, fiscalYear: "" }] }));
  };

  const removeAddress = (index) => {
    if (!hasUserEdited) setHasUserEdited(true);
    if (formData.addresses.length > 1) {
      setFormData(prev => ({ ...prev, addresses: prev.addresses.filter((_, i) => i !== index) }));
    }
  };

  const restoreDraft = () => { if (draftData) { setFormData(draftData); setHasUserEdited(true); } setHasDraft(false); };
  const discardDraft = () => { try { localStorage.removeItem(`draft_member_${id}`); } catch (_) {} setHasDraft(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const incompleteRoles = (formData.roleFiscalYears || []).filter(rf => {
      const hasRole = rf.role !== "" && rf.role != null;
      const hasFY = rf.fiscalYear !== "" && rf.fiscalYear != null;
      return (hasRole && !hasFY) || (!hasRole && hasFY);
    });
    if (incompleteRoles.length > 0) showToast("Some role entries are incomplete — both a role and fiscal year are required.", "warning", 6000);
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
      const { photo, ...jsonData } = formData;
      if (jsonData.roleFiscalYears?.length > 0) {
        jsonData.roleFiscalYears = jsonData.roleFiscalYears.map(item => ({ roleID: parseInt(item.role), fiscalYearID: parseInt(item.fiscalYear) }));
      }
      const res = await fetch(`${API_BASE_URL}/api/members/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(jsonData), credentials: "include" });
      if (res.ok) {
        if (photo) {
          const photoForm = new FormData();
          photoForm.append("file", photo);
          await fetch(`${API_BASE_URL}/api/members/${id}/photos`, { method: "POST", body: photoForm, credentials: "include" });
        }
        setSuccess("Member updated successfully!");
        try { localStorage.removeItem(`draft_member_${id}`); } catch (_) {}
        setHasUserEdited(false);
        setTimeout(() => navigate(`/members/${id}`, { replace: true }), 1500);
      } else if (res.status === 401) {
        setError("Your session has expired. Open a new tab, log in again, then come back here and click Save — your changes are still on this page.");
      } else {
        const errorData = await res.json();
        setError(errorData.message || errorData.error || "Failed to update member");
      }
    } catch (err) {
      setError("Error updating member: " + err.message);
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

  if (!user || user.role !== "admin") {
    return (
      <MainLayout>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <h1 style={{ color: T.red, marginBottom: '16px' }}>Access Denied</h1>
          <p>You must be an administrator to edit member information.</p>
          <button onClick={() => navigate("/members")} style={{ ...btn.primary, marginTop: '16px' }}>
            ← Back to Members
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={pageHeader.wrapper}>
            <div>
              <h1 style={pageHeader.title}>Edit Member</h1>
              <p style={pageHeader.subtitle}>Update member information and records</p>
            </div>
          </div>
          <div style={{ ...card, padding: '24px', marginTop: '24px' }}>
            {hasDraft && (
              <div style={{ background: T.amberLight, border: `2px solid ${T.amberBorder}`, borderRadius: T.radiusMd, padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <strong style={{ color: T.amber }}>Unsaved draft found</strong>
                  {draftSavedAt && (
                    <span style={{ color: T.amber, marginLeft: '8px', fontSize: T.fontBase }}>
                      — last auto-saved {new Date(draftSavedAt).toLocaleString()}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={restoreDraft} style={btn.warning}>Restore my changes</button>
                  <button type="button" onClick={discardDraft} style={btn.ghost}>Discard</button>
                </div>
              </div>
            )}
            {error && <div role="alert" style={{ color: T.red, marginBottom: '16px', fontSize: T.fontBase }}>{error}</div>}
            {success && <div role="status" style={{ color: T.primaryLight, marginBottom: '16px', fontSize: T.fontBase }}>{success}</div>}
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
              submitLabel="Save Changes"
              onCreateLookup={handleCreateLookup}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}