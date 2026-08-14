import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Mail, Shield, ArrowRight, CheckCircle, Sparkles } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('founder_token')
    if (token) {
      router.push('/dashboard')
    }
  }, [router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Login failed'); return }
      localStorage.setItem('founder_token', data.accessToken)
      window.location.href = '/dashboard'
    } catch (e) { setError('Network error') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-xl">SG</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Founder Portal</h1>
            <p className="text-indigo-200 text-sm">Sign in to access your startup</p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 text-red-200 rounded-lg text-sm">{error}</div>}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-indigo-200 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="founder@startupgo.local"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/15 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-indigo-200 mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/15 transition-all"
                required
              />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:-translate-y-0.5">
              Sign In
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-indigo-300 text-center mb-2">Demo credentials</p>
            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
              <p className="text-xs font-medium text-white">Founder</p>
              <p className="text-[10px] text-indigo-300">founder@startupgo.local / founderpass</p>
            </div>
          </div>
        </div>

        <p className="text-center text-indigo-400/60 text-xs mt-6">Secure workspace</p>
      </div>
    </div>
  )
}
