import { useState } from 'react'
import { useStore } from '../store'
import Directory from '../components/Directory'
import JobBoard from '../components/JobBoard'
import EloTracker from '../components/EloTracker'
import Stats from '../components/Stats'
import './Dashboard.css'

const TABS = [
  { id: 'stats', label: 'Estatísticas', icon: '📊' },
  { id: 'directory', label: 'Diretório', icon: '👥' },
  { id: 'jobs', label: 'Vagas', icon: '💼' },
  { id: 'meus-elos', label: 'Meus Elos', icon: '🔗' },
]

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('stats')
  const { currentUser } = useStore()

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="dashboard-content wrap">
        {activeTab === 'stats' && <Stats />}
        {activeTab === 'directory' && <Directory />}
        {activeTab === 'jobs' && <JobBoard />}
        {activeTab === 'meus-elos' && <EloTracker />}
      </main>
    </div>
  )
}
