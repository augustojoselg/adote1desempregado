import { useStore } from '../store'
import EloIcon from './EloIcon'
import './EloTracker.css'

const STATUSES = ['Combinado', 'Em contato', 'Entrevistas', 'Recolocado']

export default function EloTracker() {
  const { elos, currentUser, updateEloStatus } = useStore()

  const canAdvance = (elo) => {
    const statusIndex = STATUSES.indexOf(elo.status)
    return statusIndex < STATUSES.length - 1
  }

  const handleAdvance = async (eloId, currentStatus) => {
    const statusIndex = STATUSES.indexOf(currentStatus)
    if (statusIndex < STATUSES.length - 1) {
      await updateEloStatus(eloId, STATUSES[statusIndex + 1])
    }
  }

  return (
    <div className="elotracker-section">
      <div className="elotracker-header">
        <h2>Meus Elos</h2>
        <p>Acompanhe o progresso de suas conexões</p>
      </div>

      {elos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔗</div>
          <h3>Ainda não há elos ativos</h3>
          <p>Vá ao diretório e crie sua primeira conexão. Cada elo fortalece a corrente.</p>
        </div>
      ) : (
        <div className="elos-list">
          {elos.map((elo) => {
            const isMentor = elo.mentor_id === currentUser.id
            const otherName = isMentor ? elo.professional_name : elo.mentor_name
            const otherRole = isMentor ? 'Profissional' : 'Mentor'
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
                    <div className="user-avatar-small">{otherName?.[0]}</div>
                    <div className="user-label-small">{otherRole}</div>
                  </div>
                </div>

                <div className="elo-user-info">
                  <h4>{otherName}</h4>
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
                    ✨ {isMentor
                      ? `Que alegria! ${otherName} foi recolocado!`
                      : `Parabéns! Você foi recolocado com apoio de ${otherName}!`}
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
