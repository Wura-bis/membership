import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../components/mainlayout";
import MemberForm from "../../components/memberform";
import { useAuth } from "../../hooks/useauth";
import { useToast } from "../../components/toast";
import { LoadingSpinner } from "../../components/loading";

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

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    placeOfBirth: "",
    dateOfBirth: "",
    categoryId: "",
    countyId: "",
    surnameId: "",
    occupationId: "",
    notes: "",
    isActive: true,
    otherSocieties: "",
    dateJoined: "",
    dateEnded: "",
    applicationDate: "",
    approvalDate: "",
    approvedBy: "",
    signedBy: "",
    proposer: "",
    seconder: "",
    proposalDate: "",
    photo: null,
    addresses: [{
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
  });
  const [lookups, setLookups] = useState({ counties: [], categories: [], roles: [], fiscalYears: [], societies: [], connections: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/lookups", { credentials: "include" })
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
        res = await fetch("http://localhost:5000/api/members", {
          method: "POST",
          body: data,
          credentials: "include"
        });
      } else {
        // Use JSON if no file
        res = await fetch("http://localhost:5000/api/members", {
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

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h1 className="dashboard-title">➕ Add New Member</h1>
          <p className="dashboard-subtitle">Create a new member record in the database</p>
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
          />
        </div>
      </div>
    </MainLayout>
  );
}