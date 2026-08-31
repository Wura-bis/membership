import { useState } from "react";
import MainLayout from "../../components/mainlayout";
import { useAuth } from "../../hooks/useauth";
import { API_BASE_URL } from '../../utils/api';
import { T, card, btn, pageHeader } from '../../utils/theme';

export default function BulkImport() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const isCsv = selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv');
      const isExcel = selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                      selectedFile.type === 'application/vnd.ms-excel' || 
                      selectedFile.name.endsWith('.xlsx') || 
                      selectedFile.name.endsWith('.xls');
      
      if (!isCsv && !isExcel) {
        setError("Please select a CSV or Excel file (.csv, .xlsx, .xls)");
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
        const errorDetails = previewData.errors.map(errMsg => {
          const match = errMsg.match(/^Row (\d+): (.+)$/);
          return match ? { row: match[1], message: match[2] } : { row: '?', message: errMsg };
        });

        const totalRows = previewData.total_count ?? (previewData.preview.length + previewData.errors.length);

        setUploadResult({
          total_rows: totalRows,
          valid_rows: previewData.preview.length,
          insert_rows: previewData.insert_count ?? previewData.preview.filter(r => r.action !== 'update').length,
          update_rows: previewData.update_count ?? previewData.preview.filter(r => r.action === 'update').length,
          invalid_rows: errorDetails.length,
          errors: errorDetails,
          preview_data: previewData.preview,
          detected_headers: previewData.detected_headers || []
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
      const validMembers = uploadResult.preview_data;

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
          message: `Successfully imported ${(data.created || 0) + (data.updated || 0)} member${((data.created || 0) + (data.updated || 0)) !== 1 ? 's' : ''} (${data.created || 0} new, ${data.updated || 0} updated)${data.errors && data.errors.length > 0 ? ` — ${data.errors.length} error${data.errors.length !== 1 ? 's' : ''}` : ''}`
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
          <div style={pageHeader.wrapper}>
            <div>
              <h1 style={pageHeader.title}>📥 Bulk Import Members</h1>
              <p style={pageHeader.subtitle}>Import multiple members from a CSV or Excel file</p>
            </div>
          </div>

          {/* Instructions */}
          <div style={{
            ...card,
            marginBottom: '32px',
            padding: '24px',
          }}>
            <h3 style={{
              fontSize: T.fontLg,
              fontWeight: '700',
              color: T.textMain,
              margin: 0,
              marginBottom: '16px'
            }}>
              📋 Instructions
            </h3>
            <ol style={{
              color: T.textMuted,
              lineHeight: '1.8',
              fontSize: T.fontBase,
              fontWeight: '500',
              paddingLeft: '24px',
              margin: 0
            }}>
              <li style={{ marginBottom: '12px' }}>Download the CSV template below</li>
              <li style={{ marginBottom: '12px' }}>Fill in the member data in the template</li>
              <li style={{ marginBottom: '12px' }}>Upload the completed file (CSV or Excel)</li>
              <li>Review the preview and confirm the import</li>
            </ol>
            
            <button
              onClick={downloadTemplate}
              style={{
                ...btn.primary,
                marginTop: '20px',
              }}
            >
              📁 Download CSV Template
            </button>
          </div>

          {/* Upload Section */}
          <div style={{
            ...card,
            marginBottom: '32px',
            padding: '24px',
          }}>
            <h3 style={{
              fontSize: 'clamp(16px, 2.2vw, 20px)',
              fontWeight: '700',
              color: T.textMain,
              margin: 0,
              marginBottom: '16px'
            }}>
              📤 Upload File (CSV or Excel)
            </h3>
            
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
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
                  border: `2px dashed ${file ? T.green : T.primaryBorder}`,
                  borderRadius: T.radiusLg,
                  background: file ? T.greenLight : T.primaryBg,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: T.fontBase,
                  fontWeight: '600',
                  color: T.textMain
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = T.primary;
                  e.target.style.transform = 'scale(1.01)';
                  e.target.style.boxShadow = '0 4px 12px rgba(78, 93, 46, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = file ? T.green : T.primaryBorder;
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: 'clamp(26px, 4.5vw, 36px)', marginBottom: '12px' }}>
                  {file ? '✅' : '📂'}
                </div>
                <div style={{ fontSize: T.fontMd, fontWeight: '700', marginBottom: '8px' }}>
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
              <div style={{ padding: '10px 14px', background: T.redLight, borderRadius: T.radiusMd, marginBottom: '16px', fontSize: T.fontBase, fontWeight: '600', color: T.red, border: `2px solid ${T.redBorder}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              style={{
                ...btn.primary,
                padding: '14px 32px',
                fontSize: '15px',
                borderRadius: '12px',
                opacity: (!file || isUploading) ? 0.5 : 1,
                cursor: file && !isUploading ? 'pointer' : 'not-allowed',
              }}
            >
              {isUploading ? '⏳ Processing...' : '🔍 Preview Import'}
            </button>
          </div>

          {/* Preview Results */}
          {uploadResult && !uploadResult.confirmed && (
            <div style={{
              ...card,
              marginBottom: '32px',
              padding: '24px',
            }}>
              <h3 style={{
                fontSize: 'clamp(16px, 2.2vw, 20px)',
                fontWeight: '700',
                color: T.textMain,
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
                <div style={{ padding: '14px 16px', background: T.white, borderRadius: T.radiusMd, border: `2px solid ${T.primaryMid}` }}>
                  <div style={{ fontSize: T.fontBase, fontWeight: '600', color: T.textMuted, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📊 Found <strong style={{ fontWeight: '800', color: T.textMain, margin: '0 4px' }}>{uploadResult.total_rows}</strong> rows in CSV
                  </div>
                </div>
                
                {uploadResult.insert_rows > 0 && (
                  <div style={{ padding: '12px 16px', background: T.greenLight, borderRadius: T.radiusMd, border: `2px solid ${T.greenBorder}` }}>
                    <div style={{ fontSize: T.fontBase, fontWeight: '600', color: T.green, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ✅ <strong style={{ fontWeight: '800', margin: '0 4px' }}>{uploadResult.insert_rows}</strong> new records ready to import
                    </div>
                  </div>
                )}
                {uploadResult.update_rows > 0 && (
                  <div style={{ padding: '12px 16px', background: T.slateLight, borderRadius: T.radiusMd, border: `2px solid ${T.slateBorder}` }}>
                    <div style={{ fontSize: T.fontBase, fontWeight: '600', color: T.textMuted, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🔄 <strong style={{ fontWeight: '800', color: T.textMain, margin: '0 4px' }}>{uploadResult.update_rows}</strong> existing records will have missing fields filled in
                    </div>
                  </div>
                )}
                {uploadResult.invalid_rows > 0 && (
                  <div style={{ padding: '12px 16px', background: T.redLight, borderRadius: T.radiusMd, border: `2px solid ${T.redBorder}` }}>
                    <div style={{ fontSize: T.fontBase, fontWeight: '600', color: T.red, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ⚠️ <strong style={{ fontWeight: '800', margin: '0 4px' }}>{uploadResult.invalid_rows}</strong> records have errors
                    </div>
                  </div>
                )}
              </div>

              {uploadResult.valid_rows === 0 && uploadResult.detected_headers && uploadResult.detected_headers.length > 0 && (
                <div style={{ padding: '14px 16px', background: T.amberLight, borderRadius: T.radiusMd, border: `2px solid ${T.amberBorder}`, marginBottom: '16px' }}>
                  <div style={{ fontSize: T.fontBase, fontWeight: '700', color: T.amber, marginBottom: '6px' }}>
                    ⚠️ Column headers detected in your file:
                  </div>
                  <div style={{ fontSize: T.fontSm, fontWeight: '500', color: T.amber, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {uploadResult.detected_headers.join(', ')}
                  </div>
                  <div style={{ fontSize: T.fontSm, color: T.amber, marginTop: '6px' }}>
                    Expected columns include: <strong>FirstName</strong> (or Forename), <strong>LastName</strong> (or Surname). Rename your CSV columns to match and re-upload.
                  </div>
                </div>
              )}

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div style={{ maxHeight: '300px', overflowY: 'auto', background: T.redLight, padding: '16px', borderRadius: T.radiusMd, marginBottom: '16px', border: `2px solid ${T.redBorder}` }}>
                  <h4 style={{ fontSize: T.fontBase, fontWeight: '700', color: T.red, margin: 0, marginBottom: '12px' }}>
                    🚨 Errors Found:
                  </h4>
                  {uploadResult.errors.map((error, index) => (
                    <div key={index} style={{ fontSize: T.fontBase, fontWeight: '500', color: T.red, padding: '8px 12px', background: T.white, borderRadius: T.radiusSm, marginBottom: '6px', border: `1px solid ${T.redBorder}` }}>
                      <strong>Row {error.row}:</strong> {error.message}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={confirmImport}
                disabled={uploadResult.valid_rows === 0}
                style={{ ...btn.success, opacity: uploadResult.valid_rows === 0 ? 0.5 : 1, cursor: uploadResult.valid_rows > 0 ? 'pointer' : 'not-allowed' }}
              >
                ✅ Confirm Import ({[
                  uploadResult.insert_rows > 0 ? `${uploadResult.insert_rows} new` : null,
                  uploadResult.update_rows > 0 ? `${uploadResult.update_rows} updated` : null
                ].filter(Boolean).join(', ')})
              </button>
            </div>
          )}

          {/* Success Message */}
          {uploadResult && uploadResult.confirmed && (
            <div style={{ marginBottom: '32px', padding: '32px 24px', background: T.greenLight, borderRadius: T.radiusLg, border: `2px solid ${T.greenBorder}`, textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
              <h3 style={{ fontSize: T.fontLg, fontWeight: '700', color: T.green, margin: '0 0 12px 0' }}>
                Import Successful!
              </h3>
              <p style={{ fontSize: T.fontBase, fontWeight: '600', color: T.green, margin: 0 }}>
                {uploadResult.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
