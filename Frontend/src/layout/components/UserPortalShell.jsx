import { useState, useCallback, useEffect } from 'react'
import DashboardHeader from './DashboardHeader'
import UserProfilePage from './UserProfilePage'
import { useUserPortalShell } from '../hooks/useUserPortalShell'
import { fetchProfile } from '../../features/auth/services/authService'
import ChangePasswordPage from '../../features/auth/components/ChangePasswordPage'
import { fetchMyNotifications, markNotificationAsRead } from '../../features/notifications/services/notificationService'
import StudentCurriculumPage from '../../features/curriculum/components/StudentCurriculumPage'
import StudentSchedulePage from '../../features/schedule/components/StudentSchedulePage'
import TeacherSchedulePage from '../../features/schedule/components/TeacherSchedulePage'
import StudentGradesPage from '../../features/grades/components/StudentGradesPage'

const PORTAL_HASH_PREFIX = '#/portal/'

const normalizePortalView = (view, role) => {
  if (view === 'profile' || view === 'change-password') {
    return view
  }

  if (view === 'schedule') {
    return 'schedule'
  }

  if (role === 'student' && (view === 'curriculum' || view === 'grades')) {
    return view
  }

  return 'schedule'
}

const getInitialPortalView = (role) => {
  if (typeof window === 'undefined') {
    return 'schedule'
  }

  const hash = String(window.location.hash || '')
  if (!hash.startsWith(PORTAL_HASH_PREFIX)) {
    return 'schedule'
  }

  const view = hash.slice(PORTAL_HASH_PREFIX.length)
  return normalizePortalView(view, role)
}

