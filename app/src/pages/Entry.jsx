import { useState } from 'react'
import { useStore } from '../store'
import EloIcon from '../components/EloIcon'
import './Entry.css'

const ROLES = [
  { id: 'Mentor', icon: '🤝', label: 'Mentor', desc: 'Quem adota e ajuda' },
  { id: 'Profissional', icon: '👤', label: 'Profissional', desc: 'Quem procura oportunidade' },
  { id: 'Empresa', icon: '🏢', label: 'Empresa', desc: 'Quem fortalece a corrente' },
]

export default function Entry() {
  const [name, setName] = useState('')
  const [selectedRole, setSelectedRole] = useState(null)
  const [error, setError] = useState('')
  const { createUser } = useStore()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Por favor, digite seu nome')
      return
    }
    if (!selectedRole) {
      setError('Escolha seu papel na corrente')
      return
    }

    createUser(name.trim(), selectedRole)
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

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-submit">
            Entrar na corrente
          </button>

          <p className="entry-privacy">
            ⓘ Seu perfil será visível para outras pessoas da rede. Leia nossos <a href="#">termos de privacidade</a>.
          </p>
        </form>
      </div>
    </div>
  )
}
