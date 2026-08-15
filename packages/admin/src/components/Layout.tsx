import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FolderOpen,
  DollarSign,
  Package,
  UserCog,
  CheckCircle2,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', section: 'core' },
  { to: '/clients', icon: Users, label: 'Clients', section: 'core' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks', section: 'core' },
  { to: '/documents', icon: FolderOpen, label: 'Documents', section: 'core' },
  { to: '/finance', icon: DollarSign, label: 'Finance', section: 'billing' },
  { to: '/retainers', icon: Package, label: 'Retainers', section: 'billing' },
  { to: '/employees', icon: UserCog, label: 'Employees', section: 'team' },
  { to: '/todos', icon: CheckCircle2, label: 'To-Dos', section: 'team' },
  { to: '/communication', icon: MessageSquare, label: 'Communication', section: 'outreach' },
  { to: '/reports', icon: BarChart3, label: 'Reports', section: 'insights' },
  { to: '/settings', icon: Settings, label: 'Settings', section: 'admin' },
]

import { apiFetch } from '../lib/api'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    apiFetch('/users/me').then((data: any) => {
      setUser(data)
    }).catch((err: any) => {
      if (err.status === 401) {
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
        window.location.href = '/login'
      }
    })
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const getSectionTitle = (section: string) => {
    const titles: Record<string, string> = {
      core: 'Core Operations',
      billing: 'Billing & Packages',
      team: 'Team Management',
      outreach: 'Communication',
      insights: 'Reports & Analytics',
      admin: 'Administration',
    }
    return titles[section]
  }

  const groupedNav = navItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {} as Record<string, typeof navItems>)

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <span className="font-bold text-sm block leading-tight">PraxisCA</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Practice CRM</span>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {Object.entries(groupedNav).map(([section, items]) => (
            <div key={section}>
              <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{getSectionTitle(section)}</p>
              <div className="space-y-1">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover hidden sm:block" />
          <h1 className="text-lg font-semibold text-gray-800 capitalize">
            {location.pathname === '/' ? 'Dashboard' : location.pathname.slice(1).replace(/-/g, ' ')}
          </h1>
           <div className="ml-auto flex items-center gap-3">
             <div className="relative">
               <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                 <Bell size={18} />
                 <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
               </button>
               {showNotifications && (
                 <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                   <div className="p-4 border-b border-gray-100">
                     <h4 className="text-sm font-semibold text-gray-900">Notifications</h4>
                   </div>
                   <div className="p-4 text-center text-sm text-gray-500">
                     No new notifications
                   </div>
                 </div>
               )}
             </div>
             <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                 {user?.name?.charAt(0)?.toUpperCase() || 'A'}
               </div>
               <div className="hidden md:block">
                 <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin User'}</p>
                 <p className="text-xs text-gray-500">{user?.role || user?.designation || 'Partner'}</p>
               </div>
               <ChevronDown size={16} className="text-gray-400 hidden md:block" />
             </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
