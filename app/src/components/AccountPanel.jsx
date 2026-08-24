import { useState } from 'react'
import { useStore } from '../store'
import './AccountPanel.css'

export default function AccountPanel({ onShowPrivacy }) {
  const { currentUser, updateProfile, exportMyData, deleteAccount, logout } = useStore()
  const [bio, setBio] = useState(currentUser?.bio || '')
  const [city, setCity] = useState(currentUser?.city || '')
  const [linkedin, setLinkedin] = useState(currentUser?.linkedin || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await updateProfile({ bio, city, linkedin })
      setMessage('Perfil atualizado!')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    await deleteAccount()
  }

  return (
    <div className="account-panel">
      <h2>Minha conta</h2>

      <form onSubmit={handleSave} className="account-form">
        <div className="form-group">
          <label className="label">Nome</label>
          <input className="input" value={currentUser?.name || ''} disabled />
        </div>
        <div className="form-group">
          <label className="label">Cidade</label>
          <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">Bio</label>
          <textarea className="input" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">LinkedIn</label>
          <input className="input" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
        </div>
        {message && <p className="account-message">{message}</p>}
        <button type="submit" className="btn-submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>

      <div className="account-lgpd">
        <h3>Seus dados</h3>
        <p>Você pode baixar uma cópia de tudo que temos sobre você, ou excluir seu perfil permanentemente.</p>
        <div className="account-lgpd-actions">
          <button type="button" className="btn-outline" onClick={exportMyData}>
            Baixar meus dados
          </button>
          <button type="button" className="link-btn" onClick={onShowPrivacy}>
            Ler Política de Privacidade
          </button>
        </div>

        {!confirmingDelete ? (
          <button type="button" className="btn-danger" onClick={() => setConfirmingDelete(true)}>
            Excluir meu perfil
          </button>
        ) : (
          <div className="delete-confirm">
            <p>Tem certeza? Seus dados pessoais serão anonimizados imediatamente e não podem ser recuperados.</p>
            <div className="account-lgpd-actions">
              <button type="button" className="btn-danger" onClick={handleDelete}>
                Sim, excluir permanentemente
              </button>
              <button type="button" className="btn-outline" onClick={() => setConfirmingDelete(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <button type="button" className="link-btn logout-btn" onClick={logout}>
        Sair
      </button>
    </div>
  )
}
