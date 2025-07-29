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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5000/api/members/${id}`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setFormData({ ...data, photo: null });
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
          />
        </div>
      </div>
    </MainLayout>
  );
}