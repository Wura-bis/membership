import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ConfirmModal from "../../components/confirmmodal";
import MainLayout from "../../components/mainlayout";
import { useAuth } from "../../hooks/useauth";

export default function MemberProfile() {
  const navigate = useNavigate();
  const [showReinstate, setShowReinstate] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const { id } = useParams();
  const { user } = useAuth();
  const [member, setMember] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5000/api/members/${id}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Access denied or not found");
        return res.json();
      })
      .then(setMember)
      .catch(() => setError("Could not load member profile."));
  }, [id]);

  // If public user tries to view an active member, show error
  if (user && user.role === "public" && member && member.isActive) {
    return <MainLayout><div className="p-6 text-red-600">Access denied: Public users can only view deceased members.</div></MainLayout>;
  }

  if (error) return <MainLayout><div className="p-6 text-red-600">{error}</div></MainLayout>;
  if (!member) return <MainLayout><div className="p-6">Loading...</div></MainLayout>;

  return (
    <MainLayout>
      <div className="dashboard-container" style={{ background: '#f8fafc', minHeight: '100vh', padding: '32px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', background: 'white', borderRadius: 16, boxShadow: '0 2px 8px #e0e7ef', padding: 32 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: 24, marginBottom: 32, position: 'relative' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#38bdf8', flexShrink: 0 }}>
              {member.photo ? (
                <img src={`http://localhost:5000/uploads/${member.photo}`} alt="Member" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <span className="material-icons" style={{ fontSize: 56 }}>account_circle</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, wordBreak: 'break-word' }}>{member.firstName} {member.lastName}</div>
              <div style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>UID: {member.id?.toString().padStart(4, '0')}</div>
              <span style={{
                display: 'inline-block',
                padding: '4px 14px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '16px',
                background: member.isActive ? '#10b981' : '#f1f5f9',
                color: member.isActive ? 'white' : '#64748b',
                border: member.isActive ? 'none' : '1.5px solid #e2e8f0',
                marginTop: 8
              }}>{member.isActive ? 'Active Member' : 'Inactive Member'}</span>
            </div>
          </div>

          {/* Main Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Personal Information */}
              <div className="dashboard-card" style={{ background: '#f6faff', borderRadius: 10, padding: 18, marginBottom: 2, boxShadow: '0 1px 2px #e0e7ef33' }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: '#22223b' }}>Personal Information</h2>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>DATE OF BIRTH</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.dateOfBirth || '—'}</div></div>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>OCCUPATION</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.occupation || '—'}</div></div>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>PLACE OF BIRTH</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.placeOfBirth || '—'}</div></div>
              </div>
              {/* Address Information */}
              <div className="dashboard-card" style={{ background: '#f6faff', borderRadius: 10, padding: 18, marginBottom: 2, boxShadow: '0 1px 2px #e0e7ef33' }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: '#22223b' }}>Address Information</h2>
                {Array.isArray(member.addresses) && member.addresses.length > 0 ? member.addresses.map((addr, idx) => (
                  <div key={idx} style={{ marginBottom: 8 }}>
                    <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>ADDRESS LINE 1</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{addr.addressLine1 || addr.street || '—'}</div></div>
                    <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>CITY</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{addr.city || '—'}</div></div>
                    <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>PROVINCE/STATE</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{addr.province || '—'}</div></div>
                    <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>COUNTRY</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{addr.country || '—'}</div></div>
                    <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>POSTAL CODE</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{addr.postalCode || '—'}</div></div>
                  </div>
                )) : <div className="info-value">—</div>}
              </div>
              {/* Irish Connection */}
              <div className="dashboard-card" style={{ background: '#f6faff', borderRadius: 10, padding: 18, marginBottom: 2, boxShadow: '0 1px 2px #e0e7ef33' }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: '#22223b' }}>Irish Connection</h2>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>IRISH CONNECTION</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{(Array.isArray(member.irishConnection) && member.irishConnection.counties && member.irishConnection.counties.length > 0) ? member.irishConnection.counties.join(', ') : (member.irishConnection || '—')}</div></div>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>COUNTY NAME</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.county || '—'}</div></div>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>SURNAME</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.surname || '—'}</div></div>
              </div>
            </div>
            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Contact Information */}
              <div className="dashboard-card" style={{ background: '#f6faff', borderRadius: 10, padding: 18, marginBottom: 2, boxShadow: '0 1px 2px #e0e7ef33' }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: '#22223b' }}>Contact Information</h2>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>EMAIL</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.email || '—'}</div></div>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>PHONE</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.phoneNumber || member.cellPhone || member.homePhone || '—'}</div></div>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>HOME PHONE</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.homePhone || '—'}</div></div>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>CELL PHONE</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.cellPhone || '—'}</div></div>
              </div>
              {/* Address Information */}
              <div className="dashboard-card" style={{ background: '#f6faff', borderRadius: 10, padding: 18, marginBottom: 2, boxShadow: '0 1px 2px #e0e7ef33' }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: '#22223b' }}>Address Information</h2>
                {Array.isArray(member.addresses) && member.addresses.length > 0 ? (
                  member.addresses.map((addr, idx) => (
                    <div key={idx} style={{ marginBottom: idx < member.addresses.length - 1 ? 16 : 0, padding: idx > 0 ? '16px 0 0 0' : 0, borderTop: idx > 0 ? '1px solid #e5e7eb' : 'none' }}>
                      <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600, marginBottom: 8 }}>
                        {addr.isCurrent ? 'CURRENT ADDRESS' : `${addr.yearLabel || 'HISTORICAL'} ADDRESS`}
                      </div>
                      <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>STREET</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{addr.street || '—'}</div></div>
                      <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>CITY</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{addr.city || '—'}</div></div>
                      <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>PROVINCE</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{addr.province || '—'}</div></div>
                      <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>POSTAL CODE</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{addr.postalCode || '—'}</div></div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No address information available</p>
                )}
              </div>
              {/* Account Information */}
              <div className="dashboard-card" style={{ background: '#f6faff', borderRadius: 10, padding: 18, marginBottom: 2, boxShadow: '0 1px 2px #e0e7ef33' }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: '#22223b' }}>Account Information</h2>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>USERNAME</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.username || 'No account'}</div></div>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>ROLE</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.role || 'No account'}</div></div>
              </div>
              {/* Membership Details */}
              <div className="dashboard-card" style={{ background: '#f6faff', borderRadius: 10, padding: 18, marginBottom: 2, boxShadow: '0 1px 2px #e0e7ef33' }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: '#22223b' }}>Membership Details</h2>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>OTHER SOCIETIES AFFILIATED WITH</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.otherSocieties || '—'}</div></div>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>MEMBER CATEGORY</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.memberCategory || member.category || '—'}</div></div>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>MEMBERSHIP START YEAR</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.dateJoined || member.membershipStartDate || '—'}</div></div>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>MEMBERSHIP END YEAR</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.dateEnded || member.membershipEndDate || '—'}</div></div>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>APPLICATION DATE</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.applicationDate || '—'}</div></div>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>DATE APPROVED</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.approvalDate || member.dateApproved || '—'}</div></div>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>APPROVED BY</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.approvedBy || '—'}</div></div>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>SIGNED BY</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.signedBy || '—'}</div></div>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>PROPOSER</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.proposer || '—'}</div></div>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>SECONDER(S)</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.seconder || '—'}</div></div>
                <div className="info-item"><div className="info-label" style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>PROPOSAL DATE</div><div className="info-value" style={{ fontSize: 14, fontWeight: 500 }}>{member.proposalDate || '—'}</div></div>
              </div>
              {/* Roles Held */}
              <div className="dashboard-card" style={{ background: '#f6faff', borderRadius: 10, padding: 18, marginBottom: 2, boxShadow: '0 1px 2px #e0e7ef33' }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: '#22223b' }}>Role(s) Held</h2>
                {Array.isArray(member.roleFiscalYears) && member.roleFiscalYears.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                    <thead>
                      <tr style={{ background: '#e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: 8, fontSize: 12, color: '#64748b' }}>Role Title</th>
                        <th style={{ textAlign: 'left', padding: 8, fontSize: 12, color: '#64748b' }}>From</th>
                        <th style={{ textAlign: 'left', padding: 8, fontSize: 12, color: '#64748b' }}>To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {member.roleFiscalYears.map((rf, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: 8, fontSize: 14 }}>{rf.role}</td>
                          <td style={{ padding: 8, fontSize: 14 }}>{rf.from ? new Date(rf.from).toLocaleDateString() : '—'}</td>
                          <td style={{ padding: 8, fontSize: 14 }}>{rf.to ? new Date(rf.to).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No roles assigned</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 40, justifyContent: 'center' }}>
            <Link 
              to={user && user.role === "public" ? "/members/deceased" : "/members"} 
              className="btn-primary" 
              style={{ background: '#f1f5f9', color: '#22223b', border: '1.5px solid #e2e8f0', fontWeight: 600, minWidth: 120, textAlign: 'center', textDecoration: 'none' }}
            >
              ← Back to Members
            </Link>
            
            {/* Export buttons for admin and private users */}
            {user && (user.role === "admin" || user.role === "private") && (
              <>
                <button 
                  className="btn-primary" 
                  style={{ background: '#22c55e', color: 'white', fontWeight: 600, minWidth: 120 }}
                  onClick={() => window.open(`http://localhost:5000/api/export/member/${member.id}/csv`, '_blank')}
                >
                  Export CSV
                </button>
                <button 
                  className="btn-primary" 
                  style={{ background: '#3b82f6', color: 'white', fontWeight: 600, minWidth: 120 }}
                  onClick={() => window.open(`http://localhost:5000/api/export/member/${member.id}/pdf`, '_blank')}
                >
                  Export PDF
                </button>
              </>
            )}
            
            {/* Admin-only controls */}
            {user && user.role === "admin" && (
              <>
                <Link to={`/members/edit/${member.id}`} className="btn-primary" style={{ background: '#38bdf8', color: 'white', fontWeight: 600, minWidth: 120, textAlign: 'center', textDecoration: 'none' }}>Edit Member</Link>
                <button className="btn-primary" style={{ background: '#10b981', color: 'white', fontWeight: 600, minWidth: 120 }} onClick={() => setShowReinstate(true)} disabled={member.isActive || actionLoading}>Reinstate</button>
                <button className="btn-primary" style={{ background: '#f87171', color: 'white', fontWeight: 600, minWidth: 120 }} onClick={() => setShowDeactivate(true)} disabled={!member.isActive || actionLoading}>Deactivate</button>
              </>
            )}
          </div>

          {/* Confirmation Modals - Admin Only */}
          {user && user.role === "admin" && showReinstate && (
            <ConfirmModal
              isOpen={showReinstate}
              title="Reinstate Member"
              message="Are you sure you want to reinstate this member?"
              confirmLabel="Reinstate"
              onCancel={() => setShowReinstate(false)}
              onConfirm={async () => {
                setActionLoading(true);
                setActionError("");
                try {
                  const res = await fetch(`http://localhost:5000/api/members/${member.id}/reinstate`, {
                    method: "POST",
                    credentials: "include"
                  });
                  if (!res.ok) throw new Error("Failed to reinstate member");
                  setShowReinstate(false);
                  // Optionally reload member
                  window.location.reload();
                } catch (err) {
                  setActionError("Could not reinstate member.");
                } finally {
                  setActionLoading(false);
                }
              }}
              loading={actionLoading}
              error={actionError}
            />
          )}
          {user && user.role === "admin" && showDeactivate && (
            <ConfirmModal
              isOpen={showDeactivate}
              title="Deactivate Member"
              message="Are you sure you want to deactivate this member?"
              confirmLabel="Deactivate"
              onCancel={() => setShowDeactivate(false)}
              onConfirm={async () => {
                setActionLoading(true);
                setActionError("");
                try {
                  const res = await fetch(`http://localhost:5000/api/members/${member.id}/deactivate`, {
                    method: "POST",
                    credentials: "include"
                  });
                  if (!res.ok) throw new Error("Failed to deactivate member");
                  setShowDeactivate(false);
                  window.location.reload();
                } catch (err) {
                  setActionError("Could not deactivate member.");
                } finally {
                  setActionLoading(false);
                }
              }}
              loading={actionLoading}
              error={actionError}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
