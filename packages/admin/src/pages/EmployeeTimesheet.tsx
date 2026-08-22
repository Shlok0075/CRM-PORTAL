import useApi from '../hooks/useApi'

export default function EmployeeTimesheet() {
  const api = useApi('/portal/my-timesheet')
  const logs = api.data || []

  if (api.loading) return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>
  if (api.error) return <div className="text-red-500 bg-red-50 p-4 rounded-xl text-sm">{api.error}</div>

  return (
    <div className="space-y-6 max-w-[1600px]">
      <h2 className="text-2xl font-bold text-gray-900">My Timesheet</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {logs.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No timesheet entries yet</p> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100"><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Task</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Start</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">End</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Duration</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm text-gray-900">{log.task?.title || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.startTime ? new Date(log.startTime).toLocaleString('en-IN') : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.endTime ? new Date(log.endTime).toLocaleString('en-IN') : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.durationMinutes ? `${log.durationMinutes} min` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
