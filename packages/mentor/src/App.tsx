import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Startups from './pages/Startups'
import Sessions from './pages/Sessions'

export default function App() {
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlToken = urlParams.get('token')
    if (urlToken) {
      localStorage.setItem('mentor_token', urlToken)
      setToken(urlToken)
      window.history.replaceState({}, '', '/')
    } else {
      setToken(localStorage.getItem('mentor_token'))
    }
    setReady(true)
  }, [])

  if (!ready) return <div className="min-h-screen bg-slate-900" />

  if (!token) {
    window.location.href = 'http://localhost:5173/'
    return null
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50">
        <aside className="w-64 bg-slate-900 text-white flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-sm">SG</div>
              <span className="font-bold text-lg">Mentor Portal</span>
            </div>
          </div>
          <nav className="p-3 space-y-1 flex-1">
            <a href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">Dashboard</a>
            <a href="/startups" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">My Startups</a>
            <a href="/sessions" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">Sessions</a>
          </nav>
          <div className="p-3 border-t border-slate-700">
            <button onClick={() => { localStorage.removeItem('mentor_token'); setToken(null) }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white w-full">Logout</button>
          </div>
        </aside>
        <main className="flex-1 overflow-auto">
          <header className="bg-white border-b border-gray-200 px-6 py-3"><h1 className="text-lg font-semibold text-gray-800">Mentor Portal</h1></header>
          <div className="p-6">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/startups" element={<Startups />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}
