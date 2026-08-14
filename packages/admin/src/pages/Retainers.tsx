import { useState, useEffect } from 'react'
import { Plus, RefreshCw, X } from 'lucide-react'
import { apiFetch } from '../lib/api'
import useApi from '../hooks/useApi'

export default function Retainers() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [clients, setClients] = useState<any[]>([])

  const { data: retainerData, loading: retainersLoading, error: retainersError, refetch: refetchRetainers } = useApi('/finance/retainers')

  const retainers = retainerData?.data || retainerData || []

  useEffect(() => {
    apiFetch('/clients?limit=100').then((data: any) => {
      setClients(data?.data || data || [])
    }).catch((err: any) => {
      if (err.status === 401) {
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
        window.location.href = '/login'
      }
    })
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      await apiFetch('/finance/retainers', {
        method: 'POST',
        body: JSON.stringify({
          clientId: formData.get('clientId') as string,
          name: formData.get('name') as string,
          totalAmount: formData.get('totalAmount') ? parseFloat(formData.get('totalAmount') as string) : 0,
          billingFrequency: formData.get('billingFrequency') as string,
          startDate: new Date().toISOString(),
          autoRenew: formData.get('autoRenew') === 'yes',
        }),
      })
      setShowCreateModal(false)
      refetchRetainers()
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to create retainer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this retainer?')) return
    try {
      await apiFetch(`/finance/retainers/${id}`, { method: 'DELETE' })
      refetchRetainers()
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Retainers</h2>
          <p className="text-sm text-gray-500 mt-1">{retainers.length} active retainers</p>
        </div>
        <div className="flex gap-3">
          <button onClick={refetchRetainers} className="btn-secondary flex items-center gap-2"><RefreshCw size={16} />Refresh</button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Create Retainer
          </button>
        </div>
      </div>

      {retainersError && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">{retainersError}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {retainers.length === 0 && retainersLoading === false && (
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-gray-400">No retainers yet. Create your first retainer to get started.</p>
          </div>
        )}
        {retainers.map((retainer: any) => (
          <div key={retainer.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-xl hover:shadow-slate-100/50 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{retainer.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{retainer.client?.name || '-'}</p>
              </div>
              <button onClick={() => handleDelete(retainer.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><X size={16} /></button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Amount</span>
                <span className="text-sm font-bold text-gray-900">₹{retainer.totalAmount?.toLocaleString('en-IN') || '0'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Frequency</span>
                <span className="text-sm text-gray-700">{retainer.billingFrequency}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${retainer.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{retainer.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {retainersLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Create New Retainer</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="form-label">Retainer Name</label>
                  <input name="name" type="text" className="form-input" placeholder="e.g., Monthly GST Package" required />
                </div>
                 <div>
                   <label className="form-label">Client</label>
                   <select name="clientId" className="form-input" required>
                     <option value="">Select client</option>
                     {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                 </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Total Amount (₹)</label>
                    <input name="totalAmount" type="number" className="form-input" placeholder="0" required />
                  </div>
                  <div>
                    <label className="form-label">Billing Frequency</label>
                    <select name="billingFrequency" className="form-input">
                      <option>Monthly</option><option>Quarterly</option><option>Half-Yearly</option><option>Yearly</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="autoRenew" value="yes" className="rounded border-gray-300 text-emerald-600" />
                  <label className="text-sm text-gray-700">Enable auto-renewal</label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">{submitting ? 'Creating...' : 'Create Retainer'}</button>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
