import { useState, useEffect } from "react";
import MainLayout from "../../components/mainlayout";
import { useAuth } from "../../hooks/useauth";
import { useToast } from "../../components/toast";
import { LoadingSpinner, TableSkeleton } from "../../components/loading";
import { ActionButton, StatusBadge } from "../../components/ui";

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
  }, [filters]);

  const fetchTickets = async () => {
    setLoading(true);
    setTableError(null);
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.priority !== 'all') params.append('priority', filters.priority);
      
      const res = await fetch(`http://localhost:5000/api/admin/support/tickets?${params}`, {
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
      const res = await fetch('http://localhost:5000/api/admin/support/create-table', {
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
      admin_response: ticket.admin_response || ''
    });
    setShowResponseModal(true);
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    setSubmittingResponse(true);
    
    try {
      const res = await fetch(`http://localhost:5000/api/admin/support/tickets/${selectedTicket.ticket_id}`, {
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
      case 'open': return { bg: '#fee2e2', color: '#dc2626' };
      case 'in-progress': return { bg: '#fef3c7', color: '#d97706' };
      case 'resolved': return { bg: '#dcfce7', color: '#166534' };
      case 'closed': return { bg: '#f3f4f6', color: '#64748b' };
      default: return { bg: '#f3f4f6', color: '#64748b' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return { bg: '#fecaca', color: '#dc2626' };
      case 'high': return { bg: '#fed7aa', color: '#ea580c' };
      case 'normal': return { bg: '#e0f2fe', color: '#0369a1' };
      default: return { bg: '#e0f2fe', color: '#0369a1' };
    }
  };

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 className="dashboard-title">🎫 Support Tickets</h1>
            <p className="dashboard-subtitle">Manage and respond to member support requests</p>
          </div>

          {/* Filters */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            gap: '16px',
            alignItems: 'center'
          }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', marginRight: '8px' }}>Status:</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', marginRight: '8px' }}>Priority:</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Priorities</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div style={{ marginLeft: 'auto' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>
                {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Table Error Display */}
          {tableError && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>Database Table Missing</h3>
              <p style={{ color: '#7f1d1d', marginBottom: '16px' }}>
                The support tickets table needs to be created in the database.
              </p>
              <ActionButton
                onClick={createTable}
                loading={creatingTable}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {creatingTable ? 'Creating Table...' : 'Create Support Tickets Table'}
              </ActionButton>
            </div>
          )}

          {/* Tickets List */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            {loading ? (
              <div style={{ padding: '40px' }}>
                <TableSkeleton />
              </div>
            ) : tableError ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔧</div>
                <h3 style={{ marginBottom: '8px' }}>Setup Required</h3>
                <p>Please create the support tickets table to continue.</p>
              </div>
            ) : tickets.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎫</div>
                <h3 style={{ marginBottom: '8px' }}>No Support Tickets</h3>
                <p>No support tickets match your current filters.</p>
              </div>
            ) : (
              <div style={{ overflow: 'hidden' }}>
                {/* Table Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 120px 100px 120px 120px',
                  gap: '16px',
                  padding: '16px 20px',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#64748b',
                  textTransform: 'uppercase'
                }}>
                  <div>Ticket</div>
                  <div>Subject / User</div>
                  <div>Priority</div>
                  <div>Status</div>
                  <div>Created</div>
                  <div>Actions</div>
                </div>

                {/* Table Body */}
                {tickets.map((ticket) => (
                  <div
                    key={ticket.ticket_id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr 120px 100px 120px 120px',
                      gap: '16px',
                      padding: '16px 20px',
                      borderBottom: '1px solid #f1f5f9',
                      alignItems: 'center',
                      transition: 'background 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                      #{ticket.ticket_id}
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', marginBottom: '4px' }}>
                        {ticket.subject}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {ticket.user_name} • {ticket.user_email}
                      </div>
                    </div>
                    
                    <div>
                      <span style={{
                        ...getPriorityColor(ticket.priority),
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {ticket.priority}
                      </span>
                    </div>
                    
                    <div>
                      <span style={{
                        ...getStatusColor(ticket.status),
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {ticket.status.replace('-', ' ')}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {new Date(ticket.date_created).toLocaleDateString()}
                    </div>
                    
                    <div>
                      <ActionButton
                        size="small"
                        variant="secondary"
                        onClick={() => handleTicketClick(ticket)}
                      >
                        View
                      </ActionButton>
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
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '600' }}>
                Ticket #{selectedTicket.ticket_id}: {selectedTicket.subject}
              </h2>
              
              <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong>From:</strong> {selectedTicket.user_name} ({selectedTicket.user_email})
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Created:</strong> {new Date(selectedTicket.date_created).toLocaleString()}
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong>Message:</strong>
                </div>
                <div style={{ 
                  background: 'white', 
                  padding: '12px', 
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  lineHeight: 1.5
                }}>
                  {selectedTicket.message}
                </div>
              </div>

              <form onSubmit={handleResponseSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    marginBottom: '8px' 
                  }}>
                    Status
                  </label>
                  <select
                    value={responseForm.status}
                    onChange={(e) => setResponseForm(prev => ({ ...prev, status: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    marginBottom: '8px' 
                  }}>
                    Admin Response
                  </label>
                  <textarea
                    value={responseForm.admin_response}
                    onChange={(e) => setResponseForm(prev => ({ ...prev, admin_response: e.target.value }))}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="Enter your response to the user..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <ActionButton
                    type="button"
                    variant="secondary"
                    onClick={() => setShowResponseModal(false)}
                  >
                    Cancel
                  </ActionButton>
                  <ActionButton
                    type="submit"
                    variant="primary"
                    loading={submittingResponse}
                  >
                    Update Ticket
                  </ActionButton>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
