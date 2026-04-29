import './UserProfilePage.css'

const GENDER_LABELS = { male: 'Nam', female: 'Nữ' }

const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d)) return value
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

const STUDENT_FIELDS = [
  { key: 'studentCode', label: 'Mã số sinh viên' },
  { key: 'fullName', label: 'Họ và tên' },
  { key: 'dob', label: 'Ngày sinh', format: formatDate },
  { key: 'gender', label: 'Giới tính', format: (v) => GENDER_LABELS[v] || v || '—' },
  { key: 'nationalIdNumber', label: 'Số căn cước công dân' },
  { key: 'phone', label: 'Số điện thoại' },
  { key: 'address', label: 'Địa chỉ' },
  { key: 'major', label: 'Ngành học' },
  { key: 'academicYear', label: 'Khóa học' },
]

const TEACHER_FIELDS = [
  { key: 'teacherCode', label: 'Mã số giảng viên' },
  { key: 'fullName', label: 'Họ và tên' },
  { key: 'dob', label: 'Ngày sinh', format: formatDate },
  { key: 'gender', label: 'Giới tính', format: (v) => GENDER_LABELS[v] || v || '—' },
  { key: 'nationalIdNumber', label: 'Số căn cước công dân' },
  { key: 'phone', label: 'Số điện thoại' },
  { key: 'address', label: 'Địa chỉ' },
  { key: 'department', label: 'Khoa/viện công tác' },
]

function UserProfilePage({ profile, isLoading, onClose }) {
  const fields = profile?.role === 'teacher' ? TEACHER_FIELDS : STUDENT_FIELDS

  return (
    <div className="portal-profile-page">
      <div className="portal-profile-header">
        <h1 className="portal-profile-title">Thông tin cá nhân</h1>
      </div>

      <div className="portal-profile-body">
        {isLoading && (
          <p className="portal-profile-loading">Đang tải thông tin...</p>
        )}

        {!isLoading && profile && (
          <div className="portal-profile-card">
            <div className="portal-profile-avatar" aria-hidden="true">
              {(profile.fullName || '').trim().split(/\s+/).pop()?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="portal-profile-fields">
              {fields.map(({ key, label, format }) => (
                <div key={key} className="portal-profile-row">
                  <span className="portal-profile-label">{label}</span>
                  <span className="portal-profile-value">
                    {format ? format(profile[key]) : (profile[key] || '—')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && !profile && (
          <p className="portal-profile-empty">Không thể tải thông tin cá nhân.</p>
        )}
      </div>
    </div>
  )
}

export default UserProfilePage
