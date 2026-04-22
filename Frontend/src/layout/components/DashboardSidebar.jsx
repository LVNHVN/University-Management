function DashboardSidebar({
  navItems,
  activeView,
  isSidebarCollapsed,
  onToggleSidebar,
  onSelectView,
}) {
  return (
    <aside className="dashboard-sidebar" aria-label="Dieu huong chinh">
      <button
        type="button"
        className="sidebar-toggle"
        onClick={onToggleSidebar}
        aria-label={isSidebarCollapsed ? 'Mở rộng cột chức năng' : 'Thu gọn cột chức năng'}
        title={isSidebarCollapsed ? 'Mở rộng' : 'Thu gọn'}
      >
        <span aria-hidden="true">{isSidebarCollapsed ? '»' : '«'}</span>
        <span className="sidebar-label">{isSidebarCollapsed ? 'Mở' : 'Thu gọn'}</span>
      </button>

      {navItems.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`sidebar-item ${activeView === item.key ? 'active' : ''}`}
          onClick={() => onSelectView(item.key)}
        >
          {item.label}
        </button>
      ))}
    </aside>
  )
}

export default DashboardSidebar
