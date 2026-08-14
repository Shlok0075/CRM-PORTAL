import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Briefcase, Calendar, FileText, TrendingUp, LogOut, LayoutDashboard, Target, Users } from 'lucide-react'

export default function FounderLayout({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const t = localStorage.getItem('founder_token')
    setToken(t)
    if (!t) router.push('/login')
  }, [router])

  if (!token) return null

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/kpi-checkin', label: 'KPI Check-in', icon: Target },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-sm">SG</div>
            <span className="font-bold text-lg">Founder Portal</span>
          </div>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${router.pathname === item.href ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon size={18} />
              {item.label}
            </a>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <button onClick={() => { localStorage.removeItem('founder_token'); router.push('/login') }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white w-full">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-6 py-3"><h1 className="text-lg font-semibold text-gray-800">Founder Portal</h1></header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
