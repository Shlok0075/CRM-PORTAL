import { useState, useRef, useEffect } from 'react'
import { Plus, FileText, Receipt, CreditCard, TrendingUp, X, AlertTriangle, Clock, Eye, MoreVertical, RefreshCw, Upload, Trash2, Download } from 'lucide-react'
import { apiFetch, API_BASE } from '../lib/api'
import useApi from '../hooks/useApi'

export default function Finance() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'receipts' | 'expenses'>('invoices')
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [invoiceDocs, setInvoiceDocs] = useState<any[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docCategory, setDocCategory] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: invData, loading: invLoading, error: invError, refetch: refetchInvoices } = useApi('/finance/invoices')
  const { data: rcpData, loading: rcpLoading, error: rcpError, refetch: refetchReceipts } = useApi('/finance/receipts')
  const { data: expData, loading: expLoading, error: expError, refetch: refetchExpenses } = useApi('/finance/expenses')
  const { data: clientsData } = useApi('/clients?limit=100')
  const clients = clientsData?.data || clientsData || []

  const invoices = Array.isArray(invData?.data) ? invData.data : Array.isArray(invData) ? invData : []
  const receipts = Array.isArray(rcpData?.data) ? rcpData.data : Array.isArray(rcpData) ? rcpData : []
  const expenses = Array.isArray(expData?.data) ? expData.data : Array.isArray(expData) ? expData : []

  const loading = invLoading || rcpLoading || expLoading
  const error = invError || rcpError || expError

  const refetchAll = () => {
    refetchInvoices()
    refetchReceipts()
    refetchExpenses()
  }

  const viewInvoice = (inv: any) => {
    setSelectedInvoice(inv)
    setShowViewModal(true)
    setInvoiceDocs([])
  }

  useEffect(() => {
    if (selectedInvoice?.id) {
      setDocsLoading(true)
      apiFetch(`/documents?clientId=${selectedInvoice.clientId}`)
        .then((data: any) => setInvoiceDocs(data?.data || data || []))
        .catch(() => setInvoiceDocs([]))
        .finally(() => setDocsLoading(false))
    }
  }, [selectedInvoice?.id])

  const handleInvoiceDocFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleUploadInvoiceDoc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !selectedInvoice?.clientId) return
    setUploadingDoc(true)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        try {
          await apiFetch('/documents/upload-file', {
            method: 'POST',
            body: JSON.stringify({
              fileName: selectedFile.name,
              category: docCategory || 'Invoice Document',
              fileData: ev.target?.result as string,
              fileType: selectedFile.type,
              fileSize: selectedFile.size,
              clientId: selectedInvoice.clientId,
            }),
          })
          setSelectedFile(null)
          setDocCategory('')
          if (fileInputRef.current) fileInputRef.current.value = ''
          const data = await apiFetch(`/documents?clientId=${selectedInvoice.clientId}`)
          setInvoiceDocs(data?.data || data || [])
        } catch (err: any) {
          alert(err.data?.message || err.message || 'Failed to upload document')
        } finally {
          setUploadingDoc(false)
        }
      }
      reader.readAsDataURL(selectedFile)
    } catch (err: any) {
      alert(err.message || 'Failed to upload document')
      setUploadingDoc(false)
    }
  }

  const handleDeleteInvoiceDoc = async (docId: string) => {
    if (!confirm('Delete this document?')) return
    try {
      await apiFetch(`/documents/${docId}`, { method: 'DELETE' })
      if (selectedInvoice?.clientId) {
        const data = await apiFetch(`/documents?clientId=${selectedInvoice.clientId}`)
        setInvoiceDocs(data?.data || data || [])
      }
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to delete document')
    }
  }

  const handleDownloadInvoiceDoc = async (doc: any) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const res = await fetch(`${API_BASE}/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.fileName || 'document'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || 'Failed to download document')
    }
  }

  const printInvoice = (inv: any) => {
    const w = window.open('', '_blank', 'width=800,height=600')
    if (!w) return
    const rows = (inv.lineItems && inv.lineItems.length ? inv.lineItems : []).map((li: any) =>
      `<tr><td style="padding:6px;border:1px solid #ddd">${li.description}</td><td style="padding:6px;border:1px solid #ddd">${li.quantity}</td><td style="padding:6px;border:1px solid #ddd">₹${Number(li.amount || 0).toLocaleString('en-IN')}</td></tr>`,
    ).join('')
    w.document.write(`<html><head><title>Invoice ${inv.invoiceNumber}</title></head><body style="font-family:sans-serif;padding:32px">
      <h2>StartUp Go Ventures CRM</h2>
      <h3>Invoice ${inv.invoiceNumber}</h3>
      <p><strong>Client:</strong> ${inv.client?.name || '-'}</p>
      <p><strong>Status:</strong> ${inv.status}</p>
      <p><strong>Issue Date:</strong> ${inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-IN') : '-'}</p>
      <p><strong>Due Date:</strong> ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '-'}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px"><thead><tr style="background:#f5f5f5"><th style="padding:6px;border:1px solid #ddd;text-align:left">Description</th><th style="padding:6px;border:1px solid #ddd">Qty</th><th style="padding:6px;border:1px solid #ddd">Amount</th></tr></thead><tbody>${rows}</tbody></table>
      <h3 style="margin-top:16px">Total: ₹${Number(inv.total || 0).toLocaleString('en-IN')}</h3>
      <script>window.onload=function(){window.print()}</script>
    </body></html>`)
    w.document.close()
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      const amount = parseFloat(formData.get('amount') as string)
      const cgst = parseFloat(formData.get('cgst') as string) || 0
      const sgst = parseFloat(formData.get('sgst') as string) || 0
      const igst = parseFloat(formData.get('igst') as string) || 0
      const subtotal = amount
      const total = subtotal + cgst + sgst + igst
      await apiFetch('/finance/invoices', {
        method: 'POST',
        body: JSON.stringify({
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          clientId: formData.get('clientId') as string || undefined,
          subtotal,
          cgst,
          sgst,
          igst,
          total,
          status: 'draft',
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          lineItems: [{ description: formData.get('description') as string, quantity: 1, unitPrice: amount, amount }],
          hsnSac: formData.get('hsnSac') as string || undefined,
          placeOfSupply: formData.get('placeOfSupply') as string || undefined,
        }),
      })
      setShowInvoiceModal(false)
      refetchAll()
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to create invoice')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      await apiFetch('/finance/receipts', {
        method: 'POST',
        body: JSON.stringify({
          clientId: formData.get('clientId') as string || undefined,
          invoiceId: formData.get('invoiceId') as string || undefined,
          amount: parseFloat(formData.get('amount') as string),
          mode: formData.get('mode') as string,
          date: new Date().toISOString(),
        }),
      })
      setShowReceiptModal(false)
      refetchAll()
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to create receipt')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      await apiFetch('/finance/expenses', {
        method: 'POST',
        body: JSON.stringify({
          description: formData.get('description') as string,
          amount: parseFloat(formData.get('amount') as string),
          category: formData.get('category') as string || undefined,
          isBillable: formData.get('isBillable') === 'on',
          clientId: formData.get('clientId') as string || undefined,
        }),
      })
      setShowExpenseModal(false)
      refetchAll()
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to create expense')
    } finally {
      setSubmitting(false)
    }
  }

  const totalReceived = invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + (i.total || 0), 0)
  const pendingAmount = invoices.filter((i: any) => i.status === 'draft' || i.status === 'sent').reduce((s: number, i: any) => s + (i.total || 0), 0)
  const overdueAmount = invoices.filter((i: any) => i.status === 'overdue').reduce((s: number, i: any) => s + (i.total || 0), 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-700'
      case 'sent': return 'bg-blue-50 text-blue-700'
      case 'draft': return 'bg-gray-100 text-gray-600'
      case 'overdue': return 'bg-red-50 text-red-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <>
      <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Finance & Billing</h2>
          <p className="text-sm text-gray-500 mt-1">Manage invoices, receipts, and expenses</p>
        </div>
        <div className="flex gap-3">
          <button onClick={refetchAll} className="btn-secondary flex items-center gap-2"><RefreshCw size={16} />Refresh</button>
          {activeTab === 'invoices' && (
            <button onClick={() => setShowInvoiceModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              New Invoice
            </button>
          )}
          {activeTab === 'receipts' && (
            <button onClick={() => setShowReceiptModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              New Receipt
            </button>
          )}
          {activeTab === 'expenses' && (
            <button onClick={() => setShowExpenseModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              New Expense
            </button>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-50">
              <TrendingUp className="text-emerald-600" size={22} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{totalReceived.toLocaleString('en-IN')}</p>
          <p className="text-sm text-gray-500 mt-1">Total Received</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <Clock className="text-amber-600" size={22} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{pendingAmount.toLocaleString('en-IN')}</p>
          <p className="text-sm text-gray-500 mt-1">Pending Amount</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-red-50">
              <AlertTriangle className="text-red-600" size={22} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{overdueAmount.toLocaleString('en-IN')}</p>
          <p className="text-sm text-gray-500 mt-1">Overdue Amount</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex border-b border-gray-100">
          {[
            { key: 'invoices', label: 'Invoices', icon: FileText },
            { key: 'receipts', label: 'Receipts', icon: Receipt },
            { key: 'expenses', label: 'Expenses', icon: CreditCard },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'invoices' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {invoices.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No invoices yet. Create your first invoice.</td></tr>
                      ) : invoices.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{inv.invoiceNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{inv.client?.name || '-'}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{inv.total?.toLocaleString('en-IN') || '0'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(inv.status)}`}>{inv.status}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => viewInvoice(inv)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><Eye size={16} /></button>
                                <button onClick={() => {}} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><MoreVertical size={16} /></button>
                              </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'receipts' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receipt</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mode</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {receipts.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No receipts yet.</td></tr>
                      ) : receipts.map((rcp: any) => (
                        <tr key={rcp.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{rcp.id?.slice(0, 8)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{rcp.client?.name || '-'}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{rcp.amount?.toLocaleString('en-IN') || '0'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{rcp.mode || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{rcp.date ? new Date(rcp.date).toLocaleDateString('en-IN') : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'expenses' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Billable</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {expenses.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">No expenses yet.</td></tr>
                      ) : expenses.map((exp: any) => (
                        <tr key={exp.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{exp.description}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{exp.amount?.toLocaleString('en-IN') || '0'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${exp.isBillable ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                              {exp.isBillable ? 'Billable' : 'Non-billable'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{exp.date ? new Date(exp.date).toLocaleDateString('en-IN') : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Create Invoice</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
             <form onSubmit={handleCreateInvoice}>
               <div className="p-6 space-y-4">
                 <div>
                   <label className="form-label">Client</label>
                   <select name="clientId" className="form-input" required>
                     <option value="">Select client</option>
                     {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="form-label">Description</label>
                   <input name="description" type="text" className="form-input" placeholder="Service description" required />
                 </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Amount (₹)</label>
                    <input name="amount" type="number" className="form-input" placeholder="0" required />
                  </div>
                  <div>
                    <label className="form-label">HSN/SAC Code</label>
                    <input name="hsnSac" type="text" className="form-input" placeholder="998398" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">CGST (%)</label>
                    <input name="cgst" type="number" className="form-input" placeholder="9" />
                  </div>
                  <div>
                    <label className="form-label">SGST (%)</label>
                    <input name="sgst" type="number" className="form-input" placeholder="9" />
                  </div>
                  <div>
                    <label className="form-label">IGST (%)</label>
                    <input name="igst" type="number" className="form-input" placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Place of Supply</label>
                  <input name="placeOfSupply" type="text" className="form-input" placeholder="Maharashtra" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">{submitting ? 'Creating...' : 'Create Invoice'}</button>
                  <button type="button" onClick={() => setShowInvoiceModal(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReceiptModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Create Receipt</h3>
              <button onClick={() => setShowReceiptModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
             <form onSubmit={handleCreateReceipt}>
               <div className="p-6 space-y-4">
                 <div>
                   <label className="form-label">Client</label>
                   <select name="clientId" className="form-input" required>
                     <option value="">Select client</option>
                     {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="form-label">Invoice (optional)</label>
                   <select name="invoiceId" className="form-input">
                     <option value="">None</option>
                     {invoices.map((inv: any) => <option key={inv.id} value={inv.id}>{inv.invoiceNumber} - ₹{inv.total?.toLocaleString('en-IN')}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="form-label">Amount (₹)</label>
                   <input name="amount" type="number" className="form-input" placeholder="0" required />
                 </div>
                <div>
                  <label className="form-label">Payment Mode</label>
                  <select name="mode" className="form-input">
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Cheque</option>
                    <option>Bank Transfer</option>
                    <option>Online Gateway</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">{submitting ? 'Creating...' : 'Create Receipt'}</button>
                  <button type="button" onClick={() => setShowReceiptModal(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            </form>
           </div>
         </div>
       )}

       {showExpenseModal && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full">
             <div className="p-6 border-b border-gray-100 flex items-center justify-between">
               <h3 className="text-xl font-bold text-gray-900">Create Expense</h3>
               <button onClick={() => setShowExpenseModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
             </div>
             <form onSubmit={handleCreateExpense}>
               <div className="p-6 space-y-4">
                 <div>
                   <label className="form-label">Description</label>
                   <input name="description" type="text" className="form-input" placeholder="Expense description" required />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="form-label">Amount (₹)</label>
                     <input name="amount" type="number" className="form-input" placeholder="0" required />
                   </div>
                   <div>
                     <label className="form-label">Category</label>
                     <select name="category" className="form-input">
                       <option>Office Supplies</option>
                       <option>Travel</option>
                       <option>Utilities</option>
                       <option>Software</option>
                       <option>Professional Fees</option>
                       <option>Other</option>
                     </select>
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="form-label">Client</label>
                     <select name="clientId" className="form-input">
                       <option value="">None</option>
                       {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                   </div>
                   <div className="flex items-center gap-2 pt-6">
                     <input type="checkbox" name="isBillable" className="rounded border-gray-300 text-emerald-600" />
                     <label className="text-sm text-gray-700">Billable to client</label>
                   </div>
                 </div>
                 <div className="flex gap-3 pt-2">
                   <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">{submitting ? 'Creating...' : 'Create Expense'}</button>
                   <button type="button" onClick={() => setShowExpenseModal(false)} className="btn-secondary flex-1">Cancel</button>
                 </div>
               </div>
             </form>
           </div>
         </div>
        )}
      </div>

       {showViewModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Invoice Details</h3>
              <button onClick={() => setShowViewModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Invoice Number</p><p className="text-sm font-medium text-gray-900">{selectedInvoice.invoiceNumber}</p></div>
                <div><p className="text-xs text-gray-500">Client</p><p className="text-sm font-medium text-gray-900">{selectedInvoice.client?.name || '-'}</p></div>
                <div><p className="text-xs text-gray-500">Amount</p><p className="text-sm font-medium text-gray-900">₹{selectedInvoice.total?.toLocaleString('en-IN') || '0'}</p></div>
                <div><p className="text-xs text-gray-500">Status</p><p className="text-sm font-medium text-gray-900 capitalize">{selectedInvoice.status}</p></div>
                <div><p className="text-xs text-gray-500">Issue Date</p><p className="text-sm font-medium text-gray-900">{selectedInvoice.issueDate ? new Date(selectedInvoice.issueDate).toLocaleDateString() : '-'}</p></div>
                <div><p className="text-xs text-gray-500">Due Date</p><p className="text-sm font-medium text-gray-900">{selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : '-'}</p></div>
              </div>
              {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Line Items</p>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100 text-left text-xs text-gray-500"><th className="py-1">Description</th><th className="py-1">Qty</th><th className="py-1">Amount</th></tr></thead>
                    <tbody>
                      {selectedInvoice.lineItems.map((li: any, i: number) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-1">{li.description}</td><td className="py-1">{li.quantity}</td><td className="py-1">₹{li.amount?.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">Documents</h4>
                <form onSubmit={handleUploadInvoiceDoc} className="space-y-2 mb-3">
                  <div className="flex gap-2">
                    <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="form-input text-sm py-2 w-40">
                      <option value="">Category</option>
                      <option>Financial Statements</option>
                      <option>Bank Statements</option>
                      <option>Purchase/Sales Register</option>
                      <option>TDS Certificates</option>
                      <option>PAN/Aadhaar/KYC</option>
                      <option>DSC</option>
                      <option>Agreements</option>
                      <option>Notices/Orders</option>
                      <option>Filed Returns</option>
                    </select>
                    <input ref={fileInputRef} type="file" onChange={handleInvoiceDocFileSelect} className="form-input text-sm py-2 flex-1" />
                    <button type="submit" disabled={uploadingDoc || !selectedFile} className="btn-primary text-sm py-2 disabled:opacity-50">
                      <Upload size={14} />
                    </button>
                  </div>
                </form>
                {docsLoading ? (
                  <div className="flex items-center justify-center py-3">
                    <div className="w-5 h-5 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                  </div>
                ) : invoiceDocs.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">No documents for this client yet.</p>
                ) : (
                  <div className="space-y-2">
                    {invoiceDocs.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50/80 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-gray-400" />
                          <div>
                            <p className="text-xs font-medium text-gray-900">{doc.fileName || 'Untitled'}</p>
                            <p className="text-[10px] text-gray-500">{doc.category || 'Uncategorized'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDownloadInvoiceDoc(doc)} className="p-1 hover:bg-gray-100 rounded text-gray-500"><Download size={12} /></button>
                          <button onClick={() => handleDeleteInvoiceDoc(doc.id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => { setShowViewModal(false); printInvoice(selectedInvoice) }} className="btn-primary">Download / Print</button>
              <button onClick={() => setShowViewModal(false)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
       )}
    </>
  )
}
