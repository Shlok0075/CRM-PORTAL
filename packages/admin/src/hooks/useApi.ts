import { useState, useEffect } from 'react'
import { API_BASE } from '../lib/api'

function getToken(): string | null {
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

function clearToken() {
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
}

export default function useApi(url: string | null, options: any = {}) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    if (!url) {
      setData(null)
      setLoading(false)
      return
    }
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}${url}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        ...options,
      })
      if (res.status === 401) {
        clearToken()
        window.location.href = '/login'
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (res.status === 204) { setData(null); return }
      const json = await res.json()
      setData(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [url])

  const mutate = async (urlOrFn: string | Function, opts?: any) => {
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      let res: Response
      if (typeof urlOrFn === 'function') {
        res = await urlOrFn(token)
      } else {
        res = await fetch(`${API_BASE}${urlOrFn}`, {
          ...opts,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts?.headers },
        })
      }
      if (res.status === 401) {
        clearToken()
        window.location.href = '/login'
        return null
      }
      if (!res.ok) {
        const errText = await res.text()
        let errData: any = {}
        try { errData = JSON.parse(errText) } catch {}
        const err = new Error(errData?.message || `HTTP ${res.status}`) as any
        err.status = res.status
        err.data = errData
        throw err
      }
      if (res.status === 204) { setData(null); return null }
      const json = await res.json()
      setData(json)
      return json
    } catch (e: any) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, mutate, refetch: fetchData }
}
