import { useEffect, useState } from 'react'
import AuthPanel from './components/AuthPanel.jsx'
import CandidateDashboard from './components/CandidateDashboard.jsx'
import HostDashboard from './components/HostDashboard.jsx'
import { getCurrentUser, logout } from './services/authApi.js'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(() => localStorage.getItem('smartrouteTheme') || 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('smartrouteTheme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme((current) => current === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    getCurrentUser().then(setUser).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <main className="grid min-h-screen place-items-center text-sm text-slate-500">Loading SmartRoute...</main>
  }

  if (!user) {
    return <AuthPanel onAuthenticated={setUser} onThemeToggle={toggleTheme} theme={theme} />
  }

  if (user.role === 'admin') {
    return <HostDashboard onSignOut={() => { logout(); setUser(null) }} onThemeToggle={toggleTheme} theme={theme} user={user} />
  }

  return <CandidateDashboard onSignOut={() => { logout(); setUser(null) }} onThemeToggle={toggleTheme} theme={theme} user={user} />
}

export default App
