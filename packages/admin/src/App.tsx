import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import Clients from './pages/Clients'
import Tasks from './pages/Tasks'
import Events from './pages/Events'
import Documents from './pages/Documents'
import Finance from './pages/Finance'
import Retainers from './pages/Retainers'
import Employees from './pages/Employees'
import Todos from './pages/Todos'
import Communication from './pages/Communication'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Templates from './pages/Templates'
import EmployeeDashboard from './pages/EmployeeDashboard'
import ClientPortal from './pages/ClientPortal'
import EmployeeTimesheet from './pages/EmployeeTimesheet'
import ClientTasks from './pages/ClientTasks'
import ClientInvoices from './pages/ClientInvoices'
import ClientDocuments from './pages/ClientDocuments'
import { NavLink } from 'react-router-dom'

function getRoleType() {
  return localStorage.getItem('roleType') || sessionStorage.getItem('roleType') || 'admin'
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  const roleType = getRoleType()
  if (allowedRoles && !allowedRoles.includes(roleType)) {
    return <Navigate to={roleType === 'client' ? '/portal' : roleType === 'employee' ? '/employee' : '/'} replace />
  }
  return <>{children}</>
}

export default function App() {
  const roleType = getRoleType()

  const getDefaultRoute = () => {
    if (roleType === 'client') return '/portal'
    if (roleType === 'employee') return '/employee'
    return '/'
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={() => window.location.href = getDefaultRoute()} />} />
        <Route path="/" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="events" element={<Events />} />
          <Route path="documents" element={<Documents />} />
          <Route path="finance" element={<Finance />} />
          <Route path="retainers" element={<Retainers />} />
          <Route path="employees" element={<Employees />} />
          <Route path="todos" element={<Todos />} />
          <Route path="communication" element={<Communication />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="templates" element={<Templates />} />
        </Route>
        <Route path="/employee" element={
          <ProtectedRoute allowedRoles={['employee']}>
            <EmployeeLayout />
          </ProtectedRoute>
        }>
          <Route index element={<EmployeeDashboard />} />
          <Route path="my-tasks" element={<Tasks />} />
          <Route path="my-timesheet" element={<EmployeeTimesheet />} />
          <Route path="my-documents" element={<Documents />} />
        </Route>
        <Route path="/portal" element={
          <ProtectedRoute allowedRoles={['client']}>
            <ClientLayout />
          </ProtectedRoute>
        }>
          <Route index element={<ClientPortal />} />
          <Route path="my-tasks" element={<ClientTasks />} />
          <Route path="my-invoices" element={<ClientInvoices />} />
          <Route path="my-documents" element={<ClientDocuments />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function EmployeeLayout() {
  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <span className="font-bold text-sm block leading-tight">StartUp Go Ventures CRM</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Employee Portal</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            { to: '/employee', label: 'Dashboard', end: true },
            { to: '/employee/my-tasks', label: 'My Tasks' },
            { to: '/employee/my-timesheet', label: 'My Timesheet' },
            { to: '/employee/my-documents', label: 'Documents' },
          ].map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <a href="/login" className="flex items-center gap-3 px-3 py-2.5 w-full text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg text-sm font-medium transition-colors">Logout</a>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-800 capitalize">Employee Portal</h1>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function ClientLayout() {
  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <span className="font-bold text-sm block leading-tight">StartUp Go Ventures CRM</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Client Portal</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            { to: '/portal', label: 'Dashboard', end: true },
            { to: '/portal/my-tasks', label: 'My Tasks' },
            { to: '/portal/my-invoices', label: 'My Invoices' },
            { to: '/portal/my-documents', label: 'Documents' },
          ].map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <a href="/login" className="flex items-center gap-3 px-3 py-2.5 w-full text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg text-sm font-medium transition-colors">Logout</a>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-800 capitalize">Client Portal</h1>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
