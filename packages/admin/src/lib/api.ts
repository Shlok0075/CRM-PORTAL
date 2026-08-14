const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000/api'

function getToken(): string | null {
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

function clearToken() {
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (res.status === 204) return null
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const err = new Error(data?.message || `HTTP ${res.status}`) as any
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export { API_BASE }
