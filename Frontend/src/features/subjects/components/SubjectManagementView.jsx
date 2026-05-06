import { useState } from 'react'
import { API_BASE_URL } from '../../../shared/constants/api'
import ConfirmDialog from '../../../shared/components/ConfirmDialog'

function SubjectManagementView({
  subjectSearchKeyword,
  onSubjectSearchKeywordChange,
  onSubjectSearchSubmit,
  onOpenCreateSubjectModal,
  subjectsError,
  isSubjectsLoading,
  subjects,
  onOpenSubjectDetailModal,
  onDeleteSubject,
  onStartEditing,
  onCancelEditing,
  isSubjectModalOpen,
  subjectModalMode,
  onSubjectModalClose,
  onSubjectFormSubmit,
  subjectForm,
  onSubjectFormChange,
  subjectSyllabus,
  subjectSyllabusFileName,
  removeSubjectSyllabus,
  onSubjectSyllabusFileChange,
  onRemoveSubjectSyllabus,
  subjectFormErrors,
  subjectFormNotice,
  isSubjectSaving,
  confirmDialog,
  onConfirmDialogClose,
}) {
  const isViewOnly = subjectModalMode === 'detail'
  const isCreateMode = subjectModalMode === 'create'
  const isEditingMode = subjectModalMode === 'editing'
  const syllabusDownloadUrl = subjectSyllabus?.filePath ? `${API_BASE_URL}${subjectSyllabus.filePath}` : ''
  const canPreviewSyllabus = Boolean(syllabusDownloadUrl) && !removeSubjectSyllabus
  const [isSyllabusPreviewOpen, setIsSyllabusPreviewOpen] = useState(false)

  const handleCloseSubjectModal = () => {
    setIsSyllabusPreviewOpen(false)
    onSubjectModalClose()
  }

  return (
    <div className="dashboard-main">
      <div className="overview-header">
        <h2>Quản lý môn học</h2>
        <p>Danh sách và thông tin chi tiết môn học</p>
      </div>

      <div className="student-toolbar">
        <form className="student-search" onSubmit={onSubjectSearchSubmit}>
          <input
            type="text"
            placeholder="Tìm theo mã môn học hoặc tên môn học"
            value={subjectSearchKeyword}
            onChange={(event) => onSubjectSearchKeywordChange(event.target.value)}
          />
          <button type="submit">Tìm kiếm</button>
        </form>

        <div className="student-toolbar-actions">
          <button type="button" className="add-student-button" onClick={onOpenCreateSubjectModal}>
            Thêm môn học mới
          </button>
        </div>
      </div>

      {subjectsError && <p className="dashboard-error">{subjectsError}</p>}

      {isSubjectsLoading ? (
        <p className="dashboard-loading">Đang tải danh sách môn học...</p>
      ) : (
        <div className="student-table-wrap">
          <table className="student-table">
            <thead>
              <tr>
                <th>Mã môn học</th>
                <th>Tên môn học</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {subjects.length ? (
                subjects.map((subject) => (
                  <tr key={subject._id}>
                    <td>{subject.subjectCode}</td>
                    <td>{subject.name}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="table-button"
                          onClick={() => onOpenSubjectDetailModal(subject._id)}
                        >
                          Xem chi tiết
                        </button>
                        <button
                          type="button"
                          className="table-button delete"
                          onClick={() => onDeleteSubject(subject)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="table-empty">Không có môn học phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isSubjectModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>
                {isCreateMode ? 'Thêm môn học mới' : isViewOnly ? 'Thông tin chi tiết môn học' : 'Chỉnh sửa thông tin môn học'}
              </h3>
              <button type="button" className="modal-close" onClick={handleCloseSubjectModal}>×</button>
            </div>

            <form className="student-form" onSubmit={onSubjectFormSubmit} noValidate>
              <label className="full-width">
                Mã môn học
                <input
                  type="text"
                  name="subjectCode"
                  value={subjectForm.subjectCode}
                  onChange={onSubjectFormChange}
                  disabled={isViewOnly}
                />
                {subjectFormErrors.subjectCode && <p className="field-error">{subjectFormErrors.subjectCode}</p>}
              </label>

              <label className="full-width">
                Tên môn học
                <input
                  type="text"
                  name="name"
                  value={subjectForm.name}
                  onChange={onSubjectFormChange}
                  disabled={isViewOnly}
                />
                {subjectFormErrors.name && <p className="field-error">{subjectFormErrors.name}</p>}
              </label>

              <label className="full-width">
                Khoa/viện phụ trách
                <input
                  type="text"
                  name="department"
                  value={subjectForm.department}
                  onChange={onSubjectFormChange}
                  disabled={isViewOnly}
                />
                {subjectFormErrors.department && <p className="field-error">{subjectFormErrors.department}</p>}
              </label>

              <label>
                Số tín chỉ
                <input
                  type="number"
                  min="1"
                  step="1"
                  name="credits"
                  value={subjectForm.credits}
                  onChange={onSubjectFormChange}
                  disabled={isViewOnly}
                />
                {subjectFormErrors.credits && <p className="field-error">{subjectFormErrors.credits}</p>}
              </label>

              <label>
                Trọng số thi cuối kỳ
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  name="finalWeight"
                  value={subjectForm.finalWeight}
                  onChange={onSubjectFormChange}
                  disabled={isViewOnly}
                />
                {subjectFormErrors.finalWeight && <p className="field-error">{subjectFormErrors.finalWeight}</p>}
              </label>

              <div className="student-field full-width">
                <span>Đề cương chi tiết môn học</span>

                {subjectSyllabus?.filePath && !removeSubjectSyllabus && (
                  <div className="subject-syllabus-card">
                    <p className="subject-syllabus-name">{subjectSyllabus.fileName}</p>
                    <div className="subject-syllabus-actions">
                      <button
                        type="button"
                        className="table-button"
                        onClick={() => setIsSyllabusPreviewOpen(true)}
                      >
                        Xem đề cương
                      </button>
                      {!isViewOnly && (
                        <button
                          type="button"
                          className="table-button delete"
                          onClick={onRemoveSubjectSyllabus}
                        >
                          Xóa file hiện tại
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {!isViewOnly && (
                  <div className="subject-syllabus-picker">
                    <label className="import-file-picker">
                      Chọn file PDF
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(event) => {
                          onSubjectSyllabusFileChange(event.target.files?.[0])
                          event.target.value = ''
                        }}
                      />
                    </label>

                    {subjectSyllabusFileName ? (
                      <div className="subject-syllabus-card compact">
                        <p className="subject-syllabus-name">File mới: {subjectSyllabusFileName}</p>
                        <button
                          type="button"
                          className="table-button delete"
                          onClick={onRemoveSubjectSyllabus}
                        >
                          Bỏ file đã chọn
                        </button>
                      </div>
                    ) : (
                      <p className="import-file-name">
                        {removeSubjectSyllabus ? 'Đề cương hiện tại sẽ bị xóa khi lưu.' : 'Chưa chọn file PDF mới.'}
                      </p>
                    )}
                  </div>
                )}

                {isViewOnly && !subjectSyllabus?.filePath && <p className="import-file-name">Chưa có đề cương môn học.</p>}
                {subjectFormErrors.syllabusFile && <p className="field-error">{subjectFormErrors.syllabusFile}</p>}
              </div>

              {subjectFormNotice && <p className="student-form-notice">{subjectFormNotice}</p>}

              <div className="modal-actions full-width">
                {isCreateMode && (
                  <>
                    <button type="submit" disabled={isSubjectSaving}>
                      {isSubjectSaving ? 'Đang lưu...' : 'Lưu thông tin'}
                    </button>
                    <button type="button" className="ghost" onClick={handleCloseSubjectModal}>
                      Đóng
                    </button>
                  </>
                )}

                {isViewOnly && (
                  <>
                    <button type="button" onClick={onStartEditing}>
                      Chỉnh sửa thông tin
                    </button>
                    <button type="button" className="ghost" onClick={handleCloseSubjectModal}>
                      Đóng
                    </button>
                  </>
                )}

                {isEditingMode && (
                  <>
                    <button type="submit" disabled={isSubjectSaving}>
                      {isSubjectSaving ? 'Đang lưu...' : 'Lưu thông tin'}
                    </button>
                    <button type="button" className="ghost" onClick={onCancelEditing}>
                      Hủy chỉnh sửa
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {isSubjectModalOpen && canPreviewSyllabus && isSyllabusPreviewOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card syllabus-preview-modal">
            <div className="modal-header">
              <h3>Xem đề cương môn học</h3>
              <button type="button" className="modal-close" onClick={() => setIsSyllabusPreviewOpen(false)}>×</button>
            </div>

            <div className="subject-syllabus-preview">
              <iframe
                src={syllabusDownloadUrl}
                title="Xem trước đề cương môn học"
              />
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
        confirmLabel="Xóa"
        isDangerous
      />
    </div>
  )
}

export default SubjectManagementView
