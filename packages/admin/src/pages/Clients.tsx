import { useEffect, useState } from 'react'
import { Plus, Search, Mail, Phone, MapPin, ChevronRight, X, RefreshCw } from 'lucide-react'
import { apiFetch } from '../lib/api'

export default function Clients() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadClients = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)
      if (statusFilter) params.set('status', statusFilter)
      const data = await apiFetch(`/clients?${params.toString()}`)
      setClients(data?.data || data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadClients() }, [searchTerm, statusFilter])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      const data = {
        name: formData.get('name') as string,
        pan: formData.get('pan') as string || undefined,
        gstins: formData.get('gstin') ? JSON.stringify([formData.get('gstin')]) : '[]',
        type: formData.get('type') as string || undefined,
        contactInfo: JSON.stringify({
          email: formData.get('email') as string,
          phone: formData.get('phone') as string,
          address: formData.get('address') as string,
        }),
        status: 'active',
      }
      await apiFetch('/clients', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      setShowAddModal(false)
      loadClients()
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to create client')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return
    try {
      await apiFetch(`/clients/${id}`, { method: 'DELETE' })
      loadClients()
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to delete client')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700'
      case 'inactive': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Client Management</h2>
          <p className="text-sm text-gray-500 mt-1">{clients.length} clients registered</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadClients} className="btn-secondary flex items-center gap-2"><RefreshCw size={16} />Refresh</button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Add Client
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, PAN, GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input w-auto">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">PAN / GSTIN</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clients.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">No clients found. Add your first client.</td></tr>
                ) : clients.map((client: any) => {
                  const contact = client.contactInfo ? JSON.parse(client.contactInfo) : {}
                  const gstins = client.gstins ? JSON.parse(client.gstins) : []
                  return (
                    <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                            {client.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{client.name}</p>
                            <p className="text-xs text-gray-500">{contact.email || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-900 font-mono">{client.pan || '-'}</p>
                          {gstins.length > 0 && <p className="text-xs text-gray-500 font-mono">{gstins[0]}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{client.type || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(client.status)}`}>{client.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setSelectedClient(client)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="View Details"><ChevronRight size={16} /></button>
                          <button onClick={() => handleDelete(client.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title="Delete"><X size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Client Details</h3>
              <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">{selectedClient.name?.charAt(0)}</div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{selectedClient.name}</h4>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${getStatusBadge(selectedClient.status)}`}>{selectedClient.status}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Tax Details</p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">PAN: {selectedClient.pan || '-'}</p>
                    {selectedClient.gstins && <p className="text-sm text-gray-700">GSTIN: {JSON.parse(selectedClient.gstins)[0] || '-'}</p>}
                    <p className="text-sm text-gray-700">Type: {selectedClient.type || '-'}</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Contact</p>
                  <div className="space-y-2">
                    {selectedClient.contactInfo && (() => { const c = JSON.parse(selectedClient.contactInfo); return (
                      <>
                        {c.email && <p className="text-sm text-gray-700 flex items-center gap-2"><Mail size={14} />{c.email}</p>}
                        {c.phone && <p className="text-sm text-gray-700 flex items-center gap-2"><Phone size={14} />{c.phone}</p>}
                        {c.address && <p className="text-sm text-gray-700 flex items-center gap-2"><MapPin size={14} />{c.address}</p>}
                      </>
                    )})}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Add New Client</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="form-label">Client Name *</label>
                  <input name="name" type="text" className="form-input" placeholder="Enter client name" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">PAN</label>
                    <input name="pan" type="text" className="form-input" placeholder="PAN" />
                  </div>
                  <div>
                    <label className="form-label">GSTIN</label>
                    <input name="gstin" type="text" className="form-input" placeholder="GSTIN (optional)" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Client Type</label>
                  <select name="type" className="form-input">
                    <option value="private_limited">Private Limited</option>
                    <option value="public_limited">Public Limited</option>
                    <option value="llp">LLP</option>
                    <option value="partnership">Partnership</option>
                    <option value="proprietorship">Proprietorship</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input name="email" type="email" className="form-input" placeholder="client@email.com" />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input name="phone" type="tel" className="form-input" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="form-label">Address</label>
                  <textarea name="address" className="form-input" rows={2} placeholder="Address"></textarea>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">{submitting ? 'Saving...' : 'Add Client'}</button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
