import { useState } from "react";
import MainLayout from "../../components/mainlayout";
import { useAuth } from "../../hooks/useauth";
import { API_BASE_URL } from '../../utils/api';

export default function BulkImport() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
      setError("");
      setUploadResult(null);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/import/members/template`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'member_import_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        setError("Failed to download template");
      }
    } catch (err) {
      setError("Failed to download template");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append('file', file);

      // First, preview the import
      const previewResponse = await fetch(`${API_BASE_URL}/api/import/members/preview`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      const previewData = await previewResponse.json();

      if (previewResponse.ok) {
        // Transform backend response to match frontend expectations
        const validRecords = previewData.preview.filter((_, index) => 
          !previewData.errors.some(err => err.startsWith(`Row ${index + 1}:`))
        );
        
        const errorDetails = previewData.errors.map(errMsg => {
          const match = errMsg.match(/^Row (\d+): (.+)$/);
          return match ? { row: match[1], message: match[2] } : { row: '?', message: errMsg };
        });

        setUploadResult({
          total_rows: previewData.preview.length,
          valid_rows: validRecords.length,
          invalid_rows: errorDetails.length,
          errors: errorDetails,
          preview_data: previewData.preview
        });
      } else {
        setError(previewData.error || "Upload failed");
      }
    } catch (err) {
      setError("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const confirmImport = async () => {
    try {
      // Filter out invalid records before sending to backend
      const validMembers = uploadResult.preview_data.filter((_, index) => 
        !uploadResult.errors.some(err => parseInt(err.row) === index + 1)
      );

      const response = await fetch(`${API_BASE_URL}/api/import/members/confirm`, {
        method: "POST",
        credentials: "include",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ members: validMembers })
      });

      const data = await response.json();

      if (response.ok) {
        setUploadResult({
          ...uploadResult,
          confirmed: true,
          message: `Successfully imported ${data.inserted} member${data.inserted !== 1 ? 's' : ''}${data.errors && data.errors.length > 0 ? ` (${data.errors.length} error${data.errors.length !== 1 ? 's' : ''})` : ''}`
        });
        setFile(null);
      } else {
        setError(data.error || "Import confirmation failed");
      }
    } catch (err) {
      setError("Import confirmation failed: " + err.message);
    }
  };

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div>
              <h1 style={{ 
                fontSize: '38px', 
                fontWeight: '700', 
                color: '#0f766e', 
                marginBottom: '12px',
                margin: 0 
              }}>
                📥 Bulk Import Members
              </h1>
              <p style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#64748b',
                margin: 0 
              }}>
                Import multiple members from a CSV file
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div style={{ 
            marginBottom: '32px',
            padding: '36px',
            background: '#f0fdfa',
            borderRadius: '16px',
            border: '2px solid #5eead4',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.15)'
          }}>
            <h3 style={{ 
              fontSize: '24px',
              fontWeight: '700',
              color: '#0f766e', 
              marginBottom: '20px',
              margin: 0,
              marginBottom: '20px'
            }}>
              📋 Instructions
            </h3>
            <ol style={{ 
              color: '#64748b', 
              lineHeight: '1.8',
              fontSize: '17px',
              fontWeight: '500',
              paddingLeft: '24px',
              margin: 0
            }}>
              <li style={{ marginBottom: '12px' }}>Download the CSV template below</li>
              <li style={{ marginBottom: '12px' }}>Fill in the member data in the template</li>
              <li style={{ marginBottom: '12px' }}>Upload the completed CSV file</li>
              <li>Review the preview and confirm the import</li>
            </ol>
            
            <button
              onClick={downloadTemplate}
              style={{
                marginTop: '24px',
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
                color: 'white',
                border: '2px solid #0f766e',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(20, 184, 166, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(20, 184, 166, 0.3)';
              }}
            >
              📁 Download CSV Template
            </button>
          </div>

          {/* Upload Section */}
          <div style={{
            marginBottom: '32px',
            padding: '36px',
            background: 'white',
            borderRadius: '16px',
            border: '2px solid #5eead4',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.15)'
          }}>
            <h3 style={{ 
              fontSize: '24px',
              fontWeight: '700',
              color: '#0f766e', 
              marginBottom: '24px',
              margin: 0,
              marginBottom: '24px'
            }}>
              📤 Upload CSV File
            </h3>
            
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{
                  opacity: 0,
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer',
                  zIndex: 2
                }}
                id="csv-file-input"
              />
              <label
                htmlFor="csv-file-input"
                style={{
                  display: 'block',
                  padding: '32px',
                  border: '3px dashed ' + (file ? '#059669' : '#14b8a6'),
                  borderRadius: '12px',
                  background: file 
                    ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                    : 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '17px',
                  fontWeight: '600',
                  color: '#0f766e'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#0f766e';
                  e.target.style.transform = 'scale(1.01)';
                  e.target.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = file ? '#059669' : '#14b8a6';
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                  {file ? '✅' : '📂'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                  {file ? `${file.name}` : 'Choose CSV File'}
                </div>
                <div style={{ 
                  fontSize: '15px', 
                  fontWeight: '500', 
                  color: file ? '#059669' : '#64748b' 
                }}>
                  {file 
                    ? `${(file.size / 1024).toFixed(1)} KB - Click to change file`
                    : 'Click or drag and drop your CSV file here'
                  }
                </div>
              </label>
            </div>

            {error && (
              <div style={{ 
                padding: '20px', 
                background: '#fff1f2', 
                borderRadius: '12px', 
                marginBottom: '20px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#dc2626',
                border: '2px solid #fecaca',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
                {error}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              style={{
                padding: '14px 32px',
                background: file && !isUploading 
                  ? 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)' 
                  : '#e2e8f0',
                color: file && !isUploading ? 'white' : '#94a3b8',
                border: '2px solid ' + (file && !isUploading ? '#0f766e' : '#cbd5e1'),
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: file && !isUploading ? 'pointer' : 'not-allowed',
                boxShadow: file && !isUploading ? '0 2px 8px rgba(20, 184, 166, 0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (file && !isUploading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (file && !isUploading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(20, 184, 166, 0.3)';
                }
              }}
            >
              {isUploading ? '⏳ Processing...' : '🔍 Preview Import'}
            </button>
          </div>

          {/* Preview Results */}
          {uploadResult && !uploadResult.confirmed && (
            <div style={{
              marginBottom: '32px',
              padding: '36px',
              background: 'white',
              borderRadius: '16px',
              border: '2px solid #5eead4',
              boxShadow: '0 4px 12px rgba(20, 184, 166, 0.15)'
            }}>
              <h3 style={{ 
                fontSize: '24px',
                fontWeight: '700',
                color: '#0f766e', 
                marginBottom: '28px',
                margin: 0,
                marginBottom: '28px'
              }}>
                📋 Import Preview
              </h3>
              
              <div style={{ 
                marginBottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ 
                  padding: '20px',
                  background: '#f0fdfa',
                  borderRadius: '12px',
                  border: '2px solid #ccfbf1'
                }}>
                  <div style={{ 
                    fontSize: '17px',
                    fontWeight: '600',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '24px' }}>📊</span>
                    Found <strong style={{ 
                      fontSize: '20px',
                      fontWeight: '800',
                      color: '#0f766e',
                      margin: '0 6px'
                    }}>{uploadResult.total_rows}</strong> rows in CSV
                  </div>
                </div>
                
                <div style={{ 
                  padding: '20px',
                  background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                  borderRadius: '12px',
                  border: '2px solid #059669'
                }}>
                  <div style={{ 
                    fontSize: '17px',
                    fontWeight: '600',
                    color: '#065f46',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '24px' }}>✅</span>
                    <strong style={{ 
                      fontSize: '20px',
                      fontWeight: '800',
                      color: '#059669',
                      margin: '0 6px'
                    }}>{uploadResult.valid_rows}</strong> valid records ready to import
                  </div>
                </div>
                
                {uploadResult.invalid_rows > 0 && (
                  <div style={{ 
                    padding: '20px',
                    background: '#fff1f2',
                    borderRadius: '12px',
                    border: '2px solid #fecaca'
                  }}>
                    <div style={{ 
                      fontSize: '17px',
                      fontWeight: '600',
                      color: '#991b1b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <span style={{ fontSize: '24px' }}>⚠️</span>
                      <strong style={{ 
                        fontSize: '20px',
                        fontWeight: '800',
                        color: '#dc2626',
                        margin: '0 6px'
                      }}>{uploadResult.invalid_rows}</strong> records have errors
                    </div>
                  </div>
                )}
              </div>

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div style={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto', 
                  background: '#fff1f2', 
                  padding: '24px', 
                  borderRadius: '12px',
                  marginBottom: '24px',
                  border: '2px solid #fecaca'
                }}>
                  <h4 style={{ 
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#dc2626', 
                    marginBottom: '16px',
                    margin: 0,
                    marginBottom: '16px'
                  }}>
                    🚨 Errors Found:
                  </h4>
                  {uploadResult.errors.map((error, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        fontSize: '15px', 
                        fontWeight: '500',
                        color: '#991b1b',
                        padding: '10px 16px',
                        background: 'white',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        border: '1px solid #fecaca'
                      }}
                    >
                      <strong>Row {error.row}:</strong> {error.message}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={confirmImport}
                disabled={uploadResult.valid_rows === 0}
                style={{
                  padding: '14px 32px',
                  background: uploadResult.valid_rows > 0 
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
                    : '#e2e8f0',
                  color: uploadResult.valid_rows > 0 ? 'white' : '#94a3b8',
                  border: '2px solid ' + (uploadResult.valid_rows > 0 ? '#16a34a' : '#cbd5e1'),
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: uploadResult.valid_rows > 0 ? 'pointer' : 'not-allowed',
                  boxShadow: uploadResult.valid_rows > 0 ? '0 2px 8px rgba(34, 197, 94, 0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (uploadResult.valid_rows > 0) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (uploadResult.valid_rows > 0) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.3)';
                  }
                }}
              >
                ✅ Confirm Import ({uploadResult.valid_rows} {uploadResult.valid_rows === 1 ? 'record' : 'records'})
              </button>
            </div>
          )}

          {/* Success Message */}
          {uploadResult && uploadResult.confirmed && (
            <div style={{
              marginBottom: '32px',
              padding: '48px 36px',
              background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
              borderRadius: '16px',
              border: '3px solid #059669',
              boxShadow: '0 6px 20px rgba(34, 197, 94, 0.3)'
            }}>
              <div style={{ 
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '80px', 
                  marginBottom: '24px',
                  animation: 'bounce 1s ease-in-out'
                }}>✅</div>
                <h3 style={{ 
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#065f46',
                  marginBottom: '16px',
                  margin: 0,
                  marginBottom: '16px'
                }}>
                  Import Successful!
                </h3>
                <p style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#059669',
                  margin: 0
                }}>
                  {uploadResult.message}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
