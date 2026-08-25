import useApi from '../hooks/useApi'
import { API_BASE } from '../lib/api'

export default function ClientDocuments() {
  const api = useApi('/portal/my-documents')
  const docs = api.data || []

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

  if (api.loading) return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>
  if (api.error) return <div className="text-red-500 bg-red-50 p-4 rounded-xl text-sm">{api.error}</div>

  return (
    <div className="space-y-6 max-w-[1600px]">
      <h2 className="text-2xl font-bold text-gray-900">My Documents</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {docs.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No documents uploaded yet</p> : (
          <div className="space-y-3">
            {docs.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl">
                <div>
                  <p className="font-medium text-sm text-gray-900">{doc.fileName || 'Untitled'}</p>
                  <p className="text-xs text-gray-500">{doc.category} • {doc.fileType}</p>
                </div>
                <button onClick={() => handleDownload(doc)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Download</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
