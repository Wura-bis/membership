import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useStickyScrollbar } from "../../hooks/useStickyScrollbar";
import MainLayout from "../../components/mainlayout";
import { useToast } from "../../components/toast";
import { API_BASE_URL } from '../../utils/api';
import { T, card, btn, badge, thStyle, tdStyle, pageHeader } from '../../utils/theme';

const inputStyle = {
  width: '100%', padding: '9px 12px',
  border: `1.5px solid ${T.primaryBorder}`,
  borderRadius: T.radiusMd, fontSize: T.fontBase,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  background: 'var(--card-bg)', color: 'var(--text-primary)',
};

const labelStyle = {
  display: 'block', fontSize: T.fontSm, fontWeight: '600',
  color: T.textMain, marginBottom: '5px',
};

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{ ...card, padding: '28px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: T.fontLg, fontWeight: '700', color: T.textMain }}>{title}</h2>
          <button onClick={onClose} style={{ ...btn.ghost, padding: '4px 10px', fontSize: T.fontLg }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AdminRecognitions() {
  const { showToast } = useToast();
  const [recognitions, setRecognitions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recognitionTypes, setRecognitionTypes] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberFilter, setMemberFilter] = useState('');

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newRec, setNewRec] = useState({ memberId: '', recognitionTypeId: '', notes: '', isActive: true });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, recognition: null });
  const { tableWrapRef, mirrorScrollbar } = useStickyScrollbar([recognitions]);

  useEffect(() => {
    loadRecognitions();
    fetch(`${API_BASE_URL}/api/recognition-types`, { credentials: 'include' })
      .then(r => r.json()).then(data => setRecognitionTypes(Array.isArray(data) ? data : []));
    fetch(`${API_BASE_URL}/api/members`, { credentials: 'include' })
      .then(r => r.json()).then(data => setMembers(Array.isArray(data) ? data : []));
  }, []);

  const loadRecognitions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/recognitions`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRecognitions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error loading recognitions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMembers = members.filter(m =>
    !memberFilter ||
    `${m.lastName} ${m.firstName}`.toLowerCase().includes(memberFilter.toLowerCase())
  );

  const handleAdd = () => {
    setMemberFilter('');
    setNewRec({ memberId: '', recognitionTypeId: '', notes: '', isActive: true });
    setAddModalOpen(true);
  };

  const saveAdd = async (e) => {
    e.preventDefault();
    if (!newRec.memberId || !newRec.recognitionTypeId) {
      showToast('Please select a member and recognition type', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/recognitions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          memberId: parseInt(newRec.memberId),
          recognitionTypeId: parseInt(newRec.recognitionTypeId),
          notes: newRec.notes,
        }),
      });
      if (res.ok) {
        showToast('Recognition added', 'success');
        loadRecognitions();
        setAddModalOpen(false);
      } else showToast('Failed to add recognition', 'error');
    } catch { showToast('Error adding recognition', 'error'); }
  };

  const handleEdit = (recognition) => {
    setEditRec({ ...recognition });
    setEditModalOpen(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editRec?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/recognitions/${editRec.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes: editRec.notes, isActive: editRec.isActive }),
      });
      if (res.ok) {
        showToast('Recognition updated', 'success');
        loadRecognitions();
        setEditModalOpen(false);
        setEditRec(null);
      } else showToast('Failed to update recognition', 'error');
    } catch { showToast('Error updating recognition', 'error'); }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.recognition) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/recognitions/${deleteConfirm.recognition.id}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (res.ok) { showToast('Recognition deleted', 'success'); loadRecognitions(); }
      else showToast('Failed to delete recognition', 'error');
    } catch { showToast('Error deleting recognition', 'error'); }
    setDeleteConfirm({ open: false, recognition: null });
  };

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          <div style={pageHeader.wrapper}>
            <div>
              <h1 style={pageHeader.title}>Recognition Management</h1>
              <p style={pageHeader.subtitle}>Manage member recognitions and awards</p>
            </div>
            <button onClick={handleAdd} style={btn.primary}>+ Add Recognition</button>
          </div>

          {addModalOpen && (
            <Modal title="Add Recognition" onClose={() => setAddModalOpen(false)}>
              <form onSubmit={saveAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Filter Members</label>
                  <input
                    type="text"
                    placeholder="Type name to filter..."
                    value={memberFilter}
                    onChange={e => setMemberFilter(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Member *</label>
                  <select value={newRec.memberId} onChange={e => setNewRec({ ...newRec, memberId: e.target.value })} style={inputStyle} required>
                    <option value="">Select member...</option>
                    {filteredMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.lastName}, {m.firstName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Recognition Type *</label>
                  <select value={newRec.recognitionTypeId} onChange={e => setNewRec({ ...newRec, recognitionTypeId: e.target.value })} style={inputStyle} required>
                    <option value="">Select type...</option>
                    {recognitionTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Notes</label>
                  <textarea
                    value={newRec.notes}
                    onChange={e => setNewRec({ ...newRec, notes: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', lineHeight: '1.5' }}
                    placeholder="Optional notes..."
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                  <button type="submit" style={btn.primary}>Add Recognition</button>
                  <button type="button" onClick={() => setAddModalOpen(false)} style={btn.ghost}>Cancel</button>
                </div>
              </form>
            </Modal>
          )}

          {editModalOpen && editRec && (
            <Modal title="Edit Recognition" onClose={() => { setEditModalOpen(false); setEditRec(null); }}>
              <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Member</label>
                  <input type="text" value={editRec.memberName ?? ''} disabled style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
                </div>
                <div>
                  <label style={labelStyle}>Recognition Type</label>
                  <input type="text" value={editRec.recognitionType ?? ''} disabled style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
                </div>
                <div>
                  <label style={labelStyle}>Notes</label>
                  <textarea
                    value={editRec.notes ?? ''}
                    onChange={e => setEditRec({ ...editRec, notes: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', lineHeight: '1.5' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={editRec.isActive ? '1' : '0'} onChange={e => setEditRec({ ...editRec, isActive: e.target.value === '1' })} style={inputStyle}>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                  <button type="submit" style={btn.primary}>Save Changes</button>
                  <button type="button" onClick={() => { setEditModalOpen(false); setEditRec(null); }} style={btn.ghost}>Cancel</button>
                </div>
              </form>
            </Modal>
          )}

          {deleteConfirm.open && (
            <Modal title="Delete Recognition" onClose={() => setDeleteConfirm({ open: false, recognition: null })}>
              <p style={{ color: T.textMuted, marginBottom: '12px' }}>Are you sure you want to delete this recognition?</p>
              <p style={{ fontWeight: '700', color: T.textMain, marginBottom: '24px' }}>
                {deleteConfirm.recognition?.memberName} — {deleteConfirm.recognition?.recognitionType}
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={confirmDelete} style={btn.danger}>Delete</button>
                <button onClick={() => setDeleteConfirm({ open: false, recognition: null })} style={btn.ghost}>Cancel</button>
              </div>
            </Modal>
          )}

          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
              <div className="spinner" style={{ width: '36px', height: '36px', borderColor: 'rgba(78,93,46,0.2)', borderTopColor: T.primary }} />
            </div>
          ) : (
            <div ref={tableWrapRef} style={{ ...card, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: T.fontBase }}>
                <thead>
                  <tr>
                    {['Member', 'Recognition Type', 'Notes', 'Status', 'Actions'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recognitions.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: T.textMuted, padding: '40px' }}>
                        No recognitions found
                      </td>
                    </tr>
                  ) : recognitions.map((r, idx) => (
                    <tr key={r.id ?? idx} style={{ background: idx % 2 === 0 ? 'var(--card-bg)' : 'var(--bg-secondary)' }}>
                      <td style={{ ...tdStyle, fontWeight: '600' }}>
                        <Link to={`/members/${r.memberId}`} style={{ color: T.primary, textDecoration: 'none' }}>
                          {r.memberName ?? '—'}
                        </Link>
                      </td>
                      <td style={{ ...tdStyle, color: T.textMuted }}>{r.recognitionType ?? '—'}</td>
                      <td style={{ ...tdStyle, color: T.textMuted, maxWidth: '250px' }}>{r.notes || '—'}</td>
                      <td style={tdStyle}>
                        <span style={r.isActive ? badge.active : badge.inactive}>
                          {r.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleEdit(r)} style={{ ...btn.warning, padding: '4px 10px', fontSize: T.fontSm }}>Edit</button>
                          <button onClick={() => setDeleteConfirm({ open: true, recognition: r })} style={{ ...btn.danger, padding: '4px 10px', fontSize: T.fontSm }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {mirrorScrollbar}
        </div>
      </div>
    </MainLayout>
  );
}

export default AdminRecognitions;
