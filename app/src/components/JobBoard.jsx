import { useState } from 'react'
import { useStore } from '../store'
import './JobBoard.css'

export default function JobBoard() {
  const { jobs, currentUser, postJob } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    company: '',
    title: '',
    location: '',
    link: '',
  })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.company.trim() || !formData.title.trim() || !formData.link.trim()) {
      setError('Preencha empresa, cargo e link')
      return
    }

    try {
      await postJob(formData)
      setFormData({ company: '', title: '', location: '', link: '' })
      setShowForm(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const isCompany = currentUser.role === 'Empresa'

  return (
    <div className="jobboard-section">
      <div className="jobboard-header">
        <div>
          <h2>Vagas Disponíveis</h2>
          <p>{jobs.length} oportunidade{jobs.length !== 1 ? 's' : ''} para a corrente</p>
        </div>
        {isCompany && (
          <button
            className="btn-post-job"
            onClick={() => setShowForm(!showForm)}
          >
            + Publicar vaga
          </button>
        )}
      </div>

      {showForm && isCompany && (
        <form onSubmit={handleSubmit} className="job-form">
          <h3>Nova vaga</h3>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Nome da empresa"
            className="form-input"
            required
          />
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Cargo / Posição"
            className="form-input"
            required
          />
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Localização (ex: São Paulo, SP ou Remoto)"
            className="form-input"
          />
          <input
            type="url"
            name="link"
            value={formData.link}
            onChange={handleChange}
            placeholder="Link para candidatura"
            className="form-input"
            required
          />
          {error && <div className="error-message">{error}</div>}
          <div className="form-actions">
            <button type="submit" className="btn-submit">Publicar</button>
            <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💼</div>
          <h3>Ainda não há vagas publicadas</h3>
          <p>
            {isCompany
              ? 'Publique a primeira vaga e ajude profissionais a encontrar oportunidades!'
              : 'Acompanhe aqui as oportunidades publicadas por empresas parceiras.'}
          </p>
        </div>
      ) : (
        <div className="jobs-list">
          {jobs.map((job) => (
            <div key={job.id} className="job-card">
              <div className="job-header">
                <div className="job-title-block">
                  <h3>{job.title}</h3>
                  <p className="job-company">{job.company}</p>
                </div>
                <a href={job.link} target="_blank" rel="noopener noreferrer" className="btn-apply">
                  Candidatar
                </a>
              </div>
              {job.location && <p className="job-location">📍 {job.location}</p>}
              <p className="job-date">
                Publicado em {new Date(job.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