function UserPortalShell({ currentRole, currentUserName, currentFullName, onLogout, recaptchaSiteKey }) {
  const {
    isUserMenuOpen,
    isNotificationOpen,
    userMenuRef,
    notificationRef,
    toggleUserMenu,
    closeUserMenu,
    toggleNotification,
    closeNotification,
  } = useUserPortalShell()
  const [profile, setProfile] = useState(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [portalView, setPortalView] = useState(() => getInitialPortalView(currentRole))
  const isProfileOpen = portalView === 'profile'
  const isChangePasswordOpen = portalView === 'change-password'
  const isCurriculumOpen = portalView === 'curriculum'
  const isScheduleOpen = portalView === 'schedule'
  const isGradesOpen = portalView === 'grades'

  useEffect(() => {
    setPortalView((prev) => normalizePortalView(prev, currentRole))
  }, [currentRole])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const nextHash = `${PORTAL_HASH_PREFIX}${portalView}`
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash)
    }
  }, [portalView])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handleHashChange = () => {
      const nextView = getInitialPortalView(currentRole)
      setPortalView((prev) => (prev === nextView ? prev : nextView))
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [currentRole])

  const loadNotifications = useCallback(async () => {
    if (currentRole !== 'teacher' && currentRole !== 'student') {
      return
    }

    try {
      const payload = await fetchMyNotifications()
      const list = Array.isArray(payload?.notifications) ? payload.notifications : []
      setNotifications(list)
      setUnreadNotificationCount(Number(payload?.unreadCount) || 0)
    } catch {
      setNotifications([])
      setUnreadNotificationCount(0)
    }
  }, [currentRole])

  useEffect(() => {
    loadNotifications()

    if (currentRole !== 'teacher' && currentRole !== 'student') {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      loadNotifications()
    }, 30000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [currentRole, loadNotifications])

  const handleOpenProfile = useCallback(async () => {
    closeUserMenu()
    closeNotification()
    setPortalView('profile')
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
  }, [closeNotification, closeUserMenu, profile])

  const handleOpenChangePassword = useCallback(() => {
    closeUserMenu()
    closeNotification()
    setPortalView('change-password')
  }, [closeNotification, closeUserMenu])

  const handleOpenSchedule = useCallback(() => {
    closeUserMenu()
    closeNotification()
    setPortalView('schedule')
  }, [closeNotification, closeUserMenu])

  const handleOpenGrades = useCallback(() => {
    closeUserMenu()
    closeNotification()
    setPortalView('grades')
  }, [closeNotification, closeUserMenu])

  const handleOpenCurriculum = useCallback(() => {
    closeUserMenu()
    closeNotification()
    setPortalView('curriculum')
  }, [closeNotification, closeUserMenu])

  const handleCloseChangePassword = useCallback(() => {
    setPortalView('schedule')
  }, [])

  const handleNotificationClick = useCallback(async (notification) => {
    closeNotification()
    setSelectedNotification(notification)

    if (notification.isNew) {
      try {
        await markNotificationAsRead(notification._id)
      } catch {
        // Keep UI usable even if read status update fails.
      }

      setNotifications((prev) => prev.map((item) => (
        item._id === notification._id
          ? { ...item, isNew: false, isRead: true }
          : item
      )))
      setUnreadNotificationCount((prev) => Math.max(0, prev - 1))
    }
  }, [closeNotification])

  const handleCloseNotificationModal = useCallback(() => {
    setSelectedNotification(null)
  }, [])

  return (
    <div className="dashboard-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }} aria-label={`Cổng thông tin ${currentRole}`}>
      <DashboardHeader
        currentUserName={currentUserName}
        isUserMenuOpen={isUserMenuOpen}
        isNotificationOpen={isNotificationOpen}
        onToggleUserMenu={toggleUserMenu}
        onToggleNotification={toggleNotification}
        onLogout={onLogout}
        onChangePassword={handleOpenChangePassword}
        userMenuRef={userMenuRef}
        notificationRef={notificationRef}
        showNotificationBell
        unreadNotificationCount={unreadNotificationCount}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        userMenuLabel={currentFullName || currentUserName}
        showPersonalInfo
        onPersonalInfo={handleOpenProfile}
        showScheduleButton={currentRole === 'student'}
        scheduleButtonLabel="Thời khóa biểu"
        onOpenSchedule={handleOpenSchedule}
        showGradesButton={currentRole === 'student'}
        gradesButtonLabel="Bảng điểm"
        onOpenGrades={handleOpenGrades}
        showCurriculumButton={currentRole === 'student'}
        onOpenCurriculum={handleOpenCurriculum}
      />
      {currentRole === 'student' && isScheduleOpen && !isProfileOpen && !isChangePasswordOpen && (
        <StudentSchedulePage />
      )}
      {currentRole === 'teacher' && isScheduleOpen && !isProfileOpen && !isChangePasswordOpen && (
        <TeacherSchedulePage />
      )}
      {currentRole === 'student' && isCurriculumOpen && !isProfileOpen && !isChangePasswordOpen && (
        <StudentCurriculumPage />
      )}
      {currentRole === 'student' && isGradesOpen && !isProfileOpen && !isChangePasswordOpen && (
        <StudentGradesPage />
      )}
      {isChangePasswordOpen && (
        <ChangePasswordPage
          siteKey={recaptchaSiteKey}
          onCancel={handleCloseChangePassword}
          onSuccess={handleCloseChangePassword}
        />
      )}
      {isProfileOpen && (
        <UserProfilePage
          profile={profile}
          isLoading={isProfileLoading}
        />
      )}

      {selectedNotification && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card notification-read-modal">
            <div className="modal-header">
              <h3>Chi tiết thông báo</h3>
              <button type="button" className="modal-close" onClick={handleCloseNotificationModal}>×</button>
            </div>
            <hr className="notification-read-divider" />

            <div className="notification-read-content">
              <h4>{selectedNotification.title}</h4>
              <hr className="notification-read-divider" />
              <p>{selectedNotification.content}</p>
            </div>

            <div className="modal-actions full-width">
              <button type="button" className="ghost" onClick={handleCloseNotificationModal}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserPortalShell

