import { useEffect, useState } from 'react'
import { Briefcase, MapPin, Building2, Target, Sparkles, TrendingUp } from 'lucide-react'
import { mentorApiFetch } from '../lib/api'

export default function Startups() {
  const [startups, setStartups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    mentorApiFetch('/mentors')
      .then(d => {
        const mentors = Array.isArray(d) ? d : []
        const assignments = mentors.flatMap((m: any) => m.assignments || [])
        setStartups(assignments.map((a: any) => a.startup))
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (error && !loading) return (
    <div className="p-8 text-center text-red-600">{error}</div>
  )

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
      <p className="text-sm text-gray-500">Loading startups...</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full -ml-8 -mb-8 blur-xl" />
        <div className="relative">
          <h2 className="text-2xl font-bold mb-1 tracking-tight flex items-center gap-2">
            <Sparkles size={24} className="text-yellow-300" />
            My Startups
          </h2>
          <p className="text-indigo-100 text-sm">Startups assigned to you</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Assigned', value: startups.length, color: 'from-indigo-500 to-blue-600', icon: Briefcase },
          { label: 'Active', value: startups.filter(s => s.status === 'active').length, color: 'from-emerald-500 to-emerald-600', icon: TrendingUp },
          { label: 'Sectors', value: [...new Set(startups.map(s => s.sector).filter(Boolean))].length, color: 'from-purple-500 to-purple-600', icon: Target },
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

      {startups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Building2 size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No startups assigned yet</p>
          <p className="text-xs text-gray-400 mt-1">Startups will appear here when assigned</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {startups.map((s) => (
            <div key={s.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Building2 size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{s.name}</h3>
                    <span className="text-xs text-gray-500 font-medium">{s.sector || 'No sector'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2.5">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="font-medium">{s.businessModel || 'Business model not set'}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-700'}`}>
                    {s.status || 'Active'}
                  </span>
                  <Target size={14} className="text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
