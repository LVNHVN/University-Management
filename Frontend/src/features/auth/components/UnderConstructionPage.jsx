import './UnderConstructionPage.css'

const ROLE_LABELS = {
  student: 'Sinh viên',
  teacher: 'Giảng viên',
}

function UnderConstructionPage({ role, onLogout }) {
  const label = ROLE_LABELS[role] || role

  return (
    <div className="under-construction-page">
      <div className="under-construction-card">
        <div className="under-construction-icon" aria-hidden="true">🚧</div>
        <h1 className="under-construction-title">Cổng thông tin {label}</h1>
        <p className="under-construction-desc">
          Chức năng dành cho <strong>{label}</strong> đang được phát triển.
          <br />
          Vui lòng quay lại sau.
        </p>
        <button className="under-construction-logout" onClick={onLogout}>
          Đăng xuất
        </button>
      </div>
    </div>
  )
}

export default UnderConstructionPage
