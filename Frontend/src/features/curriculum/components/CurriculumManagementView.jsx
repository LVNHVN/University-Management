import { useState } from 'react'
import ConfirmDialog from '../../../shared/components/ConfirmDialog'

function CurriculumManagementView({
  curriculumSearchKeyword,
  onCurriculumSearchKeywordChange,
  onCurriculumSearchSubmit,
  onOpenCreateCurriculum,
  curriculumsError,
  curriculumFeatureNotice,
  isCurriculumsLoading,
  curriculums,
  onOpenCurriculumDetail,
  isCurriculumModalOpen,
  curriculumModalMode,
  isViewOnly,
  isCreateMode,
  isEditingMode,
  onCurriculumModalClose,
  onCurriculumFormSubmit,
  curriculumForm,
  onCurriculumFormChange,
  curriculumFormErrors,
  curriculumFormNotice,
  isCurriculumSaving,
  filteredAvailableSubjects,
  selectedSubjectItems,
  totalSelectedCredits,
  subjectPickerKeyword,
  subjectPickerId,
  subjectPickerSemester,
  subjectPickerError,
  onSubjectPickerKeywordChange,
  onSubjectPickerKeywordSelect,
  onSubjectPickerIdChange,
  onSubjectPickerSemesterChange,
  onAddSubjectToCurriculum,
  onRemoveSubjectFromCurriculum,
  onStartEditing,
  onCancelEditing,
  onDeleteCurriculum,
  confirmDialog,
  onConfirmDialogClose,
}) {
  const [isSubjectOptionsOpen, setIsSubjectOptionsOpen] = useState(false)

  const handleSubjectOptionSelect = (subject) => {
    onSubjectPickerIdChange(subject._id)
    onSubjectPickerKeywordSelect(`${subject.subjectCode} - ${subject.name}`)
    setIsSubjectOptionsOpen(false)
  }

  return (
    <div className="dashboard-main">
      <div className="overview-header">
        <h2>Quản lý chương trình đào tạo</h2>
        <p>Danh sách các ngành/chương trình đào tạo trong hệ thống</p>
      </div>

      <div className="student-toolbar">
        <form className="student-search" onSubmit={onCurriculumSearchSubmit}>
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên chương trình đào tạo"
            value={curriculumSearchKeyword}
            onChange={(event) => onCurriculumSearchKeywordChange(event.target.value)}
          />
          <button type="submit">Tìm kiếm</button>
        </form>

        <div className="student-toolbar-actions">
          <button type="button" className="add-student-button" onClick={onOpenCreateCurriculum}>
            Thêm mới chương trình đào tạo
          </button>
        </div>
      </div>

      {curriculumFeatureNotice && <p className="dashboard-loading">{curriculumFeatureNotice}</p>}
      {curriculumsError && <p className="dashboard-error">{curriculumsError}</p>}

      {isCurriculumsLoading ? (
        <p className="dashboard-loading">Đang tải danh sách chương trình đào tạo...</p>
      ) : (
        <div className="student-table-wrap">
          <table className="student-table">
            <thead>
              <tr>
                <th>Mã chương trình</th>
                <th>Tên chương trình</th>
                <th>Tổng tín chỉ</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {curriculums.length ? (
                curriculums.map((curriculum) => (
                  <tr key={curriculum._id}>
                    <td>{curriculum.curriculumCode || '-'}</td>
                    <td>{curriculum.name || '-'}</td>
                    <td>{curriculum.totalCredits ?? '-'}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="table-button"
                          onClick={() => onOpenCurriculumDetail(curriculum._id)}
                        >
                          Xem chi tiết
                        </button>
                        <button
                          type="button"
                          className="table-button delete"
                          onClick={() => onDeleteCurriculum(curriculum)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="table-empty">Không có chương trình đào tạo phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isCurriculumModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>
                {isCreateMode
                  ? 'Thêm mới chương trình đào tạo'
                  : isViewOnly
                    ? 'Thông tin chi tiết chương trình đào tạo'
                    : 'Chỉnh sửa chương trình đào tạo'}
              </h3>
              <button type="button" className="modal-close" onClick={onCurriculumModalClose}>×</button>
            </div>

            <form className="student-form" onSubmit={onCurriculumFormSubmit} noValidate>
              <label className="full-width">
                Mã chương trình đào tạo
                <input
                  type="text"
                  name="curriculumCode"
                  value={curriculumForm.curriculumCode}
                  onChange={onCurriculumFormChange}
                  disabled={isViewOnly}
                />
                {curriculumFormErrors.curriculumCode && <p className="field-error">{curriculumFormErrors.curriculumCode}</p>}
              </label>

              <label className="full-width">
                Tên chương trình đào tạo
                <input
                  type="text"
                  name="name"
                  value={curriculumForm.name}
                  onChange={onCurriculumFormChange}
                  disabled={isViewOnly}
                />
                {curriculumFormErrors.name && <p className="field-error">{curriculumFormErrors.name}</p>}
              </label>

              <div className="curriculum-subject-section full-width">
                <div className="curriculum-subject-section-title">
                  <span>Danh sách môn học</span>
                  <span className="curriculum-total-credits">
                    Tổng tín chỉ: <strong>{totalSelectedCredits}</strong>
                  </span>
                </div>

                {!isViewOnly && (
                  <div className="curriculum-subject-picker">
                    <div className="curriculum-subject-combobox">
                      <input
                        type="text"
                        placeholder="Chọn môn học"
                        value={subjectPickerKeyword}
                        onChange={(e) => {
                          onSubjectPickerKeywordChange(e.target.value)
                          setIsSubjectOptionsOpen(true)
                        }}
                        onFocus={() => setIsSubjectOptionsOpen(true)}
                        onBlur={() => {
                          window.setTimeout(() => setIsSubjectOptionsOpen(false), 120)
                        }}
                      />

                      {isSubjectOptionsOpen && filteredAvailableSubjects.length > 0 && (
                        <div className="curriculum-subject-options" role="listbox">
                          {filteredAvailableSubjects.map((subject) => (
                            <button
                              key={subject._id}
                              type="button"
                              className="curriculum-subject-option"
                              onMouseDown={(event) => {
                                event.preventDefault()
                                handleSubjectOptionSelect(subject)
                              }}
                            >
                              {subject.subjectCode} - {subject.name} ({subject.credits} tín chỉ)
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Học kỳ"
                      value={subjectPickerSemester}
                      onChange={(e) => onSubjectPickerSemesterChange(e.target.value)}
                    />
                    <button type="button" className="curriculum-add-subject-btn" onClick={onAddSubjectToCurriculum}>
                      Thêm
                    </button>
                  </div>
                )}

                {!isViewOnly && subjectPickerError && <p className="field-error">{subjectPickerError}</p>}
                {!isViewOnly && !subjectPickerError && subjectPickerKeyword.trim() && filteredAvailableSubjects.length === 0 && (
                  <p className="import-file-name">Không tìm thấy môn học phù hợp với từ khóa.</p>
                )}

                {selectedSubjectItems.length > 0 ? (
                  <table className="curriculum-subjects-table">
                    <thead>
                      <tr>
                        <th>Mã môn</th>
                        <th>Tên môn</th>
                        <th>Tín chỉ</th>
                        <th>Học kỳ</th>
                        {!isViewOnly && <th></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSubjectItems.map((item) => (
                        <tr key={item.subjectId}>
                          <td>{item.subjectCode}</td>
                          <td>{item.name}</td>
                          <td>{item.credits}</td>
                          <td>{item.recommendedSemester}</td>
                          {!isViewOnly && (
                            <td>
                              <button
                                type="button"
                                className="table-button delete"
                                onClick={() => onRemoveSubjectFromCurriculum(item.subjectId)}
                              >
                                Xóa
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="import-file-name">Chưa có môn học trong chương trình đào tạo.</p>
                )}
              </div>

              {curriculumFormNotice && <p className="student-form-notice">{curriculumFormNotice}</p>}

              <div className="modal-actions full-width">
                {isCreateMode && (
                  <>
                    <button type="submit" disabled={isCurriculumSaving}>
                      {isCurriculumSaving ? 'Đang lưu...' : 'Lưu thông tin'}
                    </button>
                    <button type="button" className="ghost" onClick={onCurriculumModalClose}>
                      Đóng
                    </button>
                  </>
                )}

                {isViewOnly && (
                  <>
                    <button type="button" onClick={onStartEditing}>
                      Chỉnh sửa thông tin
                    </button>
                    <button type="button" className="ghost" onClick={onCurriculumModalClose}>
                      Đóng
                    </button>
                  </>
                )}

                {isEditingMode && (
                  <>
                    <button type="submit" disabled={isCurriculumSaving}>
                      {isCurriculumSaving ? 'Đang lưu...' : 'Lưu thông tin'}
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

export default CurriculumManagementView
