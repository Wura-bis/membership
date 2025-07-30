import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useauth";
import MainLayout from "../../components/mainlayout";

export default function DeceasedMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("lastName");
  const [sortDirection, setSortDirection] = useState("asc");
  const [filterCounty, setFilterCounty] = useState("");

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

  // Get unique counties for filter dropdown
  const uniqueCounties = [...new Set(members.map(m => m.county).filter(Boolean))].sort();

  // Filter and sort members
  const filteredMembers = members
    .filter(member => {
      const matchesSearch = !searchTerm || 
        member.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.firstName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCounty = !filterCounty || member.county === filterCounty;
      return matchesSearch && matchesCounty;
    })
    .sort((a, b) => {
      let aValue = a[sortField] || "";
      let bValue = b[sortField] || "";
      
      if (sortField === "dateOfBirth") {
        aValue = new Date(aValue || "1900-01-01");
        bValue = new Date(bValue || "1900-01-01");
      }
      
      if (sortField === "membershipYears") {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      }
      
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-title">📚 Member Directory</h1>
              <p className="dashboard-subtitle">
                Browse and search member records
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
              <p style={{ color: '#64748b', marginTop: '16px' }}>Loading directory...</p>
            </div>
          ) : (
            <div className="dashboard-card">
              <h2 className="dashboard-card-title">📋 Member Directory</h2>
              
              {/* Search and Filter Controls */}
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                marginBottom: '24px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                {/* Search */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '14px',
                      transition: 'all 0.2s ease'
                    }}
                  />
                </div>

                {/* County Filter */}
                <div style={{ minWidth: '150px' }}>
                  <select
                    value={filterCounty}
                    onChange={(e) => setFilterCounty(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '14px',
                      background: 'white'
                    }}
                  >
                    <option value="">All Counties</option>
                    {uniqueCounties.map(county => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                </div>

                {/* Results Count */}
                <div style={{ 
                  padding: '8px 16px',
                  background: '#f0fdfa',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#0f766e',
                  fontWeight: '500'
                }}>
                  {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
                </div>
              </div>

              {filteredMembers.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px',
                  color: '#64748b'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                    {searchTerm || filterCounty ? 'No Results Found' : 'No Records Available'}
                  </h3>
                  <p style={{ fontSize: '14px' }}>
                    {searchTerm || filterCounty 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'There are currently no deceased member records in the database.'
                    }
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ 
                          padding: '16px', 
                          textAlign: 'left', 
                          fontWeight: '600',
                          color: '#374151',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('lastName')}
                        >
                          SURNAME {sortField === 'lastName' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th style={{ 
                          padding: '16px', 
                          textAlign: 'left', 
                          fontWeight: '600',
                          color: '#374151',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('firstName')}
                        >
                          FIRST NAME {sortField === 'firstName' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th style={{ 
                          padding: '16px', 
                          textAlign: 'left', 
                          fontWeight: '600',
                          color: '#374151',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('dateOfBirth')}
                        >
                          DATE OF BIRTH {sortField === 'dateOfBirth' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th style={{ 
                          padding: '16px', 
                          textAlign: 'left', 
                          fontWeight: '600',
                          color: '#374151',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('county')}
                        >
                          COUNTY {sortField === 'county' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th style={{ 
                          padding: '16px', 
                          textAlign: 'left', 
                          fontWeight: '600',
                          color: '#374151',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('membershipYears')}
                        >
                          YEARS ACTIVE {sortField === 'membershipYears' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th style={{ 
                          padding: '16px', 
                          textAlign: 'center', 
                          fontWeight: '600',
                          color: '#374151'
                        }}>
                          ACTION
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member, index) => (
                        <tr 
                          key={member.id || index}
                          style={{ 
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#f8fafc'}
                          onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '16px', color: '#0f172a', fontWeight: '500' }}>
                            {member.lastName || '—'}
                          </td>
                          <td style={{ padding: '16px', color: '#64748b' }}>
                            {member.firstName || '—'}
                          </td>
                          <td style={{ padding: '16px', color: '#64748b' }}>
                            {member.dateOfBirth || '—'}
                          </td>
                          <td style={{ padding: '16px', color: '#64748b' }}>
                            {member.county || '—'}
                          </td>
                          <td style={{ padding: '16px', color: '#64748b' }}>
                            {member.membershipYears ? `${member.membershipYears} years` : '—'}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <Link
                              to={`/members/${member.id}`}
                              style={{
                                display: 'inline-block',
                                padding: '8px 16px',
                                background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                            >
                              View Profile
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
