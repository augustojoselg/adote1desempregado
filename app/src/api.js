const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const TOKEN_KEY = 'adote-auth-token'
localStorage.removeItem(TOKEN_KEY)

// Clear obsolete browser tokens; sessions now use an HttpOnly cookie.
sessionStorage.removeItem(TOKEN_KEY)
async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  // Only successful exports are downloads.
  if (res.ok && res.headers.get('content-disposition')) return res

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data.error || 'Algo deu errado. Tente novamente.'
    throw new Error(message)
  }
  return data
}

export const api = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload, auth: false }),
  logout: () => request('/auth/logout', { method: 'POST' }),
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
