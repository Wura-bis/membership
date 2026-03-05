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
      <div className="dashboard-container" style={{ background: '#f8fafc', minHeight: '100vh', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', background: 'white', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '40px 48px', border: '2px solid #14b8a6' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, borderBottom: '3px solid #14b8a6', paddingBottom: 36, marginBottom: 40, position: 'relative' }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, color: '#14b8a6', flexShrink: 0, border: '4px solid #14b8a6', boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)' }}>
              {member.photo ? (
                <img src={`http://localhost:5000/uploads/${member.photo}`} alt="Member" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 72 }}>👤</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.2, wordBreak: 'break-word', color: '#0f172a' }}>{member.firstName} {member.lastName}</div>
              <div style={{ fontSize: 18, color: '#64748b', marginTop: 8, fontWeight: 600 }}>Member ID: #{member.id?.toString().padStart(4, '0')}</div>
              <span style={{
                display: 'inline-block',
                padding: '10px 24px',
                fontSize: '17px',
                fontWeight: '700',
                borderRadius: '12px',
                background: member.isActive 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                color: member.isActive ? 'white' : '#64748b',
                border: member.isActive ? '2px solid #059669' : '2px solid #cbd5e1',
                marginTop: 16,
                boxShadow: member.isActive ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
              }}>{member.category || (member.isActive ? 'Active' : 'Inactive')}</span>
            </div>
          </div>

          {/* Main Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 32 }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {/* Personal Information */}
              <div className="dashboard-card" style={{ background: '#f0fdfa', borderRadius: 12, padding: 36, boxShadow: '0 2px 8px rgba(20, 184, 166, 0.15)', border: '2px solid #14b8a6' }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#0f766e', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>👤</span> Personal Information
                </h2>
                <div className="info-item" style={{ marginBottom: 20 }}><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>DATE OF BIRTH</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{member.dateOfBirth || '—'}</div></div>
                <div className="info-item" style={{ marginBottom: 20 }}><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>OCCUPATION</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{member.occupation || '—'}</div></div>
                <div className="info-item"><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>PLACE OF BIRTH</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{member.placeOfBirth || '—'}</div></div>
              </div>
              {/* Irish Connection */}
              <div className="dashboard-card" style={{ background: 'white', borderRadius: 12, padding: 36, boxShadow: '0 2px 8px rgba(20, 184, 166, 0.15)', border: '2px solid #14b8a6' }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#0f766e', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>🍀</span> Irish Connection
                </h2>
                {Array.isArray(member.irishConnections) && member.irishConnections.length > 0 ? (
                  member.irishConnections.map((connection, idx) => (
                    <div key={idx} style={{ marginBottom: idx < member.irishConnections.length - 1 ? 24 : 0, padding: idx > 0 ? '24px 0 0 0' : 0, borderTop: idx > 0 ? '3px solid #f0fdfa' : 'none' }}>
                      <div className="info-item" style={{ marginBottom: 20 }}><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>COUNTY NAME</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{connection.county || '—'}</div></div>
                      <div className="info-item" style={{ marginBottom: 20 }}><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>SURNAME</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{connection.surname || '—'}</div></div>
                      <div className="info-item"><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>CONNECTION TYPE</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{connection.type || '—'}</div></div>
                    </div>
                  ))
                ) : (
                  <div className="info-item"><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>IRISH CONNECTION</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>—</div></div>
                )}
              </div>
            </div>
            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {/* Contact Information */}
              <div className="dashboard-card" style={{ background: 'white', borderRadius: 12, padding: 36, boxShadow: '0 2px 8px rgba(20, 184, 166, 0.15)', border: '2px solid #14b8a6' }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#0f766e', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>📞</span> Contact Information
                </h2>
                <div className="info-item" style={{ marginBottom: 20 }}><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>EMAIL</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', wordBreak: 'break-word' }}>{member.email || '—'}</div></div>
                {Array.isArray(member.phoneNumbers) && member.phoneNumbers.length > 0 ? (
                  <div>
                    <div style={{ fontSize: 16, color: '#14b8a6', fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      📱 PHONE NUMBERS
                    </div>
                    {member.phoneNumbers.map((phone, idx) => (
                      <div key={idx} style={{ marginBottom: idx < member.phoneNumbers.length - 1 ? 16 : 0 }}>
                        <div className="info-item">
                          <div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>
                            {phone.type || 'OTHER'}{phone.isPreferred ? ' (PRIMARY)' : ''}
                          </div>
                          <div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>
                            {phone.number || '—'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="info-item"><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>PHONE</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>—</div></div>
                )}
              </div>
              {/* Address Information */}
              <div className="dashboard-card" style={{ background: '#f0fdfa', borderRadius: 12, padding: 36, boxShadow: '0 2px 8px rgba(20, 184, 166, 0.15)', border: '2px solid #14b8a6' }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#0f766e', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>📍</span> Address Information
                </h2>
                {Array.isArray(member.addresses) && member.addresses.length > 0 ? (
                  member.addresses.map((addr, idx) => (
                    <div key={idx} style={{ marginBottom: idx < member.addresses.length - 1 ? 24 : 0, padding: idx > 0 ? '24px 0 0 0' : 0, borderTop: idx > 0 ? '3px solid #ccfbf1' : 'none' }}>
                      <div style={{ fontSize: 16, color: '#14b8a6', fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {addr.isCurrent ? '📌 CURRENT ADDRESS' : `📅 ${addr.yearLabel || 'HISTORICAL'} ADDRESS`}
                      </div>
                      <div className="info-item" style={{ marginBottom: 20 }}><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>STREET</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{addr.street || '—'}</div></div>
                      <div className="info-item" style={{ marginBottom: 20 }}><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>CITY</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{addr.city || '—'}</div></div>
                      <div className="info-item" style={{ marginBottom: 20 }}><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>PROVINCE</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{addr.province || '—'}</div></div>
                      <div className="info-item"><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>POSTAL CODE</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{addr.postalCode || '—'}</div></div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#64748b', fontSize: '18px', fontWeight: '500', margin: 0 }}>No address information available</p>
                )}
              </div>
              {/* Membership Details */}
              <div className="dashboard-card" style={{ background: 'white', borderRadius: 12, padding: 36, boxShadow: '0 2px 8px rgba(20, 184, 166, 0.15)', border: '2px solid #14b8a6' }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#0f766e', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>📋</span> Membership Details
                </h2>
                <div className="info-item" style={{ marginBottom: 20 }}><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>OTHER SOCIETIES AFFILIATED WITH</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{member.otherSocieties || '—'}</div></div>
                <div className="info-item" style={{ marginBottom: 20 }}><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>MEMBER CATEGORY</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{member.memberCategory || member.category || '—'}</div></div>
                <div className="info-item" style={{ marginBottom: 20 }}><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>MEMBERSHIP START YEAR</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{member.dateJoined || member.membershipStartDate || '—'}</div></div>
                <div className="info-item" style={{ marginBottom: 20 }}><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>MEMBERSHIP END YEAR</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{member.dateEnded || member.membershipEndDate || '—'}</div></div>
                <div className="info-item" style={{ marginBottom: 20 }}><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>APPLICATION DATE</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{member.applicationDate || '—'}</div></div>
                <div className="info-item" style={{ marginBottom: 20 }}><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>DATE APPROVED</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{member.approvalDate || member.dateApproved || '—'}</div></div>
                <div className="info-item" style={{ marginBottom: 20 }}><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>APPROVED BY</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{member.approvedBy || '—'}</div></div>
                <div className="info-item" style={{ marginBottom: 20 }}><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>SIGNED BY</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{member.signedBy || '—'}</div></div>
                <div className="info-item" style={{ marginBottom: 20 }}><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>PROPOSER</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{member.proposer || '—'}</div></div>
                <div className="info-item" style={{ marginBottom: 20 }}><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>SECONDER(S)</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{member.seconder || '—'}</div></div>
                <div className="info-item"><div className="info-label" style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>PROPOSAL DATE</div><div className="info-value" style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{member.proposalDate || '—'}</div></div>
              </div>
              {/* Roles Held */}
              <div className="dashboard-card" style={{ background: '#f0fdfa', borderRadius: 12, padding: 36, boxShadow: '0 2px 8px rgba(20, 184, 166, 0.15)', border: '2px solid #14b8a6' }}>
                <h2 className="dashboard-card-title" style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#0f766e', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>🏆</span> Role(s) Held
                </h2>
                {Array.isArray(member.roleFiscalYears) && member.roleFiscalYears.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, marginTop: 8 }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)', borderBottom: '3px solid #14b8a6' }}>
                        <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 17, color: '#0f766e', fontWeight: 700 }}>Role Title</th>
                        <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 17, color: '#0f766e', fontWeight: 700 }}>Fiscal Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {member.roleFiscalYears.map((rf, idx) => (
                        <tr key={idx} style={{ borderBottom: idx < member.roleFiscalYears.length - 1 ? '2px solid #f0fdfa' : 'none' }}>
                          <td style={{ padding: '16px 20px', fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{rf.role}</td>
                          <td style={{ padding: '16px 20px', fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{rf.fiscalYear || rf.fiscalYearLabel || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: '#64748b', fontSize: '18px', fontWeight: '500', margin: 0 }}>No roles assigned</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 48, justifyContent: 'center', paddingTop: 40, borderTop: '3px solid #14b8a6' }}>
            <Link 
              to={user && user.role === "public" ? "/members/deceased" : "/members"} 
              className="btn-primary" 
              style={{ 
                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', 
                color: '#1e293b', 
                border: '2px solid #cbd5e1', 
                fontWeight: 700, 
                minWidth: 160, 
                fontSize: 17, 
                height: 56, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                textAlign: 'center', 
                textDecoration: 'none', 
                borderRadius: 10,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
            >
              ← Back to Directory
            </Link>
            
            {/* Export buttons for admin and private users */}
            {user && (user.role === "admin" || user.role === "private") && (
              <>
                <button 
                  className="btn-primary" 
                  style={{ 
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', 
                    color: 'white', 
                    fontWeight: 700, 
                    minWidth: 160, 
                    fontSize: 17, 
                    height: 56, 
                    borderRadius: 10, 
                    border: '2px solid #16a34a',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
                  }}
                  onClick={() => window.open(`http://localhost:5000/api/export/member/${member.id}/csv`, '_blank')}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.3)';
                  }}
                >
                  📄 Export CSV
                </button>
                <button 
                  className="btn-primary" 
                  style={{ 
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                    color: 'white', 
                    fontWeight: 700, 
                    minWidth: 160, 
                    fontSize: 17, 
                    height: 56, 
                    borderRadius: 10, 
                    border: '2px solid #2563eb',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                  }}
                  onClick={() => window.open(`http://localhost:5000/api/export/member/${member.id}/pdf`, '_blank')}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                  }}
                >
                  📑 Export PDF
                </button>
              </>
            )}
            
            {/* Admin-only controls */}
            {user && user.role === "admin" && (
              <>
                <Link 
                  to={`/members/edit/${member.id}`} 
                  className="btn-primary" 
                  style={{ 
                    background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)', 
                    color: 'white', 
                    fontWeight: 700, 
                    minWidth: 160, 
                    fontSize: 17, 
                    height: 56, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    textAlign: 'center', 
                    textDecoration: 'none', 
                    borderRadius: 10, 
                    border: '2px solid #0f766e',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(20, 184, 166, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(20, 184, 166, 0.3)';
                  }}
                >
                  ✏️ Edit Member
                </Link>
                <button 
                  className="btn-primary" 
                  style={{ 
                    background: member.isActive || actionLoading ? '#cbd5e1' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                    color: 'white', 
                    fontWeight: 700, 
                    minWidth: 160, 
                    fontSize: 17, 
                    height: 56, 
                    borderRadius: 10, 
                    border: member.isActive || actionLoading ? '2px solid #94a3b8' : '2px solid #059669',
                    cursor: member.isActive || actionLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: member.isActive || actionLoading ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.3)',
                    opacity: member.isActive || actionLoading ? 0.5 : 1
                  }} 
                  onClick={() => setShowReinstate(true)} 
                  disabled={member.isActive || actionLoading}
                  onMouseEnter={(e) => {
                    if (!member.isActive && !actionLoading) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!member.isActive && !actionLoading) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                    }
                  }}
                >
                  ✅ Reinstate
                </button>
                <button 
                  className="btn-primary" 
                  style={{ 
                    background: !member.isActive || actionLoading ? '#cbd5e1' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                    color: 'white', 
                    fontWeight: 700, 
                    minWidth: 160, 
                    fontSize: 17, 
                    height: 56, 
                    borderRadius: 10, 
                    border: !member.isActive || actionLoading ? '2px solid #94a3b8' : '2px solid #dc2626',
                    cursor: !member.isActive || actionLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: !member.isActive || actionLoading ? 'none' : '0 2px 8px rgba(239, 68, 68, 0.3)',
                    opacity: !member.isActive || actionLoading ? 0.5 : 1
                  }} 
                  onClick={() => setShowDeactivate(true)} 
                  disabled={!member.isActive || actionLoading}
                  onMouseEnter={(e) => {
                    if (member.isActive && !actionLoading) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (member.isActive && !actionLoading) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                    }
                  }}
                >
                  ❌ Deactivate
                </button>
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
