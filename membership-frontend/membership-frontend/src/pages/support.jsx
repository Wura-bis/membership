import { useState } from "react";
import MainLayout from "../components/mainlayout";
import { useAuth } from "../hooks/useauth";

export default function Support() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("faq");
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
    priority: "normal"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch("http://localhost:5000/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(contactForm)
      });
      
      if (res.ok) {
        setSubmitMessage("Your support request has been submitted successfully!");
        setContactForm({ subject: "", message: "", priority: "normal" });
      } else {
        throw new Error("Failed to submit request");
      }
    } catch (err) {
      setSubmitMessage("Error submitting request. Please try again.");
    } finally {
      setIsSubmitting(false);
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
        background: 'linear-gradient(135deg, #f0fdfa 0%, #e6fffa 50%, #f0fdfa 100%)',
        padding: '32px 24px'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#134e4a',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}>
              🎧 Support Center
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#64748b',
              margin: '0'
            }}>
              Get help and find answers to common questions
            </p>
          </div>

          {/* Tab Navigation */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '24px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              {[
                { id: 'faq', label: '❓ FAQ', icon: '❓' },
                { id: 'contact', label: '📧 Contact Support', icon: '📧' },
                { id: 'resources', label: '📚 Resources', icon: '📚' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '12px 20px',
                    border: 'none',
                    background: activeTab === tab.id ? '#14b8a6' : 'transparent',
                    color: activeTab === tab.id ? 'white' : '#64748b',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
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
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: '#1e293b', 
                  marginBottom: '20px' 
                }}>
                  Frequently Asked Questions
                </h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  {faqData.map((faq, index) => (
                    <div key={index} style={{
                      background: '#f8fafc',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1e293b',
                        marginBottom: '8px'
                      }}>
                        {faq.question}
                      </h4>
                      <p style={{
                        fontSize: '14px',
                        color: '#64748b',
                        margin: '0',
                        lineHeight: '1.5'
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
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: '#1e293b', 
                  marginBottom: '20px' 
                }}>
                  Contact Support
                </h3>
                
                {submitMessage && (
                  <div style={{
                    background: submitMessage.includes('Error') ? '#fef2f2' : '#dcfce7',
                    border: `1px solid ${submitMessage.includes('Error') ? '#fecaca' : '#bbf7d0'}`,
                    color: submitMessage.includes('Error') ? '#dc2626' : '#166534',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    {submitMessage}
                  </div>
                )}

                <form onSubmit={handleContactSubmit}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#1e293b',
                      marginBottom: '8px'
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
                        padding: '12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                      placeholder="Brief description of your issue"
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#1e293b',
                      marginBottom: '8px'
                    }}>
                      Priority
                    </label>
                    <select
                      value={contactForm.priority}
                      onChange={(e) => setContactForm(prev => ({...prev, priority: e.target.value}))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#1e293b',
                      marginBottom: '8px'
                    }}>
                      Message
                    </label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({...prev, message: e.target.value}))}
                      required
                      rows={6}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                      placeholder="Please describe your issue in detail..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      background: isSubmitting ? '#94a3b8' : 'linear-gradient(135deg, #14b8a6, #0d9488)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Support Request'}
                  </button>
                </form>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div>
                <h3 style={{ 
                  fontSize: '20px', 
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
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#1e293b', 
                      marginBottom: '12px' 
                    }}>
                      📖 User Guide
                    </h4>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#64748b', 
                      marginBottom: '12px' 
                    }}>
                      Complete guide to using the membership system
                    </p>
                    <button style={{
                      background: '#14b8a6',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}>
                      Download PDF
                    </button>
                  </div>

                  <div style={{
                    background: '#f8fafc',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h4 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#1e293b', 
                      marginBottom: '12px' 
                    }}>
                      📧 Contact Information
                    </h4>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                      <p><strong>Email:</strong> support@biscenter.org</p>
                      <p><strong>Phone:</strong> (555) 123-4567</p>
                      <p><strong>Hours:</strong> Mon-Fri 9AM-5PM EST</p>
                    </div>
                  </div>

                  <div style={{
                    background: '#f8fafc',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h4 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#1e293b', 
                      marginBottom: '12px' 
                    }}>
                      🔗 Quick Links
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <a href="/my-profile" style={{ 
                        color: '#14b8a6', 
                        textDecoration: 'none',
                        fontSize: '14px'
                      }}>→ Update My Profile</a>
                      <a href="/members" style={{ 
                        color: '#14b8a6', 
                        textDecoration: 'none',
                        fontSize: '14px'
                      }}>→ Member Directory</a>
                      <a href="/account-settings" style={{ 
                        color: '#14b8a6', 
                        textDecoration: 'none',
                        fontSize: '14px'
                      }}>→ Account Settings</a>
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
              fontSize: '18px', 
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
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#14b8a6' 
                }}>
                  24/7
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#64748b' 
                }}>
                  System Availability
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#14b8a6' 
                }}>
                  &lt; 1hr
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#64748b' 
                }}>
                  Average Response Time
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#14b8a6' 
                }}>
                  99%
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#64748b' 
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