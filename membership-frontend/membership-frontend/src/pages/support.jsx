import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../components/mainlayout";
import { useAuth } from "../hooks/useauth";
import { useToast } from "../components/toast";
import { ActionButton, FormField } from "../components/ui";
import { LoadingSpinner } from "../components/loading";
import { API_BASE_URL } from '../utils/api';
import { T, card, btn } from '../utils/theme';

export default function Support() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("faq");
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
    priority: "normal"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myTickets, setMyTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [contactInfo, setContactInfo] = useState({ contactEmail: '', contactPhone: '', contactHours: '' });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/contact-info`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setContactInfo(data); })
      .catch(() => {});
  }, []);

  // Load user's tickets
  useEffect(() => {
    if (activeTab === "my-tickets") {
      fetchMyTickets();
    }
  }, [activeTab]);

  const fetchMyTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/support/my-tickets`, {
        credentials: "include"
      });
      
      if (res.ok) {
        const data = await res.json();
        setMyTickets(data.tickets || []);
      } else {
        showToast("Failed to load your tickets", "error");
      }
    } catch (err) {
      showToast("Error loading tickets: " + err.message, "error");
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      showToast("Please fill in both subject and message", "warning");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/support/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(contactForm)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        showToast(`Support request submitted! Ticket ID: #${data.ticket_id}`, "success");
        setContactForm({ subject: "", message: "", priority: "normal" });
        
        // Switch to tickets tab to show the new ticket
        setActiveTab("my-tickets");
      } else {
        showToast(data.error || "Failed to submit request", "error");
      }
    } catch (err) {
      showToast("Error submitting request: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadUserGuide = async () => {
    try {
      showToast("Generating user guide...", "info");
      
      const response = await fetch(`${API_BASE_URL}/api/user-guide/download`, {
        method: "GET",
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate user guide");
      }
      
      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-guide-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      showToast("User guide downloaded successfully!", "success");
    } catch (err) {
      showToast("Failed to download user guide: " + err.message, "error");
    }
  };

  const faqData = [
    {
      question: "How do I update my member profile?",
      answer: "Navigate to 'My Profile' from the main menu. You can update your personal information, contact details, and preferences there."
    },
    {
      question: "How do I search for other members?",
      answer: "Use the Member Directory to search by name, county, or other criteria. You can access it from the main navigation menu."
    },
    {
      question: "Who can see my information?",
      answer: "Your information visibility depends on your membership type and privacy settings. Contact an administrator for specific privacy questions."
    },
    {
      question: "How do I report a technical issue?",
      answer: "Use the Contact Support tab on this page, or email our technical support team directly."
    },
    {
      question: "How do I request access to additional features?",
      answer: "Private members have access to additional features. Contact an administrator to request an upgrade from public to private membership."
    }
  ];

  return (
    <MainLayout>
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #f8f9fa 50%, #f8f9fa 100%)',
        padding: '32px 24px'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: T.textMain,
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}>
              🎧 Support Center
            </h1>
            <p style={{
              fontSize: T.fontMd,
              fontWeight: '600',
              color: T.textMuted,
              margin: '0'
            }}>
              Get help and find answers to common questions
            </p>
          </div>

          {/* Tab Navigation */}
          <div style={{
            ...card,
            padding: '24px',
            marginBottom: '28px',
          }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '32px',
              borderBottom: '3px solid #e5e7eb',
              paddingBottom: '16px',
              flexWrap: 'wrap'
            }}>
              {[
                { id: 'faq', label: '❓ FAQ', icon: '❓' },
                { id: 'contact', label: '📧 Contact Support', icon: '📧' },
                { id: 'my-tickets', label: '🎫 My Tickets', icon: '🎫' },
                { id: 'resources', label: '📚 Resources', icon: '📚' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '16px 28px',
                    border: activeTab === tab.id ? '2px solid #4e5d2e' : '2px solid transparent',
                    background: activeTab === tab.id ? '#4e5d2e' : '#ffffff',
                    color: activeTab === tab.id ? 'white' : '#64748b',
                    borderRadius: '10px',
                    fontSize: T.fontMd,
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginBottom: '16px'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* FAQ Tab */}
            {activeTab === 'faq' && (
              <div>
                <h3 style={{
                  fontSize: T.fontLg,
                  fontWeight: '700',
                  color: T.textMain,
                  marginBottom: '24px'
                }}>
                  Frequently Asked Questions
                </h3>
                <div style={{ display: 'grid', gap: '20px' }}>
                  {faqData.map((faq, index) => (
                    <div key={index} style={{
                      background: '#ffffff',
                      padding: '24px',
                      borderRadius: '12px',
                      border: '2px solid #e5e7eb',
                      boxShadow: '0 1px 3px rgba(78,93,46,0.1)'
                    }}>
                      <h4 style={{
                        fontSize: T.fontLg,
                        fontWeight: '700',
                        color: T.textMain,
                        marginBottom: '12px'
                      }}>
                        {faq.question}
                      </h4>
                      <p style={{
                        fontSize: T.fontMd,
                        fontWeight: '500',
                        color: '#475569',
                        margin: '0',
                        lineHeight: '1.6'
                      }}>
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div>
                <h3 style={{
                  fontSize: T.fontLg,
                  fontWeight: '700',
                  color: T.textMain,
                  marginBottom: '24px'
                }}>
                  Contact Support
                </h3>
                
                <form onSubmit={handleContactSubmit}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: T.fontBase,
                      fontWeight: '700',
                      color: T.textMain,
                      marginBottom: '10px'
                    }}>
                      Subject
                    </label>
                    <input
                      type="text"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm(prev => ({...prev, subject: e.target.value}))}
                      required
                      style={{
                        width: '100%',
                        padding: '16px',
                        border: '1.5px solid #d1d5db',
                        borderRadius: '10px',
                        fontSize: T.fontMd,
                        fontWeight: '500'
                      }}
                      placeholder="Brief description of your issue"
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: T.fontBase,
                      fontWeight: '700',
                      color: T.textMain,
                      marginBottom: '10px'
                    }}>
                      Priority
                    </label>
                    <select
                      value={contactForm.priority}
                      onChange={(e) => setContactForm(prev => ({...prev, priority: e.target.value}))}
                      style={{
                        width: '100%',
                        padding: '16px',
                        border: '1.5px solid #d1d5db',
                        borderRadius: '10px',
                        fontSize: T.fontMd,
                        fontWeight: '500'
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: T.fontBase,
                      fontWeight: '700',
                      color: T.textMain,
                      marginBottom: '10px'
                    }}>
                      Message
                    </label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({...prev, message: e.target.value}))}
                      required
                      rows={8}
                      style={{
                        width: '100%',
                        padding: '16px',
                        border: '1.5px solid #d1d5db',
                        borderRadius: '10px',
                        fontSize: T.fontMd,
                        fontWeight: '500',
                        resize: 'vertical',
                        lineHeight: '1.6'
                      }}
                      placeholder="Please describe your issue in detail..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      ...btn.primary,
                      padding: '18px 32px',
                      borderRadius: '10px',
                      fontSize: T.fontBase,
                      opacity: isSubmitting ? 0.6 : 1,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSubmitting ? '⏳ Submitting...' : '📨 Submit Support Request'}
                  </button>
                </form>
              </div>
            )}

            {/* My Tickets Tab */}
            {activeTab === 'my-tickets' && (
              <div>
                <h3 style={{
                  fontSize: T.fontLg,
                  fontWeight: '700',
                  color: T.textMain,
                  marginBottom: '24px'
                }}>
                  My Support Tickets
                </h3>
                
                {loadingTickets ? (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    padding: '40px' 
                  }}>
                    <LoadingSpinner />
                  </div>
                ) : myTickets.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: T.textMuted
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🎫</div>
                    <h4 style={{ marginBottom: '8px' }}>No Support Tickets</h4>
                    <p>You haven't submitted any support requests yet.</p>
                    <button
                      onClick={() => setActiveTab('contact')}
                      style={{
                        ...btn.primary,
                        marginTop: '16px',
                        padding: '16px 32px',
                        borderRadius: '10px',
                        fontSize: T.fontMd,
                      }}
                    >
                      Submit Your First Ticket
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {myTickets.map((ticket) => (
                      <div key={ticket.ticket_id} style={{
                        background: 'white',
                        padding: '24px 28px',
                        borderRadius: '12px',
                        border: '2px solid #e5e7eb'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start',
                          marginBottom: '14px'
                        }}>
                          <div>
                            <h4 style={{
                              fontSize: T.fontLg,
                              fontWeight: '700',
                              color: T.textMain,
                              margin: '0 0 8px 0'
                            }}>
                              Ticket #{ticket.ticket_id}: {ticket.subject}
                            </h4>
                            <div style={{ display: 'flex', gap: '16px', fontSize: T.fontBase, color: T.textMuted, fontWeight: '600' }}>
                              <span>Created: {new Date(ticket.date_created).toLocaleDateString()}</span>
                              <span>Priority: {ticket.priority.toUpperCase()}</span>
                            </div>
                          </div>
                          <span style={{
                            background: ticket.status === 'open' ? '#fee2e2' :
                                       ticket.status === 'in-progress' ? '#fef3c7' :
                                       ticket.status === 'resolved' ? '#dcfce7' : '#f3f4f6',
                            color: ticket.status === 'open' ? T.red :
                                   ticket.status === 'in-progress' ? T.amber :
                                   ticket.status === 'resolved' ? '#166534' : T.textMuted,
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: T.fontBase,
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap'
                          }}>
                            {ticket.status.replace('-', ' ')}
                          </span>
                        </div>
                        
                        <p style={{
                          margin: '12px 0',
                          color: '#334155',
                          lineHeight: 1.6,
                          fontSize: T.fontMd,
                          fontWeight: '500'
                        }}>
                          {ticket.message}
                        </p>
                        
                        {ticket.admin_response && (
                          <div style={{
                            marginTop: '16px',
                            padding: '20px',
                            background: '#ecfdf5',
                            borderRadius: '10px',
                            border: '2px solid #bbf7d0'
                          }}>
                            <h5 style={{
                              margin: '0 0 10px 0',
                              color: '#166534',
                              fontSize: T.fontMd,
                              fontWeight: '700'
                            }}>
                              💬 Admin Response:
                            </h5>
                            <p style={{
                              margin: 0,
                              color: '#166534',
                              lineHeight: 1.6,
                              fontSize: T.fontMd,
                              fontWeight: '500'
                            }}>
                              {ticket.admin_response}
                            </p>
                            {ticket.date_updated && (
                              <p style={{
                                margin: '8px 0 0 0',
                                fontSize: T.fontSm,
                                color: '#059669'
                              }}>
                                Updated: {new Date(ticket.date_updated).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div>
                <h3 style={{ 
                  fontSize: T.fontMd, 
                  fontWeight: '600', 
                  color: '#1e293b', 
                  marginBottom: '20px' 
                }}>
                  Helpful Resources
                </h3>
                
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{
                    background: '#f8fafc',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h4 style={{ 
                      fontSize: T.fontBase, 
                      fontWeight: '600', 
                      color: '#1e293b', 
                      marginBottom: '12px' 
                    }}>
                      📖 User Guide
                    </h4>
                    <p style={{
                      fontSize: T.fontBase,
                      color: T.textMuted,
                      marginBottom: '12px'
                    }}>
                      Complete guide with current system statistics, features, and step-by-step instructions
                    </p>
                    <p style={{ fontSize: T.fontSm, color: T.textLight, fontStyle: 'italic' }}>Coming soon.</p>
                  </div>

                  <div style={{
                    background: '#f8fafc',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h4 style={{ 
                      fontSize: T.fontBase, 
                      fontWeight: '600', 
                      color: '#1e293b', 
                      marginBottom: '12px' 
                    }}>
                      📧 Contact Information
                    </h4>
                    <div style={{ fontSize: T.fontBase, color: T.textMuted }}>
                      {contactInfo.contactEmail && <p><strong>Email:</strong> {contactInfo.contactEmail}</p>}
                      {contactInfo.contactPhone && <p><strong>Phone:</strong> {contactInfo.contactPhone}</p>}
                      {contactInfo.contactHours && <p><strong>Hours:</strong> {contactInfo.contactHours}</p>}
                      {!contactInfo.contactEmail && !contactInfo.contactPhone && !contactInfo.contactHours && (
                        <p style={{ color: T.textMuted, fontStyle: 'italic' }}>Contact information not yet configured.</p>
                      )}
                    </div>
                    {user?.role === 'admin' && (
                      <Link to="/settings" style={{ ...btn.ghost, display: 'inline-flex', marginTop: '12px', textDecoration: 'none', fontSize: T.fontSm, padding: '6px 12px' }}>
                        ✏️ Edit Contact Info
                      </Link>
                    )}
                  </div>

                  <div style={{
                    background: '#f8fafc',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h4 style={{ 
                      fontSize: T.fontBase, 
                      fontWeight: '600', 
                      color: '#1e293b', 
                      marginBottom: '12px' 
                    }}>
                      🔗 Quick Links
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <Link to="/my-profile" style={{
                        color: T.primaryLight,
                        textDecoration: 'none',
                        fontSize: '14px'
                      }}>→ Update My Profile</Link>
                      <Link to="/members" style={{
                        color: T.primaryLight,
                        textDecoration: 'none',
                        fontSize: '14px'
                      }}>→ Member Directory</Link>
                      <Link to="/app-settings" style={{
                        color: T.primaryLight,
                        textDecoration: 'none',
                        fontSize: '14px'
                      }}>→ App Settings</Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ 
              fontSize: T.fontLg, 
              fontWeight: '600', 
              color: '#1e293b', 
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              📊 Support Status
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: T.fontLg, 
                  fontWeight: '700',
                  color: T.primaryLight
                }}>
                  24/7
                </div>
                <div style={{ 
                  fontSize: T.fontSm,
                  color: T.textMuted
                }}>
                  System Availability
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: T.fontLg, 
                  fontWeight: '700',
                  color: T.primaryLight
                }}>
                  &lt; 1hr
                </div>
                <div style={{ 
                  fontSize: T.fontSm,
                  color: T.textMuted
                }}>
                  Average Response Time
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: T.fontLg, 
                  fontWeight: '700',
                  color: T.primaryLight
                }}>
                  99%
                </div>
                <div style={{ 
                  fontSize: T.fontSm,
                  color: T.textMuted
                }}>
                  User Satisfaction
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 