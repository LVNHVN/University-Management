import { useCallback, useEffect, useState } from 'react'
import { fetchClassStudents, importClassGrades, updateClassStudentGrades } from '../../classes/services/classService'

const toScore = (value) => {
  if (value == null || value === '') {
    return null
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return null
  }

  return parsed
}

function TeacherClassStudentsPage({ classId, classCode, onBack }) {
  const [students, setStudents] = useState([])
  const [subjectFinalWeight, setSubjectFinalWeight] = useState(0.5)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [draftGrades, setDraftGrades] = useState({})
  const [isSavingGrades, setIsSavingGrades] = useState(false)
  const [isEditingGrades, setIsEditingGrades] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importFileName, setImportFileName] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  const loadStudents = useCallback(async () => {
    if (!classId) {
      setStudents([])
      return
    }

      setIsLoading(true)
      setError('')

      try {
        const response = await fetchClassStudents(classId)
        const list = Array.isArray(response?.data?.students) ? response.data.students : []
        setStudents(list.map((student) => ({
          ...student,
          gradeProcess: student.gradeProcess ?? '',
          gradeFinal: student.gradeFinal ?? '',
        })))
        setDraftGrades({})
        setIsEditingGrades(false)
        const finalWeight = Number(response?.data?.subjectFinalWeight)
        if (Number.isFinite(finalWeight) && finalWeight >= 0 && finalWeight <= 1) {
          setSubjectFinalWeight(finalWeight)
        } else {
          setSubjectFinalWeight(0.5)
        }
      } catch (requestError) {
        const backendMessage = requestError.response?.data?.message
        setError(backendMessage || 'Không tải được danh sách sinh viên của lớp.')
        setStudents([])
        setDraftGrades({})
        setIsEditingGrades(false)
        setSubjectFinalWeight(0.5)
      } finally {
        setIsLoading(false)
      }
  }, [classId])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const processWeight = 1 - subjectFinalWeight
  const isHalfStepScore = (score) => {
    if (!Number.isFinite(score)) {
      return false
    }

    return Math.abs((score * 2) - Math.round(score * 2)) < 1e-9
  }

  const isSameNullableScore = (a, b) => {
    if (a == null && b == null) {
      return true
    }

    return a === b
  }

  const computeTotal = (student) => {
    const processScore = toScore(student.gradeProcess)
    const finalScore = toScore(student.gradeFinal)

    if (processScore == null || finalScore == null) {
      return '-'
    }

    const total = processScore * processWeight + finalScore * subjectFinalWeight
    return total.toFixed(2)
  }

  const handleGradeChange = (enrollmentId, field, nextValue) => {
    setDraftGrades((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...(prev[enrollmentId] || {}),
        [field]: nextValue,
      },
    }))
  }

  const handleConfirmSaveGrades = async () => {
    const updates = students
      .map((student) => {
        const draft = draftGrades[student.enrollmentId]
        if (!draft) {
          return null
        }

        const nextProcessRaw = draft.gradeProcess ?? student.gradeProcess
        const nextFinalRaw = draft.gradeFinal ?? student.gradeFinal
        const gradeProcess = toScore(nextProcessRaw)
        const gradeFinal = toScore(nextFinalRaw)

        const currentProcess = toScore(student.gradeProcess)
        const currentFinal = toScore(student.gradeFinal)
        const unchanged = isSameNullableScore(gradeProcess, currentProcess) && isSameNullableScore(gradeFinal, currentFinal)
        if (unchanged) {
          return null
        }

        return {
          enrollmentId: student.enrollmentId,
          gradeProcess,
          gradeFinal,
        }
      })
      .filter(Boolean)

    if (!updates.length) {
      setIsEditingGrades(false)
      return
    }

    const invalidGrade = updates.find((item) => (
      (item.gradeProcess != null && (
        !Number.isFinite(item.gradeProcess)
        || item.gradeProcess < 0
        || item.gradeProcess > 10
        || !isHalfStepScore(item.gradeProcess)
      ))
      || (item.gradeFinal != null && (
        !Number.isFinite(item.gradeFinal)
        || item.gradeFinal < 0
        || item.gradeFinal > 10
        || !isHalfStepScore(item.gradeFinal)
      ))
    ))

    if (invalidGrade) {
      setError('Điểm quá trình và điểm cuối kỳ phải từ 0 đến 10, theo bước 0.5.')
      return
    }

    setIsSavingGrades(true)
    setError('')

    try {
      for (const updateItem of updates) {
        const response = await updateClassStudentGrades(classId, updateItem.enrollmentId, {
          gradeProcess: updateItem.gradeProcess,
          gradeFinal: updateItem.gradeFinal,
        })

        setStudents((prev) => prev.map((item) => {
          if (item.enrollmentId !== updateItem.enrollmentId) {
            return item
          }

          return {
            ...item,
            gradeProcess: response?.grade?.gradeProcess ?? updateItem.gradeProcess,
            gradeFinal: response?.grade?.gradeFinal ?? updateItem.gradeFinal,
          }
        }))
      }

      setDraftGrades({})
      setIsEditingGrades(false)
    } catch (requestError) {
      const backendMessage = requestError.response?.data?.message
      setError(backendMessage || 'Không cập nhật được điểm sinh viên.')
    } finally {
      setIsSavingGrades(false)
    }
  }

  const handleImportInputChange = (event) => {
    const nextFile = event.target.files?.[0] || null
    setImportFile(nextFile)
    setImportFileName(nextFile?.name || '')
  }

  const handleImportGrades = async () => {
    if (!importFile) {
      setError('Vui lòng chọn file điểm trước khi import.')
      return
    }

    setIsImporting(true)
    setError('')

    try {
      const payload = await importClassGrades(classId, importFile)
      setImportResult(payload)
      await loadStudents()
    } catch (requestError) {
      const backendMessage = requestError.response?.data?.message
      setError(backendMessage || 'Không import được file điểm.')
    } finally {
      setIsImporting(false)
    }
  }

  const handleCloseImportModal = () => {
    if (isImporting) {
      return
    }

    setIsImportModalOpen(false)
    setImportFile(null)
    setImportFileName('')
    setImportResult(null)
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-main">
        <div className="overview-header">
          <h2>Danh sách sinh viên lớp {classCode || ''}</h2>
          <p>Danh sách sinh viên thuộc lớp giảng viên đang phụ trách</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div className="student-toolbar-actions">
            <button type="button" className="table-button" onClick={onBack}>
              Quay lại lịch dạy
            </button>
          </div>

          <div className="student-toolbar-actions">
            <button
              type="button"
              className="table-button"
              onClick={() => {
                setError('')
                setImportResult(null)
                setIsImportModalOpen(true)
              }}
            >
              Upload file điểm
            </button>
          </div>
        </div>

        {error && <p className="dashboard-error">{error}</p>}

        {isLoading ? (
          <p className="dashboard-loading">Đang tải danh sách sinh viên...</p>
        ) : (
          <div className="student-table-wrap">
            <table className="student-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>MSSV</th>
                  <th>Tên sinh viên</th>
                  <th>Điểm quá trình</th>
                  <th>Điểm cuối kỳ</th>
                  <th>Điểm tổng kết</th>
                </tr>
              </thead>
              <tbody>
                {students.length ? (
                  students.map((student, index) => (
                    <tr key={student._id || `${student.studentCode}-${index}`}>
                      <td>{index + 1}</td>
                      <td>{student.studentCode || '-'}</td>
                      <td>{student.fullName || '-'}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={draftGrades[student.enrollmentId]?.gradeProcess ?? student.gradeProcess}
                          onChange={(event) => handleGradeChange(student.enrollmentId, 'gradeProcess', event.target.value)}
                          disabled={!isEditingGrades || isSavingGrades}
                          style={{ width: '88px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={draftGrades[student.enrollmentId]?.gradeFinal ?? student.gradeFinal}
                          onChange={(event) => handleGradeChange(student.enrollmentId, 'gradeFinal', event.target.value)}
                          disabled={!isEditingGrades || isSavingGrades}
                          style={{ width: '88px' }}
                        />
                      </td>
                      <td>{computeTotal(student)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="table-empty">Không có sinh viên trong lớp.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && students.length > 0 && (
          <div className="modal-actions" style={{ marginTop: '16px' }}>
            {!isEditingGrades ? (
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setIsEditingGrades(true)
                }}
                disabled={isSavingGrades}
              >
                Chỉnh sửa điểm
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmSaveGrades}
                disabled={isSavingGrades}
              >
                {isSavingGrades ? 'Đang lưu điểm...' : 'Xác nhận lưu điểm'}
              </button>
            )}
          </div>
        )}

        {isImportModalOpen && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card" style={{ maxWidth: '760px' }}>
              <div className="modal-header">
                <h3>Upload file điểm lớp</h3>
                <button type="button" className="modal-close" onClick={handleCloseImportModal}>×</button>
              </div>

              <div className="import-helper-block">
                <p className="student-form-notice import-helper-note">
                  File cần có 4 cột bắt buộc: MSSV, Tên sinh viên, Điểm quá trình, Điểm cuối kỳ.
                  <br />
                  Chấp nhận file .csv, .xlsx, .xls. Điểm chỉ hợp lệ trong khoảng 0-10 và theo bước 0.5.
                </p>

                <label className="import-file-picker">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleImportInputChange}
                  />
                  <span>{importFileName ? 'Chọn file khác' : 'Chọn file import'}</span>
                </label>

                <p className="import-file-name">{importFileName || 'Chưa chọn file nào.'}</p>

                {importResult?.summary && (
                  <div className="import-summary-grid">
                    <div className="import-summary-card">
                      <strong>{importResult.summary.totalRows || 0}</strong>
                      <span>Tổng số dòng</span>
                    </div>
                    <div className="import-summary-card success">
                      <strong>{importResult.summary.updatedRows || 0}</strong>
                      <span>Dòng cập nhật</span>
                    </div>
                    <div className="import-summary-card error">
                      <strong>{importResult.summary.errorRows || 0}</strong>
                      <span>Dòng lỗi</span>
                    </div>
                  </div>
                )}

                {Array.isArray(importResult?.errors) && importResult.errors.length > 0 && (
                  <div className="student-table-wrap">
                    <table className="student-table">
                      <thead>
                        <tr>
                          <th>Dòng</th>
                          <th>Nguyên nhân lỗi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.errors.map((errorItem, index) => (
                          <tr key={`${errorItem.rowNumber || 'unknown'}-${index}`}>
                            <td>{errorItem.rowNumber || '-'}</td>
                            <td>{errorItem.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-actions full-width">
                <button type="button" disabled={isImporting} onClick={handleImportGrades}>
                  {isImporting ? 'Đang import...' : 'Import file điểm'}
                </button>
                <button type="button" className="ghost" onClick={handleCloseImportModal}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherClassStudentsPage
