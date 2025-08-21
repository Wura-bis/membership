import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../../components/mainlayout";
import MemberForm from "../../components/memberform";
import { useAuth } from "../../hooks/useauth";

export default function EditMember() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Admin access check
  if (!user || user.role !== "admin") {
    return (
      <MainLayout>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>Access Denied</h1>
          <p>You must be an administrator to edit member information.</p>
          <button 
            onClick={() => navigate("/members")}
            style={{
              background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            ← Back to Members
          </button>
        </div>
      </MainLayout>
    );
  }

    const [formData, setFormData] = useState({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      placeOfBirth: "",
      occupationId: "",
      irishConnections: [{ type: "", countyId: "", surnameId: "" }],
      email: "",
      phoneNumber: "",
      addresses: [{ street: "", addressLine2: "", city: "", province: "", country: "", postalCode: "", dateInResidence: "", isCurrent: true }],
      otherSocieties: "",
      categoryId: "",
      dateJoined: "",
      dateEnded: "",
      applicationDate: "",
      approvalDate: "",
      approvedBy: "",
      signedBy: "",
      proposer: "",
      seconder: "",
      proposalDate: "",
      roleFiscalYears: [{ role: "", fiscalYear: "" }],
      notes: "",
      isActive: true,
      photo: null
    });
  const [lookups, setLookups] = useState({ counties: [], categories: [], roles: [], fiscalYears: [], societies: [], connections: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5000/api/members/${id}`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        // Sanitize all fields to ensure controlled inputs
        const safe = {
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          dateOfBirth: data.dateOfBirth ?? "",
          placeOfBirth: data.placeOfBirth ?? "",
          occupationId: data.occupationID ?? "",
          email: data.email ?? "",
          phoneNumber: data.phoneNumber ?? "",
          cellPhone: "", // Not in DB
          irishConnections: Array.isArray(data.irishConnections) && data.irishConnections.length > 0
            ? data.irishConnections.map(ic => ({
                type: ic.type ?? "",
                countyId: ic.countyId ?? "",
                surnameId: ic.surnameId ?? ""
              }))
            : [{ type: "", countyId: "", surnameId: "" }],
          addresses: Array.isArray(data.addresses) && data.addresses.length > 0
            ? data.addresses.map(addr => ({
                street: addr.street ?? "",
                addressLine2: addr.addressLine2 ?? "",
                city: addr.city ?? "",
                province: addr.province ?? "",
                country: addr.country ?? "",
                postalCode: addr.postalCode ?? "",
                dateInResidence: addr.dateInResidence ?? "",
                isCurrent: typeof addr.isCurrent === "boolean" ? addr.isCurrent : true
              }))
            : [{ street: "", addressLine2: "", city: "", province: "", country: "", postalCode: "", dateInResidence: "", isCurrent: true }],
          otherSocieties: data.otherSocieties ?? "",
          categoryId: data.memberCategoryID ?? "",
          dateJoined: data.dateJoined ?? "",
          dateEnded: data.dateEnded ?? "",
          applicationDate: data.applicationDate ?? "",
          approvalDate: data.approvalDate ?? "",
          approvedBy: data.approvedBy ?? "",
          signedBy: data.signedBy ?? "",
          proposer: data.proposer ?? "",
          seconder: data.seconder ?? "",
          proposalDate: data.proposalDate ?? "",
          roleFiscalYears: Array.isArray(data.roleFiscalYears) && data.roleFiscalYears.length > 0
            ? data.roleFiscalYears.map(rf => ({
                role: rf.roleID ? rf.roleID.toString() : "",
                fiscalYear: rf.fiscalYearID ? rf.fiscalYearID.toString() : ""
              }))
            : [{ role: "", fiscalYear: "" }],
          notes: data.notes ?? "",
          isActive: typeof data.isActive === "boolean" ? data.isActive : true,
          photo: null
        };
        setFormData(safe);
        setIsLoading(false);
      })
      .catch(() => {
        setError("Failed to load member");
        setIsLoading(false);
      });

    fetch("http://localhost:5000/api/lookups", { credentials: "include" })
      .then(res => res.json())
      .then(setLookups)
      .catch(() => setError("Failed to load lookup data"));
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // For array fields, sanitize each item
    if (name === "irishConnections") {
      const arr = Array.isArray(value) ? value : [];
      setFormData(prev => ({
        ...prev,
        irishConnections: arr.map(ic => ({
          type: ic.type ?? "",
          countyId: ic.countyId ?? "",
          surnameId: ic.surnameId ?? ""
        }))
      }));
      return;
    }
    if (name === "addresses") {
      const arr = Array.isArray(value) ? value : [];
      setFormData(prev => ({
        ...prev,
        addresses: arr.map(addr => ({
          street: addr.street ?? "",
          addressLine2: addr.addressLine2 ?? "",
          city: addr.city ?? "",
          province: addr.province ?? "",
          country: addr.country ?? "",
          postalCode: addr.postalCode ?? "",
          dateInResidence: addr.dateInResidence ?? "",
          isCurrent: typeof addr.isCurrent === "boolean" ? addr.isCurrent : true
        }))
      }));
      return;
    }
    if (name === "roleFiscalYears") {
      const arr = Array.isArray(value) ? value : [];
      setFormData(prev => ({
        ...prev,
        roleFiscalYears: arr.map(rf => ({
          role: rf.role ?? "",
          fiscalYear: rf.fiscalYear ?? ""
        }))
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };
  const handleAddressChange = (index, field, value) => {
    const updated = [...formData.addresses];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, addresses: updated }));
  };
  const addAddress = () => {
    setFormData((prev) => ({
      ...prev,
      addresses: [...prev.addresses, {
        street: "",
        addressLine2: "",
        city: "",
        province: "",
        country: "",
        postalCode: "",
        dateInResidence: "",
        isCurrent: false,
        fiscalYear: ""
      }]
    }));
  };
  const removeAddress = (index) => {
    if (formData.addresses.length > 1) {
      const updated = formData.addresses.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, addresses: updated }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      // Remove photo from payload if not needed for JSON
      const { photo, ...jsonData } = formData;
      
      // Transform roleFiscalYears from {role, fiscalYear} to {roleID, fiscalYearID}
      if (jsonData.roleFiscalYears && jsonData.roleFiscalYears.length > 0) {
        jsonData.roleFiscalYears = jsonData.roleFiscalYears.map(item => ({
          roleID: parseInt(item.role),
          fiscalYearID: parseInt(item.fiscalYear)
        }));
      }
      
      const res = await fetch(`http://localhost:5000/api/members/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(jsonData),
        credentials: "include"
      });
      if (res.ok) {
        setSuccess("Member updated successfully!");
        setTimeout(() => {
          navigate(`/members/${id}`);
        }, 1500);
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Failed to update member");
      }
    } catch (err) {
      setError("Error updating member: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLookup = async (type, value) => {
    try {
      let endpoint = '';
      let payload = {};
      
      switch (type) {
        case 'fiscalYear':
          endpoint = '/api/lookups/fiscal-years';
          payload = { yearLabel: value };
          break;
        case 'category':
          endpoint = '/api/lookups/categories';
          payload = { categoryName: value };
          break;
        case 'role':
          endpoint = '/api/lookups/roles';
          payload = { roleName: value };
          break;
        case 'society':
          endpoint = '/api/lookups/societies';
          payload = { societyName: value };
          break;
        case 'occupation':
          endpoint = '/api/lookups/occupations';
          payload = { occupationName: value };
          break;
        case 'surname':
          endpoint = '/api/lookups/surnames';
          payload = { surname: value };
          break;
        case 'otherSocieties':
          // These might not have specific endpoints yet, just add to local state
          console.log('Creating local lookup for:', type, value);
          setLookups(prev => ({
            ...prev,
            [type]: [...(prev[type] || []), { id: Date.now(), name: value, label: value, value: value }]
          }));
          return { value, label: value };
        default:
          console.log('Unknown lookup type:', type);
          return { value, label: value };
      }
      
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Update local lookups state
        const newItem = { 
          id: result.id, 
          name: value,
          label: value,
          value: value
        };
        
        const lookupKey = type === 'fiscalYear' ? 'fiscalYears' : 
                         type === 'occupation' ? 'occupations' :
                         type === 'surname' ? 'surnames' :
                         type + 's';
        
        setLookups(prev => ({
          ...prev,
          [lookupKey]: [...(prev[lookupKey] || []), newItem]
        }));
        
        return newItem;
      } else {
        // If the item already exists (409 conflict), find it in existing lookups
        if (response.status === 409) {
          const lookupKey = type === 'fiscalYear' ? 'fiscalYears' : 
                           type === 'occupation' ? 'occupations' :
                           type === 'surname' ? 'surnames' :
                           type + 's';
          
          const existingItem = (lookups[lookupKey] || []).find(item => 
            item.name === value || item.label === value
          );
          
          if (existingItem) {
            return existingItem;
          }
        }
        
        console.error('Failed to create lookup:', result.error);
        // Don't show error for "already exists" - just use the value
        if (response.status !== 409) {
          setError(`Failed to create ${type}: ${result.error}`);
        }
        return { value, label: value };
      }
    } catch (error) {
      console.error('Error creating lookup:', error);
      setError(`Error creating ${type}: ${error.message}`);
      return { value, label: value };
    }
  };

  return (
    <MainLayout>
      <div className="dashboard-container">
          <main style={{ maxWidth: '700px', margin: '0 auto' }} aria-label="Edit Member Form">
            <section
              className="dashboard-card"
              style={{ maxWidth: '900px', margin: '32px auto', padding: '32px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 24px rgba(20,184,166,0.08)', border: '1px solid #e5e7eb' }}
              role="form"
              aria-labelledby="edit-member-title"
            >
              <h2
                id="edit-member-title"
                className="dashboard-card-title"
                style={{ marginBottom: '24px', fontSize: '2rem', fontWeight: '700', color: '#14b8a6', letterSpacing: '0.5px' }}
                tabIndex={0}
              >
                Edit Member
              </h2>
              {/* Accessibility: Announce error/success messages to screen readers */}
              {error && (
                <div role="alert" aria-live="assertive" style={{ color: '#dc2626', marginBottom: '16px' }}>
                  {error}
                </div>
              )}
              {success && (
                <div role="status" aria-live="polite" style={{ color: '#14b8a6', marginBottom: '16px' }}>
                  {success}
                </div>
              )}
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
            </section>
          </main>
      </div>
    </MainLayout>
  );
}