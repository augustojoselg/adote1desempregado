import { create } from 'zustand'
import { api } from './api'

export const useStore = create((set, get) => ({
  currentUser: null,
  authChecked: false,
  authConfig: { provider: null, identityReady: false, canRegisterCompany: false },
  users: [],
  elos: [],
  jobs: [],
  stats: { mentors: 0, professionals: 0, companies: 0, jobs: 0, recolocados: 0 },
  error: null,

  // Restore the server-managed HttpOnly session on app load.
  restoreSession: async () => {
    try {
      const authConfig = await api.authConfig()
      set({ authConfig })
      const { user } = await api.me()
      set({ currentUser: user, authChecked: true })
    } catch (error) {
      set({ currentUser: null, authChecked: true, error: error.message })
    }
  },

  // signup requires explicit consent — enforced again here as a safety net,
  // even though the backend also rejects consent !== true.
  signup: async ({ name, role, city, bio, linkedin, consent }) => {
    if (!consent) throw new Error('É necessário aceitar a Política de Privacidade para se cadastrar.')
    const { user } = await api.signup({ name, role, city, bio, linkedin, consent })
    set({ currentUser: user })
    return user
  },

  logout: async () => {
    try {
      await api.logout()
    } catch (error) {
      set({ error: error.message })
      return
    }
    set({ currentUser: null, users: [], elos: [], jobs: [], authConfig: { ...get().authConfig, identityReady: false } })
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
    set({ currentUser: null, users: [], elos: [], jobs: [], authConfig: { ...get().authConfig, identityReady: false } })
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
