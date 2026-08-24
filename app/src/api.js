const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const TOKEN_KEY = 'adote-auth-token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  // Handle export (file download) specially — caller deals with it.
  if (res.headers.get('content-disposition')) return res

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data.error || 'Algo deu errado. Tente novamente.'
    throw new Error(message)
  }
  return data
}

export const api = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),

  updateAccount: (payload) => request('/account', { method: 'PATCH', body: payload }),
  exportAccount: () => request('/account/export'),
  deleteAccount: () => request('/account', { method: 'DELETE' }),

  listUsers: (role) => request(`/users${role ? `?role=${encodeURIComponent(role)}` : ''}`),
  getStats: () => request('/users/stats', { auth: false }),

  createElo: (targetUserId) => request('/elos', { method: 'POST', body: { targetUserId } }),
  myElos: () => request('/elos/mine'),
  updateEloStatus: (eloId, status) => request(`/elos/${eloId}/status`, { method: 'PATCH', body: { status } }),

  listJobs: () => request('/jobs'),
  postJob: (payload) => request('/jobs', { method: 'POST', body: payload }),
}
