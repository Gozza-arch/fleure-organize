import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DJsPage from './pages/DJsPage.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import ArchivesPage from './pages/ArchivesPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import LoginPage from './pages/LoginPage.jsx'

function useAuth() {
  const [auth, setAuth] = useState(() => localStorage.getItem('fleure_auth') === '1')
  return { auth, login: () => setAuth(true) }
}

export default function App() {
  const { auth, login } = useAuth()

  if (!auth) return <LoginPage onLogin={login} />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/djs" element={<DJsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/archives" element={<ArchivesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  )
}
