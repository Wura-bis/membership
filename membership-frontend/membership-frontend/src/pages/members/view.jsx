import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useauth";
import MainLayout from "../../components/mainlayout";

export default function ViewMember() {
  const { id } = useParams();
  const { user } = useAuth();
  const [member, setMember] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/members/${id}`, {
      credentials: "include"
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch member");
        return res.json();
      })
      .then((data) => {
        setMember(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError("Unable to load member details: " + err.message);
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="dashboard-container">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '400px'
          }}>
            <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="dashboard-container">
          <div className="alert alert-error" style={{ maxWidth: '600px', margin: '0 auto' }}>
            {error}
          </div>
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Link to="/members" className="btn-primary" style={{ textDecoration: 'none' }}>
              ← Back to Members
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!member) {
    return (
      <MainLayout>
        <div className="dashboard-container">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2 style={{ fontSize: '24px', color: '#64748b', marginBottom: '16px' }}>
              Member not found
            </h2>
            <Link to="/members" className="btn-primary" style={{ textDecoration: 'none' }}>
              ← Back to Members
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="dashboard-container" style={{ background: '#f8fafc', minHeight: '100vh', padding: '32px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', background: 'white', borderRadius: 16, boxShadow: '0 2px 8px #e0e7ef', padding: 32 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, borderBottom: '1px solid #e5e7eb', paddingBottom: 24, marginBottom: 32 }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, color: '#38bdf8' }}>
              <span className="material-icons" style={{ fontSize: 80 }}>account_circle</span>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{member.firstName} {member.lastName}</div>
              <div style={{ fontSize: 16, color: '#64748b', marginTop: 2 }}>UID: {member.id?.toString().padStart(4, '0')}</div>
              <div style={{ marginTop: 8 }}>
                <span style={{
                  display: 'inline-block',
                  padding: '6px 18px',
                  fontSize: '13px',
                  fontWeight: '600',
                  borderRadius: '20px',
                  background: member.isActive ? '#10b981' : '#f1f5f9',
                  color: member.isActive ? 'white' : '#64748b',
                  border: member.isActive ? 'none' : '2px solid #e2e8f0'
                }}>{member.isActive ? 'Active Member' : 'Inactive Member'}</span>
              </div>
            </div>
          </div>

          {/* Main Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 32 }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Personal Information */}
              <div className="dashboard-card" style={{ background: '#f1f5f9', borderRadius: 12, padding: 20 }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Personal Information</h2>
                <div className="info-item"><div className="info-label">Date of Birth</div><div className="info-value">{member.dateOfBirth || '—'}</div></div>
                <div className="info-item"><div className="info-label">Occupation</div><div className="info-value">{member.occupation || '—'}</div></div>
                <div className="info-item"><div className="info-label">Place of Birth</div><div className="info-value">{member.placeOfBirth || '—'}</div></div>
              </div>
              {/* Address Information */}
              <div className="dashboard-card" style={{ background: '#f1f5f9', borderRadius: 12, padding: 20 }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Address Information</h2>
                {Array.isArray(member.addresses) && member.addresses.length > 0 ? member.addresses.map((addr, idx) => (
                  <div key={idx} style={{ marginBottom: 12 }}>
                    <div className="info-item"><div className="info-label">Address Line 1</div><div className="info-value">{addr.street || '—'}</div></div>
                    <div className="info-item"><div className="info-label">City</div><div className="info-value">{addr.city || '—'}</div></div>
                    <div className="info-item"><div className="info-label">Province/State</div><div className="info-value">{addr.province || '—'}</div></div>
                    <div className="info-item"><div className="info-label">Country</div><div className="info-value">{addr.country || '—'}</div></div>
                    <div className="info-item"><div className="info-label">Postal Code</div><div className="info-value">{addr.postalCode || '—'}</div></div>
                  </div>
                )) : <div className="info-value">—</div>}
              </div>
              {/* Irish Connection */}
              <div className="dashboard-card" style={{ background: '#f1f5f9', borderRadius: 12, padding: 20 }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Irish Connection</h2>
                <div className="info-item"><div className="info-label">Irish Connection</div><div className="info-value">{(Array.isArray(member.irishConnection) && member.irishConnection.counties && member.irishConnection.counties.length > 0) ? member.irishConnection.counties.join(', ') : '—'}</div></div>
                <div className="info-item"><div className="info-label">County Name</div><div className="info-value">{member.county || '—'}</div></div>
                <div className="info-item"><div className="info-label">Surname</div><div className="info-value">{member.surname || '—'}</div></div>
              </div>
            </div>
            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Contact Information */}
              <div className="dashboard-card" style={{ background: '#f1f5f9', borderRadius: 12, padding: 20 }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Contact Information</h2>
                <div className="info-item"><div className="info-label">Email</div><div className="info-value">{member.email || '—'}</div></div>
                <div className="info-item"><div className="info-label">Phone</div><div className="info-value">{member.phoneNumber || '—'}</div></div>
                <div className="info-item"><div className="info-label">Home Phone</div><div className="info-value">{'—'}</div></div>
                <div className="info-item"><div className="info-label">Cell Phone</div><div className="info-value">{'—'}</div></div>
              </div>
              {/* Membership Details */}
              <div className="dashboard-card" style={{ background: '#f1f5f9', borderRadius: 12, padding: 20 }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Membership Details</h2>
                <div className="info-item"><div className="info-label">Other Societies Affiliated With</div><div className="info-value">{member.otherSocieties || '—'}</div></div>
                <div className="info-item"><div className="info-label">Member Category</div><div className="info-value">{member.memberCategory || '—'}</div></div>
                <div className="info-item"><div className="info-label">Membership Start Year</div><div className="info-value">{member.dateJoined || '—'}</div></div>
                <div className="info-item"><div className="info-label">Membership End Year</div><div className="info-value">{member.dateEnded || '—'}</div></div>
                <div className="info-item"><div className="info-label">Application Date</div><div className="info-value">{member.applicationDate || '—'}</div></div>
                <div className="info-item"><div className="info-label">Date Approved</div><div className="info-value">{member.approvalDate || '—'}</div></div>
                <div className="info-item"><div className="info-label">Approved By</div><div className="info-value">{member.approvedBy || '—'}</div></div>
                <div className="info-item"><div className="info-label">Signed By</div><div className="info-value">{member.signedBy || '—'}</div></div>
                <div className="info-item"><div className="info-label">Proposer</div><div className="info-value">{member.proposer || '—'}</div></div>
                <div className="info-item"><div className="info-label">Seconder(s)</div><div className="info-value">{member.seconder || '—'}</div></div>
                <div className="info-item"><div className="info-label">Proposal Date</div><div className="info-value">{member.proposalDate || '—'}</div></div>
              </div>
              {/* Roles Held */}
              <div className="dashboard-card" style={{ background: '#f1f5f9', borderRadius: 12, padding: 20 }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Role(s) Held</h2>
                {Array.isArray(member.roleFiscalYears) && member.roleFiscalYears.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                    <thead>
                      <tr style={{ background: '#e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: 8 }}>Role Title</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>From</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {member.roleFiscalYears.map((rf, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: 8 }}>{rf.role}</td>
                          <td style={{ padding: 8 }}>{rf.from ? new Date(rf.from).toLocaleDateString() : '—'}</td>
                          <td style={{ padding: 8 }}>{rf.to ? new Date(rf.to).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: '#64748b', fontSize: '14px' }}>No roles assigned</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 16, marginTop: 32, justifyContent: 'center' }}>
            {/* Admin-only controls */}
            {user && user.role === "admin" && (
              <>
                <Link to={`/members/edit/${member.id}`} className="btn-primary">EDIT MEMBER</Link>
                <button className="btn-primary" style={{ background: '#38bdf8' }}>REINSTATE</button>
                <button className="btn-primary" style={{ background: '#f87171' }}>DEACTIVATE</button>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
