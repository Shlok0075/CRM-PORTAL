import { useState } from 'react'
import { Plus, FileText, X, RefreshCw, Download, Pencil, Trash2, Eye } from 'lucide-react'
import useApi from '../hooks/useApi'
import { apiFetch } from '../lib/api'

const SAMPLE_TEMPLATE = `AGREEMENT

This Agreement is made on {{date}} between {{our_name}} (hereinafter "the Firm") and {{client_name}} (hereinafter "the Client"), having registered address at {{client_address}}.

1. SCOPE OF SERVICES
The Firm agrees to provide the following services to the Client: {{scope_of_services}}.

2. TERM
This agreement shall commence on {{start_date}} and continue until {{end_date}} unless terminated earlier.

3. FEES
The Client agrees to pay professional fees as per the agreed engagement letter.

4. CONFIDENTIALITY
Both parties agree to maintain confidentiality of all information shared.

IN WITNESS WHEREOF, the parties have executed this agreement on the date first above written.

For {{our_name}}                          For {{client_name}}
Authorized Signatory                      Authorized Signatory`

export default function Templates() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const templatesApi = useApi('/templates')
  const templates = templatesApi.data?.data || templatesApi.data || []

  const { data: clientsData } = useApi('/clients?limit=100')
  const clients = clientsData?.data || clientsData || []

  const [genTemplate, setGenTemplate] = useState<any>(null)
  const [genClient, setGenClient] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      const body = (formData.get('body') as string) || SAMPLE_TEMPLATE
      await apiFetch('/templates', {
        method: 'POST',
        body: JSON.stringify({ name: formData.get('name'), type: formData.get('type'), body }),
      })
      setShowCreateModal(false)
      templatesApi.refetch()
    } catch (err: any) {
      setError(err.data?.message || err.message || 'Failed to create template')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setSubmitting(true)
    setError(null)
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      await apiFetch(`/templates/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: formData.get('name'), type: formData.get('type'), body: formData.get('body') }),
      })
      setEditing(null)
      templatesApi.refetch()
    } catch (err: any) {
      setError(err.data?.message || err.message || 'Failed to update template')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return
    try { await apiFetch(`/templates/${id}`, { method: 'DELETE' }); templatesApi.refetch() } catch (err: any) { alert(err.data?.message || err.message) }
  }

  const openGenerate = (tpl: any) => {
    setGenTemplate(tpl)
    setGenClient('')
    setFields({})
    setPreview('')
    setShowGenerateModal(true)
  }

  const generatePreview = (_client: any, f: Record<string, string>) => {
    if (!genTemplate) return
    const filled = Object.entries({ date: new Date().toLocaleDateString('en-IN'), our_name: 'StartUp Go Ventures CRM', our_address: '', ...f }).reduce(
      (acc, [k, v]) => acc.split(`{{${k}}}`).join(v ?? ''),
      genTemplate.body,
    )
    setPreview(filled)
  }

  const onClientChange = (clientId: string) => {
    setGenClient(clientId)
    const c = clients.find((x: any) => x.id === clientId)
    if (c) {
      const contact = c.contactInfo ? JSON.parse(c.contactInfo) : {}
      const next = { ...fields, client_name: c.name, client_address: contact.address || '' }
      setFields(next)
      generatePreview(c, next)
    }
  }

  const download = () => {
    if (!preview) return
    const name = (genTemplate?.name || 'agreement').replace(/\s+/g, '_')
    const blob = new Blob([preview], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agreement Templates</h2>
          <p className="text-sm text-gray-500 mt-1">{templates.length} templates</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => templatesApi.refetch()} className="btn-secondary flex items-center gap-2"><RefreshCw size={16} />Refresh</button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} />New Template</button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center"><p className="text-gray-400">No templates yet. Create your first agreement template.</p></div>
        ) : templates.map((t: any) => (
          <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white"><FileText size={18} /></div>
                <div>
                  <h3 className="font-bold text-gray-900">{t.name}</h3>
                  <p className="text-xs text-gray-500">{t.type}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-4 line-clamp-3 whitespace-pre-wrap">{t.body?.slice(0, 120)}...</p>
            <div className="flex gap-2">
              <button onClick={() => openGenerate(t)} className="btn-primary flex-1 text-sm flex items-center justify-center gap-1"><Eye size={14} />Generate</button>
              <button onClick={() => setEditing(t)} className="p-2 hover:bg-gray-100 rounded-lg text-blue-500"><Pencil size={16} /></button>
              <button onClick={() => handleDelete(t.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">New Agreement Template</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="form-label">Template Name</label><input name="name" className="form-input" required placeholder="Service Agreement" /></div>
                  <div><label className="form-label">Type</label>
                    <select name="type" className="form-input">
                      <option>Service Agreement</option><option>Consulting Agreement</option><option>NDA</option><option>Retainer Agreement</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Template Body (use {'{{placeholder}}'} for fields)</label>
                  <textarea name="body" className="form-input font-mono text-xs" rows={12} defaultValue={SAMPLE_TEMPLATE} />
                  <p className="text-xs text-gray-400 mt-1">Supported: {'{{date}}'}, {'{{our_name}}'}, {'{{client_name}}'}, {'{{client_address}}'}, and any custom field you add during generate.</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">{submitting ? 'Saving...' : 'Create Template'}</button>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Edit Template</h3>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="form-label">Template Name</label><input name="name" className="form-input" required defaultValue={editing.name} /></div>
                  <div><label className="form-label">Type</label>
                    <select name="type" className="form-input" defaultValue={editing.type}>
                      <option>Service Agreement</option><option>Consulting Agreement</option><option>NDA</option><option>Retainer Agreement</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Template Body</label>
                  <textarea name="body" className="form-input font-mono text-xs" rows={12} defaultValue={editing.body} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">{submitting ? 'Saving...' : 'Update'}</button>
                  <button type="button" onClick={() => setEditing(null)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGenerateModal && genTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Generate: {genTemplate.name}</h3>
              <button onClick={() => setShowGenerateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Client</label>
                  <select value={genClient} onChange={(e) => onClientChange(e.target.value)} className="form-input">
                    <option value="">Select client</option>
                    {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Our Name</label>
                  <input value={fields.our_name || ''} onChange={(e) => { const n = { ...fields, our_name: e.target.value }; setFields(n); generatePreview(clients.find((x:any)=>x.id===genClient), n) }} className="form-input" />
                </div>
              </div>
              <div>
                <label className="form-label">Client Address</label>
                <input value={fields.client_address || ''} onChange={(e) => { const n = { ...fields, client_address: e.target.value }; setFields(n); generatePreview(clients.find((x:any)=>x.id===genClient), n) }} className="form-input" />
              </div>
              <div>
                <label className="form-label">Scope of Services</label>
                <input value={fields.scope_of_services || ''} onChange={(e) => { const n = { ...fields, scope_of_services: e.target.value }; setFields(n); generatePreview(clients.find((x:any)=>x.id===genClient), n) }} className="form-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="form-label">Start Date</label><input value={fields.start_date || ''} onChange={(e) => { const n = { ...fields, start_date: e.target.value }; setFields(n); generatePreview(clients.find((x:any)=>x.id===genClient), n) }} className="form-input" /></div>
                <div><label className="form-label">End Date</label><input value={fields.end_date || ''} onChange={(e) => { const n = { ...fields, end_date: e.target.value }; setFields(n); generatePreview(clients.find((x:any)=>x.id===genClient), n) }} className="form-input" /></div>
              </div>

              {preview && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Preview</p>
                  <pre className="bg-gray-50 rounded-xl p-4 text-xs whitespace-pre-wrap max-h-72 overflow-auto border border-gray-100">{preview}</pre>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={download} disabled={!preview} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"><Download size={16} />Download</button>
                <button onClick={() => setShowGenerateModal(false)} className="btn-secondary flex-1">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
