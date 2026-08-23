import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, Shield, AlertCircle, Smartphone } from 'lucide-react'
import { apiFetch } from '../lib/api'

type LoginTab = 'admin' | 'employee' | 'client'

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [activeTab, setActiveTab] = useState<LoginTab>('admin')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const form = e.target as HTMLFormElement
      const email = (form.elements.namedItem('email') as HTMLInputElement).value
      const password = (form.elements.namedItem('password') as HTMLInputElement).value
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      storeToken(data)
    } catch (err: any) {
      setError(err.data?.message || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpLoading(true)
    setError(null)
    try {
      const form = e.target as HTMLFormElement
      const email = (form.elements.namedItem('email') as HTMLInputElement).value
      await apiFetch('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setOtpSent(true)
    } catch (err: any) {
      setError(err.data?.message || err.message || 'Failed to send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const form = e.target as HTMLFormElement
      const email = (form.elements.namedItem('email') as HTMLInputElement).value
      const code = (form.elements.namedItem('code') as HTMLInputElement).value
      const data = await apiFetch('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      })
      storeToken(data)
    } catch (err: any) {
      setError(err.data?.message || err.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const storeToken = (data: any) => {
    const token = data.accessToken
    const roleType = data.roleType || 'admin'
    if (rememberMe) {
      localStorage.setItem('token', token)
      localStorage.setItem('roleType', roleType)
      localStorage.setItem('role', data.role || 'member')
      localStorage.setItem('user', JSON.stringify(data.user || {}))
    } else {
      sessionStorage.setItem('token', token)
      sessionStorage.setItem('roleType', roleType)
      sessionStorage.setItem('role', data.role || 'member')
      sessionStorage.setItem('user', JSON.stringify(data.user || {}))
    }
    onLogin()
  }

  const tabs: { key: LoginTab; label: string; icon: any }[] = [
    { key: 'admin', label: 'Admin', icon: Shield },
    { key: 'employee', label: 'Employee', icon: Mail },
    { key: 'client', label: 'Client Portal', icon: Smartphone },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <img src="/logo.jpeg" alt="StartUp Go Ventures CRM Logo" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4 shadow-lg shadow-emerald-500/30" />
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">StartUp Go Ventures CRM</h1>
            <p className="text-slate-300 text-sm">Practice Management Portal</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-300 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex rounded-xl bg-white/5 p-1 mb-6 border border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setError(null); setOtpSent(false) }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.key ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {(() => { const Icon = tab.icon; return <Icon size={14} /> })()}
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'admin' && (
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input name="email" type="email" defaultValue="admin@ca-firm.local" className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/15 transition-all" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input name="password" type={showPassword ? 'text' : 'password'} defaultValue="adminpass" className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/15 transition-all" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-200">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded border-slate-600 bg-white/10 text-emerald-500 focus:ring-emerald-400" /><span className="text-xs text-slate-300">Remember me</span></label>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-blue-700 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50">{loading ? 'Signing in...' : 'Sign In as Admin'}</button>
              <p className="text-[10px] text-slate-400 text-center">Demo: admin@ca-firm.local / adminpass</p>
            </form>
          )}

          {activeTab === 'employee' && (
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input name="email" type="email" className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/15 transition-all" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input name="password" type={showPassword ? 'text' : 'password'} className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/15 transition-all" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-200">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded border-slate-600 bg-white/10 text-emerald-500 focus:ring-emerald-400" /><span className="text-xs text-slate-300">Remember me</span></label>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50">{loading ? 'Signing in...' : 'Sign In as Employee'}</button>
              <p className="text-[10px] text-slate-400 text-center">Use your employee credentials</p>
            </form>
          )}

          {activeTab === 'client' && (
            <>
              {!otpSent ? (
                <form onSubmit={handleOtpRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Registered Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input name="email" type="email" className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/15 transition-all" required />
                    </div>
                  </div>
                  <button type="submit" disabled={otpLoading} className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-xl text-sm font-semibold hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50">{otpLoading ? 'Sending OTP...' : 'Send OTP'}</button>
                  <p className="text-[10px] text-slate-400 text-center">OTP will be sent to your registered email</p>
                </form>
              ) : (
                <form onSubmit={handleOtpVerify} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Enter OTP</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input name="code" type="text" placeholder="123456" className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/15 transition-all" required />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Demo OTP: 123456</p>
                  </div>
                  <input name="email" type="hidden" />
                  <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-xl text-sm font-semibold hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50">{loading ? 'Verifying...' : 'Verify & Login'}</button>
                  <button type="button" onClick={() => setOtpSent(false)} className="w-full text-xs text-slate-300 hover:text-white">Back to email</button>
                </form>
              )}
            </>
          )}

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-emerald-400" />
              <p className="text-xs text-slate-300 text-center">Secure Practice Management</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-lg p-2 text-center border border-white/10">
                <p className="text-xs font-medium text-white">Admin</p>
                <p className="text-[10px] text-slate-400">admin@ca-firm.local</p>
                <p className="text-[10px] text-slate-500">password: adminpass</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center border border-white/10">
                <p className="text-xs font-medium text-white">Employee</p>
                <p className="text-[10px] text-slate-400">employee@ca-firm.local</p>
                <p className="text-[10px] text-slate-500">password: employeepass</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500/60 text-xs mt-6">StartUp Go Ventures CRM v1.0</p>
      </div>
    </div>
  )
}
