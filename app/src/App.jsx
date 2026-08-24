import { useState, useEffect } from 'react'
import { useStore } from './store'
import Header from './components/Header'
import Entry from './pages/Entry'
import Dashboard from './pages/Dashboard'
import Privacy from './pages/Privacy'
import './App.css'

function App() {
  const { currentUser, authChecked, restoreSession } = useStore()
  const [showPrivacy, setShowPrivacy] = useState(false)

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  if (!authChecked) {
    return <div className="app-loading">Carregando...</div>
  }

  if (showPrivacy) {
    return <Privacy onClose={() => setShowPrivacy(false)} />
  }

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        {!currentUser ? (
          <Entry onShowPrivacy={() => setShowPrivacy(true)} />
        ) : (
          <Dashboard onShowPrivacy={() => setShowPrivacy(true)} />
        )}
      </main>
    </div>
  )
}

export default App
