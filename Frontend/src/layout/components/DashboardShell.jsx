import { NAV_ITEMS } from '../../shared/constants/navigation'
import { useDashboardShell } from '../hooks/useDashboardShell'
import DashboardContentRouter from './DashboardContentRouter'
import DashboardHeader from './DashboardHeader'
import DashboardSidebar from './DashboardSidebar'

function DashboardShell({ currentRole, currentUserName, onLogout, userMenuLabel }) {
  const {
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
  } = useDashboardShell()

  return (
    <main className="dashboard-page" aria-label={`Trang chinh ${currentRole}`}>
      <DashboardHeader
        currentUserName={currentUserName}
        isUserMenuOpen={isUserMenuOpen}
        onToggleUserMenu={toggleUserMenu}
        onLogout={onLogout}
        userMenuRef={userMenuRef}
        userMenuLabel={userMenuLabel}
      />

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
    </main>
  )
}

export default DashboardShell