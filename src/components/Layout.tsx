import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { FiHome, FiMessageSquare, FiUsers, FiCalendar, FiSettings, FiMenu, FiX, FiSun, FiMoon, FiPlus, FiChevronLeft } from 'react-icons/fi'

type LayoutProps = {
  darkMode: boolean
  setDarkMode: (mode: boolean) => void
}

const Layout = ({ darkMode, setDarkMode }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()

  // For mobile responsiveness
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Toggle sidebar collapsed state for desktop
  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  // NavLink Active Class
  const activeClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center p-2 my-1 rounded-md transition-all duration-200 ${
      sidebarCollapsed ? 'justify-center' : ''
    } ${
      isActive 
        ? 'bg-gray-800 text-white' 
        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    }`

  return (
    <div className="flex h-screen bg-white dark:bg-black">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden transition-opacity duration-300" 
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar - Collapsible */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 ${sidebarCollapsed ? 'w-16' : 'w-64'} bg-gray-900 transition-all duration-300 transform ease-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* New Chat Button */}
          <div className="p-2">
            <button className="flex items-center w-full p-3 text-white bg-gray-800 rounded-md hover:bg-gray-700 transition-colors duration-200 group">
              <FiPlus className={`${sidebarCollapsed ? 'mx-auto' : 'mr-2'} transition-transform duration-200 group-hover:rotate-90`} size={16} />
              {!sidebarCollapsed && <span className="text-sm font-medium">New Chat</span>}
            </button>
          </div>
          
          {/* Close/Collapse buttons */}
          <div className="absolute top-0 right-0 flex items-center p-1">
            {/* Mobile close button */}
            <button
              onClick={toggleSidebar}
              className="p-1 m-1 text-gray-300 rounded-md lg:hidden hover:bg-gray-800 hover:text-white"
            >
              <FiX size={20} />
            </button>
            
            {/* Desktop collapse button */}
            <button
              onClick={toggleSidebarCollapsed}
              className="hidden p-1 m-1 text-gray-300 rounded-md lg:block hover:bg-gray-800 hover:text-white"
            >
              <FiChevronLeft className={`transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} size={20} />
            </button>
          </div>
  
          {/* Navigation Links */}
          <nav className="flex-1 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
            {!sidebarCollapsed && <div className="mb-2 text-xs text-gray-400 px-2 uppercase font-semibold">Main</div>}
            <NavLink to="/" className={activeClass} end>
              <FiHome className={`${sidebarCollapsed ? 'mx-auto' : 'mr-2'} transition-transform duration-200 hover:scale-110`} size={16} />
              {!sidebarCollapsed && <span>Home</span>}
            </NavLink>
            <NavLink to="/chat" className={activeClass}>
              <FiMessageSquare className={`${sidebarCollapsed ? 'mx-auto' : 'mr-2'} transition-transform duration-200 hover:scale-110`} size={16} />
              {!sidebarCollapsed && <span>Chat</span>}
            </NavLink>
            
            {!sidebarCollapsed && <div className="my-2 text-xs text-gray-400 px-2 uppercase font-semibold">My Content</div>}
            <NavLink to="/my-questions" className={activeClass}>
              <FiMessageSquare className={`${sidebarCollapsed ? 'mx-auto' : 'mr-2'} transition-transform duration-200 hover:scale-110`} size={16} />
              {!sidebarCollapsed && <span>My Questions</span>}
            </NavLink>
            <NavLink to="/faculty-answers" className={activeClass}>
              <FiUsers className={`${sidebarCollapsed ? 'mx-auto' : 'mr-2'} transition-transform duration-200 hover:scale-110`} size={16} />
              {!sidebarCollapsed && <span>Faculty Answers</span>}
            </NavLink>
            <NavLink to="/deadlines" className={activeClass}>
              <FiCalendar className={`${sidebarCollapsed ? 'mx-auto' : 'mr-2'} transition-transform duration-200 hover:scale-110`} size={16} />
              {!sidebarCollapsed && <span>Deadlines</span>}
            </NavLink>
            
            {!sidebarCollapsed && <div className="my-2 text-xs text-gray-400 px-2 uppercase font-semibold">System</div>}
            <NavLink to="/settings" className={activeClass}>
              <FiSettings className={`${sidebarCollapsed ? 'mx-auto' : 'mr-2'} transition-transform duration-200 hover:scale-110 animate-pulse`} size={16} />
              {!sidebarCollapsed && <span>Settings</span>}
            </NavLink>
            <NavLink to="/faculty-dashboard" className={activeClass}>
              <FiUsers className={`${sidebarCollapsed ? 'mx-auto' : 'mr-2'} transition-transform duration-200 hover:scale-110`} size={16} />
              {!sidebarCollapsed && <span>Faculty Dashboard</span>}
            </NavLink>
          </nav>
  
          {/* Bottom section with theme toggle */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={toggleDarkMode}
              className={`flex items-center p-2 text-sm text-gray-300 rounded-md hover:bg-gray-800 transition-colors duration-200 ${
                sidebarCollapsed ? 'justify-center' : 'w-full'
              }`}
            >
              {darkMode ? (
                <>
                  <FiSun className={`${sidebarCollapsed ? '' : 'mr-2'} transition-transform duration-300 hover:rotate-90`} size={16} />
                  {!sidebarCollapsed && <span>Light Mode</span>}
                </>
              ) : (
                <>
                  <FiMoon className={`${sidebarCollapsed ? '' : 'mr-2'} transition-transform duration-300 hover:rotate-12`} size={16} />
                  {!sidebarCollapsed && <span>Dark Mode</span>}
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header for Mobile */}
        <header className="flex items-center h-12 px-4 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 lg:hidden">
          <button
            onClick={toggleSidebar}
            className="p-1 mr-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-200 transition-colors duration-200"
          >
            <FiMenu size={20} />
          </button>
          <h1 className="text-lg font-medium tracking-wide text-gray-900 dark:text-white">Student AI</h1>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-white dark:bg-black transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout 