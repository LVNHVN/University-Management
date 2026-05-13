import { useCallback, useEffect, useRef, useState } from 'react'

export const useUserPortalShell = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const userMenuRef = useRef(null)
  const notificationRef = useRef(null)

  useEffect(() => {
    if (!isUserMenuOpen && !isNotificationOpen) {
      return undefined
    }

    const handleOutsideClick = (event) => {
      if (!userMenuRef.current?.contains(event.target)) {
        setIsUserMenuOpen(false)
      }

      if (!notificationRef.current?.contains(event.target)) {
        setIsNotificationOpen(false)
      }
    }

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false)
        setIsNotificationOpen(false)
      }
    }

    window.addEventListener('mousedown', handleOutsideClick)
    window.addEventListener('keydown', handleEscKey)

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('keydown', handleEscKey)
    }
  }, [isNotificationOpen, isUserMenuOpen])

  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen((prev) => !prev)
  }, [])

  const closeUserMenu = useCallback(() => {
    setIsUserMenuOpen(false)
  }, [])

  const toggleNotification = useCallback(() => {
    setIsNotificationOpen((prev) => !prev)
  }, [])

  const closeNotification = useCallback(() => {
    setIsNotificationOpen(false)
  }, [])

  return {
    isUserMenuOpen,
    isNotificationOpen,
    userMenuRef,
    notificationRef,
    toggleUserMenu,
    closeUserMenu,
    toggleNotification,
    closeNotification,
  }
}
