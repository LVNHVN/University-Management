function StudentManagementView({
  studentSearchKeyword,
  onStudentSearchKeywordChange,
  onStudentSearchSubmit,
  onOpenCreateStudentModal,
  studentsError,
  isStudentsLoading,
  students,
  onOpenStudentDetailModal,
  onDeleteStudent,
  isStudentModalOpen,
  studentModalMode,
  onStudentModalClose,
  onStudentFormSubmit,
  studentForm,
  onStudentFormChange,
  studentFormErrors,
  studentFormNotice,
  isStudentSaving,
  isStudentAccountModalOpen,
  studentAccount,
  studentAccountNotice,
  isStudentAccountSaving,
  onStartEditing,
  onCancelEditing,
  onOpenStudentAccountModal,
  onCloseStudentAccountModal,
  onToggleStudentAccountStatus,
  onResetStudentAccountPassword,
}) {
  const isViewOnly = studentModalMode === 'detail'
  const roleLabelMap = {
    student: 'Sinh viên',
    teacher: 'Giảng viên',
    admin: 'Quản trị viên',
  }
  return (
    <div className="dashboard-main">
      <div className="overview-header">
        <h2>Quản lý sinh viên</h2>
        <p>Danh sách và thông tin chi tiết sinh viên</p>
      </div>

      <div className="student-toolbar">
        <form className="student-search" onSubmit={onStudentSearchSubmit}>
          <input
            type="text"
            placeholder="Tìm theo mã số sinh viên hoặc họ và tên"
            value={studentSearchKeyword}
            onChange={(event) => onStudentSearchKeywordChange(event.target.value)}
          />
          <button type="submit">Tìm kiếm</button>
        </form>

        <button type="button" className="add-student-button" onClick={onOpenCreateStudentModal}>
          Thêm sinh viên mới
        </button>
      </div>

      {studentsError && <p className="dashboard-error">{studentsError}</p>}

      {isStudentsLoading ? (
        <p className="dashboard-loading">Đang tải danh sách sinh viên...</p>
      ) : (
        <div className="student-table-wrap">
          <table className="student-table">
            <thead>
              <tr>
                <th>Mã số sinh viên</th>
                <th>Họ và tên</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {students.length ? (
                students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.studentCode}</td>
                    <td>{student.fullName}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="table-button"
                          onClick={() => onOpenStudentDetailModal(student._id)}
                        >
                          Xem chi tiết
                        </button>
                        <button
                          type="button"
                          className="table-button"
                          onClick={() => onOpenStudentAccountModal(student._id)}
                        >
                          Quản lý tài khoản
                        </button>
                        <button
                          type="button"
                          className="table-button delete"
                          onClick={() => onDeleteStudent(student)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="table-empty">Không có sinh viên phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isStudentModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>
                {studentModalMode === 'create'
                  ? 'Thêm sinh viên mới'
                  : studentModalMode === 'editing'
                  ? 'Chỉnh sửa thông tin sinh viên'
                  : 'Thông tin chi tiết sinh viên'}
              </h3>
              <button type="button" className="modal-close" onClick={onStudentModalClose}>×</button>
            </div>

            <form className="student-form" onSubmit={(e) => e.preventDefault()} noValidate>
              <label>
                Mã số sinh viên
                <input
                  type="text"
                  name="studentCode"
                  value={studentForm.studentCode}
                  onChange={onStudentFormChange}
                  inputMode="numeric"
                  disabled={isViewOnly}
                />
                {studentFormErrors.studentCode && <p className="field-error">{studentFormErrors.studentCode}</p>}
              </label>

              <label>
                Họ và tên
                <input
                  type="text"
                  name="fullName"
                  value={studentForm.fullName}
                  onChange={onStudentFormChange}
                  disabled={isViewOnly}
                />
                {studentFormErrors.fullName && <p className="field-error">{studentFormErrors.fullName}</p>}
              </label>

              <label>
                Ngày sinh
                <input
                  type="text"
                  name="dob"
                  value={studentForm.dob}
                  onChange={onStudentFormChange}
                  placeholder="dd/mm/yyyy"
                  disabled={isViewOnly}
                />
                {studentFormErrors.dob && <p className="field-error">{studentFormErrors.dob}</p>}
              </label>

              <div className="student-field">
                <span>Giới tính</span>
                <div className="gender-options">
                  <label className="gender-option">
                    <input
                      type="radio"
                      name="gender"
                      value="Nam"
                      checked={studentForm.gender === 'Nam'}
                      onChange={onStudentFormChange}
                      disabled={isViewOnly}
                    />
                    <span className="gender-text">Nam</span>
                  </label>
                  <label className="gender-option">
                    <input
                      type="radio"
                      name="gender"
                      value="Nữ"
                      checked={studentForm.gender === 'Nữ'}
                      onChange={onStudentFormChange}
                      disabled={isViewOnly}
                    />
                    <span className="gender-text">Nữ</span>
                  </label>
                </div>
                {studentFormErrors.gender && <p className="field-error">{studentFormErrors.gender}</p>}
              </div>

              <label>
                Căn cước công dân
                <input
                  type="text"
                  name="nationalIdNumber"
                  value={studentForm.nationalIdNumber}
                  onChange={onStudentFormChange}
                  inputMode="numeric"
                  maxLength={12}
                  disabled={isViewOnly}
                />
                {studentFormErrors.nationalIdNumber && <p className="field-error">{studentFormErrors.nationalIdNumber}</p>}
              </label>

              <label>
                Số điện thoại
                <input
                  type="text"
                  name="phone"
                  value={studentForm.phone}
                  onChange={onStudentFormChange}
                  inputMode="numeric"
                  maxLength={10}
                  disabled={isViewOnly}
                />
                {studentFormErrors.phone && <p className="field-error">{studentFormErrors.phone}</p>}
              </label>

              <label className="full-width">
                Địa chỉ
                <input
                  type="text"
                  name="address"
                  value={studentForm.address}
                  onChange={onStudentFormChange}
                  disabled={isViewOnly}
                />
                {studentFormErrors.address && <p className="field-error">{studentFormErrors.address}</p>}
              </label>

              <label>
                Ngành
                <input
                  type="text"
                  name="major"
                  value={studentForm.major}
                  onChange={onStudentFormChange}
                  disabled={isViewOnly}
                />
                {studentFormErrors.major && <p className="field-error">{studentFormErrors.major}</p>}
              </label>

              <label>
                Khóa học
                <input
                  type="text"
                  name="academicYear"
                  value={studentForm.academicYear}
                  onChange={onStudentFormChange}
                  inputMode="numeric"
                  disabled={isViewOnly}
                />
                {studentFormErrors.academicYear && <p className="field-error">{studentFormErrors.academicYear}</p>}
              </label>

              {studentFormNotice && <p className="student-form-notice">{studentFormNotice}</p>}
            </form>

            {studentModalMode === 'detail' ? (
              <div className="modal-actions full-width">
                <button type="button" onClick={onStartEditing}>
                  Chỉnh sửa thông tin
                </button>
                <button type="button" className="ghost" onClick={onStudentModalClose}>
                  Đóng
                </button>
              </div>
            ) : studentModalMode === 'editing' ? (
              <div className="modal-actions full-width">
                <button type="button" disabled={isStudentSaving} onClick={onStudentFormSubmit}>
                  {isStudentSaving ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
                <button type="button" className="ghost" onClick={onCancelEditing}>
                  Hủy chỉnh sửa
                </button>
              </div>
            ) : (
              <div className="modal-actions full-width">
                <button type="button" disabled={isStudentSaving} onClick={onStudentFormSubmit}>
                  {isStudentSaving ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
                <button type="button" className="ghost" onClick={onStudentModalClose}>
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isStudentAccountModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Quản lý tài khoản sinh viên</h3>
              <button type="button" className="modal-close" onClick={onCloseStudentAccountModal}>×</button>
            </div>

            {studentAccount ? (
              <div className="student-form">
                <label className="full-width">
                  Tên tài khoản
                  <input type="text" value={studentAccount.username} disabled />
                </label>

                <label>
                  Vai trò
                  <input type="text" value={roleLabelMap[studentAccount.role] || studentAccount.role} disabled />
                </label>

                <label>
                  Trạng thái
                  <input type="text" value={studentAccount.status ? 'Hoạt động' : 'Đã khóa'} disabled />
                </label>
              </div>
            ) : (
              <p className="dashboard-loading">{studentAccountNotice || 'Đang tải thông tin tài khoản...'}</p>
            )}

            {studentAccountNotice && studentAccount && (
              <p className="student-form-notice">{studentAccountNotice}</p>
            )}

            <div className="modal-actions full-width">
              <button
                type="button"
                disabled={isStudentAccountSaving || !studentAccount}
                onClick={onResetStudentAccountPassword}
              >
                {isStudentAccountSaving ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>
              <button
                type="button"
                className={studentAccount?.status ? 'danger' : ''}
                disabled={isStudentAccountSaving || !studentAccount}
                onClick={onToggleStudentAccountStatus}
              >
                {studentAccount?.status ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
              </button>
              <button type="button" className="ghost" onClick={onCloseStudentAccountModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentManagementView