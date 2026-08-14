const API_BASE = 'http://localhost:4000/api'

export async function mentorApiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('mentor_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

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
