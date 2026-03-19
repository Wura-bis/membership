import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useauth";
import MainLayout from "../../components/mainlayout";
import { API_BASE_URL } from '../../utils/api';

export default function HistoricalMembers() {
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
    fetch(`${API_BASE_URL}/api/members`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch historical members");
        return res.json();
      })
      .then((data) => {
        // Filter for historical members
        const historical = Array.isArray(data) ? data.filter(m => m.isActive === false) : [];
        setMembers(historical);
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
          padding: '22px 24px', 
          textAlign: 'left',
          fontWeight: '700',
          color: isActive ? '#14b8a6' : '#0f766e',
          fontSize: '17px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          cursor: 'pointer',
          userSelect: 'none',
          position: 'relative',
          transition: 'color 0.2s ease'
        }}
        onClick={() => handleSort(column)}
        onMouseEnter={(e) => {
          if (!isActive) e.target.style.color = '#14b8a6';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.target.style.color = '#0f766e';
        }}
        title={`Sort by ${children}${isActive ? ` (currently ${sortDirection === "asc" ? "A-Z" : "Z-A"})` : ""}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {children}
          {isActive ? (
            <span style={{ 
              fontSize: '18px', 
              fontWeight: 'bold',
              color: '#14b8a6'
            }}>
              {sortDirection === "asc" ? "↑" : "↓"}
            </span>
          ) : (
            <span style={{ 
              fontSize: '14px', 
              opacity: 0.5,
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
              <h1 className="dashboard-title">📜 Historical Members</h1>
              <p className="dashboard-subtitle">
                Browse memorial and historical member records
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
              <div className="dashboard-card" style={{ marginBottom: '28px', padding: '36px', background: '#f0fdfa', border: '2px solid #5eead4' }}>
            <h2 className="dashboard-card-title" style={{ fontSize: '24px', fontWeight: '700', marginBottom: '28px', color: '#0f766e' }}>🔍 Search & Filter</h2>
            
            {/* Primary Search */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px', 
              marginBottom: '28px',
              flexWrap: 'wrap'
            }}>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{
                  fontSize: '17px',
                  padding: '18px 24px',
                  flex: '1',
                  minWidth: '320px',
                  maxWidth: '600px',
                  border: '2px solid #14b8a6',
                  borderRadius: '10px',
                  fontWeight: '600',
                  background: 'white'
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
                    padding: '18px 28px',
                    fontSize: '17px',
                    fontWeight: '700',
                    border: '2px solid #14b8a6',
                    borderRadius: '10px',
                    background: 'white',
                    color: '#0f766e',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    minHeight: '58px'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>✕</span>
                  Clear All
                </button>
              )}
            </div>

            {/* Filters Grid */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '28px'
            }}>
              <div>
                <label className="form-label" style={{ fontSize: '17px', fontWeight: '700', marginBottom: '14px', display: 'block', color: '#0f766e' }}>📍 County</label>
                <select
                  value={filterCounty}
                  onChange={(e) => setFilterCounty(e.target.value)}
                  className="form-input"
                  style={{
                    fontSize: '17px',
                    padding: '18px 24px',
                    border: '2px solid #14b8a6',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: 'white'
                  }}
                >
                  <option value="">All Counties</option>
                  {uniqueCounties.map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Results Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '20px 0 16px',
            padding: '0 4px',
            fontSize: '17px',
            fontWeight: '600',
            color: '#0f766e'
          }}>
            <strong style={{ fontSize: '22px', fontWeight: '800', color: '#14b8a6', marginRight: '6px' }}>{filteredMembers.length}</strong>
            {filteredMembers.length === members.length
              ? `total historical ${filteredMembers.length === 1 ? 'record' : 'records'}`
              : `of ${members.length} historical records`}
          </div>

          {/* Members Table */}
          <div className="dashboard-card" style={{ padding: '36px', border: '2px solid #14b8a6' }}>
            {filteredMembers.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '80px 40px',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🕊️</div>
                <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#374151' }}>
                  {searchTerm || filterCounty ? 'No Results Found' : 'No Records Available'}
                </h3>
                <p style={{ fontSize: '18px', fontWeight: '500' }}>
                  {searchTerm || filterCounty 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'There are currently no historical member records in the database.'
                  }
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '17px', borderCollapse: 'separate', borderSpacing: '0' }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)', borderBottom: '3px solid #14b8a6' }}>
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
                          padding: '22px 24px', 
                          textAlign: 'center', 
                          fontWeight: '700',
                          color: '#0f766e',
                          fontSize: '17px',
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
                            borderBottom: '2px solid #f0fdfa',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#f0fdfa'}
                          onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '20px 24px', color: '#0f172a', fontWeight: '700', fontSize: '17px' }}>
                            {member.lastName || '—'}
                          </td>
                          <td style={{ padding: '20px 24px', color: '#374151', fontWeight: '600', fontSize: '17px' }}>
                            {member.firstName || '—'}
                          </td>
                          <td style={{ padding: '20px 24px', color: '#64748b', fontWeight: '500', fontSize: '17px' }}>
                            {member.dateOfBirth || '—'}
                          </td>
                          <td style={{ padding: '20px 24px', color: '#64748b', fontWeight: '500', fontSize: '17px' }}>
                            {member.county || '—'}
                          </td>
                          <td style={{ padding: '20px 24px', color: '#64748b', fontWeight: '500', fontSize: '17px' }}>
                            {member.membershipYears ? `${member.membershipYears} years` : '—'}
                          </td>
                          <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                            <Link
                              to={`/members/${member.id}`}
                              style={{
                                display: 'inline-block',
                                padding: '12px 24px',
                                background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '10px',
                                fontSize: '16px',
                                fontWeight: '700',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 8px rgba(20,184,166,0.3)',
                                whiteSpace: 'nowrap'
                              }}
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
