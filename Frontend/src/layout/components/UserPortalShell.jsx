import { useState, useCallback } from 'react'
import DashboardHeader from './DashboardHeader'
import UserProfilePage from './UserProfilePage'
import { useUserPortalShell } from '../hooks/useUserPortalShell'
import { fetchProfile } from '../../features/auth/services/authService'

function UserPortalShell({ currentRole, currentUserName, currentFullName, onLogout }) {
  const { isUserMenuOpen, userMenuRef, toggleUserMenu } = useUserPortalShell()
  const [profile, setProfile] = useState(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleOpenProfile = useCallback(async () => {
    setIsProfileOpen(true)
    if (profile) return
    setIsProfileLoading(true)
    try {
      const data = await fetchProfile()
      setProfile(data.profile)
    } catch {
      setProfile(null)
    } finally {
      setIsProfileLoading(false)
    }
  }, [profile])

  return (
    <div className="dashboard-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }} aria-label={`Cổng thông tin ${currentRole}`}>
      <DashboardHeader
        currentUserName={currentUserName}
        isUserMenuOpen={isUserMenuOpen}
        onToggleUserMenu={toggleUserMenu}
        onLogout={onLogout}
        userMenuRef={userMenuRef}
        userMenuLabel={currentFullName || currentUserName}
        showPersonalInfo
        onPersonalInfo={handleOpenProfile}
      />
      {isProfileOpen && (
        <UserProfilePage
          profile={profile}
          isLoading={isProfileLoading}
        />
      )}
    </div>
  )
}

export default UserPortalShell

