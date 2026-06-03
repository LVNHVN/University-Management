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
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [isCurriculumOpen, setIsCurriculumOpen] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(currentRole === 'student' || currentRole === 'teacher')
  const [isGradesOpen, setIsGradesOpen] = useState(false)

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
    setIsChangePasswordOpen(false)
    setIsCurriculumOpen(false)
    setIsScheduleOpen(false)
    setIsGradesOpen(false)
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
  }, [closeNotification, closeUserMenu, profile])

  const handleOpenChangePassword = useCallback(() => {
    closeUserMenu()
    closeNotification()
    setIsCurriculumOpen(false)
    setIsScheduleOpen(false)
    setIsGradesOpen(false)
    setIsProfileOpen(false)
    setIsChangePasswordOpen(true)
  }, [closeNotification, closeUserMenu])

  const handleOpenSchedule = useCallback(() => {
    closeUserMenu()
    closeNotification()
    setIsProfileOpen(false)
    setIsChangePasswordOpen(false)
    setIsCurriculumOpen(false)
    setIsScheduleOpen(true)
    setIsGradesOpen(false)
  }, [closeNotification, closeUserMenu])

  const handleOpenGrades = useCallback(() => {
    closeUserMenu()
    closeNotification()
    setIsProfileOpen(false)
    setIsChangePasswordOpen(false)
    setIsCurriculumOpen(false)
    setIsScheduleOpen(false)
    setIsGradesOpen(true)
  }, [closeNotification, closeUserMenu])

  const handleOpenCurriculum = useCallback(() => {
    closeUserMenu()
    closeNotification()
    setIsProfileOpen(false)
    setIsChangePasswordOpen(false)
    setIsCurriculumOpen(true)
    setIsScheduleOpen(false)
    setIsGradesOpen(false)
  }, [closeNotification, closeUserMenu])

  const handleCloseChangePassword = useCallback(() => {
    setIsChangePasswordOpen(false)
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

