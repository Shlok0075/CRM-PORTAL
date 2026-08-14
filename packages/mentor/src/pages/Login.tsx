import { useState } from 'react'

export default function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Login failed'); return }
      onLogin(data.accessToken)
    } catch (e) { setError('Network error') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4"><span className="text-indigo-600 font-bold text-lg">SG</span></div>
          <h1 className="text-2xl font-bold text-gray-900">Mentor Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to access your mentor dashboard</p>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="mentor@startupgo.local" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="mentorpass" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">Sign In</button>
        </form>
        <p className="text-xs text-gray-400 mt-4 text-center">Default: mentor@startupgo.local / mentorpass</p>
      </div>
    </div>
  )
}
