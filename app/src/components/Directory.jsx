import { useState } from 'react'
import { useStore } from '../store'
import EloIcon from './EloIcon'
import './Directory.css'

export default function Directory() {
  const { users, currentUser, createElo } = useStore()
  const [filter, setFilter] = useState('all')

  const filteredUsers = users.filter((u) => {
    if (u.id === currentUser.id) return false
    if (filter === 'all') return true
    if (filter === 'mentor') return u.role === 'Mentor'
    if (filter === 'profissional') return u.role === 'Profissional'
    return false
  })

  const handleConnect = (toUserId) => {
    const elo = createElo(currentUser.id, toUserId)
    if (!elo) {
      alert('Você já tem uma conexão com essa pessoa!')
    }
  }

  const isMentor = currentUser.role === 'Mentor'
  const isProfissional = currentUser.role === 'Profissional'

  return (
    <div className="directory-section">
      <div className="directory-header">
        <h2>Diretório</h2>
        {filteredUsers.length > 0 && (
          <div className="filter-tabs">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todos ({filteredUsers.length})
            </button>
            {isMentor && (
              <button
                className={`filter-btn ${filter === 'profissional' ? 'active' : ''}`}
                onClick={() => setFilter('profissional')}
              >
                Profissionais
              </button>
            )}
            {isProfissional && (
              <button
                className={`filter-btn ${filter === 'mentor' ? 'active' : ''}`}
                onClick={() => setFilter('mentor')}
              >
                Mentores
              </button>
            )}
          </div>
        )}
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Ainda não há {isMentor ? 'profissionais' : 'mentores'} cadastrados</h3>
          <p>Convide seus amigos a entrarem na corrente e fortalecer esse movimento.</p>
        </div>
      ) : (
        <div className="users-grid">
          {filteredUsers.map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-header">
                <div className="user-avatar">{user.name[0].toUpperCase()}</div>
                <div className="user-info">
                  <h3>{user.name}</h3>
                  <span className="user-badge">{user.role}</span>
                </div>
              </div>
              {user.bio && <p className="user-bio">{user.bio}</p>}
              <div className="user-meta">
                {user.city && <span>📍 {user.city}</span>}
                {user.linkedin && <span>in {user.linkedin}</span>}
              </div>
              <button
                className="btn-connect"
                onClick={() => handleConnect(user.id)}
              >
                <EloIcon size={16} />
                {isMentor ? 'Adotar' : isProfissional ? 'Pedir apoio' : 'Conectar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
