import { create } from 'zustand'
import { api, getToken, setToken } from './api'

export const useStore = create((set, get) => ({
  currentUser: null,
  authChecked: false,
  users: [],
  elos: [],
  jobs: [],
  stats: { mentors: 0, professionals: 0, companies: 0, jobs: 0, recolocados: 0 },
  error: null,

  // Called once on app load — if we have a token, confirm it's still valid.
  restoreSession: async () => {
    const token = getToken()
    if (!token) {
      set({ authChecked: true })
      return
    }
    try {
      const { user } = await api.me()
      set({ currentUser: user, authChecked: true })
    } catch {
      setToken(null)
      set({ currentUser: null, authChecked: true })
    }
  },

  // signup requires explicit consent — enforced again here as a safety net,
  // even though the backend also rejects consent !== true.
  signup: async ({ name, role, city, bio, linkedin, consent }) => {
    if (!consent) throw new Error('É necessário aceitar a Política de Privacidade para se cadastrar.')
    const { user, token } = await api.signup({ name, role, city, bio, linkedin, consent })
    setToken(token)
    set({ currentUser: user })
    return user
  },

  logout: () => {
    setToken(null)
    set({ currentUser: null, users: [], elos: [], jobs: [] })
  },

  updateProfile: async (updates) => {
    const { user } = await api.updateAccount(updates)
    set({ currentUser: user })
    return user
  },

  // Right to data portability — downloads everything we hold as a JSON file.
  exportMyData: async () => {
    const res = await api.exportAccount()
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'meus-dados-adote-um-desempregado.json'
    a.click()
    URL.revokeObjectURL(url)
  },

  // Right to erasure — anonymizes the account server-side and logs the user out.
  deleteAccount: async () => {
    await api.deleteAccount()
    setToken(null)
    set({ currentUser: null, users: [], elos: [], jobs: [] })
  },

  loadUsers: async () => {
    const { users } = await api.listUsers()
    set({ users })
  },

  loadStats: async () => {
    const stats = await api.getStats()
    set({ stats })
  },

  createElo: async (targetUserId) => {
    const { elo } = await api.createElo(targetUserId)
    await get().loadMyElos()
    return elo
  },

  loadMyElos: async () => {
    const { elos } = await api.myElos()
    set({ elos })
  },

  updateEloStatus: async (eloId, status) => {
    await api.updateEloStatus(eloId, status)
    await get().loadMyElos()
  },

  loadJobs: async () => {
    const { jobs } = await api.listJobs()
    set({ jobs })
  },

  postJob: async (payload) => {
    const { job } = await api.postJob(payload)
    await get().loadJobs()
    return job
  },
}))
