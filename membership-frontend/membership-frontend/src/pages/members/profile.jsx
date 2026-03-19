import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ConfirmModal from "../../components/confirmmodal";
import MainLayout from "../../components/mainlayout";
import { useAuth } from "../../hooks/useauth";
import { API_BASE_URL } from '../../utils/api';

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
    fetch(`${API_BASE_URL}/api/members/${id}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Access denied or not found");
        return res.json();
      })
      .then(setMember)
      .catch(() => setError("Could not load member profile."));
  }, [id]);

  // If public user tries to view an active member, show error
  if (user && user.role === "public" && member && member.isActive) {
    return <MainLayout><div className="p-6 text-red-600">Access denied: Public users can only view historical members.</div></MainLayout>;
  }

  if (error) return <MainLayout><div className="p-6 text-red-600">{error}</div></MainLayout>;
  if (!member) return <MainLayout><div className="p-6">Loading...</div></MainLayout>;

  // Shared styles
  const cardStyle = {
    background: 'var(--card-bg)',
    borderRadius: 10,
    padding: '20px 22px',
    border: '1.5px solid #ccfbf1',
    boxShadow: '0 1px 4px rgba(20,184,166,0.08)',
  };
  const cardHeadStyle = {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--text-accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 10,
    borderBottom: '1.5px solid #f0fdfa',
  };
  const btnStyle = {
    padding: '10px 22px',
    fontSize: '1rem',
    fontWeight: 700,
    borderRadius: 8,
    cursor: 'pointer',
    border: 'none',
    minHeight: '2.75rem',
    whiteSpace: 'nowrap',
  };

  // Label-left / value-right row — rem sizes scale with app settings font size
  const InfoRow = ({ label, value }) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '6px 0', borderBottom: '1px solid #f8fafc' }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '9rem', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: '1rem', fontWeight: 600, color: value ? '#0f172a' : '#cbd5e1', wordBreak: 'break-word' }}>
        {value || '—'}
      </span>
    </div>
  );

  return (
    <MainLayout>
      <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '20px 20px 32px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>

          {/* ── Header ── */}
          <div style={{ background: 'white', borderRadius: 10, border: '1.5px solid #14b8a6', padding: '18px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', boxShadow: '0 1px 6px rgba(20,184,166,0.1)' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2.5px solid #14b8a6', overflow: 'hidden' }}>
              {member.photo
                ? <img src={`${API_BASE_URL}/uploads/${member.photo}`} alt="Member" style={{ width: 72, height: 72, objectFit: 'cover' }} />
                : <span style={{ fontSize: '2.375rem' }}>👤</span>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                {member.firstName} {member.lastName}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600, marginTop: 3 }}>
                Member ID: #{member.id?.toString().padStart(4, '0')}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{
                padding: '6px 16px', fontSize: '0.9rem', fontWeight: 700, borderRadius: 16,
                background: member.isActive ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f1f5f9',
                color: member.isActive ? 'white' : '#64748b',
                border: member.isActive ? '1.5px solid #059669' : '1.5px solid #cbd5e1',
              }}>{member.isActive ? '● Active' : '○ Inactive'}</span>
              {member.category && (
                <span style={{ padding: '6px 16px', fontSize: '0.9rem', fontWeight: 700, borderRadius: 16, background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)', color: '#0f766e', border: '1.5px solid #14b8a6' }}>
                  {member.category}
                </span>
              )}
            </div>
          </div>

          {/* ── 3-column grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, alignItems: 'start' }}>

            {/* Column 1: Personal + Irish Connection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={cardStyle}>
                <h2 style={cardHeadStyle}>👤 Personal</h2>
                <InfoRow label="Date of Birth" value={member.dateOfBirth} />
                <InfoRow label="Place of Birth" value={member.placeOfBirth} />
                <InfoRow label="Occupation" value={member.occupation} />
              </div>
              <div style={cardStyle}>
                <h2 style={cardHeadStyle}>🍀 Irish Connection</h2>
                {Array.isArray(member.irishConnections) && member.irishConnections.length > 0 ? (
                  member.irishConnections.map((c, idx) => (
                    <div key={idx} style={{ paddingTop: idx > 0 ? 8 : 0, marginTop: idx > 0 ? 8 : 0, borderTop: idx > 0 ? '1px dashed #e2e8f0' : 'none' }}>
                      <InfoRow label="County" value={c.county} />
                      <InfoRow label="Surname" value={c.surname} />
                      <InfoRow label="Connection Type" value={c.type} />
                    </div>
                  ))
                ) : <InfoRow label="Irish Connection" value={null} />}
              </div>
            </div>

            {/* Column 2: Contact + Address */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={cardStyle}>
                <h2 style={cardHeadStyle}>📞 Contact</h2>
                <InfoRow label="Email" value={member.email} />
                {Array.isArray(member.phoneNumbers) && member.phoneNumbers.length > 0
                  ? member.phoneNumbers.map((phone, idx) => (
                      <InfoRow
                        key={idx}
                        label={`${phone.type || 'Phone'}${phone.isPreferred ? ' (Primary)' : ''}`}
                        value={phone.number}
                      />
                    ))
                  : <InfoRow label="Phone" value={null} />
                }
              </div>
              <div style={cardStyle}>
                <h2 style={cardHeadStyle}>📍 Address</h2>
                {Array.isArray(member.addresses) && member.addresses.length > 0 ? (
                  member.addresses.map((addr, idx) => (
                    <div key={idx} style={{ paddingTop: idx > 0 ? 8 : 0, marginTop: idx > 0 ? 8 : 0, borderTop: idx > 0 ? '1px dashed #e2e8f0' : 'none' }}>
                      <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#14b8a6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                        {addr.isCurrent ? '📌 Current' : `📅 ${addr.yearLabel || 'Historical'}`}
                      </div>
                      <InfoRow label="Street" value={addr.street} />
                      {addr.addressLine2 && <InfoRow label="Line 2" value={addr.addressLine2} />}
                      <InfoRow label="City" value={addr.city} />
                      {addr.province && <InfoRow label="Province" value={addr.province} />}
                      <InfoRow label="Country" value={addr.country} />
                      {addr.postalCode && <InfoRow label="Postal Code" value={addr.postalCode} />}
                    </div>
                  ))
                ) : <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>No address on record</p>}
              </div>
            </div>

            {/* Column 3: Membership + Roles + Volunteering */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={cardStyle}>
                <h2 style={cardHeadStyle}>📋 Membership</h2>
                <InfoRow label="Category" value={member.memberCategory || member.category} />
                <InfoRow label="Date Joined" value={member.dateJoined || member.membershipStartDate} />
                <InfoRow label="Date Ended" value={member.dateEnded || member.membershipEndDate} />
                <InfoRow label="Application" value={member.applicationDate} />
                <InfoRow label="Date Approved" value={member.approvalDate || member.dateApproved} />
                <InfoRow label="Approved By" value={member.approvedBy} />
                <InfoRow label="Signed By" value={member.signedBy} />
                <InfoRow label="Proposer" value={member.proposer} />
                <InfoRow label="Seconder(s)" value={member.seconder} />
                <InfoRow label="Proposal Date" value={member.proposalDate} />
                <InfoRow label="Other Societies" value={member.otherSocieties} />
              </div>
              <div style={cardStyle}>
                <h2 style={cardHeadStyle}>🏆 Roles Held</h2>
                {Array.isArray(member.roleFiscalYears) && member.roleFiscalYears.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid #e2e8f0' }}>
                        <th style={{ textAlign: 'left', padding: '6px 6px', fontWeight: 700, color: '#0f766e', fontSize: '0.825rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</th>
                        <th style={{ textAlign: 'left', padding: '6px 6px', fontWeight: 700, color: '#0f766e', fontSize: '0.825rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {member.roleFiscalYears.map((rf, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '7px 6px', fontWeight: 600, color: '#0f172a' }}>{rf.role}</td>
                          <td style={{ padding: '7px 6px', color: '#64748b', fontWeight: 500 }}>{rf.fiscalYear || rf.fiscalYearLabel || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>No roles assigned</p>}
              </div>
              {user && (user.role === 'admin' || user.role === 'private') && (
                <div style={cardStyle}>
                  <h2 style={cardHeadStyle}>🤝 Volunteering</h2>
                  {Array.isArray(member.volunteeringInterests) && member.volunteeringInterests.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {member.volunteeringInterests.map((interest, idx) => (
                        <span key={idx} style={{ padding: '6px 14px', background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)', border: '1.5px solid #14b8a6', borderRadius: 14, fontSize: '0.9rem', fontWeight: 600, color: '#0f766e' }}>
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>No interests recorded</p>}
                </div>
              )}
            </div>
          </div>

          {/* ── Action Bar ── */}
          <div style={{ background: 'white', borderRadius: 10, border: '1.5px solid #14b8a6', padding: '14px 20px', marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', boxShadow: '0 1px 6px rgba(20,184,166,0.1)' }}>
            <Link
              to={user && user.role === "public" ? "/members/historical" : "/members"}
              style={{ ...btnStyle, background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', color: '#1e293b', border: '1.5px solid #cbd5e1', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >← Back</Link>
            {user && (user.role === "admin" || user.role === "private") && (
              <>
                <button style={{ ...btnStyle, background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white', border: '1.5px solid #16a34a' }} onClick={() => window.open(`${API_BASE_URL}/api/export/member/${member.id}/csv`, '_blank')}>📄 Export CSV</button>
                <button style={{ ...btnStyle, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: '1.5px solid #2563eb' }} onClick={() => window.open(`${API_BASE_URL}/api/export/member/${member.id}/pdf`, '_blank')}>📑 Export PDF</button>
              </>
            )}
            {user && user.role === "admin" && (
              <>
                <Link to={`/members/edit/${member.id}`} style={{ ...btnStyle, background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)', color: 'white', border: '1.5px solid #0f766e', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>✏️ Edit</Link>
                <button
                  style={{ ...btnStyle, background: member.isActive || actionLoading ? '#e2e8f0' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: member.isActive || actionLoading ? '#94a3b8' : 'white', border: member.isActive || actionLoading ? '1.5px solid #cbd5e1' : '1.5px solid #059669', cursor: member.isActive || actionLoading ? 'not-allowed' : 'pointer' }}
                  onClick={() => setShowReinstate(true)}
                  disabled={member.isActive || actionLoading}
                >✅ Reinstate</button>
                <button
                  style={{ ...btnStyle, background: !member.isActive || actionLoading ? '#e2e8f0' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: !member.isActive || actionLoading ? '#94a3b8' : 'white', border: !member.isActive || actionLoading ? '1.5px solid #cbd5e1' : '1.5px solid #dc2626', cursor: !member.isActive || actionLoading ? 'not-allowed' : 'pointer' }}
                  onClick={() => setShowDeactivate(true)}
                  disabled={!member.isActive || actionLoading}
                >❌ Deactivate</button>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Confirmation Modals */}
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
              const res = await fetch(`${API_BASE_URL}/api/members/${member.id}/reinstate`, { method: "POST", credentials: "include" });
              if (!res.ok) throw new Error("Failed to reinstate member");
              setShowReinstate(false);
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
              const res = await fetch(`${API_BASE_URL}/api/members/${member.id}/deactivate`, { method: "POST", credentials: "include" });
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
    </MainLayout>
  );
}
