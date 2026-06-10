function DashboardHeader({
  currentUserName,
  isUserMenuOpen,
  onToggleUserMenu,
  isNotificationOpen,
  onToggleNotification,
  onLogout,
  onChangePassword,
  userMenuRef,
  notificationRef,
  showNotificationBell = false,
  unreadNotificationCount = 0,
  notifications = [],
  onNotificationClick,
  userMenuLabel,
  showPersonalInfo = false,
  onPersonalInfo,
  showScheduleButton = false,
  scheduleButtonLabel = 'Thời khóa biểu',
  onOpenSchedule,
  showGradesButton = false,
  gradesButtonLabel = 'Bảng điểm',
  onOpenGrades,
  showCurriculumButton = false,
  onOpenCurriculum,
  showTuitionButton = false,
  tuitionButtonLabel = 'Học phí',
  onOpenTuition,
}) {
  return (
    <header className="dashboard-header">
      <div className="university-brand">
        <div className="school-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img" aria-label="Truong hoc">
            <path d="M12 3 2 8l10 5 8-4v6h2V8L12 3Zm-6 9v4.5C6 18.99 8.69 21 12 21s6-2.01 6-4.5V12l-6 3-6-3Z" />
          </svg>
        </div>
        <div className="university-name">Hoàng University</div>
      </div>

      <div className="header-actions">
        {showScheduleButton && (
          <button type="button" className="header-action-button" onClick={onOpenSchedule}>
            {scheduleButtonLabel}
          </button>
        )}

        {showGradesButton && (
          <button type="button" className="header-action-button" onClick={onOpenGrades}>
            {gradesButtonLabel}
          </button>
        )}

        {showCurriculumButton && (
          <button type="button" className="header-action-button" onClick={onOpenCurriculum}>
            Xem chương trình đào tạo
          </button>
        )}

        {showTuitionButton && (
          <button type="button" className="header-action-button" onClick={onOpenTuition}>
            {tuitionButtonLabel}
          </button>
        )}

        {showNotificationBell && (
          <div className="notification-menu" ref={notificationRef}>
            <button
              type="button"
              className="notification-trigger"
              aria-expanded={isNotificationOpen}
              aria-haspopup="menu"
              onClick={onToggleNotification}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2a7 7 0 0 0-7 7v3.9L3.4 15a1 1 0 0 0 .8 1.6H19.8a1 1 0 0 0 .8-1.6L19 12.9V9a7 7 0 0 0-7-7Zm0 20a3.2 3.2 0 0 1-3-2h6a3.2 3.2 0 0 1-3 2Z" />
              </svg>
              {unreadNotificationCount > 0 && <span className="notification-dot" aria-hidden="true" />}
            </button>

            {isNotificationOpen && (
              <div className="notification-dropdown" role="menu">
                <p className="notification-title">{unreadNotificationCount} thông báo mới</p>
                <div className="notification-list">
                  {notifications.length ? (
                    notifications.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        className={`notification-item${item.isNew ? ' is-new' : ''}`}
                        onClick={() => onNotificationClick?.(item)}
                      >
                        <strong>{item.title}</strong>
                        <span>{item.content}</span>
                      </button>
                    ))
                  ) : (
                    <p className="notification-empty">Chưa có thông báo.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="user-menu" ref={userMenuRef}>
        <button
          type="button"
          className="user-menu-trigger"
          aria-expanded={isUserMenuOpen}
          aria-haspopup="menu"
          onClick={onToggleUserMenu}
        >
          <span className="user-avatar" aria-hidden="true">
            {(userMenuLabel || currentUserName || '').trim().split(/\s+/).pop()?.charAt(0).toUpperCase() || 'U'}
          </span>
        </button>

        {isUserMenuOpen && (
          <div className="user-menu-dropdown" role="menu">
            <p className="menu-user-name">{userMenuLabel}</p>
            {showPersonalInfo && (
              <button type="button" className="menu-button" role="menuitem" onClick={onPersonalInfo}>
                Thông tin cá nhân
              </button>
            )}
            <button type="button" className="menu-button" role="menuitem" onClick={onChangePassword}>
              Đổi mật khẩu
            </button>
            <button
              type="button"
              className="menu-button menu-button-logout"
              role="menuitem"
              onClick={onLogout}
            >
              Đăng xuất
            </button>
          </div>
        )}
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
