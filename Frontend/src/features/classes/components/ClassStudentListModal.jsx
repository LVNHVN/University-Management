import { useEffect, useState } from 'react'
import { fetchClassStudents } from '../services/classService'

function ClassStudentListModal({ classId, classCode, isOpen, onClose }) {
  const [students, setStudents] = useState([])
  const [studentCount, setStudentCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !classId) return

    const loadStudents = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetchClassStudents(classId)

        if (!response?.success || !response?.data) {
          throw new Error('Không tải được danh sách sinh viên.')
        }

        setStudents(response.data.students || [])
        setStudentCount(response.data.studentCount || 0)
      } catch (err) {
        setError(err.message || 'Đã xảy ra lỗi khi tải danh sách sinh viên.')
      } finally {
        setIsLoading(false)
      }
    }

    loadStudents()
  }, [isOpen, classId])

  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Danh sách sinh viên - {classCode || 'Lớp học'}</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {error && <p className="dashboard-error">{error}</p>}

          {isLoading ? (
            <p className="dashboard-loading">Đang tải danh sách sinh viên...</p>
          ) : (
            <>
              <p style={{ marginBottom: '16px', fontSize: '14px' }}>
                <strong>Tổng sĩ số: {studentCount} sinh viên</strong>
              </p>

              {studentCount === 0 ? (
                <p className="table-empty">Không có sinh viên trong lớp.</p>
              ) : (
                <table className="student-table">
                  <thead>
                    <tr>
                      <th>MSSV</th>
                      <th>Họ tên</th>
                      <th>Ngành học</th>
                      <th>Khóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student._id}>
                        <td>{student.studentCode || '-'}</td>
                        <td>{student.fullName || '-'}</td>
                        <td>{student.major || '-'}</td>
                        <td>{student.academicYear || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClassStudentListModal
