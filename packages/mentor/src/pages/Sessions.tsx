import { useEffect, useState } from 'react'
import { Plus, Clock, Save, BookOpen, Calendar as CalendarIcon, Timer, Sparkles, TrendingUp } from 'lucide-react'
import { mentorApiFetch } from '../lib/api'

export default function Sessions() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [startups, setStartups] = useState<any[]>([])
  const [form, setForm] = useState({ startupId: '', date: '', durationMinutes: '', notes: '', actionItems: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await mentorApiFetch('/mentor-sessions/me')
      setSessions(Array.isArray(data) ? data : [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (modalOpen) {
      mentorApiFetch('/mentors')
        .then(d => {
          const mentors = Array.isArray(d) ? d : []
          const assignments = mentors.flatMap((m: any) => m.assignments || [])
          setStartups(assignments.map((a: any) => a.startup))
        })
        .catch(() => {})
    }
  }, [modalOpen])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await mentorApiFetch('/mentor-sessions', {
        method: 'POST',
        body: JSON.stringify({ ...form, durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : undefined }),
      })
      setModalOpen(false)
      setForm({ startupId: '', date: '', durationMinutes: '', notes: '', actionItems: '' })
      load()
    } catch (e) {
      alert('Failed to log session: ' + (e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const totalMinutes = sessions.reduce((a, s) => a + (s.durationMinutes || 0), 0)

  if (error && !loading) return (
    <div className="p-8 text-center text-red-600">{error}</div>
  )

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-900 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full -ml-8 -mb-8 blur-xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1 tracking-tight flex items-center gap-2">
              <Sparkles size={24} className="text-yellow-300" />
              Mentoring Sessions
            </h2>
            <p className="text-slate-300 text-sm">Track and log your mentoring sessions</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
            <Plus size={18} />
            Log Session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Sessions', value: sessions.length, color: 'from-indigo-500 to-blue-600', icon: BookOpen },
          { label: 'Total Minutes', value: totalMinutes, color: 'from-emerald-500 to-teal-600', icon: Clock },
          { label: 'Avg Duration', value: sessions.length ? Math.round(totalMinutes / sessions.length) : 0, color: 'from-purple-500 to-purple-600', icon: Timer },
          { label: 'This Month', value: sessions.filter(s => new Date(s.date).getMonth() === new Date().getMonth()).length, color: 'from-amber-500 to-amber-600', icon: TrendingUp },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 p-4 hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} shadow-md shadow-indigo-500/20`}>
                <stat.icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setModalOpen(true)} className="md:hidden w-full btn-primary justify-center">
        <Plus size={16} /> Log Session
      </button>

      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">Loading sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <BookOpen size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No sessions logged yet</p>
          <p className="text-xs text-gray-400 mt-1">Log your first mentoring session to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {sessions.map((s) => (
              <div key={s.id} className="group p-5 hover:bg-gray-50/50 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-indigo-50 rounded-xl">
                      <BookOpen size={20} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{s.startup?.name || 'Unknown Startup'}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <CalendarIcon size={12} />
                          {new Date(s.date).toLocaleDateString()}
                        </span>
                        {s.durationMinutes && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Timer size={12} />
                            {s.durationMinutes} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                    #{sessions.indexOf(s) + 1}
                  </span>
                </div>
                {s.notes && <p className="text-sm text-gray-600 mt-3 ml-12 bg-gray-50 rounded-lg p-3">{s.notes}</p>}
                {s.actionItems && (
                  <div className="mt-3 ml-12">
                    <p className="text-xs font-medium text-gray-500 mb-1">Action Items</p>
                    <p className="text-sm text-gray-600 bg-amber-50 rounded-lg p-3 border border-amber-100">{s.actionItems}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Log Session</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={submit} className="p-5 space-y-4">
              <div>
                <label className="form-label">Startup</label>
                <select required value={form.startupId} onChange={e => setForm({ ...form, startupId: e.target.value })} className="form-input">
                  <option value="">Select a startup</option>
                  {startups.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Date</label>
                <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="form-input" />
              </div>
              <div>
                <label className="form-label">Duration (minutes)</label>
                <input type="number" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: e.target.value })} className="form-input" />
              </div>
              <div>
                <label className="form-label">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="form-input" />
              </div>
              <div>
                <label className="form-label">Action Items</label>
                <textarea value={form.actionItems} onChange={e => setForm({ ...form, actionItems: e.target.value })} rows={2} className="form-input" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}><Save size={14} /> {submitting ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
