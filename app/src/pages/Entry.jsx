import { useState } from 'react'
import { useStore } from '../store'
import EloIcon from '../components/EloIcon'
import './Entry.css'

const ROLES = [
  { id: 'Mentor', icon: '🤝', label: 'Mentor', desc: 'Quem adota e ajuda' },
  { id: 'Profissional', icon: '👤', label: 'Profissional', desc: 'Quem procura oportunidade' },
  { id: 'Empresa', icon: '🏢', label: 'Empresa', desc: 'Quem fortalece a corrente' },
]

export default function Entry({ onShowPrivacy }) {
  const [name, setName] = useState('')
  const [selectedRole, setSelectedRole] = useState(null)
  const [city, setCity] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) return setError('Por favor, digite seu nome')
    if (!selectedRole) return setError('Escolha seu papel na corrente')
    if (!consent) return setError('É necessário aceitar a Política de Privacidade para se cadastrar')

    setLoading(true)
    try {
      await signup({ name: name.trim(), role: selectedRole, city: city.trim(), consent })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="entry-container">
      <div className="entry-card">
        <div className="entry-header">
          <EloIcon size={64} />
          <h1>Bem-vindo!</h1>
          <p className="entry-subtitle">
            "Quem está empregado pode mudar a vida de quem procura uma oportunidade."
          </p>
        </div>

        <form onSubmit={handleSubmit} className="entry-form">
          <div className="form-group">
            <label htmlFor="name" className="label">Qual é seu nome?</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome"
              className="input"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="city" className="label">Cidade (opcional)</label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: São Paulo, SP"
              className="input"
            />
          </div>

          <div className="form-group">
            <label className="label">Qual é seu papel na corrente?</label>
            <div className="roles-grid">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={`role-btn ${selectedRole === role.id ? 'active' : ''}`}
                >
                  <span className="role-icon">{role.icon}</span>
                  <span className="role-label">{role.label}</span>
                  <span className="role-desc">{role.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="consent-check">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              Li e concordo com a{' '}
              <button type="button" className="link-btn" onClick={onShowPrivacy}>
                Política de Privacidade
              </button>
              . Sei que meu nome, cidade e demais dados do perfil ficarão visíveis para outras
              pessoas da rede, e que posso exportar ou excluir meus dados quando quiser.
            </span>
          </label>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar na corrente'}
          </button>
        </form>
      </div>
    </div>
  )
}
