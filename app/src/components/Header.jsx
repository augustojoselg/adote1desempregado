import EloIcon from './EloIcon'
import { useStore } from '../store'
import './Header.css'

export default function Header() {
  const { currentUser, logout } = useStore()

  if (!currentUser) return null

  return (
    <header className="header">
      <div className="header-content wrap">
        <div className="header-brand">
          <EloIcon size={36} />
          <div>
            <div className="header-sub">TISL + EmpregoSocial</div>
            <div className="header-name">Adote um Desempregado</div>
          </div>
        </div>
        <div className="header-user">
          <span className="user-role">{currentUser.role}</span>
          <span className="user-name">{currentUser.name}</span>
          <button className="btn-logout" onClick={logout} title="Sair">
            ✕
          </button>
        </div>
      </div>
    </header>
  )
}
