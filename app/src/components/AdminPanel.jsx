import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { useStore } from '../store'

export default function AdminPanel() {
  const { currentUser } = useStore()
  const [users, setUsers] = useState([])
  const [offset, setOffset] = useState(0)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    const result = await api.adminUsers(offset)
    setUsers(result.users)
  }, [offset])
  useEffect(() => { load().catch((error) => setMessage(error.message)) }, [load])
  const act = async (user, action) => {
    const label = action === 'disable' ? 'Suspender o acesso' : action === 'enable' ? 'Restabelecer o acesso' : 'Encerrar a sessão'
    if (!window.confirm(`${label} de ${user.name}?`)) return
    setBusy(true)
    try {
      await api.adminAction(user.id, action)
      await load()
      setMessage('Operação registrada. O próximo login também exige autorização no Microsoft Entra.')
    } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }
  return <section className="account-panel">
    <h2>Administração</h2>
    <p>Revise os participantes e encerre sessões ou suspenda acessos quando necessário.</p>
    {message && <p role="status">{message}</p>}
    <ul>
      {users.map((user) => <li key={user.id}>
        <strong>{user.name}</strong> — {user.role} — {user.account_enabled ? 'Ativo' : 'Suspenso'}
        {user.role === 'Empresa' && (user.company_approved ? ' — Empresa autorizada' : ' — Empresa não autorizada')}
        {user.id !== currentUser.id && <div className="account-lgpd-actions">
          <button type="button" className="btn-outline" disabled={busy} onClick={() => act(user, 'revoke')}>Encerrar sessão</button>
          <button type="button" className="btn-danger" disabled={busy || !user.account_enabled} onClick={() => act(user, 'disable')}>Suspender acesso</button>
          {!user.account_enabled && <button type="button" className="btn-outline" disabled={busy} onClick={() => act(user, 'enable')}>Restabelecer acesso</button>}
        </div>}
      </li>)}
    </ul>
    <div className="account-lgpd-actions">
      <button type="button" className="btn-outline" disabled={offset === 0 || busy} onClick={() => setOffset(Math.max(0, offset - 50))}>Anterior</button>
      <button type="button" className="btn-outline" disabled={users.length < 50 || busy} onClick={() => setOffset(offset + 50)}>Próxima</button>
    </div>
  </section>
}
