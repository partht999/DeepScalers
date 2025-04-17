import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ChatPage from './pages/ChatPage'
import MyQuestions from './pages/MyQuestions'
import FacultyAnswers from './pages/FacultyAnswers'
import Deadlines from './pages/Deadlines'
import Settings from './pages/Settings'
import FacultyDashboard from './pages/FacultyDashboard'

function App() {
  const [darkMode, setDarkMode] = useState(false)

  // Load dark mode preference from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode')
    if (savedMode) {
      setDarkMode(savedMode === 'true')
    } else {
      // Check for system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setDarkMode(prefersDark)
    }
  }, [])

  // Update localStorage when darkMode changes
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString())
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-black text-white' : 'bg-white text-gray-900'}`}>
      <Routes>
        <Route path="/" element={<Layout darkMode={darkMode} setDarkMode={setDarkMode} />}>
          <Route index element={<Home />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="my-questions" element={<MyQuestions />} />
          <Route path="faculty-answers" element={<FacultyAnswers />} />
          <Route path="deadlines" element={<Deadlines />} />
          <Route path="settings" element={<Settings />} />
          <Route path="faculty-dashboard" element={<FacultyDashboard />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App 