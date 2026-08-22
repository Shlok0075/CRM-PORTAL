import useApi from '../hooks/useApi'

export default function ClientInvoices() {
  const api = useApi('/portal/my-invoices')
  const invoices = api.data || []

  if (api.loading) return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>
  if (api.error) return <div className="text-red-500 bg-red-50 p-4 rounded-xl text-sm">{api.error}</div>

  const outstanding = invoices.reduce((sum: number, inv: any) => {
    const paid = (inv.receipts || []).reduce((s: number, r: any) => s + (r.amount || 0), 0)
    return sum + Math.max(0, (inv.total || 0) - paid)
  }, 0)

  return (
    <div className="space-y-6 max-w-[1600px]">
      <h2 className="text-2xl font-bold text-gray-900">My Invoices</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-2xl font-bold text-gray-900">₹{outstanding.toLocaleString('en-IN')}</p>
          <p className="text-sm text-gray-500 mt-1">Outstanding Balance</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total Invoices</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {invoices.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No invoices yet</p> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100"><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Invoice</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Due Date</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{(inv.total || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{inv.status}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '-'}</td>
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
