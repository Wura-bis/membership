import { useState, useEffect } from "react";
import MainLayout from "../components/mainlayout";
import { useAuth } from "../hooks/useauth";

export default function Recognitions() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("awards");
  const [recognitions, setRecognitions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load recognitions data
    const loadData = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/recognitions", {
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          console.log("Backend recognitions data:", data); // Debug log
          setRecognitions(data || []);
          // Set categories from backend or use defaults
          setCategories(["all", "Service", "Culture", "Leadership", "Youth", "Lifetime Achievement"]);
        }
      } catch (err) {
        console.log("Could not load recognitions:", err.message);
        // Fall back to sample data if backend unavailable
        setRecognitions(sampleRecognitions);
        setCategories(sampleCategories);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Sample data until backend is ready
  const sampleRecognitions = [
    {
      id: 1,
      title: "Community Service Excellence Award",
      recipient: "Benevolent Irish Society",
      year: 2024,
      category: "Service",
      description: "Recognized by the Provincial Government for outstanding community service and cultural preservation efforts.",
      image: null
    },
    {
      id: 2,
      title: "Cultural Heritage Preservation Award",
      recipient: "BIS Heritage Committee",
      year: 2024,
      category: "Culture",
      description: "Honored for exceptional work in preserving and promoting Irish cultural traditions in the community.",
      image: null
    },
    {
      id: 3,
      title: "Non-Profit Leadership Recognition",
      recipient: "Benevolent Irish Society",
      year: 2023,
      category: "Leadership",
      description: "Acknowledged for outstanding organizational leadership and community impact over decades of service.",
      image: null
    },
    {
      id: 4,
      title: "Youth Program Excellence Award",
      recipient: "BIS Youth Division",
      year: 2023,
      category: "Youth",
      description: "Recognized for exceptional youth programming and mentorship in Irish cultural education.",
      image: null
    }
  ];

  const sampleCategories = ["Service", "Culture", "Leadership", "Youth", "Lifetime Achievement"];

  // Use real data from backend or fallback to sample data
  const displayRecognitions = recognitions.length > 0 ? recognitions : sampleRecognitions;
  const displayCategories = categories.length > 0 ? categories : sampleCategories;

  // Filter based on whether we're using backend data or sample data
  const filteredRecognitions = selectedCategory === "all" 
    ? displayRecognitions 
    : displayRecognitions.filter(r => {
        // Backend data uses 'type' field, sample data uses 'category'
        const categoryField = r.type || r.category;
        return categoryField === selectedCategory;
      });

  return (
    <MainLayout>
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #e6fffa 50%, #f0fdfa 100%)',
        padding: '32px 24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
              🏆 Society Recognitions & Honors
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#64748b',
              margin: '0'
            }}>
              Recognitions and honors received by the Benevolent Irish Society and affiliated societies
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
                { id: 'awards', label: '🏆 Society Honors' },
                { id: 'hall-of-fame', label: '⭐ Recognition History' }
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

            {/* Recent Awards Tab */}
            {activeTab === 'awards' && (
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: '600', 
                    color: '#1e293b',
                    margin: '0'
                  }}>
                    Recent Awards & Recognitions
                  </h3>
                  
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'white'
                    }}
                  >
                    <option value="all">All Categories</option>
                    {displayCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
                  gap: '20px' 
                }}>
                  {filteredRecognitions.map((recognition) => {
                    // Handle both backend data format and sample data format
                    const title = recognition.title || `${recognition.type || 'Recognition'} - ${recognition.society || 'BIS'}`;
                    const year = recognition.year || recognition.fiscalYear || 'N/A';
                    const category = recognition.category || recognition.type || 'General';
                    const recipient = recognition.recipient || recognition.society || 'Benevolent Irish Society';
                    const description = recognition.description || 'Recognition details';
                    const isActive = recognition.isActive !== undefined ? recognition.isActive : true;
                    
                    return (
                    <div key={recognition.id} style={{
                      background: isActive ? '#f8fafc' : '#f1f5f9',
                      padding: '20px',
                      borderRadius: '8px',
                      border: `1px solid ${isActive ? '#e2e8f0' : '#cbd5e1'}`,
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      opacity: isActive ? 1 : 0.7
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: '12px'
                      }}>
                        <h4 style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#1e293b',
                          margin: '0'
                        }}>
                          {title}
                        </h4>
                        <span style={{
                          background: isActive ? '#14b8a6' : '#94a3b8',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {year}
                        </span>
                      </div>
                      
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{
                          background: '#e2e8f0',
                          color: '#64748b',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {category}
                        </span>
                        {!isActive && (
                          <span style={{
                            background: '#fbbf24',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500',
                            marginLeft: '8px'
                          }}>
                            Inactive
                          </span>
                        )}
                      </div>

                      <p style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#059669',
                        marginBottom: '8px'
                      }}>
                        {recipient}
                      </p>

                      <p style={{
                        fontSize: '14px',
                        color: '#64748b',
                        lineHeight: '1.5',
                        margin: '0'
                      }}>
                        {description}
                      </p>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recognition History Tab */}
            {activeTab === 'hall-of-fame' && (
              <div>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: '#1e293b', 
                  marginBottom: '20px' 
                }}>
                  Recognition History
                </h3>
                
                <div style={{
                  background: '#f8fafc',
                  padding: '40px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📜</div>
                  <h4 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '12px'
                  }}>
                    Society Recognition History
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    maxWidth: '400px',
                    margin: '0 auto',
                    lineHeight: '1.5'
                  }}>
                    A comprehensive timeline of honors and recognitions received by the Benevolent Irish Society 
                    and its affiliated societies throughout our proud history. Coming soon!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Recognition Stats */}
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
              📊 Recognition Statistics
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#14b8a6' 
                }}>
                  47
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#64748b' 
                }}>
                  Total Awards
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#14b8a6' 
                }}>
                  12
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#64748b' 
                }}>
                  This Year
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#14b8a6' 
                }}>
                  5
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#64748b' 
                }}>
                  Categories
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#14b8a6' 
                }}>
                  34
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#64748b' 
                }}>
                  Recipients
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 