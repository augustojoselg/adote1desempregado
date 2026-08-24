import { useStore } from '../store'
import './Stats.css'

export default function Stats() {
  const { stats } = useStore()

  const statItems = [
    { label: 'Mentores', value: stats.mentors, icon: '🤝' },
    { label: 'Profissionais', value: stats.professionals, icon: '👤' },
    { label: 'Vagas', value: stats.jobs, icon: '💼' },
    { label: 'Recolocados', value: stats.recolocados, icon: '✨' },
  ]

  return (
    <div className="stats-section">
      <div className="stats-header">
        <h2>Estatísticas em Tempo Real</h2>
        <p>Acompanhe o crescimento da corrente</p>
      </div>

      <div className="stats-grid">
        {statItems.map((item) => (
          <div key={item.label} className="stat-card">
            <div className="stat-icon">{item.icon}</div>
            <div className="stat-value">{item.value}</div>
            <div className="stat-label">{item.label}</div>
          </div>
        ))}
      </div>

      {stats.mentors === 0 && stats.professionals === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🌱</div>
          <h3>Você é o primeiro elo!</h3>
          <p>Convide amigos para começar a corrente. Cada pessoa que entra fortalece toda a rede.</p>
        </div>
      )}
    </div>
  )
}
