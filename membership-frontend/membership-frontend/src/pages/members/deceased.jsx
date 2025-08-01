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

  // Helper function to render sortable column header
  const SortableHeader = ({ column, children }) => {
    const isActive = sortField === column;
    return (
      <th 
        style={{ 
          padding: '16px', 
          textAlign: 'left',
          fontWeight: '600',
          color: isActive ? '#14b8a6' : '#374151',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          cursor: 'pointer',
          userSelect: 'none',
          position: 'relative',
          transition: 'color 0.2s ease',
          borderBottom: isActive ? '2px solid #14b8a6' : '2px solid #e2e8f0'
        }}
        onClick={() => handleSort(column)}
        onMouseEnter={(e) => {
          if (!isActive) e.target.style.color = '#64748b';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.target.style.color = '#374151';
        }}
        title={`Sort by ${children}${isActive ? ` (currently ${sortDirection === "asc" ? "A-Z" : "Z-A"})` : ""}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {children}
          {isActive ? (
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 'bold',
              color: '#14b8a6'
            }}>
              {sortDirection === "asc" ? "↑" : "↓"}
            </span>
          ) : (
            <span style={{ 
              fontSize: '10px', 
              opacity: 0.4,
              transition: 'opacity 0.2s ease'
            }}>
              ↕
            </span>
          )}
        </div>
      </th>
    );
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
            <>
              {/* Filter Bar */}
              <div className="dashboard-card" style={{ marginBottom: '24px' }}>
            <h2 className="dashboard-card-title">🔍 Search & Filters</h2>
            
            {/* Primary Search */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{
                  fontSize: '16px',
                  padding: '12px 16px',
                  flex: '1',
                  minWidth: '300px',
                  maxWidth: '500px'
                }}
              />
              {(searchTerm || filterCounty || sortField !== "lastName" || sortDirection !== "asc") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterCounty("");
                    setSortField("lastName");
                    setSortDirection("asc");
                  }}
                  style={{
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'white',
                    color: '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>✕</span>
                  Clear All
                </button>
              )}
            </div>

            {/* Filters Grid */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <label className="form-label">County</label>
                <select
                  value={filterCounty}
                  onChange={(e) => setFilterCounty(e.target.value)}
                  className="form-input"
                >
                  <option value="">All Counties</option>
                  {uniqueCounties.map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort Controls */}
            <div style={{
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    color: '#64748b'
                  }}>
                    Sort by:
                  </span>
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      fontSize: '13px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: 'white'
                    }}
                  >
                    <option value="lastName">Last Name</option>
                    <option value="firstName">First Name</option>
                    <option value="dateOfBirth">Date of Birth</option>
                    <option value="county">County</option>
                    <option value="membershipYears">Years Active</option>
                  </select>
                  <button
                    onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                    style={{
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: '500',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {sortDirection === "asc" ? "A → Z" : "Z → A"}
                    <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                  </button>
                </div>
                
                {/* Quick actions */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => { setSortField("lastName"); setSortDirection("asc"); }}
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: '500',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      background: sortField === "lastName" && sortDirection === "asc" ? '#14b8a6' : 'white',
                      color: sortField === "lastName" && sortDirection === "asc" ? 'white' : '#64748b',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    A-Z Names
                  </button>
                  <button
                    onClick={() => { setSortField("membershipYears"); setSortDirection("desc"); }}
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: '500',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      background: sortField === "membershipYears" && sortDirection === "desc" ? '#14b8a6' : 'white',
                      color: sortField === "membershipYears" && sortDirection === "desc" ? 'white' : '#64748b',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Most Active
                  </button>
                </div>
              </div>
            </div>
            
            {/* Results Summary */}
            <div style={{ 
              marginTop: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#64748b'
            }}>
              <div>
                <strong style={{ color: '#374151' }}>{filteredMembers.length}</strong> 
                {filteredMembers.length === members.length 
                  ? ` members` 
                  : ` of ${members.length} members`
                }
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div className="dashboard-card">
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
                        <SortableHeader column="lastName">
                          Surname
                        </SortableHeader>
                        <SortableHeader column="firstName">
                          First Name
                        </SortableHeader>
                        <SortableHeader column="dateOfBirth">
                          Date of Birth
                        </SortableHeader>
                        <SortableHeader column="county">
                          County
                        </SortableHeader>
                        <SortableHeader column="membershipYears">
                          Years Active
                        </SortableHeader>
                        <th style={{ 
                          padding: '16px', 
                          textAlign: 'center', 
                          fontWeight: '600',
                          color: '#374151',
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Action
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
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
