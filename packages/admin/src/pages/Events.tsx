import { useState, useMemo } from 'react'
import { Plus, X, RefreshCw, Upload, FileText, Eye, CheckCircle2, PlayCircle, XCircle, Pencil } from 'lucide-react'
import useApi from '../hooks/useApi'
import { apiFetch, API_BASE } from '../lib/api'

const STATUSES = ['pending', 'ongoing', 'completed', 'cancelled']
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
}
const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  ongoing: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

export default function Events() {
  const role = (localStorage.getItem('role') || sessionStorage.getItem('role') || 'admin') as string
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [activeEventId, setActiveEventId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const params = useMemo(() => {
    const p = new URLSearchParams()
    if (searchTerm) p.set('search', searchTerm)
    if (statusFilter) p.set('status', statusFilter)
    return p.toString()
  }, [searchTerm, statusFilter])

  const eventsApi = useApi(`/events?${params}`)
  const events = eventsApi.data?.data || eventsApi.data || []
  const loading = eventsApi.loading

  const activeApi = useApi(activeEventId ? `/events/${activeEventId}` : null)
  const activeEvent = activeApi.data

  const { data: clientsData } = useApi('/clients?limit=100')
  const clients = clientsData?.data || clientsData || []

  const { data: teamData } = useApi('/employees')
  const team = teamData?.data || teamData || []

  const { data: docsData, refetch: refetchDocs } = useApi(activeEventId ? `/documents/by-event/${activeEventId}` : null)
  const docs = docsData?.data || docsData || []

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      const assignees = Array.from(formData.getAll('assigneeIds') as string[]).filter(Boolean)
      const data = {
        title: formData.get('title') as string,
        description: formData.get('description') as string || undefined,
        clientId: formData.get('clientId') as string || undefined,
        assigneeIds: assignees,
        priority: formData.get('priority') as string || 'medium',
        status: formData.get('status') as string || 'pending',
        startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string).toISOString() : null,
        dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string).toISOString() : null,
        expectedDate: formData.get('expectedDate') ? new Date(formData.get('expectedDate') as string).toISOString() : null,
      }
      await eventsApi.mutate('/events', { method: 'POST', body: JSON.stringify(data) })
      setShowCreateModal(false)
      eventsApi.refetch()
    } catch (err: any) {
      setError(err.data?.message || err.message || 'Failed to create event')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (ev: any) => {
    setEditingEvent(ev)
    setShowEditModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEvent) return
    setSubmitting(true)
    setError(null)
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      const assignees = Array.from(formData.getAll('assigneeIds') as string[]).filter(Boolean)
      const data = {
        title: formData.get('title') as string,
        description: formData.get('description') as string || undefined,
        clientId: formData.get('clientId') as string || undefined,
        assigneeIds: assignees,
        priority: formData.get('priority') as string || 'medium',
        status: formData.get('status') as string || 'pending',
        startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string).toISOString() : null,
        dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string).toISOString() : null,
        expectedDate: formData.get('expectedDate') ? new Date(formData.get('expectedDate') as string).toISOString() : null,
      }
      await eventsApi.mutate(`/events/${editingEvent.id}`, { method: 'PATCH', body: JSON.stringify(data) })
      setShowEditModal(false)
      setEditingEvent(null)
      eventsApi.refetch()
    } catch (err: any) {
      setError(err.data?.message || err.message || 'Failed to update event')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (eventId: string, status: string) => {
    try {
      await eventsApi.mutate(`/events/${eventId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      eventsApi.refetch()
      if (activeEventId === eventId) activeApi.refetch()
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to update status')
    }
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm('Delete this event?')) return
    try {
      await eventsApi.mutate(`/events/${eventId}`, { method: 'DELETE' })
      eventsApi.refetch()
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to delete event')
    }
  }

  const handleDocDownload = async (doc: any) => {
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeEventId) return
    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          await apiFetch('/documents/upload', {
            method: 'POST',
            body: JSON.stringify({
              eventId: activeEventId,
              fileUrl: reader.result,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              category: 'Event Document',
              uploadedByType: role,
            }),
          })
          refetchDocs()
        } catch (err: any) {
          alert(err.data?.message || err.message || 'Upload failed')
        } finally {
          setUploading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{role === 'member' ? 'My Events' : 'Event Management'}</h2>
          <p className="text-sm text-gray-500 mt-1">{events.length} events</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { eventsApi.refetch(); if (activeEventId) activeApi.refetch() }} className="btn-secondary flex items-center gap-2"><RefreshCw size={16} />Refresh</button>
          {role === 'admin' && (
            <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} />Create Event</button>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATUSES.map((s) => (
          <div key={s} className={`bg-white rounded-2xl border shadow-sm p-5 ${STATUS_STYLE[s]}`}>
            <p className="text-2xl font-bold">{events.filter((ev: any) => ev.status === s).length}</p>
            <p className="text-sm opacity-80 mt-1">{STATUS_LABEL[s]}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 p-4">
          <input type="text" placeholder="Search events..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input flex-1" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input w-auto">
            <option value="">All Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assignees</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expected</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {events.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">No events found.</td></tr>
                ) : events.map((ev: any) => (
                  <tr key={ev.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-sm text-gray-900">{ev.title}</p>
                      <p className="text-xs text-gray-500">{ev.priority} priority</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{ev.client?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{(ev.assigneeIds || []).length} assigned</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{ev.expectedDate ? new Date(ev.expectedDate).toLocaleDateString('en-IN') : '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLE[ev.status]}`}>{STATUS_LABEL[ev.status]}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setActiveEventId(ev.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><Eye size={16} /></button>
                        {role === 'admin' && <button onClick={() => handleEdit(ev)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500"><Pencil size={16} /></button>}
                        {role === 'admin' && <button onClick={() => handleDelete(ev.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><X size={16} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Create Event</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="p-6 space-y-4">
                <div><label className="form-label">Event Title *</label><input name="title" type="text" className="form-input" required placeholder="e.g., Q3 Compliance Review" /></div>
                <div><label className="form-label">Client</label><select name="clientId" className="form-input"><option value="">Select client</option>{clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className="form-label">Description</label><textarea name="description" className="form-input" rows={2} placeholder="Event description" /></div>
                <div><label className="form-label">Assign To (team members)</label>
                  <select name="assigneeIds" className="form-input" multiple size={Math.min(team.length || 1, 5)}>
                    {team.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.designation || 'Member'})</option>)}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="form-label">Priority</label><select name="priority" className="form-input"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
                  <div><label className="form-label">Status</label><select name="status" className="form-input">{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="form-label">Start Date</label><input name="startDate" type="date" className="form-input" /></div>
                  <div><label className="form-label">Due Date</label><input name="dueDate" type="date" className="form-input" /></div>
                  <div><label className="form-label">Expected Date</label><input name="expectedDate" type="date" className="form-input" /></div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">{submitting ? 'Creating...' : 'Create Event'}</button>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Edit Event</h3>
              <button onClick={() => { setShowEditModal(false); setEditingEvent(null) }} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="p-6 space-y-4">
                <div><label className="form-label">Event Title *</label><input name="title" type="text" className="form-input" required defaultValue={editingEvent.title} /></div>
                <div><label className="form-label">Client</label><select name="clientId" className="form-input" defaultValue={editingEvent.clientId || ''}><option value="">Select client</option>{clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className="form-label">Description</label><textarea name="description" className="form-input" rows={2} defaultValue={editingEvent.description || ''} /></div>
                <div><label className="form-label">Assign To (team members)</label>
                  <select name="assigneeIds" className="form-input" multiple size={Math.min(team.length || 1, 5)} defaultValue={editingEvent.assigneeIds || []}>
                    {team.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.designation || 'Member'})</option>)}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="form-label">Priority</label><select name="priority" className="form-input" defaultValue={editingEvent.priority || 'medium'}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
                  <div><label className="form-label">Status</label><select name="status" className="form-input" defaultValue={editingEvent.status || 'pending'}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="form-label">Start Date</label><input name="startDate" type="date" className="form-input" defaultValue={editingEvent.startDate ? new Date(editingEvent.startDate).toISOString().slice(0,10) : ''} /></div>
                  <div><label className="form-label">Due Date</label><input name="dueDate" type="date" className="form-input" defaultValue={editingEvent.dueDate ? new Date(editingEvent.dueDate).toISOString().slice(0,10) : ''} /></div>
                  <div><label className="form-label">Expected Date</label><input name="expectedDate" type="date" className="form-input" defaultValue={editingEvent.expectedDate ? new Date(editingEvent.expectedDate).toISOString().slice(0,10) : ''} /></div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">{submitting ? 'Saving...' : 'Update Event'}</button>
                  <button type="button" onClick={() => { setShowEditModal(false); setEditingEvent(null) }} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeEventId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{activeEvent?.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{activeEvent?.client?.name || 'No client'}</p>
              </div>
              <button onClick={() => setActiveEventId(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              {activeEvent?.description && <p className="text-sm text-gray-700">{activeEvent.description}</p>}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500">Status</p><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${STATUS_STYLE[activeEvent?.status]}`}>{STATUS_LABEL[activeEvent?.status]}</span></div>
                <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500">Priority</p><p className="text-sm font-medium capitalize">{activeEvent?.priority}</p></div>
                <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500">Due</p><p className="text-sm">{activeEvent?.dueDate ? new Date(activeEvent.dueDate).toLocaleDateString('en-IN') : '-'}</p></div>
                <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500">Expected</p><p className="text-sm">{activeEvent?.expectedDate ? new Date(activeEvent.expectedDate).toLocaleDateString('en-IN') : '-'}</p></div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleStatusChange(activeEvent.id, 'ongoing')} className="btn-secondary flex items-center gap-1 text-sm"><PlayCircle size={14} />Ongoing</button>
                  <button onClick={() => handleStatusChange(activeEvent.id, 'completed')} className="btn-secondary flex items-center gap-1 text-sm"><CheckCircle2 size={14} />Completed</button>
                  <button onClick={() => handleStatusChange(activeEvent.id, 'cancelled')} className="btn-secondary flex items-center gap-1 text-sm"><XCircle size={14} />Cancelled</button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Documents</p>
                  <label className="btn-primary flex items-center gap-1 text-sm cursor-pointer"><Upload size={14} />{uploading ? 'Uploading...' : 'Upload'}<input type="file" className="hidden" onChange={handleUpload} disabled={uploading} /></label>
                </div>
                {docs.length === 0 ? (
                  <p className="text-sm text-gray-400">No documents uploaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {docs.map((d: any) => (
                      <div key={d.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <FileText size={18} className="text-gray-500" />
                        <span className="text-sm text-gray-700 flex-1 truncate">{d.fileName}</span>
                        <button onClick={() => handleDocDownload(d)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Download</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                {role === 'admin' && <button onClick={() => { handleEdit(activeEvent); setActiveEventId(null) }} className="btn-secondary flex-1">Edit</button>}
                <button onClick={() => setActiveEventId(null)} className="btn-primary flex-1">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
