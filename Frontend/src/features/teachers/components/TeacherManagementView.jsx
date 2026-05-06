import ConfirmDialog from '../../../shared/components/ConfirmDialog'

function TeacherManagementView({
  teacherSearchKeyword,
  onTeacherSearchKeywordChange,
  onTeacherSearchSubmit,
  onOpenCreateTeacherModal,
  isTeacherImportModalOpen,
  isTeachersImporting,
  teacherImportFileName,
  onOpenTeacherImportModal,
  onCloseTeacherImportModal,
  onTeacherImportFileChange,
  onImportTeachersCsv,
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
  isTeacherImportPreviewOpen,
  teacherImportPreview,
  isTeacherImportCommitting,
  teacherImportSuccess,
  onCommitTeachersImport,
  onCloseTeacherImportPreview,
  onCloseTeacherImportSuccess,
  onStartEditing,
  onCancelEditing,
  onOpenTeacherAccountModal,
  onCloseTeacherAccountModal,
  onToggleTeacherAccountStatus,
  onResetTeacherAccountPassword,
  confirmDialog,
  onConfirmDialogClose,
}) {
  const isViewOnly = teacherModalMode === 'detail'
  const roleLabelMap = {
    student: 'Sinh viên',
    teacher: 'Giảng viên',
    admin: 'Quản trị viên',
  }

  const handleImportInputChange = (event) => {
    const selectedFile = event.target.files?.[0]
    onTeacherImportFileChange(selectedFile)
    event.target.value = ''
  }

  const handleReopenImportModal = () => {
    onCloseTeacherImportPreview()
    onOpenTeacherImportModal()
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

        <div className="student-toolbar-actions">
          <button type="button" className="add-student-button" onClick={onOpenCreateTeacherModal}>
            Thêm giảng viên mới
          </button>

          <button type="button" className="import-student-button" onClick={onOpenTeacherImportModal}>
            Import file giảng viên
          </button>
        </div>
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
                Số căn cước công dân
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

      {isTeacherImportModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h3>Chuẩn bị import giảng viên</h3>
              <button type="button" className="modal-close" onClick={onCloseTeacherImportModal}>×</button>
            </div>

            <div className="import-helper-block">
              <p className="student-form-notice import-helper-note">
                Dùng đúng header chuẩn của hệ thống. Chấp nhận file .csv, .xlsx và .xls.
                <br />
                Lưu ý: xóa dòng dữ liệu mẫu trước khi import vào hệ thống.
              </p>

              <div className="import-template-actions">
                <a className="template-download-button" href="/templates/teachers-import-template.csv" download>
                  Tải file mẫu CSV
                </a>
                <a className="template-download-button" href="/templates/teachers-import-template.xlsx" download>
                  Tải file mẫu Excel
                </a>
              </div>

              <label className="import-file-picker">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleImportInputChange}
                />
                <span>{teacherImportFileName ? 'Chọn file khác' : 'Chọn file import'}</span>
              </label>

              <p className="import-file-name">{teacherImportFileName || 'Chưa chọn file nào.'}</p>

              {teachersError && <p className="dashboard-error import-inline-error">{teachersError}</p>}
            </div>

            <div className="modal-actions full-width">
              <button type="button" disabled={isTeachersImporting} onClick={onImportTeachersCsv}>
                {isTeachersImporting ? 'Đang kiểm tra...' : 'Kiểm tra dữ liệu'}
              </button>
              <button type="button" className="ghost" onClick={onCloseTeacherImportModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {isTeacherImportPreviewOpen && teacherImportPreview && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Kết quả kiểm tra file import</h3>
              <button type="button" className="modal-close" onClick={onCloseTeacherImportPreview}>×</button>
            </div>

            <div className="import-summary-grid">
              <div className="import-summary-card">
                <strong>{teacherImportPreview.summary?.totalRows || 0}</strong>
                <span>Tổng số dòng</span>
              </div>
              <div className="import-summary-card success">
                <strong>{teacherImportPreview.summary?.validRows || 0}</strong>
                <span>Dòng hợp lệ</span>
              </div>
              <div className="import-summary-card error">
                <strong>{Array.isArray(teacherImportPreview.errors) ? teacherImportPreview.errors.length : 0}</strong>
                <span>Dòng lỗi</span>
              </div>
            </div>

            {Array.isArray(teacherImportPreview.errors) && teacherImportPreview.errors.length > 0 ? (
              <div className="student-table-wrap">
                <table className="student-table">
                  <thead>
                    <tr>
                      <th>Dòng</th>
                      <th>Nguyên nhân lỗi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherImportPreview.errors.map((errorItem, index) => (
                      <tr key={`${errorItem.rowNumber || 'unknown'}-${index}`}>
                        <td>{errorItem.rowNumber || '-'}</td>
                        <td>{errorItem.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="dashboard-loading">Không có dòng lỗi trong file.</p>
            )}

            <div className="modal-actions full-width">
              <button
                type="button"
                disabled={isTeacherImportCommitting || !(teacherImportPreview.summary?.validRows > 0)}
                onClick={onCommitTeachersImport}
              >
                {isTeacherImportCommitting ? 'Đang lưu...' : 'Lưu các dòng hợp lệ'}
              </button>
              <button type="button" className="ghost" onClick={handleReopenImportModal}>
                Chọn file khác
              </button>
              <button type="button" className="ghost" onClick={onCloseTeacherImportPreview}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {teacherImportSuccess && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Import thành công</h3>
              <button type="button" className="modal-close" onClick={onCloseTeacherImportSuccess}>×</button>
            </div>

            <p className="student-form-notice">
              Đã lưu thành công {teacherImportSuccess.createdRows} giảng viên lên hệ thống.
            </p>

            <div className="modal-actions full-width">
              <button type="button" onClick={onCloseTeacherImportSuccess}>
                Đóng
              </button>
            </div>
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

      <ConfirmDialog
        isOpen={confirmDialog?.isOpen}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={onConfirmDialogClose}
        confirmLabel="Xác nhận"
        isDangerous
      />
    </div>
  )
}

export default TeacherManagementView
