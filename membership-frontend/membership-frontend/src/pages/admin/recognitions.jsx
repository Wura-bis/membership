import { useState, useEffect } from "react";
import MainLayout from "../../components/mainlayout";
import { useAuth } from "../../hooks/useauth";
import Toast from "../../components/toast";

function AdminRecognitions() {
  const { user } = useAuth();
  const [recognitions, setRecognitions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    loadRecognitions();
  }, []);

  const loadRecognitions = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/recognitions", {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setRecognitions(data);
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
            onClick={() => showToast('Add functionality will be added soon')}
          >
            Add Recognition
          </button>
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
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Society</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Year</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recognitions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    color: '#6b7280' 
                  }}>
                    No recognitions found
                  </td>
                </tr>
              ) : (
                recognitions.map((recognition) => (
                  <tr key={recognition.id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      {recognition.id}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      {recognition.description}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      {recognition.type || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      {recognition.society || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      {recognition.fiscalYear || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: recognition.isActive ? '#dcfce7' : '#fee2e2',
                        color: recognition.isActive ? '#166534' : '#991b1b'
                      }}>
                        {recognition.isActive ? 'Active' : 'Inactive'}
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
                        onClick={() => showToast('Edit functionality will be added soon')}
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
                        onClick={() => showToast('Delete functionality will be added soon')}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      </div>
    </MainLayout>
  );
}

export default AdminRecognitions;