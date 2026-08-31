import { useState, useEffect } from "react";
import MainLayout from "../../components/mainlayout";
import { useAuth } from "../../hooks/useauth";
import { useToast } from "../../components/toast";
import { LoadingSpinner, TableSkeleton } from "../../components/loading";
import { ActionButton, StatusBadge } from "../../components/ui";
import { API_BASE_URL } from '../../utils/api';
import { T, card, btn, pageHeader } from '../../utils/theme';

export default function SupportTickets() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseForm, setResponseForm] = useState({
    status: '',
    admin_response: ''
  });
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all'
  });
  const [search, setSearch] = useState('');
  const [tableError, setTableError] = useState(null);
  const [creatingTable, setCreatingTable] = useState(false);

  // Admin access check
  if (!user || user.role !== "admin") {
    return (
      <MainLayout>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>Access Denied</h1>
          <p>You must be an administrator to access support ticket management.</p>
        </div>
      </MainLayout>
    );
  }

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    setTableError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/support/tickets`, {
        credentials: "include"
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setTickets(data.tickets || []);
      } else {
        // Check if it's a table not found error
        if (data.error && data.error.includes('table not found')) {
          setTableError(data.error);
        } else {
          showToast(data.error || "Failed to load support tickets", "error");
        }
      }
    } catch (err) {
      showToast("Error loading tickets: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    setCreatingTable(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/support/create-table`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Support tickets table created successfully!", "success");
        setTableError(null);
        fetchTickets(); // Reload tickets
      } else {
        showToast(data.error || "Failed to create table", "error");
      }
    } catch (err) {
      showToast("Error creating table: " + err.message, "error");
    } finally {
      setCreatingTable(false);
    }
  };

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setResponseForm({
      status: ticket.status,
      priority: ticket.priority || 'normal',
      admin_response: ticket.admin_response || ''
    });
    setShowResponseModal(true);
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    setSubmittingResponse(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/support/tickets/${selectedTicket.ticket_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(responseForm)
      });
      
      if (res.ok) {
        showToast("Ticket updated successfully!", "success");
        setShowResponseModal(false);
        fetchTickets(); // Refresh the list
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to update ticket", "error");
      }
    } catch (err) {
      showToast("Error updating ticket: " + err.message, "error");
    } finally {
      setSubmittingResponse(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return { bg: T.redLight, color: T.red };
      case 'in-progress': return { bg: T.amberLight, color: T.amber };
      case 'resolved': return { bg: T.greenLight, color: T.green };
      case 'closed': return { bg: T.slateLight, color: T.slate };
      default: return { bg: T.slateLight, color: T.slate };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return { bg: T.redLight, color: T.red };
      case 'high': return { bg: '#fed7aa', color: '#ea580c' };
      case 'normal': return { bg: '#e0f2fe', color: '#0369a1' };
      default: return { bg: '#e0f2fe', color: '#0369a1' };
    }
  };

  const q = search.trim().toLowerCase();
  const filteredTickets = tickets.filter(t => {
    if (filters.status !== 'all' && t.status !== filters.status) return false;
    if (filters.priority !== 'all' && t.priority !== filters.priority) return false;
    if (q && !`${t.subject} ${t.user_name} ${t.user_email}`.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={pageHeader.wrapper}>
            <div>
              <h1 style={pageHeader.title}>🎫 Support Tickets</h1>
              <p style={pageHeader.subtitle}>Manage and respond to member support requests</p>
            </div>
          </div>

          {/* Filters */}
          <div style={{ ...card, padding: '20px 24px', marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 220px', minWidth: '200px' }}>
              <label style={{ fontSize: T.fontBase, fontWeight: '700', color: T.textMain, display: 'block', marginBottom: '6px' }}>
                🔍 Search:
              </label>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by subject, name or email…"
                className="form-input"
                style={{ width: '100%', minWidth: '200px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: T.fontBase, fontWeight: '700', color: T.textMain, display: 'block', marginBottom: '6px' }}>
                📊 Status:
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="form-input"
                style={{ width: 'auto', minWidth: '160px' }}
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: T.fontBase, fontWeight: '700', color: T.textMain, display: 'block', marginBottom: '6px' }}>
                🔥 Priority:
              </label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="form-input"
                style={{ width: 'auto', minWidth: '140px' }}
              >
                <option value="all">All Priorities</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div style={{ marginLeft: 'auto' }}>
              <div style={{ background: `linear-gradient(135deg, ${T.primaryLight} 0%, ${T.primary} 100%)`, color: T.white, padding: '10px 20px', borderRadius: T.radiusMd, fontSize: T.fontBase, fontWeight: '700' }}>
                {filteredTickets.length}{filteredTickets.length !== tickets.length ? `/${tickets.length}` : ''} {filteredTickets.length !== 1 ? 'Tickets' : 'Ticket'}
              </div>
            </div>
          </div>

          {/* Table Error Display */}
          {tableError && (
            <div style={{
              background: '#fff1f2',
              border: '2px solid #fecaca',
              borderRadius: '12px',
              padding: '40px 24px',
              marginBottom: '32px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)'
            }}>
              <div style={{ fontSize: 'clamp(40px, 7vw, 56px)', marginBottom: '20px' }}>⚠️</div>
              <h3 style={{ 
                fontSize: 'clamp(16px, 2.2vw, 20px)',
                fontWeight: '700',
                color: '#dc2626', 
                marginBottom: '12px' 
              }}>
                Database Table Missing
              </h3>
              <p style={{ 
                fontSize: '17px',
                fontWeight: '500',
                color: '#991b1b', 
                marginBottom: '24px' 
              }}>
                The support tickets table needs to be created in the database.
              </p>
              <button
                onClick={createTable}
                disabled={creatingTable}
                style={{
                  background: creatingTable 
                    ? '#9ca3af' 
                    : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  color: 'white',
                  border: '2px solid #991b1b',
                  padding: '14px 32px',
                  fontSize: '15px',
                  fontWeight: '700',
                  borderRadius: '12px',
                  cursor: creatingTable ? 'not-allowed' : 'pointer',
                  boxShadow: creatingTable ? 'none' : '0 4px 12px rgba(220, 38, 38, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!creatingTable) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!creatingTable) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
                  }
                }}
              >
                {creatingTable ? '⏳ Creating Table...' : '🔧 Create Support Tickets Table'}
              </button>
            </div>
          )}

          {/* Tickets List */}
          <div style={card}>
            {loading ? (
              <div style={{ padding: '60px' }}>
                <TableSkeleton />
              </div>
            ) : tableError ? (
              <div style={{
                textAlign: 'center',
                padding: '80px 48px',
                color: '#64748b'
              }}>
                <div style={{ fontSize: 'clamp(40px, 7vw, 56px)', marginBottom: '20px' }}>🔧</div>
                <h3 style={{ 
                  fontSize: 'clamp(16px, 2.2vw, 20px)',
                  fontWeight: '700',
                  color: '#4e5d2e',
                  marginBottom: '12px' 
                }}>
                  Setup Required
                </h3>
                <p style={{ 
                  fontSize: '17px',
                  fontWeight: '500',
                  color: '#64748b'
                }}>
                  Please create the support tickets table to continue.
                </p>
              </div>
            ) : tickets.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '80px 48px',
                color: '#64748b'
              }}>
                <div style={{ fontSize: 'clamp(40px, 7vw, 56px)', marginBottom: '20px' }}>🎫</div>
                <h3 style={{
                  fontSize: 'clamp(16px, 2.2vw, 20px)',
                  fontWeight: '700',
                  color: '#4e5d2e',
                  marginBottom: '12px'
                }}>
                  No Support Tickets
                </h3>
                <p style={{ fontSize: '17px', fontWeight: '500', color: '#64748b' }}>
                  No support tickets have been submitted yet.
                </p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 48px', color: '#64748b' }}>
                <div style={{ fontSize: 'clamp(40px, 7vw, 56px)', marginBottom: '20px' }}>🔍</div>
                <h3 style={{ fontSize: 'clamp(16px, 2.2vw, 20px)', fontWeight: '700', color: '#4e5d2e', marginBottom: '12px' }}>
                  No Matching Tickets
                </h3>
                <p style={{ fontSize: '17px', fontWeight: '500', color: '#64748b' }}>
                  Try adjusting your search or filters.
                </p>
              </div>
            ) : (
              <div style={{ overflow: 'hidden' }}>
                {/* Table Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 140px 120px 140px 140px', gap: '20px', padding: '16px 32px', background: T.primaryBg, borderBottom: `2px solid ${T.primaryBorder}`, fontSize: T.fontSm, fontWeight: '700', color: T.textMain, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <div>🎫 Ticket</div>
                  <div>📧 Subject / User</div>
                  <div>🔥 Priority</div>
                  <div>📊 Status</div>
                  <div>📅 Created</div>
                  <div>⚡ Actions</div>
                </div>

                {/* Table Body */}
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.ticket_id}
                    style={{ display: 'grid', gridTemplateColumns: '100px 1fr 140px 120px 140px 140px', gap: '20px', padding: '16px 32px', borderBottom: `1px solid ${T.primaryMid}`, alignItems: 'center', background: T.white, transition: 'background 0.15s', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.primaryBg}
                    onMouseLeave={e => e.currentTarget.style.background = T.white}
                  >
                    <div style={{ fontSize: T.fontBase, fontWeight: '700', color: T.textMain, background: T.primaryBg, padding: '8px 14px', borderRadius: T.radiusMd, border: `1.5px solid ${T.primaryBorder}`, textAlign: 'center' }}>
                      #{ticket.ticket_id}
                    </div>
                    
                    <div>
                      <div style={{ fontSize: T.fontBase, fontWeight: '600', color: T.textMain, marginBottom: '4px' }}>{ticket.subject}</div>
                      <div style={{ fontSize: T.fontSm, fontWeight: '500', color: T.textMuted }}>👤 {ticket.user_name} • 📧 {ticket.user_email}</div>
                    </div>
                    
                    <div>
                      <span style={{
                        ...getPriorityColor(ticket.priority),
                        padding: '8px 12px',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        border: '2px solid currentColor',
                        display: 'inline-block'
                      }}>
                        {ticket.priority === 'urgent' && '🔥 '}
                        {ticket.priority === 'high' && '⚡ '}
                        {ticket.priority === 'normal' && '📋 '}
                        {ticket.priority}
                      </span>
                    </div>
                    
                    <div>
                      <span style={{
                        ...getStatusColor(ticket.status),
                        padding: '8px 12px',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        border: '2px solid currentColor',
                        display: 'inline-block'
                      }}>
                        {ticket.status === 'open' && '📭 '}
                        {ticket.status === 'in-progress' && '⏳ '}
                        {ticket.status === 'resolved' && '✅ '}
                        {ticket.status === 'closed' && '🔒 '}
                        {ticket.status.replace('-', ' ')}
                      </span>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: T.fontBase, fontWeight: '600', color: T.textMain, marginBottom: '2px' }}>{new Date(ticket.date_created).toLocaleDateString()}</div>
                      <div style={{ fontSize: T.fontSm, fontWeight: '500', color: T.textMuted }}>{new Date(ticket.date_created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    
                    <div>
                      <button onClick={() => handleTicketClick(ticket)} style={{ ...btn.primary, width: '100%', justifyContent: 'center' }}>
                        👁️ View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Response Modal */}
        {showResponseModal && selectedTicket && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '32px'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '48px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '85vh',
              overflow: 'auto',
              border: '1px solid #e5e7eb',
              boxShadow: '0 20px 50px rgba(78, 93, 46, 0.3)'
            }}>
              <h2 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '700', color: T.textMain, borderBottom: `2px solid ${T.primaryBorder}`, paddingBottom: '16px' }}>
                🎫 Ticket #{selectedTicket.ticket_id}: {selectedTicket.subject}
              </h2>
              
              <div style={{
                marginBottom: '32px',
                padding: '28px',
                background: 'white',
                borderRadius: '16px',
                border: '2px solid #e5e7eb'
              }}>
                <div style={{ 
                  marginBottom: '16px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#4e5d2e'
                }}>
                  <span style={{ fontWeight: '700' }}>👤 From:</span> {selectedTicket.user_name} ({selectedTicket.user_email})
                </div>
                <div style={{ 
                  marginBottom: '20px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#4e5d2e'
                }}>
                  <span style={{ fontWeight: '700' }}>📅 Created:</span> {new Date(selectedTicket.date_created).toLocaleString()}
                </div>
                <div style={{ 
                  marginBottom: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#4e5d2e'
                }}>
                  💬 Message:
                </div>
                <div style={{ 
                  background: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  lineHeight: 1.6,
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1e293b'
                }}>
                  {selectedTicket.message}
                </div>
              </div>

              <form onSubmit={handleResponseSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: T.fontBase, fontWeight: '700', color: T.textMain, marginBottom: '8px' }}>
                      📊 Status
                    </label>
                    <select
                      value={responseForm.status}
                      onChange={(e) => setResponseForm(prev => ({ ...prev, status: e.target.value }))}
                      className="form-input"
                    >
                      <option value="open">📭 Open</option>
                      <option value="in-progress">⏳ In Progress</option>
                      <option value="resolved">✅ Resolved</option>
                      <option value="closed">🔒 Closed</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: T.fontBase, fontWeight: '700', color: T.textMain, marginBottom: '8px' }}>
                      🔥 Priority
                    </label>
                    <select
                      value={responseForm.priority}
                      onChange={(e) => setResponseForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="form-input"
                    >
                      <option value="normal">📋 Normal</option>
                      <option value="high">⚡ High</option>
                      <option value="urgent">🔥 Urgent</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', fontSize: T.fontBase, fontWeight: '700', color: T.textMain, marginBottom: '8px' }}>
                    💬 Admin Response
                  </label>
                  <textarea
                    value={responseForm.admin_response}
                    onChange={(e) => setResponseForm(prev => ({ ...prev, admin_response: e.target.value }))}
                    rows={6}
                    className="form-input"
                    placeholder="Enter your response to the user..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowResponseModal(false)} style={btn.ghost}>
                    ✕ Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingResponse}
                    style={{ ...btn.primary, opacity: submittingResponse ? 0.6 : 1, cursor: submittingResponse ? 'not-allowed' : 'pointer' }}
                  >
                    {submittingResponse ? '⏳ Updating...' : '💾 Update Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
