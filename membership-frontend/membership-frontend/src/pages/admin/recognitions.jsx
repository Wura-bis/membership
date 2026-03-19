import { useState, useEffect } from "react";
import MainLayout from "../../components/mainlayout";
import { useAuth } from "../../hooks/useauth";
import { useToast } from "../../components/toast";
import CreatableSelect from '../../components/creatableselect';
import { API_BASE_URL } from '../../utils/api';

function AdminRecognitions() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newRecognition, setNewRecognition] = useState({ title: '', description: '', recognitionTypeId: '', fiscalYearId: '', isActive: true });
  const [recognitionTypes, setRecognitionTypes] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  // ...existing code...
  useEffect(() => {
    fetchFiscalYears();
  }, []);
  // Optionally, call fetchFiscalYears when opening add/edit modal if you want freshest data

  // Always fetch recognition types when opening add/edit modal
  const fetchRecognitionTypes = () => {
    fetch(`${API_BASE_URL}/api/recognition-types`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setRecognitionTypes(data));
  };
  // Add logic
  const handleAdd = () => {
    fetchRecognitionTypes();
    fetch(`${API_BASE_URL}/api/fiscal-years`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setFiscalYears(data));
    setNewRecognition({ title: '', description: '', recognitionTypeId: '', fiscalYearId: '', isActive: true });
    setAddModalOpen(true);
  };

  const saveAdd = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/recognitions/old`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: newRecognition.title,
          description: newRecognition.description,
          recognitionTypeId: newRecognition.recognitionTypeId,
          fiscalYearId: newRecognition.fiscalYearId,
          isActive: newRecognition.isActive
        })
      });
      if (response.ok) {
        showToast('Recognition added', 'success');
        loadRecognitions();
        setAddModalOpen(false);
      } else {
        showToast('Failed to add recognition', 'error');
      }
    } catch (err) {
      showToast('Error adding recognition', 'error');
    }
  };
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecognition, setEditRecognition] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, recognition: null });
  // Delete logic
  const handleDelete = (recognition) => {
    setDeleteConfirm({ open: true, recognition });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.recognition) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/recognitions/${deleteConfirm.recognition.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        showToast('Recognition deleted', 'success');
        loadRecognitions();
      } else {
        showToast('Failed to delete recognition', 'error');
      }
    } catch (err) {
      showToast('Error deleting recognition', 'error');
    }
    setDeleteConfirm({ open: false, recognition: null });
  };

  // Edit logic
  const fetchFiscalYears = () => {
    fetch(`${API_BASE_URL}/api/fiscal-years`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        // Map backend {FiscalYearID, YearLabel} to {value, label}
        const mapped = Array.isArray(data)
          ? data.map(y => ({ value: y.id ?? y.FiscalYearID, label: y.label ?? y.yearLabel }))
          : [];
        setFiscalYears(mapped);
      });
  };
  const handleEdit = (recognition) => {
    fetchRecognitionTypes();
    fetch(`${API_BASE_URL}/api/fiscal-years`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        // Map backend {FiscalYearID, YearLabel} to {value, label}
        const mapped = Array.isArray(data)
          ? data.map(y => ({ value: y.id ?? y.FiscalYearID, label: y.label ?? y.yearLabel }))
          : [];
        setFiscalYears(mapped);
        // Find fiscal year ID for this recognition
        let fyId = recognition.fiscalYearId || recognition.fiscalYearID || recognition.fiscalYear;
        if (typeof fyId === 'string') {
          // If it's a label, find the matching ID
          const match = mapped.find(fy => fy.label === fyId);
          fyId = match ? match.value : '';
        }
        // Ensure id is set
        setEditRecognition({ ...recognition, fiscalYearId: fyId, id: recognition.id ?? recognition.RecognitionID });
        setEditModalOpen(true);
      });
  };

  const saveEdit = async (updated) => {
    console.log('saveEdit called with:', updated);
    if (!updated.id) {
      showToast('Recognition ID missing, cannot update.', 'error');
      setEditModalOpen(false);
      setEditRecognition(null);
      return;
    }
    // Find fiscal year object from fiscalYears list
    const fyObj = fiscalYears.find(fy => fy.value === updated.fiscalYearId || fy.label === updated.fiscalYearId);
    let fyId = fyObj ? fyObj.value : updated.fiscalYearId;
    let fyLabel = fyObj ? fyObj.label : updated.fiscalYearId;
    // Validate fiscal year is not future-dated
    try {
      const endYear = parseInt((fyLabel || '').split('-')[1]);
      const currentYear = new Date().getFullYear();
      if (endYear > currentYear) {
        showToast('Fiscal year cannot be in the future.', 'error');
        return;
      }
    } catch (e) { /* ignore parse errors */ }
    try {
      const response = await fetch(`${API_BASE_URL}/api/recognitions/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: updated.title,
          description: updated.description,
          recognitionTypeId: updated.recognitionTypeId,
          fiscalYearId: fyId,
          isActive: updated.isActive
        })
      });
      if (response.ok) {
        showToast('Recognition updated', 'success');
        loadRecognitions();
      } else {
        const errMsg = await response.text();
        showToast('Failed to update recognition: ' + errMsg, 'error');
      }
    } catch (err) {
      showToast('Error updating recognition', 'error');
    }
    setEditModalOpen(false);
    setEditRecognition(null);
  };
  const { user } = useAuth();
  const [recognitions, setRecognitions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    loadRecognitions();
  }, []);

  const loadRecognitions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recognitions/old`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Raw recognitions data from backend:', data);
        // Ensure each recognition has a valid 'id' property
        const normalized = Array.isArray(data)
          ? data.map(r => ({ ...r, id: r.id ?? r.RecognitionID ?? r.recognitionID }))
          : [];
        setRecognitions(normalized);
      }
    } catch (error) {
      console.error("Error loading recognitions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ padding: '20px' }}>
        {/* Delete Confirmation Dialog */}
        {deleteConfirm.open && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: 32, borderRadius: 8, maxWidth: 400, margin: '100px auto', boxShadow: '0 2px 8px #0002' }}>
              <h3>Delete Recognition</h3>
              <p>Are you sure you want to delete this recognition?</p>
              <div style={{ marginBottom: 16 }}><strong>{deleteConfirm.recognition?.description}</strong></div>
              <button style={{ marginRight: 8, background: '#ef4444', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4 }} onClick={confirmDelete}>Delete</button>
              <button style={{ background: '#e5e7eb', color: '#374151', padding: '8px 16px', border: 'none', borderRadius: 4 }} onClick={() => setDeleteConfirm({ open: false, recognition: null })}>Cancel</button>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModalOpen && editRecognition && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: 32, borderRadius: 8, maxWidth: 500, margin: '100px auto', boxShadow: '0 2px 8px #0002' }}>
              <h3>Edit Recognition</h3>
              <form onSubmit={e => { e.preventDefault(); saveEdit(editRecognition); }}>
                <div style={{ marginBottom: 12 }}>
                  <label>Title:<br />
                    <input type="text" value={editRecognition.title ?? ''} onChange={e => setEditRecognition({ ...editRecognition, title: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #e5e7eb' }} required />
                  </label>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Description:<br />
                    <textarea value={editRecognition.description ?? ''} onChange={e => setEditRecognition({ ...editRecognition, description: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #e5e7eb' }} required />
                  </label>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Type:<br />
                    <select value={editRecognition.recognitionTypeId ?? ''} onChange={e => setEditRecognition({ ...editRecognition, recognitionTypeId: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #e5e7eb' }} required>
                      <option value="">Select type...</option>
                      {recognitionTypes.map((type, idx) => (
                        <option key={type.id ?? `type-idx-${idx}`} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>
                    <CreatableSelect
                      label="Fiscal Year"
                      name="fiscalYearId"
                      value={editRecognition.fiscalYearId}
                      options={fiscalYears}
                      onChange={e => setEditRecognition({ ...editRecognition, fiscalYearId: e.target.value })}
                      onCreate={async (inputYear) => {
                        // POST to backend to create year, then refresh
                        const res = await fetch(`${API_BASE_URL}/api/lookups/fiscal-years`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ yearLabel: inputYear })
                        });
                        if (res.ok) {
                          fetchFiscalYears();
                        }
                      }}
                      placeholder="Type or select year..."
                    />
                  </label>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Status:<br />
                    <select value={editRecognition.isActive ? '1' : '0'} onChange={e => setEditRecognition({ ...editRecognition, isActive: e.target.value === '1' })} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #e5e7eb' }}>
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </label>
                </div>
                <div style={{ marginTop: 16 }}>
                  <button type="submit" style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, marginRight: 8 }}>Save</button>
                  <button type="button" style={{ background: '#e5e7eb', color: '#374151', padding: '8px 16px', border: 'none', borderRadius: 4 }} onClick={() => { setEditModalOpen(false); setEditRecognition(null); }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h1 style={{ margin: 0, color: '#1f2937' }}>Recognition Management</h1>
          <button 
            style={{
              padding: '10px 20px',
              backgroundColor: '#14b8a6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            onClick={handleAdd}
          >
            Add Recognition
          </button>
        {/* Add Modal */}
        {addModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: 32, borderRadius: 8, maxWidth: 500, margin: '100px auto', boxShadow: '0 2px 8px #0002' }}>
              <h3>Add Recognition</h3>
              <form onSubmit={saveAdd}>
                <div style={{ marginBottom: 12 }}>
                  <label>Title:<br />
                    <input type="text" value={newRecognition.title} onChange={e => setNewRecognition({ ...newRecognition, title: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #e5e7eb' }} required />
                  </label>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Description:<br />
                    <textarea value={newRecognition.description} onChange={e => setNewRecognition({ ...newRecognition, description: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #e5e7eb' }} required />
                  </label>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Type:<br />
                    <select value={newRecognition.recognitionTypeId} onChange={e => setNewRecognition({ ...newRecognition, recognitionTypeId: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #e5e7eb' }} required>
                      <option value="">Select type...</option>
                      {recognitionTypes.map((type, idx) => (
                        <option key={type.id ?? `type-idx-${idx}`} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Fiscal Year:<br />
                    <CreatableSelect
                      label="Fiscal Year"
                      name="fiscalYearId"
                      value={newRecognition.fiscalYearId}
                      options={fiscalYears}
                      onChange={e => setNewRecognition({ ...newRecognition, fiscalYearId: e.target.value })}
                      onCreate={async (inputYear) => {
                        // POST to backend to create year, then refresh
                        const res = await fetch(`${API_BASE_URL}/api/lookups/fiscal-years`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ yearLabel: inputYear })
                        });
                        if (res.ok) {
                          fetchFiscalYears();
                        }
                      }}
                      placeholder="Type or select year..."
                    />
                  </label>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Status:<br />
                    <select value={newRecognition.isActive ? '1' : '0'} onChange={e => setNewRecognition({ ...newRecognition, isActive: e.target.value === '1' })} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #e5e7eb' }}>
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </label>
                </div>
                <div style={{ marginTop: 16 }}>
                  <button type="submit" style={{ background: '#14b8a6', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, marginRight: 8 }}>Add</button>
                  <button type="button" style={{ background: '#e5e7eb', color: '#374151', padding: '8px 16px', border: 'none', borderRadius: 4 }} onClick={() => setAddModalOpen(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>

        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Title</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Society</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Fiscal Year</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recognitions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    color: '#6b7280' 
                  }}>
                    No recognitions found
                  </td>
                </tr>
              ) : (
                (() => {
                  try {
                    return recognitions.map((recognition, idx) => (
                      <tr key={recognition?.id ? `rec-${recognition.id}` : `rec-idx-${idx}`}>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{recognition?.title ?? 'N/A'}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{recognition?.description ?? 'N/A'}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{recognition?.type ?? 'N/A'}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{recognition?.society ?? 'N/A'}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{recognition?.fiscalYear ?? 'N/A'}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor: recognition?.isActive ? '#dcfce7' : '#fee2e2',
                            color: recognition?.isActive ? '#166534' : '#991b1b'
                          }}>
                            {recognition?.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                          <button 
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              marginRight: '5px',
                              fontSize: '12px'
                            }}
                            onClick={() => handleEdit(recognition)}
                          >
                            Edit
                          </button>
                          <button 
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            onClick={() => handleDelete(recognition)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  } catch (err) {
                    return (
                      <tr>
                        <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#991b1b' }}>
                          Error rendering recognitions: {String(err)}
                        </td>
                      </tr>
                    );
                  }
                })()
              )}
            </tbody>
          </table>
        </div>

      </div>
    </MainLayout>
  );
}

export default AdminRecognitions;