import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DJsPage from './pages/DJsPage.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import ArchivesPage from './pages/ArchivesPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

export default function App() {
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
