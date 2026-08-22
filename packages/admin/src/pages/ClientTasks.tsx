import useApi from '../hooks/useApi'

export default function ClientTasks() {
  const api = useApi('/portal/my-tasks')
  const tasks = api.data?.items || []

  if (api.loading) return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>
  if (api.error) return <div className="text-red-500 bg-red-50 p-4 rounded-xl text-sm">{api.error}</div>

  return (
    <div className="space-y-6 max-w-[1600px]">
      <h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {tasks.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No tasks assigned to you</p> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100"><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Task</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Due Date</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.map((task: any) => (
                  <tr key={task.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{task.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{task.status?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN') : '-'}</td>
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
