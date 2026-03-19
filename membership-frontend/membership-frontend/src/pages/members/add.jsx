import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../components/mainlayout";
import MemberForm from "../../components/memberform";
import { useAuth } from "../../hooks/useauth";
import { useToast } from "../../components/toast";
import { LoadingSpinner } from "../../components/loading";
import { API_BASE_URL } from '../../utils/api';

export default function AddMember() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Admin access check
  if (!user || user.role !== "admin") {
    return (
      <MainLayout>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>Access Denied</h1>
          <p>You must be an administrator to add new members.</p>
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

  const defaultDOB = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split("T")[0];
  })();

    const [formData, setFormData] = useState({
      firstName: "",
      lastName: "",
      dateOfBirth: defaultDOB,
      placeOfBirth: "",
      occupationId: "",
      irishConnections: [{ type: "", countyId: "", surnameId: "" }],
      email: "",
      phoneNumbers: [{ type: "", number: "", isPreferred: true }],
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
      volunteeringInterests: [],
      notes: "",
      isActive: true,
      photo: null
    });
  const [lookups, setLookups] = useState({ counties: [], categories: [], roles: [], fiscalYears: [], societies: [], connections: [], occupations: [], volunteeringInterests: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/lookups`, { credentials: "include" })
      .then(res => res.json())
      .then(setLookups)
      .catch(() => setError("Failed to load form data"));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Map frontend field names to backend
    let mappedName = name;
    if (name === "county") mappedName = "countyId";
    if (name === "surname") mappedName = "surnameId";
    if (name === "category") mappedName = "categoryId";
    if (name === "irishConnection") mappedName = "irishConnectionId";
    setFormData((prev) => ({ ...prev, [mappedName]: type === "checkbox" ? checked : value }));
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
        isCurrent: false, // User sets this manually as needed
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

  // Role handling functions
  const handleRoleChange = (index, field, value) => {
    const updated = [...formData.roles];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, roles: updated }));
  };

  const addRole = () => {
    setFormData((prev) => ({
      ...prev,
      roles: [...prev.roles, {
        roleId: "",
        societyId: "",
        startDate: "",
        endDate: "",
        isActive: true
      }]
    }));
  };

  const removeRole = (index) => {
    if (formData.roles.length > 1) {
      const updated = formData.roles.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, roles: updated }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Coerce types for backend
      const toNull = v => v === "" ? null : v;
      const toInt = v => v === "" || v === null || v === undefined ? null : parseInt(v, 10);
      const toBool = v => v === true || v === "true" || v === 1 ? true : false;
      const cleanData = {
        ...formData,
        categoryId: toInt(formData.categoryId),
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
      let res;
      if (formData.photo) {
        // Use FormData if uploading a file
        const data = new FormData();
        Object.entries(cleanData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            data.append(key, JSON.stringify(value));
          } else {
            data.append(key, value === undefined ? "" : value);
          }
        });
        data.append("photo", formData.photo);
        res = await fetch(`${API_BASE_URL}/api/members`, {
          method: "POST",
          body: data,
          credentials: "include"
        });
      } else {
        // Use JSON if no file
        res = await fetch(`${API_BASE_URL}/api/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanData),
          credentials: "include"
        });
      }
      if (res.ok) {
        showToast("Member added successfully!", "success");
        setTimeout(() => {
          navigate("/members");
        }, 1500);
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
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h1 className="dashboard-title">➕ Add New Member</h1>
          <p className="dashboard-subtitle">Create a new member record in the database</p>
            <div className="dashboard-card" style={{ maxWidth: '900px', margin: '32px auto', padding: '36px', border: '2px solid #5eead4' }}>
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