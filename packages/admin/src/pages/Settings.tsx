import { useState, useEffect } from 'react'
import { Building2, Users, Shield, Globe, Save, CheckCircle2, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react'
import useApi from '../hooks/useApi'
import { apiFetch } from '../lib/api'

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'firm' | 'users' | 'permissions' | 'integrations'>('firm')
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [roles, setRoles] = useState([
    { name: 'Admin', permissions: ['read', 'write', 'delete', 'manage_users'], active: true },
    { name: 'Partner', permissions: ['read', 'write', 'delete'], active: true },
    { name: 'Employee', permissions: ['read', 'write'], active: true },
    { name: 'Client', permissions: ['read'], active: true },
  ])
  const [integrations, setIntegrations] = useState([
    { name: 'Email (SMTP)', description: 'Send emails via SMTP', enabled: true, icon: '📧' },
    { name: 'WhatsApp Business', description: 'Send WhatsApp notifications', enabled: false, icon: '💬' },
    { name: 'SMS Gateway', description: 'Send SMS notifications', enabled: false, icon: '📱' },
    { name: 'Google Calendar', description: 'Sync tasks with Google Calendar', enabled: false, icon: '📅' },
  ])

  const { data: users, loading: usersLoading, refetch: refetchUsers } = useApi('/employees')

  useEffect(() => {
    apiFetch('/users/me').then((data: any) => {
      setUser(data)
    }).catch((err: any) => {
      if (err.status === 401) {
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
        window.location.href = '/login'
      }
    })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: formData.get('name') as string || undefined,
          email: formData.get('email') as string,
          phone: formData.get('phone') as string || undefined,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      if (err.status === 404) {
        alert('Profile updates are not available yet. Please contact your administrator.')
      } else {
        alert(err.message || 'Failed to save')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your firm configuration</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium">
            <CheckCircle2 size={16} />
            Settings saved successfully
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
          <nav className="space-y-1">
            {[
              { key: 'firm', label: 'Firm Details', icon: Building2 },
              { key: 'users', label: 'User Management', icon: Users },
              { key: 'permissions', label: 'Roles & Permissions', icon: Shield },
              { key: 'integrations', label: 'Integrations', icon: Globe },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.key ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {activeTab === 'firm' && (
            <form onSubmit={handleSave} className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900">Firm Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Firm Name</label>
                  <input name="name" type="text" className="form-input" placeholder="Your Firm Name" defaultValue={user?.name || ''} />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input name="email" type="email" className="form-input" placeholder="contact@firm.com" defaultValue={user?.email || ''} />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input name="phone" type="tel" className="form-input" placeholder="+91 22 1234 5678" defaultValue={user?.phone || ''} />
                </div>
                <div>
                  <label className="form-label">Address</label>
                  <input name="address" type="text" className="form-input" placeholder="Office address" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2"><Save size={16} /> {submitting ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">User Management</h3>
                <button onClick={refetchUsers} className="btn-secondary flex items-center gap-2"><RefreshCw size={16} />Refresh</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Designation</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {usersLoading ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center"><div className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" /></td></tr>
                    ) : !users || users.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">No users found.</td></tr>
                    ) : users.map((user: any) => (
                      <tr key={user.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.designation || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{user.isActive ? 'Active' : 'Inactive'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900">Roles & Permissions</h3>
              <div className="space-y-4">
                {roles.map((role, idx) => (
                  <div key={role.name} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900">{role.name}</h4>
                      <button onClick={() => setRoles(roles.map((r, i) => i === idx ? { ...r, active: !r.active } : r))} className="text-gray-400 hover:text-emerald-600 transition-colors">
                        {role.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map(perm => (
                        <span key={perm} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium capitalize">{perm.replace('_', ' ')}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }} className="btn-primary flex items-center gap-2"><Save size={16} /> Save Roles</button>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900">Integrations</h3>
              <div className="space-y-4">
                {integrations.map((int, idx) => (
                  <div key={int.name} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{int.icon}</span>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{int.name}</h4>
                        <p className="text-xs text-gray-500">{int.description}</p>
                      </div>
                    </div>
                    <button onClick={() => setIntegrations(integrations.map((i, iIdx) => iIdx === idx ? { ...i, enabled: !i.enabled } : i))} className="text-gray-400 hover:text-emerald-600 transition-colors">
                      {int.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }} className="btn-primary flex items-center gap-2"><Save size={16} /> Save Integrations</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
