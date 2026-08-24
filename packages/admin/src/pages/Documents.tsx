import { useState, useRef } from 'react'
import { FolderOpen, Upload, Download, Search, FileText, Image, FileSpreadsheet, File, Eye, Plus, X, Package, RefreshCw, UploadCloud } from 'lucide-react'
import { apiFetch, API_BASE } from '../lib/api'
import useApi from '../hooks/useApi'

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'digital' | 'physical'>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showPhysicalModal, setShowPhysicalModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)

  const docQuery = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''
  const { data: docData, loading: docLoading, error: docError, refetch: refetchDocuments } = useApi(`/documents${docQuery}`)
  const { data: physData, loading: physLoading, error: physError, refetch: refetchPhysicalDocs } = useApi('/document-in-out')

  const documents = docData?.data || docData || []
  const physicalDocs = physData?.data || physData || []

  const loading = docLoading || physLoading
  const error = docError || physError

  const refetchAll = () => {
    refetchDocuments()
    refetchPhysicalDocs()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => {
        setFilePreview(ev.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setUploadProgress(0)
    try {
      const form = e.target as HTMLFormElement
      const fileName = (form.elements.namedItem('fileName') as HTMLInputElement).value
      const category = (form.elements.namedItem('category') as HTMLSelectElement).value

      if (!selectedFile) {
        alert('Please select a file')
        return
      }

      const reader = new FileReader()
      reader.onload = async (ev) => {
        try {
          setUploadProgress(50)
          const base64Data = ev.target?.result as string
          await apiFetch('/documents/upload-file', {
            method: 'POST',
            body: JSON.stringify({
              fileName,
              category,
              fileData: base64Data,
              fileType: selectedFile.type,
              fileSize: selectedFile.size,
            }),
          })
          setUploadProgress(100)
          setShowUploadModal(false)
          setSelectedFile(null)
          setFilePreview(null)
          if (fileInputRef.current) fileInputRef.current.value = ''
          refetchAll()
        } catch (err: any) {
          alert(err.data?.message || err.message || 'Failed to upload document')
        } finally {
          setSubmitting(false)
          setUploadProgress(0)
        }
      }
      reader.readAsDataURL(selectedFile)
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to upload document')
      setSubmitting(false)
      setUploadProgress(0)
    }
  }

  const handlePreview = async (doc: any) => {
    try {
      const blob = await apiFetch(`/documents/${doc.id}/preview`, {}, 'blob')
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to preview document')
    }
  }

  const handleDownload = async (doc: any) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const res = await fetch(`${API_BASE}/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.fileName || 'document'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || 'Failed to download document')
    }
  }

  const handleBulkDownload = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const res = await fetch(`${API_BASE}/documents/bulk-download?ids=all`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'documents.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || 'Failed to download documents')
    }
  }

  const handlePhysicalCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      await apiFetch('/document-in-out', {
        method: 'POST',
        body: JSON.stringify({
          itemName: formData.get('itemName') as string,
          clientId: formData.get('clientId') as string || undefined,
          direction: formData.get('direction') as string,
          returnable: formData.get('returnable') === 'yes',
          location: formData.get('location') as string || undefined,
          remarks: formData.get('remarks') as string || undefined,
        }),
      })
      setShowPhysicalModal(false)
      refetchAll()
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to save entry')
    } finally {
      setSubmitting(false)
    }
  }

  const getFileIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'application/pdf': return <FileText className="text-red-500" size={20} />
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': return <FileSpreadsheet className="text-emerald-500" size={20} />
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif': return <Image className="text-blue-500" size={20} />
      case 'application/zip':
      case 'application/x-zip-compressed': return <Package className="text-amber-500" size={20} />
      default: return <File className="text-gray-500" size={20} />
    }
  }

  const getFileExtension = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'application/pdf': return 'PDF'
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': return 'XLS'
      case 'image/jpeg': return 'JPG'
      case 'image/png': return 'PNG'
      case 'application/zip': return 'ZIP'
      default: return 'FILE'
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Management</h2>
          <p className="text-sm text-gray-500 mt-1">{documents.length} documents stored</p>
        </div>
        <div className="flex gap-3">
          <button onClick={refetchAll} className="btn-secondary flex items-center gap-2"><RefreshCw size={16} />Refresh</button>
          <button onClick={handleBulkDownload} className="btn-secondary flex items-center gap-2"><Download size={16} />Download All</button>
          <button onClick={() => setShowPhysicalModal(true)} className="btn-secondary flex items-center gap-2">
            <Plus size={16} />
            Physical Register
          </button>
          <button onClick={() => { setShowUploadModal(true); setSelectedFile(null); setFilePreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className="btn-primary flex items-center gap-2">
            <Upload size={16} />
            Upload Document
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">{error}</div>}

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'all', label: 'All Documents', icon: FolderOpen },
          { key: 'digital', label: 'Digital Upload', icon: Upload },
          { key: 'physical', label: 'Physical Register', icon: Package },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab !== 'physical' && (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Document</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploaded By</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {documents.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">No documents found. Upload your first document.</td></tr>
                    ) : documents.map((doc: any) => (
                      <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {getFileIcon(doc.fileType)}
                            <div>
                              <p className="font-semibold text-sm text-gray-900">{doc.fileName || 'Untitled'}</p>
                              <p className="text-xs text-gray-500">{doc.fileType ? getFileExtension(doc.fileType) : 'Unknown type'} • {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">{doc.category}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{doc.uploadedBy || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-IN') : '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handlePreview(doc)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Preview"><Eye size={16} /></button>
                            <button onClick={() => handleDownload(doc)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Download"><Download size={16} /></button>
                          </div>
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

      {activeTab === 'physical' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Document</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Direction</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Custody</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {physicalDocs.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No physical document entries yet.</td></tr>
                  ) : physicalDocs.map((doc: any) => (
                    <tr key={doc.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{doc.itemName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${doc.direction === 'in' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                          {doc.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{doc.date ? new Date(doc.date).toLocaleDateString('en-IN') : '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{doc.location || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${doc.status === 'returned' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {doc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Upload Document</h3>
              <button onClick={() => { setShowUploadModal(false); setSelectedFile(null); setFilePreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="form-label">Select File</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="form-input"
                    required
                  />
                  {selectedFile && (
                    <p className="text-xs text-gray-500 mt-1">Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>
                  )}
                </div>
                {filePreview && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-700 mb-2">Preview</p>
                    {filePreview.startsWith('data:image') ? (
                      <img src={filePreview} alt="Preview" className="max-h-40 rounded-lg" />
                    ) : (
                      <p className="text-sm text-gray-600">File selected — {selectedFile?.name}</p>
                    )}
                  </div>
                )}
                <div>
                  <label className="form-label">File Name</label>
                  <input name="fileName" type="text" className="form-input" placeholder="e.g., GSTR-3B_July2025.pdf" required />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <select name="category" className="form-input">
                    <option>Financial Statements</option>
                    <option>Bank Statements</option>
                    <option>Purchase/Sales Register</option>
                    <option>TDS Certificates</option>
                    <option>PAN/Aadhaar/KYC</option>
                    <option>DSC</option>
                    <option>Agreements</option>
                    <option>Notices/Orders</option>
                    <option>Filed Returns</option>
                  </select>
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</> : <><UploadCloud size={16} />Save Document</>}
                  </button>
                  <button type="button" onClick={() => { setShowUploadModal(false); setSelectedFile(null); setFilePreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPhysicalModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Physical Document In/Out</h3>
              <button onClick={() => setShowPhysicalModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handlePhysicalCreate}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="form-label">Document Name</label>
                  <input name="itemName" type="text" className="form-input" placeholder="e.g., Original DSC Token" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Direction</label>
                    <select name="direction" className="form-input">
                      <option value="in">In (Received)</option>
                      <option value="out">Out (Given)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Returnable</label>
                    <select name="returnable" className="form-input">
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Location / Custody</label>
                  <input name="location" type="text" className="form-input" placeholder="Who holds this document?" />
                </div>
                <div>
                  <label className="form-label">Remarks</label>
                  <textarea name="remarks" className="form-input" rows={2} placeholder="Additional notes..."></textarea>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">{submitting ? 'Saving...' : 'Save Entry'}</button>
                  <button type="button" onClick={() => setShowPhysicalModal(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
