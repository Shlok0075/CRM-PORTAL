import { useState } from 'react'
import { Download, Clock, DollarSign, Users, CheckSquare, FolderOpen, Shield, Sparkles, RefreshCw } from 'lucide-react'
import useApi from '../hooks/useApi'
import { API_BASE } from '../lib/api'

export default function Reports() {
  const [activeReport, setActiveReport] = useState<'tasks' | 'time' | 'attendance' | 'clients' | 'financial' | 'documents' | 'compliance' | 'unbilled'>('tasks')

  const { data: tasksData, loading: tasksLoading, refetch: refetchTasks } = useApi('/reports/tasks')
  const { data: timeData, loading: timeLoading, refetch: refetchTime } = useApi('/reports/time')
  const { data: attendanceData, loading: attendanceLoading, refetch: refetchAttendance } = useApi('/reports/attendance')
  const { data: clientsData, loading: clientsLoading, refetch: refetchClients } = useApi('/reports/clients')
  const { data: financialData, loading: financialLoading, refetch: refetchFinancial } = useApi('/reports/financial')
  const { data: documentsData, loading: documentsLoading, refetch: refetchDocuments } = useApi('/reports/documents')
  const { data: complianceData, loading: complianceLoading, refetch: refetchCompliance } = useApi('/reports/compliance')
  const { data: unbilledData, loading: unbilledLoading, refetch: refetchUnbilled } = useApi('/reports/unbilled')

  const loading = tasksLoading || timeLoading || attendanceLoading || clientsLoading || financialLoading || documentsLoading || complianceLoading || unbilledLoading

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'Paid':
      case 'Cleared':
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'overdue':
      case 'Pending':
      case 'Overdue':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'sent':
      case 'Approved':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'failed':
      case 'Inactive':
        return 'bg-gray-100 text-gray-600 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const res = await fetch(`${API_BASE}/reports/${activeReport}?export=csv`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${activeReport}-report.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || 'Export failed')
    }
  }

  const refetch = () => {
    switch (activeReport) {
      case 'tasks': refetchTasks(); break
      case 'time': refetchTime(); break
      case 'attendance': refetchAttendance(); break
      case 'clients': refetchClients(); break
      case 'financial': refetchFinancial(); break
      case 'documents': refetchDocuments(); break
      case 'compliance': refetchCompliance(); break
      case 'unbilled': refetchUnbilled(); break
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports Centre</h2>
          <p className="text-sm text-gray-500 mt-1">Analytics and insights for your practice</p>
        </div>
        <div className="flex gap-3">
          <button onClick={refetch} className="btn-secondary flex items-center gap-2"><RefreshCw size={16} />Refresh</button>
          <button onClick={handleExport} className="btn-primary flex items-center gap-2">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {[
            { key: 'tasks', label: 'Tasks', icon: CheckSquare },
            { key: 'time', label: 'Time', icon: Clock },
            { key: 'attendance', label: 'Attendance', icon: Users },
            { key: 'clients', label: 'Clients', icon: Users },
            { key: 'financial', label: 'Financial', icon: DollarSign },
            { key: 'documents', label: 'Documents', icon: FolderOpen },
            { key: 'compliance', label: 'Compliance', icon: Shield },
            { key: 'unbilled', label: 'Unbilled', icon: Sparkles },
          ].map(report => (
            <button
              key={report.key}
              onClick={() => setActiveReport(report.key as typeof activeReport)}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeReport === report.key ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <report.icon size={16} />
              {report.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Tasks Report */}
          {activeReport === 'tasks' && tasksData && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Task Completion Report</h3>
                <p className="text-sm text-gray-500">Overview of all tasks with service type, assignee, and completion status</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-gray-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-gray-900">{tasksData.total || tasksData.tasks?.length || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Tasks</p>
                </div>
                <div className="p-5 bg-gray-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-emerald-600">{tasksData.completionRate || 0}%</p>
                  <p className="text-sm text-gray-500 mt-1">Completion Rate</p>
                </div>
                <div className="p-5 bg-gray-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-red-600">{(tasksData.byStatus || []).find((s: any) => s.status === 'overdue')?.count || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Overdue</p>
                </div>
              </div>
              {tasksData.tasks && tasksData.tasks.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Task</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Type</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {tasksData.tasks.map((task: any) => (
                          <tr key={task.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-3 text-sm font-medium text-gray-900">{task.title}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{task.clientName}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{task.serviceType}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                            <td className="px-6 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(task.status)}`}>
                                {task.status?.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Time Report */}
          {activeReport === 'time' && timeData && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Time Log Report</h3>
                <p className="text-sm text-gray-500">Employee time logs with client, task, and duration</p>
              </div>
              {timeData.raw && timeData.raw.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Task</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {timeData.raw.map((log: any) => (
                          <tr key={log.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-3 text-sm font-medium text-gray-900">{log.userName}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{log.taskTitle}</td>
                            <td className="px-6 py-3 text-sm text-gray-700">{log.taskTitle}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{log.startTime ? new Date(log.startTime).toLocaleDateString() : '-'}</td>
                            <td className="px-6 py-3 text-sm font-medium text-gray-900">{log.durationMinutes ? `${Math.floor(log.durationMinutes / 60)}h ${log.durationMinutes % 60}m` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Attendance Report */}
          {activeReport === 'attendance' && attendanceData && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Attendance Summary</h3>
                <p className="text-sm text-gray-500">Employee attendance summary by date range</p>
              </div>
              {attendanceData.records && attendanceData.records.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">In Time</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Out Time</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {attendanceData.records.map((att: any) => (
                          <tr key={att.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-3 text-sm font-medium text-gray-900">{att.userName}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{att.date ? new Date(att.date).toLocaleDateString() : '-'}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{att.inTime ? new Date(att.inTime).toLocaleTimeString() : '-'}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{att.outTime ? new Date(att.outTime).toLocaleTimeString() : '-'}</td>
                            <td className="px-6 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(att.status)}`}>
                                {att.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Clients Report */}
          {activeReport === 'clients' && clientsData && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Client Master Report</h3>
                <p className="text-sm text-gray-500">Complete client list with PAN, GSTIN, status, and outstanding balance</p>
              </div>
              {clientsData.clients && clientsData.clients.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">PAN</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">GSTIN</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {clientsData.clients.map((client: any) => (
                          <tr key={client.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-3 text-sm font-medium text-gray-900">{client.name}</td>
                            <td className="px-6 py-3 text-sm text-gray-900 font-mono">{client.pan || 'N/A'}</td>
                            <td className="px-6 py-3 text-sm text-gray-600 font-mono">{client.gstins || 'N/A'}</td>
                            <td className="px-6 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(client.status)}`}>
                                {client.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Financial Report */}
          {activeReport === 'financial' && financialData && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Financial Summary</h3>
                <p className="text-sm text-gray-500">Invoices, receipts, and expenses overview</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-gray-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-emerald-600">₹{financialData.invoices?.totalAmount?.toLocaleString('en-IN') || '0'}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Invoiced</p>
                </div>
                <div className="p-5 bg-gray-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-blue-600">₹{financialData.receipts?.totalAmount?.toLocaleString('en-IN') || '0'}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Received</p>
                </div>
                <div className="p-5 bg-gray-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-red-600">₹{financialData.outstanding?.totalAmount?.toLocaleString('en-IN') || '0'}</p>
                  <p className="text-sm text-gray-500 mt-1">Outstanding</p>
                </div>
              </div>
            </div>
          )}

          {/* Documents Report */}
          {activeReport === 'documents' && documentsData && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Document Management Report</h3>
                <p className="text-sm text-gray-500">Pending document requests and document outstanding status</p>
              </div>
              {documentsData.pendingRequests && documentsData.pendingRequests.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Task</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Document</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {documentsData.pendingRequests.map((doc: any) => (
                          <tr key={doc.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-3 text-sm font-medium text-gray-900">{doc.clientName}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{doc.taskTitle}</td>
                            <td className="px-6 py-3 text-sm text-gray-700">{doc.documentName}</td>
                            <td className="px-6 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(doc.status)}`}>
                                {doc.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Compliance Report */}
          {activeReport === 'compliance' && complianceData && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Compliance Calendar</h3>
                <p className="text-sm text-gray-500">Statutory compliance due dates and affected clients</p>
              </div>
              {complianceData.entries && complianceData.entries.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Compliance</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">On Time</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Late</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {complianceData.entries.map((entry: any) => (
                          <tr key={entry.entryId} className="hover:bg-gray-50/50">
                            <td className="px-6 py-3 text-sm font-medium text-gray-900">{entry.entryName}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{entry.totalTasks}</td>
                            <td className="px-6 py-3 text-sm text-emerald-600 font-medium">{entry.onTime}</td>
                            <td className="px-6 py-3 text-sm text-red-600 font-medium">{entry.late}</td>
                            <td className="px-6 py-3 text-sm text-amber-600 font-medium">{entry.pending}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Unbilled Report */}
          {activeReport === 'unbilled' && unbilledData && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Unbilled Tasks Report</h3>
                <p className="text-sm text-gray-500">Completed tasks not yet invoiced</p>
              </div>
              {unbilledData.tasks && unbilledData.tasks.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Task</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Type</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {unbilledData.tasks.map((task: any) => (
                          <tr key={task.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-3 text-sm font-medium text-gray-900">{task.title}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{task.clientName}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{task.serviceType}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
