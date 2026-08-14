import { useState } from 'react'
import { CheckCircle2, Circle, Plus, X, Clock, RefreshCw } from 'lucide-react'
import useApi from '../hooks/useApi'
import { apiFetch } from '../lib/api'

export default function Todos() {
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    data: todosData,
    loading: todosLoading,
    error: todosError,
    mutate: mutateTodos,
  } = useApi('/todos')

  const todos = todosData?.data || todosData || []

  const {
    data: usersData,
  } = useApi('/employees')

  const users = usersData?.data || usersData || []

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      await apiFetch('/todos', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.get('title') as string,
          assigneeId: formData.get('assigneeId') ? formData.get('assigneeId') as string : undefined,
          dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string).toISOString() : null,
          repeatRule: formData.get('repeatRule') as string || undefined,
          priority: formData.get('priority') as string || undefined,
        }),
      })
      setShowCreateModal(false)
      mutateTodos('/todos')
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to create to-do')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (todo: any) => {
    try {
      const newStatus = todo.status === 'completed' ? 'pending' : 'completed'
      await apiFetch(`/todos/${todo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      mutateTodos('/todos')
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to update')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this to-do?')) return
    try {
      await apiFetch(`/todos/${id}`, { method: 'DELETE' })
      mutateTodos('/todos')
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to delete')
    }
  }

  const filteredTodos = todos.filter((t: any) => {
    if (filter === 'completed') return t.status === 'completed'
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0]
      return t.status !== 'completed' && t.dueDate?.split('T')[0] === today
    }
    if (filter === 'upcoming') {
      const today = new Date().toISOString().split('T')[0]
      return t.status !== 'completed' && t.dueDate && t.dueDate.split('T')[0] > today
    }
    return t.status !== 'completed'
  })

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200'
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'low': return 'bg-gray-100 text-gray-600 border-gray-200'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Internal To-Dos</h2>
          <p className="text-sm text-gray-500 mt-1">{todos.filter((t: any) => t.status !== 'completed').length} pending tasks</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => mutateTodos('/todos')} className="btn-secondary flex items-center gap-2"><RefreshCw size={16} />Refresh</button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Add To-Do
          </button>
        </div>
      </div>

      {todosError && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">{todosError}</div>}

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'all', label: 'All' },
          { key: 'today', label: 'Today' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'completed', label: 'Completed' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {todosLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredTodos.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">No to-dos found. Add your first to-do.</div>
            ) : filteredTodos.map((todo: any) => (
              <div key={todo.id} className={`flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors ${todo.status === 'completed' ? 'opacity-60' : ''}`}>
                <button onClick={() => handleToggle(todo)} className="flex-shrink-0">
                  {todo.status === 'completed' ? (
                    <CheckCircle2 size={24} className="text-emerald-600" />
                  ) : (
                    <Circle size={24} className="text-gray-300 hover:text-gray-500" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${todo.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {todo.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">Assignee: {todo.assignee?.name || '-'}</span>
                    {todo.dueDate && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} /> {new Date(todo.dueDate).toLocaleDateString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${getPriorityBadge(todo.priority || 'medium')}`}>
                    {todo.priority || 'medium'}
                  </span>
                  <button onClick={() => handleDelete(todo.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><X size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Add New To-Do</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="form-label">Task Title</label>
                  <input name="title" type="text" className="form-input" placeholder="Enter task title" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Assignee</label>
                    <select name="assigneeId" className="form-input">
                      <option value="">Unassigned</option>
                      {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Priority</label>
                    <select name="priority" className="form-input">
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Due Date</label>
                  <input name="dueDate" type="date" className="form-input" />
                </div>
                <div>
                  <label className="form-label">Repeat Rule</label>
                  <select name="repeatRule" className="form-input">
                    <option value="">No Repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">{submitting ? 'Creating...' : 'Create To-Do'}</button>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
