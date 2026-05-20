import { formatDateForDisplay } from '../../../shared/utils/date'

function SemesterManagementView({
  semesterSearchKeyword,
  onSemesterSearchKeywordChange,
  onSemesterSearchSubmit,
  onOpenCreateSemester,
  semestersError,
  isSemestersLoading,
  semesters,
  onOpenSemesterDetail,
  isSemesterModalOpen,
  semesterModalMode,
  semesterForm,
  semesterFormErrors,
  semesterFormNotice,
  isSemesterSaving,
  onSemesterModalClose,
  onSemesterFormSubmit,
  onSemesterFormChange,
  onStartEditing,
  onCancelEditing,
}) {
  const isViewOnly = semesterModalMode === 'detail'
  const isCreateMode = semesterModalMode === 'create'
  const isEditingMode = semesterModalMode === 'editing'

  return (
    <div className="dashboard-main">
      <div className="overview-header">
        <h2>Quản lý học kỳ</h2>
        <p>Quản lý mã, tên và thời gian bắt đầu/kết thúc học kỳ</p>
      </div>

      <div className="student-toolbar">
        <form className="student-search" onSubmit={onSemesterSearchSubmit}>
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên học kỳ"
            value={semesterSearchKeyword}
            onChange={(event) => onSemesterSearchKeywordChange(event.target.value)}
          />
          <button type="submit">Tìm kiếm</button>
        </form>

        <div className="student-toolbar-actions">
          <button type="button" className="add-student-button" onClick={onOpenCreateSemester}>
            Thêm học kỳ mới
          </button>
        </div>
      </div>

      {semestersError && <p className="dashboard-error">{semestersError}</p>}

      {isSemestersLoading ? (
        <p className="dashboard-loading">Đang tải danh sách học kỳ...</p>
      ) : (
        <div className="student-table-wrap">
          <table className="student-table">
            <thead>
              <tr>
                <th>Mã học kỳ</th>
                <th>Tên học kỳ</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {semesters.length ? (
                semesters.map((semester) => (
                  <tr key={semester._id}>
                    <td>{semester.code}</td>
                    <td>{semester.name}</td>
                    <td>{formatDateForDisplay(semester.startDate)}</td>
                    <td>{formatDateForDisplay(semester.endDate)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="table-button"
                          onClick={() => onOpenSemesterDetail(semester._id)}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="table-empty">Chưa có học kỳ nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isSemesterModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>
                {isCreateMode
                  ? 'Thêm học kỳ mới'
                  : isViewOnly
                    ? 'Thông tin chi tiết học kỳ'
                    : 'Chỉnh sửa học kỳ'}
              </h3>
              <button type="button" className="modal-close" onClick={onSemesterModalClose}>×</button>
            </div>

            <form className="student-form" onSubmit={onSemesterFormSubmit} noValidate>
              <label className="full-width">
                Mã học kỳ
                <input
                  type="text"
                  name="code"
                  value={semesterForm.code}
                  onChange={onSemesterFormChange}
                  disabled={!isCreateMode || isSemesterSaving}
                />
                {semesterFormErrors.code && <p className="field-error">{semesterFormErrors.code}</p>}
              </label>

              <label className="full-width">
                Tên học kỳ
                <input
                  type="text"
                  name="name"
                  value={semesterForm.name}
                  onChange={onSemesterFormChange}
                  disabled={isViewOnly || isSemesterSaving}
                />
                {semesterFormErrors.name && <p className="field-error">{semesterFormErrors.name}</p>}
              </label>

              <label className="full-width">
                Ngày bắt đầu
                {isViewOnly ? (
                  <input type="text" value={semesterForm.startDate || ''} disabled />
                ) : (
                  <input
                    type="text"
                    name="startDate"
                    value={semesterForm.startDate}
                    onChange={onSemesterFormChange}
                    placeholder="dd/mm/yyyy"
                    disabled={isSemesterSaving}
                  />
                )}
                {semesterFormErrors.startDate && <p className="field-error">{semesterFormErrors.startDate}</p>}
              </label>

              <label className="full-width">
                Ngày kết thúc
                {isViewOnly ? (
                  <input type="text" value={semesterForm.endDate || ''} disabled />
                ) : (
                  <input
                    type="text"
                    name="endDate"
                    value={semesterForm.endDate}
                    onChange={onSemesterFormChange}
                    placeholder="dd/mm/yyyy"
                    disabled={isSemesterSaving}
                  />
                )}
                {semesterFormErrors.endDate && <p className="field-error">{semesterFormErrors.endDate}</p>}
              </label>

              {semesterFormNotice && <p className="student-form-notice">{semesterFormNotice}</p>}

              <div className="modal-actions full-width">
                {isCreateMode && (
                  <>
                    <button type="submit" disabled={isSemesterSaving}>
                      {isSemesterSaving ? 'Đang lưu...' : 'Lưu thông tin'}
                    </button>
                    <button type="button" className="ghost" onClick={onSemesterModalClose}>
                      Đóng
                    </button>
                  </>
                )}

                {isViewOnly && (
                  <>
                    <button type="button" onClick={onStartEditing}>
                      Chỉnh sửa thông tin
                    </button>
                    <button type="button" className="ghost" onClick={onSemesterModalClose}>
                      Đóng
                    </button>
                  </>
                )}

                {isEditingMode && (
                  <>
                    <button type="submit" disabled={isSemesterSaving}>
                      {isSemesterSaving ? 'Đang lưu...' : 'Lưu thông tin'}
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
    </div>
  )
}

export default SemesterManagementView
