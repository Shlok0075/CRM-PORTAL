import { useEffect, useState } from 'react'
import { Briefcase, Calendar, FileText, TrendingUp, LogOut, LayoutDashboard, Target, Rocket, Award } from 'lucide-react'
import { useRouter } from 'next/router'

export default function Dashboard() {
  const [startup, setStartup] = useState<any>(null)
  const [kpis, setKpis] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [startups, setStartups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const startupId = router.query.startupId as string

  useEffect(() => {
    const token = localStorage.getItem('founder_token')
    if (!token) { router.push('/login'); return }

    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/startups', { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data.value || [])
        setStartups(list)
        if (startupId) {
          const s = list.find((x: any) => x.id === startupId) || list[0]
          setStartup(s)
          if (s?.id) {
            const kpiRes = await fetch(`/api/kpi-checkins/startup/${s.id}`, { headers: { Authorization: `Bearer ${token}` } })
            const kpiData = await kpiRes.json()
            setKpis(Array.isArray(kpiData) ? kpiData : [])
            const docRes = await fetch(`/api/documents?startup_id=${s.id}`, { headers: { Authorization: `Bearer ${token}` } })
            const docData = await docRes.json()
            setDocuments(Array.isArray(docData) ? docData : (docData.value || []))
          }
        } else if (list.length > 0) {
          setStartup(list[0])
          router.push(`/dashboard?startupId=${list[0].id}`)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [startupId])

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {startups.length > 1 && !startupId && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Select Your Startup</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {startups.map((s: any) => (
              <button key={s.id} onClick={() => router.push(`/dashboard?startupId=${s.id}`)} className="group text-left p-5 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-300 hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                    <Briefcase className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.sector || 'No sector'}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {startup && (
        <>
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full -ml-8 -mb-8 blur-xl" />
            <div className="relative flex items-center gap-5">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                <Rocket size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1 tracking-tight">{startup.name}</h2>
                <p className="text-indigo-100 text-sm font-medium">{startup.sector || 'No sector'} · {startup.status || 'Active'}</p>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg">
                    <Calendar className="text-white" size={22} />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                    <Award size={14} />
                    Tracked
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{kpis.length}</p>
                <p className="text-sm text-gray-500 mt-1 font-medium">KPI Check-ins</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-100/50 transition-all duration-300 hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                    <FileText className="text-white" size={22} />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                    <Target size={14} />
                    {documents.length} files
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{documents.length}</p>
                <p className="text-sm text-gray-500 mt-1 font-medium">Documents</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300 hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                    <TrendingUp className="text-white" size={22} />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                    <Rocket size={14} />
                    Active
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">-</p>
                <p className="text-sm text-gray-500 mt-1 font-medium">Program Progress</p>
              </div>
            </div>
          </div>

          {/* Recent KPI Check-ins */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="p-2 bg-indigo-50 rounded-lg"><Calendar size={18} className="text-indigo-500" /></div>
              Recent KPI Check-ins
            </h3>
            {kpis.length === 0 ? <p className="text-sm text-gray-400">No check-ins yet</p> : (
              <div className="space-y-3">
                {kpis.slice(0, 5).map((k: any) => (
                  <div key={k.id} className="group flex items-center justify-between p-4 bg-gray-50/80 rounded-xl hover:bg-indigo-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                        {new Date(k.periodDate).getDate()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900 group-hover:text-indigo-700 transition-colors">{new Date(k.periodDate).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">{JSON.stringify(k.metrics).slice(0, 100)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
