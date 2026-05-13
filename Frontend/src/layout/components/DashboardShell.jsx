import { NAV_ITEMS } from '../../shared/constants/navigation'
import ChangePasswordPage from '../../features/auth/components/ChangePasswordPage'
import { useDashboardShell } from '../hooks/useDashboardShell'
import DashboardContentRouter from './DashboardContentRouter'
import DashboardHeader from './DashboardHeader'
import DashboardSidebar from './DashboardSidebar'
import { useState } from 'react'

function DashboardShell({ currentRole, currentUserName, onLogout, userMenuLabel, recaptchaSiteKey }) {
  const {
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
  } = useDashboardShell()
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)

  const handleOpenChangePassword = () => {
    closeUserMenu()
    setIsChangePasswordOpen(true)
  }

  const handleCloseChangePassword = () => {
    setIsChangePasswordOpen(false)
  }

  return (
    <main className="dashboard-page" aria-label={`Trang chinh ${currentRole}`}>
      <DashboardHeader
        currentUserName={currentUserName}
        isUserMenuOpen={isUserMenuOpen}
        onToggleUserMenu={toggleUserMenu}
        onLogout={onLogout}
        onChangePassword={handleOpenChangePassword}
        userMenuRef={userMenuRef}
        userMenuLabel={userMenuLabel}
      />

      {isChangePasswordOpen ? (
        <ChangePasswordPage
          siteKey={recaptchaSiteKey}
          onCancel={handleCloseChangePassword}
          onSuccess={handleCloseChangePassword}
        />
      ) : (
        <div className={`dashboard-body ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <DashboardSidebar
            navItems={NAV_ITEMS}
            activeView={activeView}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={toggleSidebar}
            onSelectView={setActiveView}
          />

          <section className="dashboard-content" aria-label="Noi dung chinh">
            <DashboardContentRouter
              activeView={activeView}
              dashboardRefreshVersion={dashboardRefreshVersion}
              onStudentChanged={handleStudentChanged}
              onTeacherChanged={handleTeacherChanged}
            />
          </section>
        </div>
      )}
    </main>
  )
}

export default DashboardShell