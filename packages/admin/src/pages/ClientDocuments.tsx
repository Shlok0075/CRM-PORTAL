import useApi from '../hooks/useApi'

export default function ClientDocuments() {
  const api = useApi('/portal/my-documents')
  const docs = api.data || []

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
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Download</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
