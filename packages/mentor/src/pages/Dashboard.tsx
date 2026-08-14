import { useEffect, useState } from 'react'
import { Users, Clock, TrendingUp, Award, Target, BookOpen, Flame, Trophy } from 'lucide-react'
import { mentorApiFetch } from '../lib/api'

export default function Dashboard() {
  const [startups, setStartups] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      mentorApiFetch('/mentors'),
      mentorApiFetch('/mentor-sessions/me'),
    ])
      .then(([mentors, sess]) => {
        const mentorList = Array.isArray(mentors) ? mentors : (mentors.value || [])
        const mentor = mentorList[0]
        if (mentor?.assignments?.length) {
          setStartups(mentor.assignments.map((a: any) => a.startup))
        }
        setSessions(Array.isArray(sess) ? sess : [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (error && !loading) return (
    <div className="p-8 text-center text-red-600">{error}</div>
  )

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    </div>
  )

  const totalMinutes = sessions.reduce((a, s) => a + (s.durationMinutes || 0), 0)
  const avgMinutes = sessions.length ? Math.round(totalMinutes / sessions.length) : 0

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-900 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full -ml-8 -mb-8 blur-xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-1 tracking-tight">Mentor Dashboard</h2>
            <p className="text-slate-300 text-sm font-medium">Track your mentoring activity and startups</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <p className="text-xs text-slate-300 uppercase tracking-wider mb-0.5">Sessions</p>
              <p className="text-xl font-bold">{sessions.length}</p>
            </div>
            <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <p className="text-xs text-slate-300 uppercase tracking-wider mb-0.5">Minutes</p>
              <p className="text-xl font-bold text-emerald-300">{totalMinutes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 hover:-translate-y-1">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg">
                <Users className="text-white" size={22} />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                <Trophy size={14} />
                Active
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{startups.length}</p>
            <p className="text-sm text-gray-500 mt-1 font-medium">Assigned Startups</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-100/50 transition-all duration-300 hover:-translate-y-1">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                <BookOpen className="text-white" size={22} />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                <Flame size={14} />
                {sessions.length} logged
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{sessions.length}</p>
            <p className="text-sm text-gray-500 mt-1 font-medium">Sessions Logged</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300 hover:-translate-y-1">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                <TrendingUp className="text-white" size={22} />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                <Clock size={14} />
                Avg {avgMinutes}m
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{totalMinutes}</p>
            <p className="text-sm text-gray-500 mt-1 font-medium">Total Minutes</p>
          </div>
        </div>
      </div>

      {/* Assigned Startups */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="p-2 bg-indigo-50 rounded-lg"><Award size={18} className="text-indigo-500" /></div>
          Assigned Startups
        </h3>
        {startups.length === 0 ? <p className="text-sm text-gray-400">No startups assigned yet</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {startups.map((s: any) => (
              <div key={s.id} className="group relative overflow-hidden rounded-xl border border-gray-100 hover:border-indigo-200 bg-gray-50/50 hover:bg-indigo-50/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                      <Target size={22} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{s.name}</h3>
                      <span className="text-xs text-gray-500 font-medium">{s.sector || 'No sector'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/80 rounded-lg p-2.5 border border-gray-100">
                    <BookOpen size={14} className="text-gray-400" />
                    <span className="font-medium">{s.businessModel || 'Business model not set'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
