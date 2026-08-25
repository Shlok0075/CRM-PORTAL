import { useState } from 'react'
import { UserCog, Plus, Calendar, Timer, X, RefreshCw, Download } from 'lucide-react'
import useApi from '../hooks/useApi'
import { apiFetch, API_BASE } from '../lib/api'

export default function Employees() {
  const [activeTab, setActiveTab] = useState<'team' | 'attendance' | 'timesheet'>('team')
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalType, setModalType] = useState<'employee' | 'attendance' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedTimesheetUser, setSelectedTimesheetUser] = useState<string>('')

  const {
    data: employeesData,
    loading: employeesLoading,
    error: employeesError,
    mutate: mutateEmployees,
  } = useApi('/employees')

  const users = employeesData?.data || employeesData || []

  const {
    data: attendanceData,
    loading: attendanceLoading,
    error: attendanceError,
    mutate: mutateAttendance,
  } = useApi('/employees/attendance')

  const attendance = attendanceData?.data || attendanceData || []

  const timesheetUrl = selectedTimesheetUser
    ? `/employees/${selectedTimesheetUser}/timesheet`
    : ''
  const {
    data: timesheetData,
    loading: timesheetLoading,
  } = useApi(timesheetUrl)

  const timesheets = timesheetData?.data || timesheetData || []

  const combinedError = employeesError || attendanceError

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      await apiFetch('/employees', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.get('name') as string,
          email: formData.get('email') as string,
          password: formData.get('password') as string,
          designation: formData.get('designation') as string || undefined,
          phone: formData.get('phone') as string || undefined,
        }),
      })
      setModalType(null)
      setShowAddModal(false)
      mutateEmployees('/employees')
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to add employee')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      await apiFetch('/employees/attendance', {
        method: 'POST',
        body: JSON.stringify({
          userId: formData.get('userId') as string,
          date: formData.get('date') as string,
          inTime: formData.get('inTime') as string,
          outTime: formData.get('outTime') as string,
          status: formData.get('status') as string,
        }),
      })
      setModalType(null)
      setShowAddModal(false)
      mutateAttendance('/employees/attendance')
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to mark attendance')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTimesheetUserChange = (userId: string) => {
    setSelectedTimesheetUser(userId)
  }

  const handleAttendanceDownload = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const res = await fetch(`${API_BASE}/employees/attendance/export`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'attendance.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || 'Failed to export attendance')
    }
  }

  const handleTimesheetDownload = async () => {
    if (!selectedTimesheetUser) {
      alert('Please select an employee first')
      return
    }
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const res = await fetch(`${API_BASE}/employees/${selectedTimesheetUser}/timesheet/export`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `timesheet_${selectedTimesheetUser}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || 'Failed to export timesheet')
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
          <p className="text-sm text-gray-500 mt-1">{users.length} team members</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { mutateEmployees('/employees'); mutateAttendance('/employees/attendance'); }} className="btn-secondary flex items-center gap-2"><RefreshCw size={16} />Refresh</button>
          <button onClick={() => { setModalType('employee'); setShowAddModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Add Employee
          </button>
        </div>
      </div>

      {combinedError && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">{combinedError}</div>}

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'team', label: 'Team', icon: UserCog },
          { key: 'attendance', label: 'Attendance', icon: Calendar },
          { key: 'timesheet', label: 'Timesheet', icon: Timer },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'team' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {employeesLoading ? (
            <div className="col-span-2 flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <p className="text-gray-400">No team members yet. Add your first employee.</p>
            </div>
          ) : users.map((user: any) => (
            <div key={user.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-xl hover:shadow-slate-100/50 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.designation || 'Team Member'}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Attendance Records</h3>
            <div className="flex gap-2">
              <button onClick={handleAttendanceDownload} className="btn-secondary flex items-center gap-2 text-sm py-2">
                <Download size={14} /> Export Excel
              </button>
              <button onClick={() => { setModalType('attendance'); setShowAddModal(true); }} className="btn-primary flex items-center gap-2 text-sm py-2">
                <Plus size={14} /> Mark Attendance
              </button>
            </div>
          </div>
          {attendanceLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">In Time</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Out Time</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attendance.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">No attendance records yet.</td></tr>
                  ) : attendance.map((att: any) => (
                    <tr key={att.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{att.user?.name || '-'}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{att.date ? new Date(att.date).toLocaleDateString('en-IN') : '-'}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{att.inTime || '-'}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{att.outTime || '-'}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${att.status === 'present' ? 'bg-emerald-50 text-emerald-700' : att.status === 'absent' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{att.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'timesheet' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Timesheet</h3>
            <div className="flex gap-2">
              <button onClick={handleTimesheetDownload} className="btn-secondary flex items-center gap-2 text-sm py-2">
                <Download size={14} /> Export Excel
              </button>
              <select
                value={selectedTimesheetUser}
                onChange={(e) => handleTimesheetUserChange(e.target.value)}
                className="form-input text-sm py-2 w-48"
              >
                <option value="">Select employee...</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
          {timesheetLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : !selectedTimesheetUser ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">Select an employee to view their timesheet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Task</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {timesheets.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">No timesheet entries yet.</td></tr>
                  ) : timesheets.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{log.user?.name || '-'}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{log.task?.title || '-'}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{log.durationMinutes ? `${Math.floor(log.durationMinutes / 60)}h ${log.durationMinutes % 60}m` : '-'}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{log.startTime ? new Date(log.startTime).toLocaleDateString('en-IN') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && modalType === 'employee' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Add Employee</h3>
              <button onClick={() => { setModalType(null); setShowAddModal(false); }} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="form-label">Full Name</label>
                  <input name="name" type="text" className="form-input" placeholder="Enter full name" required />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input name="email" type="email" className="form-input" placeholder="employee@firm.com" required />
                </div>
                <div>
                  <label className="form-label">Password</label>
                  <input name="password" type="password" className="form-input" placeholder="Initial password" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Designation</label>
                    <select name="designation" className="form-input">
                      <option>Partner</option><option>Manager</option><option>Senior CA</option><option>Article Assistant</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <input name="phone" type="tel" className="form-input" placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">{submitting ? 'Adding...' : 'Add Employee'}</button>
                  <button type="button" onClick={() => { setModalType(null); setShowAddModal(false); }} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Attendance Modal */}
      {showAddModal && modalType === 'attendance' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Mark Attendance</h3>
              <button onClick={() => { setModalType(null); setShowAddModal(false); }} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleMarkAttendance}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="form-label">Employee</label>
                  <select name="userId" className="form-input" required>
                    <option value="">Select employee...</option>
                    {users.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Date</label>
                  <input name="date" type="date" className="form-input" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">In Time</label>
                    <input name="inTime" type="time" className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">Out Time</label>
                    <input name="outTime" type="time" className="form-input" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select name="status" className="form-input">
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="half-day">Half Day</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">{submitting ? 'Saving...' : 'Mark Attendance'}</button>
                  <button type="button" onClick={() => { setModalType(null); setShowAddModal(false); }} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
