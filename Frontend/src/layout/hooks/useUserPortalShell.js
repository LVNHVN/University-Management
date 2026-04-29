import { useCallback, useEffect, useRef, useState } from 'react'

export const useUserPortalShell = () => {
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

  return {
    isUserMenuOpen,
    userMenuRef,
    toggleUserMenu,
  }
}
