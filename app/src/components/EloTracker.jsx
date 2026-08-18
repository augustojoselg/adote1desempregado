import { useStore } from '../store'
import EloIcon from './EloIcon'
import './EloTracker.css'

const STATUSES = ['Combinado', 'Em contato', 'Entrevistas', 'Recolocado']

export default function EloTracker() {
  const { elos, users, currentUser, updateEloStatus } = useStore()

  const myElos = elos.filter(
    (e) => e.fromUserId === currentUser.id || e.toUserId === currentUser.id
  )

  const getOtherUser = (elo) => {
    const otherId = elo.fromUserId === currentUser.id ? elo.toUserId : elo.fromUserId
    return users.find((u) => u.id === otherId)
  }

  const canAdvance = (elo) => {
    const statusIndex = STATUSES.indexOf(elo.status)
    return statusIndex < STATUSES.length - 1
  }

  const handleAdvance = (eloId, currentStatus) => {
    const statusIndex = STATUSES.indexOf(currentStatus)
    if (statusIndex < STATUSES.length - 1) {
      updateEloStatus(eloId, STATUSES[statusIndex + 1])
    }
  }

  return (
    <div className="elotracker-section">
      <div className="elotracker-header">
        <h2>Meus Elos</h2>
        <p>Acompanhe o progresso de suas conexões</p>
      </div>

      {myElos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔗</div>
          <h3>Ainda não há elos ativos</h3>
          <p>Vá ao diretório e crie sua primeira conexão. Cada elo fortalece a corrente.</p>
        </div>
      ) : (
        <div className="elos-list">
          {myElos.map((elo) => {
            const otherUser = getOtherUser(elo)
            if (!otherUser) return null

            const statusIndex = STATUSES.indexOf(elo.status)

            return (
              <div key={elo.id} className="elo-card">
                <div className="elo-connection">
                  <div className="user-block">
                    <div className="user-avatar-small">{currentUser.name[0]}</div>
                    <div className="user-label-small">{currentUser.role}</div>
                  </div>
                  <EloIcon size={32} />
                  <div className="user-block">
                    <div className="user-avatar-small">{otherUser.name[0]}</div>
                    <div className="user-label-small">{otherUser.role}</div>
                  </div>
                </div>

                <div className="elo-user-info">
                  <h4>{otherUser.name}</h4>
                  {otherUser.bio && <p>{otherUser.bio}</p>}
                </div>

                <div className="elo-status-tracker">
                  {STATUSES.map((status, idx) => (
                    <div
                      key={status}
                      className={`status-step ${idx <= statusIndex ? 'active' : ''}`}
                    >
                      <div className="status-dot" />
                      <span className="status-text">{status}</span>
                    </div>
                  ))}
                </div>

                {canAdvance(elo) && (
                  <button
                    className="btn-advance"
                    onClick={() => handleAdvance(elo.id, elo.status)}
                  >
                    Avançar para próxima etapa
                  </button>
                )}

                {elo.status === 'Recolocado' && (
                  <div className="success-message">
                    ✨ {currentUser.role === 'Mentor'
                      ? `Que alegria! ${otherUser.name} foi recolocado!`
                      : `Parabéns! Você foi recolocado com apoio de ${otherUser.name}!`}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
