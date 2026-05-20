import { useState } from 'react'
import ConfirmDialog from '../../../shared/components/ConfirmDialog'
import ClassStudentListModal from './ClassStudentListModal'

function ClassManagementView({
  classSearchKeyword,
  onClassSearchKeywordChange,
  onClassSearchSubmit,
  onOpenCreateClass,
  classesError,
  classFeatureNotice,
  isClassesLoading,
  classes,
  onOpenClassDetail,
  isClassModalOpen,
  classModalMode,
  isViewOnly,
  isCreateMode,
  isEditingMode,
  onClassModalClose,
  onClassFormSubmit,
  classForm,
  onClassFormChange,
  classFormErrors,
  classFormNotice,
  isClassSaving,
  filteredAvailableSubjects,
  subjectPickerKeyword,
  subjectPickerId,
  onSubjectPickerKeywordChange,
  onSubjectPickerKeywordSelect,
  onSubjectPickerIdChange,
  filteredAvailableTeachers,
  availableSemesters,
  teacherPickerKeyword,
  teacherPickerId,
  onTeacherPickerKeywordChange,
  onTeacherPickerKeywordSelect,
  onTeacherPickerIdChange,
  onStartEditing,
  onCancelEditing,
  onDeleteClass,
  confirmDialog,
  onConfirmDialogClose,
}) {
  const [isSubjectOptionsOpen, setIsSubjectOptionsOpen] = useState(false)
  const [isTeacherOptionsOpen, setIsTeacherOptionsOpen] = useState(false)
  const [isStudentListOpen, setIsStudentListOpen] = useState(false)

  const handleSubjectOptionSelect = (subject) => {
    onSubjectPickerIdChange(subject._id)
    onSubjectPickerKeywordSelect(`${subject.subjectCode} - ${subject.name}`)
    setIsSubjectOptionsOpen(false)
  }

  const handleTeacherOptionSelect = (teacher) => {
    onTeacherPickerIdChange(teacher._id)
    onTeacherPickerKeywordSelect(`${teacher.teacherCode} - ${teacher.fullName}`)
    setIsTeacherOptionsOpen(false)
  }

  return (
    <div className="dashboard-main">
      <div className="overview-header">
        <h2>Quản lý lớp học</h2>
        <p>Danh sách các lớp học trong hệ thống</p>
      </div>

      <div className="student-toolbar">
        <form className="student-search" onSubmit={onClassSearchSubmit}>
          <input
            type="text"
            placeholder="Tìm theo mã lớp hoặc mã/tên môn học"
            value={classSearchKeyword}
            onChange={(event) => onClassSearchKeywordChange(event.target.value)}
          />
          <button type="submit">Tìm kiếm</button>
        </form>

        <div className="student-toolbar-actions">
          <button type="button" className="add-student-button" onClick={onOpenCreateClass}>
            Thêm lớp học mới
          </button>
        </div>
      </div>

      {classFeatureNotice && <p className="dashboard-loading">{classFeatureNotice}</p>}
      {classesError && <p className="dashboard-error">{classesError}</p>}

      {isClassesLoading ? (
        <p className="dashboard-loading">Đang tải danh sách lớp học...</p>
      ) : (
        <div className="student-table-wrap">
          <table className="student-table">
            <thead>
              <tr>
                <th>Mã lớp</th>
                <th>Môn học</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {classes.length ? (
                classes.map((cls) => (
                  <tr key={cls._id}>
                    <td>{cls.classCode || '-'}</td>
                    <td>{cls.subject?.name || '-'}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="table-button"
                          onClick={() => onOpenClassDetail(cls._id)}
                        >
                          Xem chi tiết
                        </button>
                        <button
                          type="button"
                          className="table-button delete"
                          onClick={() => onDeleteClass(cls)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="table-empty">Không có lớp học phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isClassModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>
                {isCreateMode
                  ? 'Thêm lớp học mới'
                  : isViewOnly
                    ? 'Thông tin chi tiết lớp học'
                    : 'Chỉnh sửa lớp học'}
              </h3>
              <button type="button" className="modal-close" onClick={onClassModalClose}>×</button>
            </div>

            <form className="student-form" onSubmit={onClassFormSubmit} noValidate>
              <label className="full-width">
                Mã lớp học
                <input
                  type="text"
                  name="classCode"
                  value={classForm.classCode}
                  onChange={onClassFormChange}

                  disabled={isViewOnly || isClassSaving}
                />
                {classFormErrors.classCode && (
                  <p className="field-error">{classFormErrors.classCode}</p>
                )}
              </label>

              <label className="full-width">
                Môn học
                {isViewOnly ? (
                  <input type="text" value={subjectPickerKeyword || ''} disabled />
                ) : (
                  <div
                    className="curriculum-subject-combobox"
                    onBlur={() => window.setTimeout(() => setIsSubjectOptionsOpen(false), 120)}
                  >
                    <input
                      type="text"
                      placeholder="Tìm theo mã hoặc tên môn học"
                      value={subjectPickerKeyword}
                      onChange={(e) => {
                        onSubjectPickerKeywordChange(e.target.value)
                        setIsSubjectOptionsOpen(true)
                      }}
                      onFocus={() => setIsSubjectOptionsOpen(true)}
                      disabled={isClassSaving}
                    />
                    {isSubjectOptionsOpen && filteredAvailableSubjects.length > 0 && (
                      <div className="curriculum-subject-options" role="listbox">
                        {filteredAvailableSubjects.map((subject) => (
                          <button
                            key={subject._id}
                            type="button"
                            className={`curriculum-subject-option${String(subject._id) === subjectPickerId ? ' selected' : ''}`}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              handleSubjectOptionSelect(subject)
                            }}
                          >
                            {subject.subjectCode} - {subject.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {classFormErrors.subject && (
                  <p className="field-error">{classFormErrors.subject}</p>
                )}
              </label>

              <label className="full-width">
                Giảng viên
                {isViewOnly ? (
                  <input type="text" value={teacherPickerKeyword || ''} disabled />
                ) : (
                  <div
                    className="curriculum-subject-combobox"
                    onBlur={() => window.setTimeout(() => setIsTeacherOptionsOpen(false), 120)}
                  >
                    <input
                      type="text"
                      placeholder="Tìm theo mã hoặc tên giảng viên"
                      value={teacherPickerKeyword}
                      onChange={(e) => {
                        onTeacherPickerKeywordChange(e.target.value)
                        setIsTeacherOptionsOpen(true)
                      }}
                      onFocus={() => setIsTeacherOptionsOpen(true)}
                      disabled={isClassSaving}
                    />
                    {isTeacherOptionsOpen && filteredAvailableTeachers.length > 0 && (
                      <div className="curriculum-subject-options" role="listbox">
                        {filteredAvailableTeachers.map((teacher) => (
                          <button
                            key={teacher._id}
                            type="button"
                            className={`curriculum-subject-option${String(teacher._id) === teacherPickerId ? ' selected' : ''}`}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              handleTeacherOptionSelect(teacher)
                            }}
                          >
                            {teacher.teacherCode} - {teacher.fullName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {classFormErrors.teacher && (
                  <p className="field-error">{classFormErrors.teacher}</p>
                )}
              </label>

              <label className="full-width">
                Học kỳ
                <select
                  name="semester"
                  value={classForm.semester}
                  onChange={onClassFormChange}
                  disabled={isViewOnly || isClassSaving}
                >
                  <option value="" disabled>-- Chọn học kỳ --</option>
                  {availableSemesters.map((semester) => (
                    <option key={semester._id} value={semester.code}>
                      {semester.name}
                    </option>
                  ))}
                </select>
                {classFormErrors.semester && (
                  <p className="field-error">{classFormErrors.semester}</p>
                )}
              </label>

              {isViewOnly && (
                <label className="full-width">
                  Sĩ số
                  <input type="text" value={classForm.studentCount ?? 0} disabled />
                </label>
              )}

              <label className="full-width">
                Thứ học
                <select
                  name="dayOfWeek"
                  value={classForm.dayOfWeek}
                  onChange={onClassFormChange}
                  disabled={isViewOnly || isClassSaving}
                >
                  <option value="" disabled>-- Chọn thứ học --</option>
                  <option value="2">Thứ Hai</option>
                  <option value="3">Thứ Ba</option>
                  <option value="4">Thứ Tư</option>
                  <option value="5">Thứ Năm</option>
                  <option value="6">Thứ Sáu</option>
                  <option value="7">Thứ Bảy</option>
                  <option value="1">Chủ Nhật</option>
                </select>
                {classFormErrors.dayOfWeek && (
                  <p className="field-error">{classFormErrors.dayOfWeek}</p>
                )}
              </label>

              <label className="full-width">
                Giờ bắt đầu
                <input
                  type="text"
                  name="startTime"
                  value={classForm.startTime}
                  onChange={onClassFormChange}
                  placeholder="HH:MM"
                  disabled={isViewOnly || isClassSaving}
                />
                {classFormErrors.startTime && (
                  <p className="field-error">{classFormErrors.startTime}</p>
                )}
              </label>

              <label className="full-width">
                Giờ kết thúc
                <input
                  type="text"
                  name="endTime"
                  value={classForm.endTime}
                  onChange={onClassFormChange}
                  placeholder="HH:MM"
                  disabled={isViewOnly || isClassSaving}
                />
                {classFormErrors.endTime && (
                  <p className="field-error">{classFormErrors.endTime}</p>
                )}
              </label>

              <label className="full-width">
                Phòng học
                <input
                  type="text"
                  name="room"
                  value={classForm.room}
                  onChange={onClassFormChange}
                  disabled={isViewOnly || isClassSaving}
                />
                {classFormErrors.room && (
                  <p className="field-error">{classFormErrors.room}</p>
                )}
              </label>

              {classFormNotice && <p className="student-form-notice">{classFormNotice}</p>}

              <div className="modal-actions full-width">
                {isCreateMode && (
                  <>
                    <button type="submit" disabled={isClassSaving}>
                      {isClassSaving ? 'Đang lưu...' : 'Lưu thông tin'}
                    </button>
                    <button type="button" className="ghost" onClick={onClassModalClose}>
                      Đóng
                    </button>
                  </>
                )}

                {isViewOnly && (
                  <>
                    <button type="button" onClick={onStartEditing}>
                      Chỉnh sửa thông tin
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsStudentListOpen(true)}
                    >
                      Xem danh sách sinh viên
                    </button>
                    <button type="button" className="ghost" onClick={onClassModalClose}>
                      Đóng
                    </button>
                  </>
                )}

                {isEditingMode && (
                  <>
                    <button type="submit" disabled={isClassSaving}>
                      {isClassSaving ? 'Đang lưu...' : 'Lưu thông tin'}
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

      <ClassStudentListModal
        classId={classForm._id}
        classCode={classForm.classCode}
        isOpen={isStudentListOpen}
        onClose={() => setIsStudentListOpen(false)}
      />
    </div>
  )
}

export default ClassManagementView
