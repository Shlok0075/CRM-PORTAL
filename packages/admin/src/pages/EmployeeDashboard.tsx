import { useState, useEffect } from 'react'
import { CheckSquare, Clock, AlertTriangle, Award, Timer, TrendingUp, Download, Calendar } from 'lucide-react'
import useApi from '../hooks/useApi'
import { API_BASE } from '../lib/api'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

export default function EmployeeDashboard() {
  const dashboardApi = useApi('/portal/dashboard')
  const tasksApi = useApi('/portal/my-tasks?limit=50')
  const timesheetApi = useApi('/portal/my-timesheet')
  const attendanceApi = useApi('/portal/my-attendance')

  const dashboard = dashboardApi.data || {}
  const tasks = tasksApi.data?.items || tasksApi.data || []
  const timesheets = timesheetApi.data || []
  const attendance = attendanceApi.data?.data || attendanceApi.data || []

  const loading = dashboardApi.loading || tasksApi.loading || timesheetApi.loading || attendanceApi.loading
  const error = dashboardApi.error || tasksApi.error || timesheetApi.error || attendanceApi.error

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'overdue'>('all')

  const totalTasks = dashboard.totalTasks || 0
  const pendingTasks = dashboard.pendingTasks || 0
  const inProgressTasks = dashboard.inProgressTasks || 0
  const completedTasks = dashboard.completedTasks || 0
  const overdueTasks = dashboard.overdueTasks || 0
  const recentTasks = dashboard.recentTasks || []

  const filteredTasks = tasks.filter((t: any) => {
    if (activeTab === 'pending') return t.status === 'pending' || t.status === 'in_progress'
    if (activeTab === 'overdue') return t.isOverdue || t.status === 'overdue'
    return true
  })

  const handleTimesheetDownload = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const res = await fetch(`${API_BASE}/portal/my-timesheet/export`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'my_timesheet.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || 'Failed to export timesheet')
    }
  }

  const [debug, setDebug] = useState<any>(null)

  useEffect(() => {
    console.log('EmployeeDashboard API states:', {
      dashboard: { loading: dashboardApi.loading, error: dashboardApi.error, data: dashboardApi.data },
      tasks: { loading: tasksApi.loading, error: tasksApi.error, count: tasks.length },
      timesheet: { loading: timesheetApi.loading, error: timesheetApi.error, data: timesheetApi.data },
      attendance: { loading: attendanceApi.loading, error: attendanceApi.error, data: attendanceApi.data },
    })
    setDebug({
      dashboard: dashboardApi.data,
      tasks: tasksApi.data,
      timesheet: timesheetApi.data,
      attendance: attendanceApi.data,
    })
  }, [dashboardApi.data, tasksApi.data, timesheetApi.data, attendanceApi.data, dashboardApi.loading, tasksApi.loading, timesheetApi.loading, attendanceApi.loading])

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="relative"><div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>
    </div>
  )
  if (error) return <div className="text-red-500 bg-red-50 p-4 rounded-xl">{error}</div>

  const stats = [
    { label: 'My Tasks', value: totalTasks, icon: CheckSquare, color: 'from-blue-500 to-cyan-400', bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'In Progress', value: inProgressTasks, icon: Clock, color: 'from-amber-500 to-orange-400', bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'Overdue', value: overdueTasks, icon: AlertTriangle, color: 'from-red-500 to-pink-400', bg: 'bg-red-50', text: 'text-red-600' },
    { label: 'Completed', value: completedTasks, icon: Award, color: 'from-emerald-500 to-teal-400', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  ]

  const taskStatusData = [
    { name: 'Pending', value: pendingTasks, fill: '#f59e0b' },
    { name: 'In Progress', value: inProgressTasks, fill: '#3b82f6' },
    { name: 'Completed', value: completedTasks, fill: '#10b981' },
    { name: 'Overdue', value: overdueTasks, fill: '#ef4444' },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
              <CheckSquare className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1 tracking-tight">Welcome back, Employee</h1>
              <p className="text-slate-300 text-sm font-medium">Here's your task overview for today.</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <p className="text-xs text-slate-300 uppercase tracking-wider mb-0.5">Pending</p>
              <p className="text-xl font-bold text-amber-300">{pendingTasks}</p>
            </div>
            <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <p className="text-xs text-slate-300 uppercase tracking-wider mb-0.5">Overdue</p>
              <p className="text-xl font-bold text-red-300">{overdueTasks}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-amber-50 rounded-lg"><Timer size={18} className="text-amber-600" /></div>
              My Tasks
            </h3>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(['all', 'pending', 'overdue'] as const).map(tab => (
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
                    <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${task.status === 'completed' || task.status === 'verified' ? 'bg-emerald-50 text-emerald-700' : task.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : task.isOverdue || task.status === 'overdue' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{task.status?.replace('_', ' ')}</span></td>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg"><Calendar size={18} className="text-blue-600" /></div>
              My Attendance
            </h3>
            <button onClick={handleTimesheetDownload} className="btn-secondary flex items-center gap-2 text-sm py-2">
              <Download size={14} /> Export Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100"><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">In Time</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Out Time</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {attendance.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">No attendance records yet</td></tr> : attendance.slice(0, 10).map((att: any) => (
                  <tr key={att.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm text-gray-900">{att.date ? new Date(att.date).toLocaleDateString('en-IN') : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{att.inTime ? new Date(att.inTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{att.outTime ? new Date(att.outTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${att.status === 'present' ? 'bg-emerald-50 text-emerald-700' : att.status === 'absent' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{att.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-emerald-50 rounded-lg"><Timer size={18} className="text-emerald-600" /></div>
              My Timesheet
            </h3>
            <button onClick={handleTimesheetDownload} className="btn-secondary flex items-center gap-2 text-sm py-2">
              <Download size={14} /> Export Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100"><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Task</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Duration</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {timesheets.length === 0 ? <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">No timesheet entries yet</td></tr> : timesheets.slice(0, 10).map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm text-gray-900">{log.task?.title || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.durationMinutes ? `${Math.floor(log.durationMinutes / 60)}h ${log.durationMinutes % 60}m` : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.startTime ? new Date(log.startTime).toLocaleDateString('en-IN') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="p-2 bg-emerald-50 rounded-lg"><TrendingUp size={18} className="text-emerald-600" /></div>
          Recent Tasks
        </h3>
        <div className="space-y-3">
          {recentTasks.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No recent tasks</p> : recentTasks.slice(0, 5).map((task: any) => (
            <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                <div><p className="text-sm font-medium text-gray-900 line-clamp-1">{task.title}</p><p className="text-xs text-gray-500">{task.client?.name || '-'}</p></div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : task.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{task.status?.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {debug && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Debug Info (API Responses)</h3>
          <pre className="text-xs bg-gray-50 p-4 rounded-xl overflow-auto max-h-64 border border-gray-100">{JSON.stringify(debug, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
