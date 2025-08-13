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
    placeOfBirthCity: "",
    placeOfBirthProvince: "",
    placeOfBirthCountry: "",
    occupation: "",
    email: "",
    homePhone: "",
    cellPhone: "",
    county: "",
    surname: "",
    irishConnection: "",
    userId: "",
    category: "",
    societies: [],
    roles: [],
    fiscalYears: [],
    membershipStartDate: "",
    membershipEndDate: "",
    applicationDate: "",
    dateApproved: "",
    approvedBy: "",
    signedBy: "",
    proposer: "",
    seconder: "",
    proposalDate: "",
    photo: null,
    irishConnections: [{ type: "", county: "", surname: "" }], // Add default structured Irish connection
    roleFiscalYears: [{ role: "", fiscalYear: "" }], // Add default role/fiscal year
    addresses: [{
      addressLine1: "",
      addressLine2: "",
      city: "",
      province: "",
      country: "",
      postalCode: "",
      dateInResidence: "",
      isCurrent: true, // Default to current address
      fiscalYear: ""
    }]
  });
  const [lookups, setLookups] = useState({ counties: [], categories: [], roles: [], fiscalYears: [], societies: [], connections: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5000/api/members/${id}`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        // Ensure we preserve the structure for form fields that might not be in API response
        setFormData(prev => ({ 
          ...prev,
          ...data, 
          photo: null,
          // Ensure these arrays exist and have at least one default item
          irishConnections: data.irishConnections && data.irishConnections.length > 0 ? data.irishConnections : [{ type: "", county: "", surname: "" }],
          roleFiscalYears: data.roleFiscalYears && data.roleFiscalYears.length > 0 ? data.roleFiscalYears : [{ role: "", fiscalYear: "" }],
          addresses: data.addresses && data.addresses.length > 0 ? data.addresses : prev.addresses
        }));
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
        addressLine1: "",
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
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h1 className="dashboard-title">✏️ Edit Member</h1>
          <p className="dashboard-subtitle">Update member record in the database</p>
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
    </MainLayout>
  );
}