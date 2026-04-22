import { useCallback, useEffect, useRef, useState } from 'react'

export const useDashboardShell = () => {
  const [activeView, setActiveView] = useState('overview')
  const [dashboardRefreshVersion, setDashboardRefreshVersion] = useState(0)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    if (!isUserMenuOpen) {
      return undefined
    }

    const handleOutsideClick = (event) => {
      if (!userMenuRef.current?.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handleOutsideClick)
    window.addEventListener('keydown', handleEscKey)

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('keydown', handleEscKey)
    }
  }, [isUserMenuOpen])

  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen((prev) => !prev)
  }, [])

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev)
  }, [])

  const handleStudentChanged = useCallback(() => {
    setDashboardRefreshVersion((prev) => prev + 1)
  }, [])

  const handleTeacherChanged = useCallback(() => {
    setDashboardRefreshVersion((prev) => prev + 1)
  }, [])

  return {
    activeView,
    dashboardRefreshVersion,
    isSidebarCollapsed,
    isUserMenuOpen,
    userMenuRef,
    setActiveView,
    toggleSidebar,
    toggleUserMenu,
    handleStudentChanged,
    handleTeacherChanged,
  }
}