function DashboardHeader({
  currentUserName,
  isUserMenuOpen,
  onToggleUserMenu,
  onLogout,
  userMenuRef,
  userMenuLabel,
}) {
  return (
    <header className="dashboard-header">
      <div className="university-brand">
        <div className="school-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img" aria-label="Truong hoc">
            <path d="M12 3 2 8l10 5 8-4v6h2V8L12 3Zm-6 9v4.5C6 18.99 8.69 21 12 21s6-2.01 6-4.5V12l-6 3-6-3Z" />
          </svg>
        </div>
        <div className="university-name">Trường Đại học ABC</div>
      </div>

      <div className="user-menu" ref={userMenuRef}>
        <button
          type="button"
          className="user-menu-trigger"
          aria-expanded={isUserMenuOpen}
          aria-haspopup="menu"
          onClick={onToggleUserMenu}
        >
          <span className="user-avatar" aria-hidden="true">
            {(currentUserName.charAt(0).toUpperCase() || userMenuLabel.charAt(0).toUpperCase() || 'U')}
          </span>
        </button>

        {isUserMenuOpen && (
          <div className="user-menu-dropdown" role="menu">
            <p className="menu-user-name">{userMenuLabel}</p>
            <button type="button" className="menu-button" role="menuitem">
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
    </header>
  )
}

export default DashboardHeader
