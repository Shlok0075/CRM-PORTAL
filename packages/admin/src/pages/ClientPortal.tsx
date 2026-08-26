import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, CheckSquare, FolderOpen, Clock, DollarSign } from 'lucide-react'
import useApi from '../hooks/useApi'

export default function ClientPortal() {
  const dashboardApi = useApi('/portal/dashboard')
  const invoicesApi = useApi('/portal/my-invoices')
  const tasksApi = useApi('/portal/my-tasks?limit=10')

  const dashboard = dashboardApi.data || {}
  const invoices = Array.isArray(invoicesApi.data) ? invoicesApi.data : []
  const tasks = Array.isArray(tasksApi.data?.items) ? tasksApi.data.items : Array.isArray(tasksApi.data) ? tasksApi.data : []

  const loading = dashboardApi.loading || invoicesApi.loading || tasksApi.loading
  const error = dashboardApi.error || invoicesApi.error || tasksApi.error

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all')

  const totalTasks = dashboard.totalTasks || 0
  const pendingTasks = dashboard.pendingTasks || 0
  const totalInvoices = dashboard.totalInvoices || 0
  const outstandingAmount = dashboard.outstandingAmount || 0
  const recentInvoices = dashboard.recentInvoices || []

  const filteredTasks = Array.isArray(tasks) ? tasks.filter((t: any) => {
    if (activeTab === 'pending') return t.status === 'pending' || t.status === 'in_progress'
    if (activeTab === 'completed') return t.status === 'completed' || t.status === 'verified'
    return true
  }) : []

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="relative"><div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>
    </div>
  )
  if (error) return <div className="text-red-500 bg-red-50 p-4 rounded-xl">{error}</div>

  const stats = [
    { label: 'Total Tasks', value: totalTasks, icon: CheckSquare, color: 'from-blue-500 to-cyan-400', bg: 'bg-blue-50' },
    { label: 'Pending', value: pendingTasks, icon: Clock, color: 'from-amber-500 to-orange-400', bg: 'bg-amber-50' },
    { label: 'Invoices', value: totalInvoices, icon: FileText, color: 'from-purple-500 to-pink-400', bg: 'bg-purple-50' },
    { label: 'Outstanding', value: `₹${(outstandingAmount / 100000).toFixed(1)}L`, icon: DollarSign, color: 'from-red-500 to-pink-400', bg: 'bg-red-50' },
  ]

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
              <FileText className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1 tracking-tight">Welcome to Your Portal</h1>
              <p className="text-slate-300 text-sm font-medium">Track your tasks, invoices, and documents.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-slate-100/50 transition-all duration-300 hover:-translate-y-1">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                  <stat.icon className="text-white" size={22} />
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1 font-medium">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-amber-50 rounded-lg"><CheckSquare size={18} className="text-amber-600" /></div>
              My Tasks
            </h3>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(['all', 'pending', 'completed'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{tab}</button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {filteredTasks.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No tasks found</p> : filteredTasks.slice(0, 5).map((task: any) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl">
                <div><p className="font-medium text-sm text-gray-900">{task.title}</p><p className="text-xs text-gray-500">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN') : '-'}</p></div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${task.status === 'completed' || task.status === 'verified' ? 'bg-emerald-50 text-emerald-700' : task.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{task.status?.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
          {tasks.length > 5 && <Link to="/portal/my-tasks" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium mt-3 inline-block">View all tasks →</Link>}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="p-2 bg-red-50 rounded-lg"><DollarSign size={18} className="text-red-600" /></div>
            Recent Invoices
          </h3>
          <div className="space-y-3">
            {recentInvoices.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No invoices yet</p> : recentInvoices.slice(0, 5).map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl">
                <div><p className="font-semibold text-sm text-gray-900">{inv.invoiceNumber}</p><p className="text-xs text-gray-500">Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '-'}</p></div>
                <div className="text-right"><p className="text-sm font-bold text-gray-900">₹{inv.total?.toLocaleString('en-IN') || '0'}</p><span className={`text-xs ${inv.status === 'paid' ? 'text-emerald-600' : inv.status === 'overdue' ? 'text-red-600' : 'text-amber-600'}`}>{inv.status}</span></div>
              </div>
            ))}
          </div>
          {invoices.length > 5 && <Link to="/portal/my-invoices" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium mt-3 inline-block">View all invoices →</Link>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="p-2 bg-purple-50 rounded-lg"><FolderOpen size={18} className="text-purple-600" /></div>
          Quick Links
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'My Tasks', href: '/portal/my-tasks', icon: CheckSquare, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
            { label: 'My Invoices', href: '/portal/my-invoices', icon: FileText, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50' },
            { label: 'Documents', href: '/portal/my-documents', icon: FolderOpen, color: 'from-green-500 to-green-600', bg: 'bg-green-50' },
          ].map((link) => (
            <Link key={link.label} to={link.href} className="group flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${link.color} shadow-md group-hover:scale-110 transition-transform`}>
                <link.icon className="text-white" size={18} />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-emerald-700 transition-colors">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
