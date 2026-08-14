import { useState, useEffect } from 'react'
import { Save, Calendar, Target, TrendingUp, Sparkles, CheckCircle, DollarSign, Users, Fuel } from 'lucide-react'

export default function KpiCheckin() {
  const [startups, setStartups] = useState<any[]>([])
  const [form, setForm] = useState({ startupId: '', periodDate: '', metrics: { mrr: '', users: '', runway: '' } })
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/startups', { headers: { Authorization: `Bearer ${localStorage.getItem('founder_token')}` } })
      .then(r => r.json())
      .then(d => setStartups(Array.isArray(d) ? d : d.value || []))
      .catch(() => {})
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/kpi-checkins', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('founder_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, metrics: { mrr: parseFloat(form.metrics.mrr) || 0, users: parseInt(form.metrics.users) || 0, runway: parseInt(form.metrics.runway) || 0 } }) })
    if (!res.ok) { setMessage('Failed to submit'); return }
    setMessage('KPI submitted successfully!')
    setForm({ startupId: '', periodDate: '', metrics: { mrr: '', users: '', runway: '' } })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full -ml-8 -mb-8 blur-xl" />
        <div className="relative">
          <h2 className="text-2xl font-bold mb-1 tracking-tight flex items-center gap-2">
            <Sparkles size={24} className="text-yellow-300" />
            KPI Check-in
          </h2>
          <p className="text-indigo-100 text-sm">Submit your monthly metrics</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <div className="p-2 bg-indigo-50 rounded-xl"><Target size={20} className="text-indigo-500" /></div>
          Submit Monthly KPI Update
        </h2>
        {message && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle size={16} />
            {message}
          </div>
        )}
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Startup</label>
              <select required value={form.startupId} onChange={e => setForm({ ...form, startupId: e.target.value })} className="form-input">
                <option value="">Select startup</option>
                {startups.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Period Date</label>
              <input required type="date" value={form.periodDate} onChange={e => setForm({ ...form, periodDate: e.target.value })} className="form-input" />
            </div>
          </div>

          <div>
            <label className="form-label mb-3 block">Monthly Metrics</label>
            <div className="grid grid-cols-3 gap-4">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <DollarSign size={16} />
                </div>
                <input
                  type="number"
                  value={form.metrics.mrr}
                  onChange={e => setForm({ ...form, metrics: { ...form.metrics, mrr: e.target.value } })}
                  placeholder="MRR"
                  className="form-input pl-9"
                />
                <p className="text-[10px] text-gray-400 mt-1 ml-1">Monthly Revenue</p>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Users size={16} />
                </div>
                <input
                  type="number"
                  value={form.metrics.users}
                  onChange={e => setForm({ ...form, metrics: { ...form.metrics, users: e.target.value } })}
                  placeholder="Users"
                  className="form-input pl-9"
                />
                <p className="text-[10px] text-gray-400 mt-1 ml-1">Active Users</p>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Fuel size={16} />
                </div>
                <input
                  type="number"
                  value={form.metrics.runway}
                  onChange={e => setForm({ ...form, metrics: { ...form.metrics, runway: e.target.value } })}
                  placeholder="Runway"
                  className="form-input pl-9"
                />
                <p className="text-[10px] text-gray-400 mt-1 ml-1">Months left</p>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 flex items-center justify-center gap-2">
            <Save size={16} />
            Submit KPI
          </button>
        </form>
      </div>
    </div>
  )
}
