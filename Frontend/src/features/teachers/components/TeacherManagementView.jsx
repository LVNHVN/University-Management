function TeacherManagementView({
  teacherSearchKeyword,
  onTeacherSearchKeywordChange,
  onTeacherSearchSubmit,
  onOpenCreateTeacherModal,
  teachersError,
  isTeachersLoading,
  teachers,
  onOpenTeacherDetailModal,
  onDeleteTeacher,
  isTeacherModalOpen,
  teacherModalMode,
  onTeacherModalClose,
  onTeacherFormSubmit,
  teacherForm,
  onTeacherFormChange,
  teacherFormErrors,
  teacherFormNotice,
  isTeacherSaving,
  isTeacherAccountModalOpen,
  teacherAccount,
  teacherAccountNotice,
  isTeacherAccountSaving,
  onStartEditing,
  onCancelEditing,
  onOpenTeacherAccountModal,
  onCloseTeacherAccountModal,
  onToggleTeacherAccountStatus,
  onResetTeacherAccountPassword,
}) {
  const isViewOnly = teacherModalMode === 'detail'
  const roleLabelMap = {
    student: 'Sinh viên',
    teacher: 'Giảng viên',
    admin: 'Quản trị viên',
  }

  return (
    <div className="dashboard-main">
      <div className="overview-header">
        <h2>Quản lý giảng viên</h2>
        <p>Danh sách và thông tin chi tiết giảng viên</p>
      </div>

      <div className="student-toolbar">
        <form className="student-search" onSubmit={onTeacherSearchSubmit}>
          <input
            type="text"
            placeholder="Tìm theo mã số giảng viên hoặc họ và tên"
            value={teacherSearchKeyword}
            onChange={(event) => onTeacherSearchKeywordChange(event.target.value)}
          />
          <button type="submit">Tìm kiếm</button>
        </form>

        <button type="button" className="add-student-button" onClick={onOpenCreateTeacherModal}>
          Thêm giảng viên mới
        </button>
      </div>

      {teachersError && <p className="dashboard-error">{teachersError}</p>}

      {isTeachersLoading ? (
        <p className="dashboard-loading">Đang tải danh sách giảng viên...</p>
      ) : (
        <div className="student-table-wrap">
          <table className="student-table">
            <thead>
              <tr>
                <th>Mã số giảng viên</th>
                <th>Họ và tên</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length ? (
                teachers.map((teacher) => (
                  <tr key={teacher._id}>
                    <td>{teacher.teacherCode}</td>
                    <td>{teacher.fullName}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="table-button"
                          onClick={() => onOpenTeacherDetailModal(teacher._id)}
                        >
                          Xem chi tiết
                        </button>
                        <button
                          type="button"
                          className="table-button"
                          onClick={() => onOpenTeacherAccountModal(teacher._id)}
                        >
                          Quản lý tài khoản
                        </button>
                        <button
                          type="button"
                          className="table-button delete"
                          onClick={() => onDeleteTeacher(teacher)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="table-empty">Không có giảng viên phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isTeacherModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>
                {teacherModalMode === 'create'
                  ? 'Thêm giảng viên mới'
                  : teacherModalMode === 'editing'
                  ? 'Chỉnh sửa thông tin giảng viên'
                  : 'Thông tin chi tiết giảng viên'}
              </h3>
              <button type="button" className="modal-close" onClick={onTeacherModalClose}>×</button>
            </div>

            <form className="student-form" onSubmit={(e) => e.preventDefault()} noValidate>
              <label>
                Mã số giảng viên
                <input
                  type="text"
                  name="teacherCode"
                  value={teacherForm.teacherCode}
                  onChange={onTeacherFormChange}
                  inputMode="numeric"
                  disabled={isViewOnly}
                />
                {teacherFormErrors.teacherCode && <p className="field-error">{teacherFormErrors.teacherCode}</p>}
              </label>

              <label>
                Họ và tên
                <input
                  type="text"
                  name="fullName"
                  value={teacherForm.fullName}
                  onChange={onTeacherFormChange}
                  disabled={isViewOnly}
                />
                {teacherFormErrors.fullName && <p className="field-error">{teacherFormErrors.fullName}</p>}
              </label>

              <label>
                Ngày sinh
                <input
                  type="text"
                  name="dob"
                  value={teacherForm.dob}
                  onChange={onTeacherFormChange}
                  placeholder="dd/mm/yyyy"
                  disabled={isViewOnly}
                />
                {teacherFormErrors.dob && <p className="field-error">{teacherFormErrors.dob}</p>}
              </label>

              <div className="student-field">
                <span>Giới tính</span>
                <div className="gender-options">
                  <label className="gender-option">
                    <input
                      type="radio"
                      name="gender"
                      value="Nam"
                      checked={teacherForm.gender === 'Nam'}
                      onChange={onTeacherFormChange}
                      disabled={isViewOnly}
                    />
                    <span className="gender-text">Nam</span>
                  </label>
                  <label className="gender-option">
                    <input
                      type="radio"
                      name="gender"
                      value="Nữ"
                      checked={teacherForm.gender === 'Nữ'}
                      onChange={onTeacherFormChange}
                      disabled={isViewOnly}
                    />
                    <span className="gender-text">Nữ</span>
                  </label>
                </div>
                {teacherFormErrors.gender && <p className="field-error">{teacherFormErrors.gender}</p>}
              </div>

              <label>
                Căn cước công dân
                <input
                  type="text"
                  name="nationalIdNumber"
                  value={teacherForm.nationalIdNumber}
                  onChange={onTeacherFormChange}
                  inputMode="numeric"
                  maxLength={12}
                  disabled={isViewOnly}
                />
                {teacherFormErrors.nationalIdNumber && <p className="field-error">{teacherFormErrors.nationalIdNumber}</p>}
              </label>

              <label>
                Số điện thoại
                <input
                  type="text"
                  name="phone"
                  value={teacherForm.phone}
                  onChange={onTeacherFormChange}
                  inputMode="numeric"
                  maxLength={10}
                  disabled={isViewOnly}
                />
                {teacherFormErrors.phone && <p className="field-error">{teacherFormErrors.phone}</p>}
              </label>

              <label className="full-width">
                Địa chỉ
                <input
                  type="text"
                  name="address"
                  value={teacherForm.address}
                  onChange={onTeacherFormChange}
                  disabled={isViewOnly}
                />
                {teacherFormErrors.address && <p className="field-error">{teacherFormErrors.address}</p>}
              </label>

              <label className="full-width">
                Khoa/viện công tác
                <input
                  type="text"
                  name="department"
                  value={teacherForm.department}
                  onChange={onTeacherFormChange}
                  disabled={isViewOnly}
                />
                {teacherFormErrors.department && <p className="field-error">{teacherFormErrors.department}</p>}
              </label>

              {teacherFormNotice && <p className="student-form-notice">{teacherFormNotice}</p>}
            </form>

            {teacherModalMode === 'detail' ? (
              <div className="modal-actions full-width">
                <button type="button" onClick={onStartEditing}>
                  Chỉnh sửa thông tin
                </button>
                <button type="button" className="ghost" onClick={onTeacherModalClose}>
                  Đóng
                </button>
              </div>
            ) : teacherModalMode === 'editing' ? (
              <div className="modal-actions full-width">
                <button type="button" disabled={isTeacherSaving} onClick={onTeacherFormSubmit}>
                  {isTeacherSaving ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
                <button type="button" className="ghost" onClick={onCancelEditing}>
                  Hủy chỉnh sửa
                </button>
              </div>
            ) : (
              <div className="modal-actions full-width">
                <button type="button" disabled={isTeacherSaving} onClick={onTeacherFormSubmit}>
                  {isTeacherSaving ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
                <button type="button" className="ghost" onClick={onTeacherModalClose}>
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isTeacherAccountModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Quản lý tài khoản giảng viên</h3>
              <button type="button" className="modal-close" onClick={onCloseTeacherAccountModal}>×</button>
            </div>

            {teacherAccount ? (
              <div className="student-form">
                <label className="full-width">
                  Tên tài khoản
                  <input type="text" value={teacherAccount.username} disabled />
                </label>

                <label>
                  Vai trò
                  <input type="text" value={roleLabelMap[teacherAccount.role] || teacherAccount.role} disabled />
                </label>

                <label>
                  Trạng thái
                  <input type="text" value={teacherAccount.status ? 'Hoạt động' : 'Đã khóa'} disabled />
                </label>
              </div>
            ) : (
              <p className="dashboard-loading">{teacherAccountNotice || 'Đang tải thông tin tài khoản...'}</p>
            )}

            {teacherAccountNotice && teacherAccount && (
              <p className="student-form-notice">{teacherAccountNotice}</p>
            )}

            <div className="modal-actions full-width">
              <button
                type="button"
                disabled={isTeacherAccountSaving || !teacherAccount}
                onClick={onResetTeacherAccountPassword}
              >
                {isTeacherAccountSaving ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>
              <button
                type="button"
                className={teacherAccount?.status ? 'danger' : ''}
                disabled={isTeacherAccountSaving || !teacherAccount}
                onClick={onToggleTeacherAccountStatus}
              >
                {teacherAccount?.status ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
              </button>
              <button type="button" className="ghost" onClick={onCloseTeacherAccountModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherManagementView
