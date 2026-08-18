import { create } from 'zustand'

const STORAGE_KEY = 'adote-desempregado-data'

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

const initialState = loadFromStorage() || {
  currentUser: null,
  users: [],
  elos: [],
  jobs: [],
}

export const useStore = create((set, get) => ({
  ...initialState,

  setCurrentUser: (user) => {
    set({ currentUser: user })
    persistState(get())
  },

  createUser: (name, role) => {
    const user = {
      id: Date.now().toString(),
      name,
      role,
      bio: '',
      city: '',
      linkedin: '',
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ users: [...state.users, user], currentUser: user }))
    persistState(get())
    return user
  },

  updateUser: (updates) => {
    set((state) => ({
      currentUser: { ...state.currentUser, ...updates },
      users: state.users.map((u) => (u.id === state.currentUser.id ? { ...u, ...updates } : u)),
    }))
    persistState(get())
  },

  createElo: (fromUserId, toUserId) => {
    const state = get()
    const exists = state.elos.some(
      (e) => (e.fromUserId === fromUserId && e.toUserId === toUserId) ||
             (e.fromUserId === toUserId && e.toUserId === fromUserId)
    )
    if (exists) return null

    const elo = {
      id: Date.now().toString(),
      fromUserId,
      toUserId,
      status: 'Combinado',
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ elos: [...state.elos, elo] }))
    persistState(get())
    return elo
  },

  updateEloStatus: (eloId, status) => {
    set((state) => ({
      elos: state.elos.map((e) => (e.id === eloId ? { ...e, status } : e)),
    }))
    persistState(get())
  },

  postJob: (company, title, location, link) => {
    const job = {
      id: Date.now().toString(),
      company,
      title,
      location,
      link,
      postedBy: get().currentUser.id,
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ jobs: [...state.jobs, job] }))
    persistState(get())
    return job
  },

  getStats: () => {
    const state = get()
    const mentors = state.users.filter((u) => u.role === 'Mentor').length
    const professionals = state.users.filter((u) => u.role === 'Profissional').length
    const totalJobs = state.jobs.length
    const recolocados = state.elos.filter((e) => e.status === 'Recolocado').length
    return { mentors, professionals, totalJobs, recolocados }
  },
}))

function persistState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    currentUser: state.currentUser,
    users: state.users,
    elos: state.elos,
    jobs: state.jobs,
  }))
}
