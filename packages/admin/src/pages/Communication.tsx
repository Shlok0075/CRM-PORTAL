import { useEffect, useState } from 'react'
import { MessageSquare, Send, Mail, MessageCircle, Smartphone, X, Clock, CheckCheck, RefreshCw, Plus, Trash2 } from 'lucide-react'
import { apiFetch } from '../lib/api'

export default function Communication() {
  const [messages, setMessages] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'messages' | 'templates'>('messages')
  const [showSendModal, setShowSendModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [msgData, tplData, cliData] = await Promise.all([
        apiFetch('/messages/logs').catch(() => ({ data: [] })),
        apiFetch('/communication/templates').catch(() => ({ data: [] })),
        apiFetch('/clients?limit=100').catch(() => ({ data: [] })),
      ])
      setMessages(Array.isArray(msgData?.data) ? msgData.data : Array.isArray(msgData) ? msgData : [])
      setTemplates(Array.isArray(tplData?.data) ? tplData.data : Array.isArray(tplData) ? tplData : [])
      setClients(Array.isArray(cliData?.data) ? cliData.data : Array.isArray(cliData) ? cliData : [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      const channel = formData.get('channel') as string
      await apiFetch('/communication/send', {
        method: 'POST',
        body: JSON.stringify({
          channel,
          clientIds: [formData.get('recipient') as string].filter(Boolean),
          templateId: formData.get('templateId') as string || undefined,
          body: formData.get('body') as string || undefined,
        }),
      })
      setShowSendModal(false)
      loadData()
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to send message')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      await apiFetch('/communication/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.get('name') as string,
          channel: formData.get('channel') as string,
          body: formData.get('body') as string,
        }),
      })
      setShowTemplateModal(false)
      loadData()
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to create template')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return
    try {
      await apiFetch(`/communication/templates/${id}`, { method: 'DELETE' })
      loadData()
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to delete template')
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return <MessageCircle className="text-green-600" size={16} />
      case 'email': return <Mail className="text-blue-600" size={16} />
      case 'sms': return <Smartphone className="text-amber-600" size={16} />
      default: return <MessageSquare className="text-gray-600" size={16} />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-50 text-emerald-700'
      case 'sent': return 'bg-blue-50 text-blue-700'
      case 'failed': return 'bg-red-50 text-red-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Communication Engine</h2>
          <p className="text-sm text-gray-500 mt-1">WhatsApp, Email & SMS notifications</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadData} className="btn-secondary flex items-center gap-2"><RefreshCw size={16} />Refresh</button>
          <button onClick={() => setShowSendModal(true)} className="btn-primary flex items-center gap-2">
            <Send size={16} />
            Send Message
          </button>
          <button onClick={() => setShowTemplateModal(true)} className="btn-secondary flex items-center gap-2">
            <Plus size={16} />
            New Template
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-50"><MessageCircle className="text-green-600" size={22} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{messages.filter(m => m.channel === 'whatsapp').length}</p>
            <p className="text-sm text-gray-500">WhatsApp Sent</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50"><Mail className="text-blue-600" size={22} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{messages.filter(m => m.channel === 'email').length}</p>
            <p className="text-sm text-gray-500">Emails Sent</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50"><Smartphone className="text-amber-600" size={22} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{messages.filter(m => m.channel === 'sms').length}</p>
            <p className="text-sm text-gray-500">SMS Sent</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex border-b border-gray-100">
          {[
            { key: 'messages', label: 'Message Log', icon: Clock },
            { key: 'templates', label: 'Templates', icon: MessageSquare },
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
          ) : activeTab === 'messages' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Channel</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipient</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Template</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {messages.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No messages sent yet.</td></tr>
                  ) : messages.map((msg: any) => (
                    <tr key={msg.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(msg.channel)}
                          <span className="text-sm text-gray-700 capitalize">{msg.channel}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{msg.recipient || msg.client?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{msg.template?.name || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(msg.status)}`}>
                          {msg.status === 'delivered' && <CheckCheck size={12} />}
                          {msg.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{msg.sentAt ? new Date(msg.sentAt).toLocaleString('en-IN') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.length === 0 ? (
                <div className="col-span-2 text-center text-gray-400 text-sm py-4">No templates yet.</div>
              ) : templates.map((template: any) => (
                <div key={template.id} className="p-5 bg-gray-50 rounded-xl hover:bg-gray-100/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getChannelIcon(template.channel)}
                      <h4 className="font-semibold text-sm text-gray-900">{template.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 capitalize">{template.channel}</span>
                      <button onClick={() => handleDeleteTemplate(template.id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{template.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Send Message</h3>
              <button onClick={() => setShowSendModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSend}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="form-label">Channel</label>
                  <select name="channel" className="form-input">
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Recipient</label>
                  <select name="recipient" className="form-input">
                    {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Template</label>
                  <select name="templateId" className="form-input">
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Message</label>
                  <textarea name="body" className="form-input" rows={4} placeholder="Enter your message..."></textarea>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">{submitting ? 'Sending...' : 'Send Message'}</button>
                  <button type="button" onClick={() => setShowSendModal(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            </form>
           </div>
         </div>
       )}

       {showTemplateModal && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full">
             <div className="p-6 border-b border-gray-100 flex items-center justify-between">
               <h3 className="text-xl font-bold text-gray-900">Create Template</h3>
               <button onClick={() => setShowTemplateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
             </div>
             <form onSubmit={handleCreateTemplate}>
               <div className="p-6 space-y-4">
                 <div>
                   <label className="form-label">Template Name</label>
                   <input name="name" type="text" className="form-input" placeholder="e.g., Welcome Message" required />
                 </div>
                 <div>
                   <label className="form-label">Channel</label>
                   <select name="channel" className="form-input">
                     <option value="whatsapp">WhatsApp</option>
                     <option value="email">Email</option>
                     <option value="sms">SMS</option>
                   </select>
                 </div>
                 <div>
                   <label className="form-label">Body</label>
                   <textarea name="body" className="form-input" rows={4} placeholder="Template content..." required></textarea>
                 </div>
                 <div className="flex gap-3 pt-2">
                   <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">{submitting ? 'Creating...' : 'Create Template'}</button>
                   <button type="button" onClick={() => setShowTemplateModal(false)} className="btn-secondary flex-1">Cancel</button>
                 </div>
               </div>
             </form>
           </div>
         </div>
       )}
     </div>
   )
 }
