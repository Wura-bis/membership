import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ConfirmModal from "../../components/confirmmodal";
import MainLayout from "../../components/mainlayout";
import { useAuth } from "../../hooks/useauth";
import { API_BASE_URL } from '../../utils/api';
import { T, card, btn, badge, pageHeader } from '../../utils/theme';

export default function MemberProfile() {
  const navigate = useNavigate();
  const [showReinstate, setShowReinstate] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [photoDeleting, setPhotoDeleting] = useState(false);
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
    return (
      <MainLayout>
        <div className="dashboard-container">
          <div style={{ padding: '12px 16px', background: T.redLight, border: `2px solid ${T.redBorder}`, borderRadius: T.radiusMd, color: T.red, fontSize: T.fontBase, fontWeight: '600' }}>
            Access denied: Public users can only view historical members.
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ padding: '12px 16px', background: T.redLight, border: `2px solid ${T.redBorder}`, borderRadius: T.radiusMd, color: T.red, fontSize: T.fontBase, fontWeight: '600' }}>
          {error}
        </div>
      </div>
    </MainLayout>
  );
  if (!member) return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
        </div>
      </div>
    </MainLayout>
  );

  const cardStyle = { ...card, padding: '24px', overflow: 'hidden' };
  const cardHeadStyle = {
    fontSize: T.fontBase, fontWeight: 700, color: T.primary,
    textTransform: 'uppercase', letterSpacing: '0.7px',
    display: 'flex', alignItems: 'center', gap: 8,
    background: T.primaryBg,
    margin: '-24px -24px 16px',
    padding: '10px 16px',
    borderRadius: `${T.radiusLg} ${T.radiusLg} 0 0`,
    borderBottom: `1px solid ${T.primaryMid}`,
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = String(dateStr).split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const InfoRow = ({ label, value }) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <span style={{ fontSize: T.fontSm, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '8.5rem', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: T.fontBase, fontWeight: 600, color: value ? '#1e293b' : T.textLight, wordBreak: 'break-word' }}>
        {value || '—'}
      </span>
    </div>
  );

  const handleDeletePhoto = async () => {
    if (!window.confirm('Remove this member\'s photo?')) return;
    setPhotoDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/members/${id}/photos`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) setMember(prev => ({ ...prev, photo: null }));
    } finally {
      setPhotoDeleting(false);
    }
  };

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>

          {/* ── Profile Hero Card ── */}
          <div style={{ ...card, marginBottom: 20, overflow: 'hidden' }}>
            {/* Soft mint identity band */}
            <div style={{
              background: `linear-gradient(135deg, ${T.primaryBg} 0%, ${T.primaryMid} 100%)`,
              padding: '28px 28px 24px',
              display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: T.white, border: `3px solid ${T.primaryBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {member.photo
                    ? <img src={`${API_BASE_URL}/uploads/photos/${member.photo}`} alt="Member" style={{ width: 72, height: 72, objectFit: 'cover' }} />
                    : <span style={{ fontSize: '2rem' }}>👤</span>
                  }
                </div>
                {user && user.role === 'admin' && member.photo && (
                  <button onClick={handleDeletePhoto} disabled={photoDeleting} style={{ fontSize: '0.7rem', color: T.red, background: 'none', border: 'none', cursor: photoDeleting ? 'not-allowed' : 'pointer', padding: 0, fontWeight: 600, opacity: photoDeleting ? 0.5 : 1 }}>
                    {photoDeleting ? 'Removing…' : '× Remove photo'}
                  </button>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontSize: '1.571rem', fontWeight: '800', color: T.primary, margin: 0, letterSpacing: '-0.01em' }}>
                  {member.firstName} {member.lastName}
                </h1>
                <p style={{ fontSize: T.fontMd, fontWeight: '500', color: T.textMuted, margin: '5px 0 0' }}>
                  Member #{(member.memberNumber ?? member.id)?.toString().padStart(4, '0')}
                </p>
              </div>
              {member.category && (() => {
                const cat = member.category.toLowerCase();
                const isActiveCategory = cat === 'active' || cat === 'honorary';
                return <span style={isActiveCategory ? badge.active : badge.inactive}>{member.category}</span>;
              })()}
            </div>
            {/* Action buttons footer — Back on left, everything else on right */}
            <div style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', borderTop: `1px solid ${T.primaryMid}`, background: T.white }}>
              <button
                onClick={() => navigate(-1)}
                style={btn.ghost}
              >← Back</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {user && user.role === "admin" && (
                  <>
                    <button
                      style={{ ...btn.success, opacity: member.isActive || actionLoading ? 0.4 : 1, cursor: member.isActive || actionLoading ? 'not-allowed' : 'pointer' }}
                      onClick={() => setShowReinstate(true)}
                      disabled={member.isActive || actionLoading}
                    >✅ Reinstate</button>
                    <button
                      style={{ ...btn.danger, opacity: !member.isActive || actionLoading ? 0.4 : 1, cursor: !member.isActive || actionLoading ? 'not-allowed' : 'pointer' }}
                      onClick={() => setShowDeactivate(true)}
                      disabled={!member.isActive || actionLoading}
                    >Deactivate</button>
                    <Link to="/members/new" style={{ ...btn.ghost, background: T.primaryBg, border: `1.5px solid ${T.primaryBorder}`, color: T.primary, textDecoration: 'none' }}>➕ Add Member</Link>
                  </>
                )}
                {user && (user.role === 'admin' || user.role === 'private') && (
                  <>
                    <button style={btn.exportCsv} onClick={() => window.open(`${API_BASE_URL}/api/export/member/${member.id}/csv`, '_blank')}>📄 CSV</button>
                    <button style={btn.exportPdf} onClick={() => window.open(`${API_BASE_URL}/api/export/member/${member.id}/pdf`, '_blank')}>📑 PDF</button>
                  </>
                )}
                {user && user.role === "admin" && (
                  <Link to={`/members/edit/${member.id}`} replace style={{ ...btn.primary, textDecoration: 'none' }}>✏️ Edit</Link>
                )}
              </div>
            </div>
          </div>

          {/* ── Card flow — browser balances column heights automatically ── */}
          <div style={{ columns: '360px 3', columnGap: '20px' }}>

            <div style={{ breakInside: 'avoid', marginBottom: 16 }}>
              <div style={cardStyle}>
                <h2 style={cardHeadStyle}>👤 Personal</h2>
                <InfoRow label="Date of Birth" value={formatDate(member.dateOfBirth)} />
                <InfoRow label="Place of Birth" value={member.placeOfBirth} />
                <InfoRow label="Occupation" value={member.occupation} />
              </div>
            </div>

            <div style={{ breakInside: 'avoid', marginBottom: 16 }}>
              <div style={cardStyle}>
                <h2 style={cardHeadStyle}>🍀 Irish Connection</h2>
                {Array.isArray(member.irishConnections) && member.irishConnections.length > 0 ? (
                  member.irishConnections.map((c, idx) => (
                    <div key={idx} style={{ paddingTop: idx > 0 ? 8 : 0, marginTop: idx > 0 ? 8 : 0, borderTop: idx > 0 ? `1px dashed ${T.slateBorder}` : 'none' }}>
                      <InfoRow label="County" value={c.countyName} />
                      <InfoRow label="Surname" value={c.surname} />
                      <InfoRow label="Connection Type" value={c.type} />
                    </div>
                  ))
                ) : <InfoRow label="Irish Connection" value={null} />}
              </div>
            </div>

            <div style={{ breakInside: 'avoid', marginBottom: 16 }}>
              <div style={cardStyle}>
                <h2 style={cardHeadStyle}>📞 Contact</h2>
                <InfoRow label="Email" value={member.email} />
                {Array.isArray(member.phoneNumbers) && member.phoneNumbers.length > 0
                  ? [...new Map(member.phoneNumbers.map(p => [`${p.type}|${p.number}`, p])).values()].map((phone, idx) => (
                      <InfoRow
                        key={idx}
                        label={`${phone.type || 'Phone'}${phone.isPreferred ? ' (Primary)' : ''}`}
                        value={phone.number}
                      />
                    ))
                  : <InfoRow label="Phone" value={null} />
                }
              </div>
            </div>

            <div style={{ breakInside: 'avoid', marginBottom: 16 }}>
              <div style={cardStyle}>
                <h2 style={cardHeadStyle}>📋 Membership</h2>
                <InfoRow label="Category" value={member.memberCategory || member.category} />
                <InfoRow label="Date Joined" value={formatDate(member.dateJoined || member.membershipStartDate)} />
                <InfoRow label="Date Ended" value={formatDate(member.dateEnded || member.membershipEndDate)} />
                <InfoRow label="Application" value={formatDate(member.applicationDate)} />
                <InfoRow label="Date Approved" value={formatDate(member.approvalDate || member.dateApproved)} />
                <InfoRow label="Approved By" value={member.approvedBy} />
                <InfoRow label="Signed By" value={member.signedBy} />
                <InfoRow label="Proposer" value={member.proposer} />
                <InfoRow label="Seconder(s)" value={member.seconder} />
                <InfoRow label="Proposal Date" value={formatDate(member.proposalDate)} />
                <InfoRow label="Other Societies" value={member.otherSocieties} />
              </div>
            </div>

            <div style={{ breakInside: 'avoid', marginBottom: 16 }}>
              <div style={cardStyle}>
                <h2 style={cardHeadStyle}>📍 Address</h2>
                {Array.isArray(member.addresses) && member.addresses.length > 0 ? (
                  member.addresses.map((addr, idx) => (
                    <div key={idx} style={{ paddingTop: idx > 0 ? 8 : 0, marginTop: idx > 0 ? 8 : 0, borderTop: idx > 0 ? `1px dashed ${T.slateBorder}` : 'none' }}>
                      <div style={{ fontSize: T.fontSm, fontWeight: 700, color: T.primaryLight, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                        {addr.isCurrent ? '📌 Current' : `📍 Other`}
                      </div>
                      <InfoRow label="Street" value={addr.street} />
                      {addr.addressLine2 && <InfoRow label="Line 2" value={addr.addressLine2} />}
                      <InfoRow label="City" value={addr.city} />
                      {addr.province && <InfoRow label="Province" value={addr.province} />}
                      <InfoRow label="Country" value={addr.country} />
                      {addr.postalCode && <InfoRow label="Postal Code" value={addr.postalCode} />}
                    </div>
                  ))
                ) : <p style={{ color: T.textLight, fontSize: T.fontBase, margin: 0 }}>No address on record</p>}
              </div>
            </div>

            <div style={{ breakInside: 'avoid', marginBottom: 16 }}>
              <div style={cardStyle}>
                <h2 style={cardHeadStyle}>🏆 Roles Held</h2>
                {Array.isArray(member.roleFiscalYears) && member.roleFiscalYears.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: T.fontBase }}>
                    <thead>
                      <tr style={{ borderBottom: `1.5px solid ${T.primaryMid}` }}>
                        <th style={{ textAlign: 'left', padding: '5px 6px', fontWeight: 700, color: T.textMain, fontSize: T.fontSm, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</th>
                        <th style={{ textAlign: 'left', padding: '5px 6px', fontWeight: 700, color: T.textMain, fontSize: T.fontSm, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...member.roleFiscalYears].sort((a, b) => (a.yearLabel || '').localeCompare(b.yearLabel || '') || (a.roleName || '').localeCompare(b.roleName || '')).map((rf, idx) => (
                        <tr key={idx} style={{ borderBottom: `1px solid ${T.primaryMid}` }}>
                          <td style={{ padding: '6px 6px', fontWeight: 600, color: '#1e293b' }}>{rf.roleName}</td>
                          <td style={{ padding: '6px 6px', color: T.textMuted, fontWeight: 500 }}>{rf.yearLabel || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p style={{ color: T.textLight, fontSize: T.fontBase, margin: 0 }}>No roles assigned</p>}
              </div>
            </div>

            {user && (user.role === 'admin' || user.role === 'private') && (
              <div style={{ breakInside: 'avoid', marginBottom: 16 }}>
                <div style={cardStyle}>
                  <h2 style={cardHeadStyle}>🤝 Volunteering</h2>
                  {Array.isArray(member.volunteeringInterests) && member.volunteeringInterests.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {member.volunteeringInterests.map((interest, idx) => (
                        <span key={idx} style={{ padding: '4px 12px', background: `linear-gradient(135deg, ${T.primaryBg} 0%, ${T.primaryMid} 100%)`, border: `1px solid ${T.primaryLight}`, borderRadius: 14, fontSize: T.fontSm, fontWeight: 600, color: T.primary }}>
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : <p style={{ color: T.textLight, fontSize: T.fontBase, margin: 0 }}>No interests recorded</p>}
                </div>
              </div>
            )}

          </div>

          {/* Notes — full width below the column flow */}
          {user && (user.role === 'admin' || user.role === 'private') && member.notes && (
            <div style={{ ...cardStyle, marginBottom: 16 }}>
              <h2 style={cardHeadStyle}>📝 Notes</h2>
              <div style={{ fontSize: T.fontBase, fontWeight: 500, color: '#1e293b', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {member.notes}
              </div>
            </div>
          )}


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
              const updated = await fetch(`${API_BASE_URL}/api/members/${member.id}`, { credentials: "include" });
              if (updated.ok) setMember(await updated.json());
              setShowReinstate(false);
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
              const updated = await fetch(`${API_BASE_URL}/api/members/${member.id}`, { credentials: "include" });
              if (updated.ok) setMember(await updated.json());
              setShowDeactivate(false);
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
