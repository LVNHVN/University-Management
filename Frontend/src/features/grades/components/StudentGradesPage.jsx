import { useEffect, useMemo, useState } from 'react'
import { fetchMyGrades } from '../services/gradeService'
import StudentGradeSummaryPage from './StudentGradeSummaryPage'

const toGradeLetter = (totalScore) => {
  if (!Number.isFinite(totalScore) || totalScore < 0 || totalScore > 10) {
    return ''
  }

  if (totalScore < 4.0) return 'F'
  if (totalScore < 5.0) return 'D'
  if (totalScore < 5.5) return 'D+'
  if (totalScore < 6.5) return 'C'
  if (totalScore < 7.0) return 'C+'
  if (totalScore < 8.0) return 'B'
  if (totalScore < 8.5) return 'B+'
  if (totalScore < 9.5) return 'A'
  return 'A+'
}

const formatScore = (score) => {
  if (!Number.isFinite(score)) {
    return '-'
  }

  return Number(score).toFixed(2)
}

function StudentGradesPage() {
  const [viewMode, setViewMode] = useState('detail')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchText, setSearchText] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [availableSemesters, setAvailableSemesters] = useState([])
  const [grades, setGrades] = useState([])

  useEffect(() => {
    const loadGrades = async () => {
      setIsLoading(true)
      setError('')

      try {
        const payload = await fetchMyGrades(selectedSemester)
        const gradesPayload = payload?.grades || {}

        setAvailableSemesters(Array.isArray(gradesPayload.semesters) ? gradesPayload.semesters : [])
        setSelectedSemester(gradesPayload.semester || '')
        setGrades(Array.isArray(gradesPayload.grades) ? gradesPayload.grades : [])
      } catch (requestError) {
        const backendMessage = requestError.response?.data?.message
        setError(backendMessage || 'Không tải được bảng điểm.')
        setAvailableSemesters([])
        setGrades([])
      } finally {
        setIsLoading(false)
      }
    }

    loadGrades()
  }, [selectedSemester])

  const filteredGrades = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()

    if (!keyword) {
      return grades
    }

    return grades.filter((item) => String(item?.subject?.name || '').toLowerCase().includes(keyword))
  }, [grades, searchText])

  return (
    <div className="dashboard-content">
      <div className="dashboard-main">
        <div className="overview-header">
          <div>
            <h2>Bảng điểm</h2>
            <p>Xem điểm các môn học theo từng học kỳ.</p>
          </div>
        </div>

        <div className="student-grade-mode-switch" role="radiogroup" aria-label="Chọn chế độ xem bảng điểm">
          <label>
            <input
              type="radio"
              name="student-grade-mode"
              value="detail"
              checked={viewMode === 'detail'}
              onChange={() => setViewMode('detail')}
            />
            Điểm chi tiết
          </label>

          <label>
            <input
              type="radio"
              name="student-grade-mode"
              value="summary"
              checked={viewMode === 'summary'}
              onChange={() => setViewMode('summary')}
            />
            Điểm tổng hợp
          </label>
        </div>

        {viewMode === 'summary' ? (
          <StudentGradeSummaryPage />
        ) : (
          <>
            {error && <p className="dashboard-error">{error}</p>}

            <div className="student-grade-toolbar">
              <div className="student-schedule-semester-controls">
                <label htmlFor="student-grades-semester">Học kỳ</label>
                <select
                  id="student-grades-semester"
                  value={selectedSemester}
                  onChange={(event) => setSelectedSemester(String(event.target.value || ''))}
                  disabled={isLoading || !availableSemesters.length}
                >
                  {!availableSemesters.length && (
                    <option value="">Không có học kỳ</option>
                  )}

                  {availableSemesters.map((semester) => (
                    <option key={semester.code} value={semester.code}>
                      {semester.name || semester.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="student-grade-search">
                <label htmlFor="student-grades-search">Tìm môn học</label>
                <input
                  id="student-grades-search"
                  type="text"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Nhập tên môn học"
                />
              </div>
            </div>

            {isLoading ? (
              <p className="dashboard-loading">Đang tải bảng điểm...</p>
            ) : (
              <div className="student-table-wrap">
                <table className="student-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Mã môn</th>
                      <th>Tên môn học</th>
                      <th>Tín chỉ</th>
                      <th>Điểm quá trình</th>
                      <th>Điểm cuối kỳ</th>
                      <th>Điểm tổng kết</th>
                      <th>Điểm chữ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGrades.length ? (
                      filteredGrades.map((grade, index) => {
                        const gradeTotal = Number.isFinite(grade.gradeTotal) ? Number(grade.gradeTotal) : null
                        const gradeLetter = toGradeLetter(gradeTotal)

                        return (
                          <tr key={grade.enrollmentId || `${grade.subject?.subjectCode || 'subject'}-${index}`}>
                            <td>{index + 1}</td>
                            <td>{grade.subject?.subjectCode || '-'}</td>
                            <td>{grade.subject?.name || '-'}</td>
                            <td>{Number.isFinite(grade.subject?.credits) ? grade.subject.credits : '-'}</td>
                            <td>{formatScore(grade.gradeProcess)}</td>
                            <td>{formatScore(grade.gradeFinal)}</td>
                            <td>{formatScore(gradeTotal)}</td>
                            <td>{gradeLetter || '-'}</td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="table-empty">Không có dữ liệu điểm phù hợp.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default StudentGradesPage
