import { useCallback, useEffect, useRef, useState } from 'react'
import { NAV_ITEMS } from '../../shared/constants/navigation'

const ADMIN_HASH_PREFIX = '#/admin/'

const getInitialAdminView = () => {
  if (typeof window === 'undefined') {
    return 'overview'
  }

  const hash = String(window.location.hash || '')
  if (!hash.startsWith(ADMIN_HASH_PREFIX)) {
    return 'overview'
  }

  const view = hash.slice(ADMIN_HASH_PREFIX.length)
  const isValidView = NAV_ITEMS.some((item) => item.key === view)
  return isValidView ? view : 'overview'
}

export const useDashboardShell = () => {
  const [activeView, setActiveView] = useState(getInitialAdminView)
  const [dashboardRefreshVersion, setDashboardRefreshVersion] = useState(0)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const nextHash = `${ADMIN_HASH_PREFIX}${activeView}`
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash)
    }
  }, [activeView])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handleHashChange = () => {
      const nextView = getInitialAdminView()
      setActiveView((prev) => (prev === nextView ? prev : nextView))
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

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

  const closeUserMenu = useCallback(() => {
    setIsUserMenuOpen(false)
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
    closeUserMenu,
    handleStudentChanged,
    handleTeacherChanged,
  }
}