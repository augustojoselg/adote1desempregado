import { useStore } from './store'
import Header from './components/Header'
import Entry from './pages/Entry'
import Dashboard from './pages/Dashboard'
import './App.css'

function App() {
  const { currentUser } = useStore()

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        {!currentUser ? <Entry /> : <Dashboard />}
      </main>
    </div>
  )
}

export default App
