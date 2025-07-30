import { useState } from "react";
import MainLayout from "../../components/mainlayout";
import { useAuth } from "../../hooks/useauth";

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
      const response = await fetch("http://localhost:5000/api/import/members/template", {
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
      const previewResponse = await fetch("http://localhost:5000/api/import/members/preview", {
        method: "POST",
        credentials: "include",
        body: formData
      });

      const previewData = await previewResponse.json();

      if (previewResponse.ok) {
        setUploadResult(previewData);
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
      const response = await fetch("http://localhost:5000/api/import/members/confirm", {
        method: "POST",
        credentials: "include",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ import_id: uploadResult.import_id })
      });

      const data = await response.json();

      if (response.ok) {
        setUploadResult({
          ...uploadResult,
          confirmed: true,
          message: `Successfully imported ${data.imported_count} members`
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
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-title">📥 Bulk Import Members</h1>
              <p className="dashboard-subtitle">
                Import multiple members from a CSV file
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="dashboard-card" style={{ marginBottom: '24px' }}>
            <h3 style={{ color: '#0f766e', marginBottom: '16px' }}>📋 Instructions</h3>
            <ol style={{ color: '#64748b', lineHeight: '1.6' }}>
              <li>Download the CSV template below</li>
              <li>Fill in the member data in the template</li>
              <li>Upload the completed CSV file</li>
              <li>Review the preview and confirm the import</li>
            </ol>
            
            <button
              onClick={downloadTemplate}
              style={{
                marginTop: '16px',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              📁 Download CSV Template
            </button>
          </div>

          {/* Upload Section */}
          <div className="dashboard-card">
            <h3 style={{ color: '#0f766e', marginBottom: '16px' }}>📤 Upload CSV File</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{
                  padding: '12px',
                  border: '2px dashed #14b8a6',
                  borderRadius: '8px',
                  width: '100%',
                  fontSize: '14px'
                }}
              />
            </div>

            {file && (
              <div style={{ 
                padding: '12px', 
                background: '#f0fdfa', 
                borderRadius: '8px', 
                marginBottom: '16px',
                fontSize: '14px',
                color: '#0f766e'
              }}>
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}

            {error && (
              <div style={{ 
                padding: '12px', 
                background: '#fef2f2', 
                borderRadius: '8px', 
                marginBottom: '16px',
                fontSize: '14px',
                color: '#dc2626'
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              style={{
                padding: '12px 24px',
                background: file && !isUploading 
                  ? 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)' 
                  : '#e2e8f0',
                color: file && !isUploading ? 'white' : '#94a3b8',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: file && !isUploading ? 'pointer' : 'not-allowed'
              }}
            >
              {isUploading ? '⏳ Processing...' : '🔍 Preview Import'}
            </button>
          </div>

          {/* Preview Results */}
          {uploadResult && !uploadResult.confirmed && (
            <div className="dashboard-card">
              <h3 style={{ color: '#0f766e', marginBottom: '16px' }}>📋 Import Preview</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: '#64748b' }}>
                  Found <strong>{uploadResult.total_rows}</strong> rows in CSV
                </p>
                <p style={{ color: '#16a34a' }}>
                  <strong>{uploadResult.valid_rows}</strong> valid records ready to import
                </p>
                {uploadResult.invalid_rows > 0 && (
                  <p style={{ color: '#dc2626' }}>
                    <strong>{uploadResult.invalid_rows}</strong> records have errors
                  </p>
                )}
              </div>

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div style={{ 
                  maxHeight: '200px', 
                  overflowY: 'auto', 
                  background: '#fef2f2', 
                  padding: '12px', 
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ color: '#dc2626', marginBottom: '8px' }}>Errors:</h4>
                  {uploadResult.errors.map((error, index) => (
                    <div key={index} style={{ fontSize: '13px', color: '#dc2626' }}>
                      Row {error.row}: {error.message}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={confirmImport}
                disabled={uploadResult.valid_rows === 0}
                style={{
                  padding: '12px 24px',
                  background: uploadResult.valid_rows > 0 
                    ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' 
                    : '#e2e8f0',
                  color: uploadResult.valid_rows > 0 ? 'white' : '#94a3b8',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: uploadResult.valid_rows > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                ✅ Confirm Import ({uploadResult.valid_rows} records)
              </button>
            </div>
          )}

          {/* Success Message */}
          {uploadResult && uploadResult.confirmed && (
            <div className="dashboard-card">
              <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                color: '#16a34a'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                <h3 style={{ marginBottom: '8px' }}>Import Successful!</h3>
                <p>{uploadResult.message}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
