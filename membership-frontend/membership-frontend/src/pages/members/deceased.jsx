import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useauth";
import MainLayout from "../../components/mainlayout";

export default function DeceasedMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    fetch("http://localhost:5000/api/members", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch deceased members");
        return res.json();
      })
      .then((data) => {
        // Filter for inactive members (deceased)
        const deceased = Array.isArray(data) ? data.filter(m => m.isActive === false) : [];
        setMembers(deceased);
        setIsLoading(false);
      })
      .catch((err) => {
        console.log("Backend not available, showing empty state");
        setMembers([]);
        setIsLoading(false);
      });
  }, []);

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-title">📚 Member Directory</h1>
              <p className="dashboard-subtitle">
                Browse our community membership records and memorial register
              </p>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '32px' }}>
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto' }}></div>
              <p style={{ color: '#64748b', marginTop: '16px' }}>Loading memorial records...</p>
            </div>
          ) : (
            <div className="dashboard-card">
              <h2 className="dashboard-card-title">📋 Directory & Memorial Register</h2>
              
              {members.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px',
                  color: '#64748b'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                    No Records Found
                  </h3>
                  <p style={{ fontSize: '14px' }}>
                    There are currently no deceased member records in the database.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ 
                    marginBottom: '20px',
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                    color: '#64748b',
                    textAlign: 'center'
                  }}>
                    <strong>{members.length}</strong> member{members.length !== 1 ? 's' : ''} remembered in our memorial register
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ 
                            padding: '16px', 
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Surname
                          </th>
                          <th style={{ 
                            padding: '16px', 
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            First Name
                          </th>
                          <th style={{ 
                            padding: '16px', 
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Date of Birth
                          </th>
                          <th style={{ 
                            padding: '16px', 
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            County
                          </th>
                          <th style={{ 
                            padding: '16px', 
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Years Active
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member, index) => (
                          <tr 
                            key={member.id || index}
                            style={{ 
                              borderBottom: '1px solid #f1f5f9',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#f8fafc'}
                            onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                          >
                            <td style={{ padding: '16px', fontWeight: '500' }}>
                              {member.lastName || "—"}
                            </td>
                            <td style={{ padding: '16px' }}>
                              {member.firstName || "—"}
                            </td>
                            <td style={{ padding: '16px', color: '#64748b' }}>
                              {member.dateOfBirth || "—"}
                            </td>
                            <td style={{ padding: '16px', color: '#64748b' }}>
                              {member.county || "—"}
                            </td>
                            <td style={{ padding: '16px', color: '#64748b' }}>
                              {member.membershipYears || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Memorial Message */}
          <div className="dashboard-card" style={{ 
            background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
            border: '1px solid #e5e7eb',
            textAlign: 'center',
            marginTop: '24px'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>🕯️</div>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#374151',
              marginBottom: '8px'
            }}>
              In Loving Memory
            </h3>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              lineHeight: '1.6',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              We honor and remember our dear members who have passed away. 
              Their contributions to our community will never be forgotten, 
              and their legacy lives on in our hearts and memories.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
