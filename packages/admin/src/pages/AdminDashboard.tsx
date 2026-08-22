import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  Clock,
  Calendar,
  ArrowUpRight,
  Plus,
  FileText,
  Timer,
  Award,
  AlertCircle,
  Inbox,
  FolderOpen,
} from 'lucide-react'
import useApi from '../hooks/useApi'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

export default function AdminDashboard() {
  const dashboardApi = useApi('/portal/dashboard')
  const clientsApi = useApi('/clients?limit=50')

  const dashboard = dashboardApi.data || {}
  const clients = clientsApi.data?.data || clientsApi.data || []

  const loading = dashboardApi.loading || clientsApi.loading
  const error = dashboardApi.error || clientsApi.error

  const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'upcoming'>('all')

  const tasks = dashboard.recentTasks || []
  const invoices = dashboard.recentInvoices || []
  const compliance = dashboard.upcomingCompliance || []

  const totalClients = dashboard.totalClients || 0
  const tasksByStatus = dashboard.tasksByStatus || []

  const filteredTasks = tasks.filter((t: any) => {
    if (activeTab === 'overdue') return t.isOverdue || t.status === 'overdue'
    if (activeTab === 'upcoming') return t.status === 'pending' || t.status === 'in_progress'
    return true
  })

  const pendingTasks = tasksByStatus.find((s: any) => s.status === 'pending')?._count?.status || 0
  const inProgressTasks = tasksByStatus.find((s: any) => s.status === 'in_progress')?._count?.status || 0
  const completedTasks = tasksByStatus.filter((s: any) => s.status === 'completed' || s.status === 'verified').reduce((a: number, s: any) => a + s._count?.status, 0)
  const overdueTasks = tasksByStatus.find((s: any) => s.status === 'overdue')?._count?.status || 0

  const outstandingAmount = invoices.reduce((sum: number, inv: any) => {
    const total = inv.total || 0
    const paid = inv.receipts?.reduce((s: number, r: any) => s + (r.amount || 0), 0) || 0
    return sum + Math.max(0, total - paid)
  }, 0)

  const stats = [
    { label: 'Total Clients', value: totalClients, icon: Users, color: 'from-blue-500 to-cyan-400', bg: 'bg-blue-50', text: 'text-blue-600', change: `+${totalClients}`, up: true },
    { label: 'Pending Tasks', value: pendingTasks, icon: Clock, color: 'from-amber-500 to-orange-400', bg: 'bg-amber-50', text: 'text-amber-600', change: '-3', up: false },
    { label: 'Overdue', value: overdueTasks, icon: AlertTriangle, color: 'from-red-500 to-pink-400', bg: 'bg-red-50', text: 'text-red-600', change: '+2', up: true },
    { label: 'Outstanding', value: `₹${(outstandingAmount / 100000).toFixed(1)}L`, icon: TrendingUp, color: 'from-emerald-500 to-teal-400', bg: 'bg-emerald-50', text: 'text-emerald-600', change: '-5%', up: false },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="relative"><div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>
    </div>
  )
  if (error) return <div className="text-red-500 bg-red-50 p-4 rounded-xl">{error}</div>

  const taskStatusData = [
    { name: 'Pending', value: pendingTasks, fill: '#f59e0b' },
    { name: 'In Progress', value: inProgressTasks, fill: '#3b82f6' },
    { name: 'Completed', value: completedTasks, fill: '#10b981' },
    { name: 'Overdue', value: overdueTasks, fill: '#ef4444' },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full -ml-8 -mb-8 blur-xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
              <LayoutDashboard className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1 tracking-tight">Welcome back, Admin</h1>
              <p className="text-slate-300 text-sm font-medium">Here's your practice overview for today.</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <p className="text-xs text-slate-300 uppercase tracking-wider mb-0.5">Clients</p>
              <p className="text-xl font-bold">{clients.length}</p>
            </div>
            <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <p className="text-xs text-slate-300 uppercase tracking-wider mb-0.5">Outstanding</p>
              <p className="text-xl font-bold text-amber-300">₹{(outstandingAmount / 100000).toFixed(1)}L</p>
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
                <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${stat.up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {stat.up ? <ArrowUpRight size={14} /> : <AlertCircle size={14} />}
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1 font-medium">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="p-2 bg-emerald-50 rounded-lg"><Plus size={18} className="text-emerald-600" /></div>
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'New Client', href: '/clients', icon: Users, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
            { label: 'Create Task', href: '/tasks', icon: CheckSquare, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50' },
            { label: 'New Invoice', href: '/finance', icon: FileText, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Upload Document', href: '/documents', icon: FolderOpen, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50' },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-amber-50 rounded-lg"><Timer size={18} className="text-amber-600" /></div>
              Task Highlights
            </h3>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(['all', 'upcoming', 'overdue'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{tab}</button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100"><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Task</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Due Date</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTasks.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">No tasks found</td></tr> : filteredTasks.slice(0, 10).map((task: any) => (
                  <tr key={task.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{task.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{task.client?.name || '-'}</td>
                    <td className={`px-4 py-3 text-sm ${task.isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN') : '-'}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${task.status === 'completed' || task.status === 'verified' ? 'bg-emerald-50 text-emerald-700' : task.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : task.isOverdue || task.status === 'overdue' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{task.isOverdue && <AlertCircle size={12} className="mr-1" />}{task.status?.replace('_', ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="p-2 bg-amber-50 rounded-lg"><Award size={18} className="text-amber-600" /></div>
            Task Summary
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[{ label: 'Pending', value: pendingTasks, color: 'bg-amber-50 text-amber-700', border: 'border-amber-200' }, { label: 'In Progress', value: inProgressTasks, color: 'bg-blue-50 text-blue-700', border: 'border-blue-200' }, { label: 'Completed', value: completedTasks, color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' }, { label: 'Overdue', value: overdueTasks, color: 'bg-red-50 text-red-700', border: 'border-red-200' }].map((item) => (
              <div key={item.label} className={`p-4 rounded-xl border ${item.border} ${item.color} text-center`}>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs font-medium mt-1">{item.label}</p>
              </div>
            ))}
          </div>
          {taskStatusData.length > 0 && (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart><Pie data={taskStatusData} cx="50%" cy="50%" outerRadius={70} paddingAngle={4} dataKey="value">{taskStatusData.map((entry) => (<Cell key={entry.name} fill={entry.fill} />))}</Pie><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} /></PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-lg"><Calendar size={18} className="text-indigo-600" /></div>
            Statutory Compliance
          </h3>
          <div className="space-y-3">
            {compliance.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No compliance entries yet</p> : compliance.slice(0, 5).map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl hover:bg-indigo-50/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">{item.name?.charAt(0) || 'C'}</div>
                <div className="flex-1"><p className="font-semibold text-sm text-gray-900">{item.name}</p><p className="text-xs text-gray-500">{item.applicableTo}</p></div>
                <div className="text-right"><p className="text-xs font-medium text-gray-700">{item.dueDateRule}</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="p-2 bg-red-50 rounded-lg"><Inbox size={18} className="text-red-600" /></div>
            Recent Invoices
          </h3>
          <div className="space-y-3">
            {invoices.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No invoices yet</p> : invoices.slice(0, 5).map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl">
                <div><p className="font-semibold text-sm text-gray-900">{inv.invoiceNumber}</p><p className="text-xs text-gray-500">{inv.client?.name || '-'}</p></div>
                <div className="text-right"><p className="text-sm font-bold text-gray-900">₹{inv.total?.toLocaleString('en-IN') || '0'}</p><span className={`text-xs ${inv.status === 'paid' ? 'text-emerald-600' : inv.status === 'overdue' ? 'text-red-600' : 'text-amber-600'}`}>{inv.status}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="p-2 bg-emerald-50 rounded-lg"><TrendingUp size={18} className="text-emerald-600" /></div>
            Recent Activity
          </h3>
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task: any) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                  <div><p className="text-sm font-medium text-gray-900 line-clamp-1">{task.title}</p><p className="text-xs text-gray-500">{task.client?.name || '-'}</p></div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : task.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{task.status?.replace('_', ' ')}</span>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
