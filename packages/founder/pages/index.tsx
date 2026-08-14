import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Sparkles, ArrowRight, Rocket, BarChart3, FileText, Shield, Zap, Users, TrendingUp } from 'lucide-react'

export default function Index() {
  const router = useRouter()
  const token = typeof window !== 'undefined' ? localStorage.getItem('founder_token') : null

  useEffect(() => {
    if (token) router.push('/dashboard')
  }, [token])

  const features = [
    { icon: Rocket, title: 'KPI Tracking', desc: 'Submit monthly metrics and track growth', color: 'from-indigo-500 to-blue-600' },
    { icon: FileText, title: 'Documents', desc: 'Upload and manage your pitch decks', color: 'from-emerald-500 to-teal-600' },
    { icon: Users, title: 'Mentors', desc: 'Connect with experienced advisors', color: 'from-purple-500 to-purple-600' },
    { icon: BarChart3, title: 'Reports', desc: 'View portfolio insights and analytics', color: 'from-amber-500 to-orange-600' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Founder Portal</h1>
          <p className="text-indigo-200 text-sm mb-6">Access your startup dashboard, submit KPIs, and manage documents.</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 flex items-center justify-center gap-2"
          >
            Sign In
            <ArrowRight size={16} />
          </button>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {features.map((f) => (
              <div key={f.title} className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className={`w-8 h-8 bg-gradient-to-br ${f.color} rounded-lg flex items-center justify-center mx-auto mb-2 shadow-md`}>
                  <f.icon size={14} className="text-white" />
                </div>
                <p className="text-xs font-semibold text-white">{f.title}</p>
                <p className="text-[10px] text-indigo-300 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
