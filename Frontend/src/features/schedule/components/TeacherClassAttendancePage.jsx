import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchClassAttendance, updateClassAttendance } from '../../classes/services/classService'

function TeacherClassAttendancePage({ classId, classCode, attendanceDate, onBack }) {
  const [students, setStudents] = useState([])
  const [draftAttendance, setDraftAttendance] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')

  const dateLabel = useMemo(() => {
    if (!attendanceDate) {
      return ''
    }

    const date = new Date(`${attendanceDate}T00:00:00`)
    if (Number.isNaN(date.getTime())) {
      return attendanceDate
    }

    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }, [attendanceDate])

  const loadAttendance = useCallback(async () => {
    if (!classId || !attendanceDate) {
      setStudents([])
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetchClassAttendance(classId, attendanceDate)
      const list = Array.isArray(response?.data?.students) ? response.data.students : []
      setStudents(list.map((student) => ({
        ...student,
        note: student.note || '',
      })))
      setDraftAttendance({})
      setIsEditing(false)
    } catch (requestError) {
      const backendMessage = requestError.response?.data?.message
      setError(backendMessage || 'Không tải được dữ liệu điểm danh.')
      setStudents([])
    } finally {
      setIsLoading(false)
    }
  }, [attendanceDate, classId])

  useEffect(() => {
    loadAttendance()
  }, [loadAttendance])

  const handleAttendanceChange = (studentId, field, value) => {
    setDraftAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [field]: value,
      },
    }))
  }

  const handleConfirmSave = async () => {
    const records = students.map((student) => {
      const draft = draftAttendance[student.studentId] || {}

      return {
        studentId: student.studentId,
        isPresent: typeof draft.isPresent === 'boolean' ? draft.isPresent : Boolean(student.isPresent),
        note: typeof draft.note === 'string' ? draft.note : String(student.note || ''),
      }
    })

    setIsSaving(true)
    setError('')

    try {
      await updateClassAttendance(classId, attendanceDate, records)
      await loadAttendance()
    } catch (requestError) {
      const backendMessage = requestError.response?.data?.message
      setError(backendMessage || 'Không lưu được điểm danh.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-main">
        <div className="overview-header">
          <h2>Điểm danh lớp {classCode || ''}{dateLabel ? ` - ${dateLabel}` : ''}</h2>
          <p>Danh sách điểm danh theo ngày học đã chọn</p>
        </div>

        <div className="student-toolbar-actions" style={{ marginBottom: '16px' }}>
          <button type="button" className="table-button" onClick={onBack}>
            Quay lại lịch dạy
          </button>
        </div>

        {error && <p className="dashboard-error">{error}</p>}

        {isLoading ? (
          <p className="dashboard-loading">Đang tải dữ liệu điểm danh...</p>
        ) : (
          <div className="student-table-wrap">
            <table className="student-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>MSSV</th>
                  <th>Tên sinh viên</th>
                  <th>Điểm danh</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {students.length ? (
                  students.map((student, index) => {
                    const draft = draftAttendance[student.studentId] || {}
                    const checked = typeof draft.isPresent === 'boolean' ? draft.isPresent : Boolean(student.isPresent)
                    const noteValue = typeof draft.note === 'string' ? draft.note : String(student.note || '')

                    return (
                      <tr key={student.studentId || `${student.studentCode}-${index}`}>
                        <td>{index + 1}</td>
                        <td>{student.studentCode || '-'}</td>
                        <td>{student.fullName || '-'}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => handleAttendanceChange(student.studentId, 'isPresent', event.target.checked)}
                            disabled={!isEditing || isSaving}
                            style={{ width: '22px', height: '22px', cursor: (!isEditing || isSaving) ? 'not-allowed' : 'pointer' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={noteValue}
                            onChange={(event) => handleAttendanceChange(student.studentId, 'note', event.target.value)}
                            disabled={!isEditing || isSaving}
                          />
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="table-empty">Không có sinh viên trong lớp.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && students.length > 0 && (
          <div className="modal-actions" style={{ marginTop: '16px' }}>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setIsEditing(true)
                }}
                disabled={isSaving}
              >
                Chỉnh sửa điểm danh
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
              >
                {isSaving ? 'Đang lưu...' : 'Xác nhận điểm danh'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherClassAttendancePage
