import { useState, useMemo, useRef, useEffect } from 'react'
import { Plus, Search, AlertTriangle, CheckCircle2, Circle, Play, X, ChevronRight, RefreshCw, Upload, FileText, Trash2, Download } from 'lucide-react'
import useApi from '../hooks/useApi'
import { apiFetch, API_BASE } from '../lib/api'

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [taskDocs, setTaskDocs] = useState<any[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docCategory, setDocCategory] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const params = useMemo(() => {
    const p = new URLSearchParams()
    if (searchTerm) p.set('search', searchTerm)
    if (statusFilter) p.set('status', statusFilter)
    return p.toString()
  }, [searchTerm, statusFilter])

  const tasksApi = useApi(`/tasks?${params}`)
  const tasks = Array.isArray(tasksApi.data?.data) ? tasksApi.data.data : Array.isArray(tasksApi.data) ? tasksApi.data : []
  const loading = tasksApi.loading

  const activeTaskApi = useApi(activeTaskId ? `/tasks/${activeTaskId}` : null)
  const activeTask = activeTaskApi.data
  const activeTaskLoading = activeTaskApi.loading

  const { data: clientsData } = useApi('/clients?limit=100')
  const clients = clientsData?.data || clientsData || []

  const { data: employeesData } = useApi('/employees')
  const employees = employeesData?.data || employeesData || []

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      const data = {
        title: formData.get('title') as string,
        description: formData.get('description') as string || undefined,
        clientId: formData.get('clientId') as string || undefined,
        serviceType: formData.get('serviceType') as string || undefined,
        dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string).toISOString() : null,
        targetDate: formData.get('targetDate') ? new Date(formData.get('targetDate') as string).toISOString() : null,
        priority: formData.get('priority') as string || 'medium',
        assigneeIds: formData.get('assigneeIds') ? [formData.get('assigneeIds') as string] : [],
        tags: [formData.get('serviceType') as string],
        status: 'not_started',
      }
      await tasksApi.mutate('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      setShowCreateModal(false)
      tasksApi.refetch()
    } catch (err: any) {
      setError(err.data?.message || err.message || 'Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      await tasksApi.mutate(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      tasksApi.refetch()
      if (activeTaskId === taskId) activeTaskApi.refetch()
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to update status')
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    try {
      await tasksApi.mutate(`/tasks/${taskId}`, { method: 'DELETE' })
      tasksApi.refetch()
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to delete task')
    }
  }

  const handleViewTask = (task: any) => {
    setActiveTaskId(task.id)
  }

  useEffect(() => {
    if (activeTaskId) {
      setDocsLoading(true)
      apiFetch(`/documents/by-task/${activeTaskId}`)
        .then((data: any) => setTaskDocs(data?.data || data || []))
        .catch(() => setTaskDocs([]))
        .finally(() => setDocsLoading(false))
    } else {
      setTaskDocs([])
    }
  }, [activeTaskId])

  const handleDocFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleUploadTaskDoc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !activeTaskId) return
    setUploadingDoc(true)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        try {
          await apiFetch('/documents/upload-file', {
            method: 'POST',
            body: JSON.stringify({
              fileName: selectedFile.name,
              category: docCategory || 'Task Document',
              fileData: ev.target?.result as string,
              fileType: selectedFile.type,
              fileSize: selectedFile.size,
              taskId: activeTaskId,
            }),
          })
          setSelectedFile(null)
          setDocCategory('')
          if (fileInputRef.current) fileInputRef.current.value = ''
          const data = await apiFetch(`/documents/by-task/${activeTaskId}`)
          setTaskDocs(data?.data || data || [])
        } catch (err: any) {
          alert(err.data?.message || err.message || 'Failed to upload document')
        } finally {
          setUploadingDoc(false)
        }
      }
      reader.readAsDataURL(selectedFile)
    } catch (err: any) {
      alert(err.message || 'Failed to upload document')
      setUploadingDoc(false)
    }
  }

  const handleDeleteTaskDoc = async (docId: string) => {
    if (!confirm('Delete this document?')) return
    try {
      await apiFetch(`/documents/${docId}`, { method: 'DELETE' })
      if (activeTaskId) {
        const data = await apiFetch(`/documents/by-task/${activeTaskId}`)
        setTaskDocs(data?.data || data || [])
      }
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to delete document')
    }
  }

  const handleDownloadTaskDoc = async (doc: any) => {
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

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (isOverdue && status !== 'completed' && status !== 'verified') return 'bg-red-50 text-red-700 border-red-200'
    switch (status) {
      case 'completed':
      case 'verified': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'overdue': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-amber-50 text-amber-700 border-amber-200'
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
          <p className="text-sm text-gray-500 mt-1">{tasks.length} tasks across all clients</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { tasksApi.refetch(); if (activeTaskId) activeTaskApi.refetch() }} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button onClick={() => { setError(null); setShowCreateModal(true) }} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Create Task
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">{error}</div>}

      {/* Task Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
                  { label: 'Pending', count: tasks.filter((t: any) => t.status === 'not_started').length, icon: Circle, color: 'text-amber-600 bg-amber-50', border: 'border-amber-200' },
          { label: 'In Progress', count: tasks.filter((t: any) => t.status === 'in_progress').length, icon: Play, color: 'text-blue-600 bg-blue-50', border: 'border-blue-200' },
          { label: 'Completed', count: tasks.filter((t: any) => t.status === 'completed' || t.status === 'verified').length, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Overdue', count: tasks.filter((t: any) => t.isOverdue || t.status === 'overdue').length, icon: AlertTriangle, color: 'text-red-600 bg-red-50', border: 'border-red-200' },
        ].map((stat) => (
          <div key={stat.label} className={`bg-white rounded-2xl border ${stat.border} shadow-sm p-5 flex items-center gap-4`}>
            <div className={`p-3 rounded-xl ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input w-auto">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
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
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assignee</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                  {tasks.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">No tasks found. Create your first task.</td></tr>
                ) : tasks.map((task: any) => (
                  <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        {task.isOverdue && <AlertTriangle size={18} className="text-red-600 mt-0.5" />}
                        {task.status === 'completed' && <CheckCircle2 size={18} className="text-emerald-600 mt-0.5" />}
                        {task.status === 'in_progress' && <Play size={18} className="text-blue-600 mt-0.5" />}
                        {!task.isOverdue && task.status === 'not_started' && <Circle size={18} className="text-gray-300 mt-0.5" />}
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{task.title}</p>
                          <p className="text-xs text-gray-500">{task.serviceType || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{task.client?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{task.assignee?.name || '-'}</td>
                    <td className={`px-6 py-3 text-sm ${task.isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className={`text-xs rounded-lg px-2 py-1 border ${getStatusBadge(task.status, task.isOverdue)}`}
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="verified">Verified</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleViewTask(task)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                          <ChevronRight size={16} />
                        </button>
                        <button onClick={() => handleDelete(task.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Create New Task</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
               <div className="p-6 space-y-4">
                 <div>
                   <label className="form-label">Task Title *</label>
                   <input name="title" type="text" className="form-input" placeholder="e.g., GSTR-3B Filing" required />
                 </div>
                 <div>
                   <label className="form-label">Client</label>
                   <select name="clientId" className="form-input">
                     <option value="">Select client</option>
                     {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="form-label">Description</label>
                   <textarea name="description" className="form-input" rows={2} placeholder="Task description..."></textarea>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="form-label">Service Type</label>
                    <select name="serviceType" className="form-input">
                      <option value="GST Return">GST Return</option>
                      <option value="ITR">ITR</option>
                      <option value="TDS">TDS</option>
                      <option value="ROC">ROC</option>
                      <option value="Tax Audit">Tax Audit</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Priority</label>
                    <select name="priority" className="form-input">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Assign To</label>
                  <select name="assigneeIds" className="form-input">
                    <option value="">Unassigned</option>
                    {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation || 'Employee'})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Due Date</label>
                    <input name="dueDate" type="date" className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">Target Date</label>
                    <input name="targetDate" type="date" className="form-input" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">{submitting ? 'Creating...' : 'Create Task'}</button>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {activeTaskId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                {activeTaskLoading ? (
                  <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-gray-900">{activeTask?.title || 'Task Details'}</h3>
                    <p className="text-sm text-gray-500 mt-1">{activeTask?.client?.name || '-'}</p>
                  </>
                )}
              </div>
              <button onClick={() => setActiveTaskId(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            {activeTaskLoading ? (
              <div className="p-6 flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              </div>
            ) : activeTask ? (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(activeTask.status, activeTask.isOverdue)}`}>
                      {activeTask.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Service</p>
                    <p className="text-sm font-medium text-gray-900">{activeTask.serviceType || '-'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Assignee</p>
                    <p className="text-sm font-medium text-gray-900">{activeTask.assignee?.name || 'Unassigned'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Due Date</p>
                    <p className="text-sm font-medium text-gray-900">{activeTask.dueDate ? new Date(activeTask.dueDate).toLocaleDateString('en-IN') : '-'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Priority</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{activeTask.priority || 'medium'}</p>
                  </div>
                </div>
                {activeTask.description && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Description</p>
                    <p className="text-sm text-gray-700">{activeTask.description}</p>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Documents</h4>
                  <form onSubmit={handleUploadTaskDoc} className="space-y-2 mb-3">
                    <div className="flex gap-2">
                      <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="form-input text-sm py-2 w-40">
                        <option value="">Category</option>
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
                      <input ref={fileInputRef} type="file" onChange={handleDocFileSelect} className="form-input text-sm py-2 flex-1" />
                      <button type="submit" disabled={uploadingDoc || !selectedFile} className="btn-primary text-sm py-2 disabled:opacity-50">
                        <Upload size={14} />
                      </button>
                    </div>
                  </form>
                  {docsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-5 h-5 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                    </div>
                  ) : taskDocs.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-2">No documents yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {taskDocs.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50/80 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-gray-400" />
                            <div>
                              <p className="text-xs font-medium text-gray-900">{doc.fileName || 'Untitled'}</p>
                              <p className="text-[10px] text-gray-500">{doc.category || 'Uncategorized'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDownloadTaskDoc(doc)} className="p-1 hover:bg-gray-100 rounded text-gray-500"><Download size={12} /></button>
                            <button onClick={() => handleDeleteTaskDoc(doc.id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={async () => { await handleStatusChange(activeTask.id, 'in_progress'); setActiveTaskId(null) }} className="btn-primary flex items-center gap-2"><Play size={16} /> Start</button>
                  <button onClick={async () => { await handleStatusChange(activeTask.id, 'completed'); setActiveTaskId(null) }} className="btn-secondary flex items-center gap-2"><CheckCircle2 size={16} /> Complete</button>
                  {activeTask.status === 'completed' && (
                    <button onClick={async () => { await apiFetch(`/tasks/${activeTask.id}/verify`, { method: 'POST' }); setActiveTaskId(null) }} className="btn-primary flex items-center gap-2"><CheckCircle2 size={16} /> Verify</button>
                  )}
                  <button onClick={async () => { await handleDelete(activeTask.id); setActiveTaskId(null) }} className="btn-secondary flex items-center gap-2 text-red-600"><X size={16} /> Delete</button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-400 text-sm">Task not found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
