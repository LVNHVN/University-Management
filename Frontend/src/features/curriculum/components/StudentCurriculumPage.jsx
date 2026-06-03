import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../../../shared/constants/api'
import { fetchMyCurriculum } from '../services/curriculumService'

const INITIAL_FILTERS = {
  subjectCode: '',
  name: '',
  recommendedSemester: '',
  credits: '',
}

function StudentCurriculumPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [curriculum, setCurriculum] = useState(null)
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [isSyllabusPreviewOpen, setIsSyllabusPreviewOpen] = useState(false)

  useEffect(() => {
    const loadMyCurriculum = async () => {
      setIsLoading(true)
      setError('')

      try {
        const payload = await fetchMyCurriculum()

        if (!payload?.success || !payload.curriculum) {
          throw new Error('Không tải được chương trình đào tạo.')
        }

        setCurriculum(payload.curriculum)
      } catch (requestError) {
        const backendMessage = requestError.response?.data?.message
        setError(backendMessage || 'Không tải được chương trình đào tạo.')
        setCurriculum(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadMyCurriculum()
  }, [])

  const subjects = useMemo(() => {
    const source = Array.isArray(curriculum?.subjects) ? curriculum.subjects : []

    return source.filter((subject) => {
      const codeMatch = String(subject.subjectCode || '')
        .toLowerCase()
        .includes(filters.subjectCode.trim().toLowerCase())

      const nameMatch = String(subject.name || '')
        .toLowerCase()
        .includes(filters.name.trim().toLowerCase())

      const semesterText = Number.isInteger(subject.recommendedSemester)
        ? String(subject.recommendedSemester)
        : ''
      const semesterMatch = semesterText.includes(filters.recommendedSemester.trim())

      const creditsText = Number.isFinite(subject.credits) ? String(subject.credits) : ''
      const creditsMatch = creditsText.includes(filters.credits.trim())

      return codeMatch && nameMatch && semesterMatch && creditsMatch
    })
  }, [curriculum?.subjects, filters])

  const sortedSubjects = useMemo(() => {
    return [...subjects].sort((a, b) => {
      const semesterA = Number.isInteger(a.recommendedSemester) ? a.recommendedSemester : Number.MAX_SAFE_INTEGER
      const semesterB = Number.isInteger(b.recommendedSemester) ? b.recommendedSemester : Number.MAX_SAFE_INTEGER

      if (semesterA !== semesterB) {
        return semesterA - semesterB
      }

      return String(a.subjectCode || '').localeCompare(String(b.subjectCode || ''))
    })
  }, [subjects])

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const selectedSyllabusDownloadUrl = selectedSubject?.syllabus?.filePath
    ? `${API_BASE_URL}${selectedSubject.syllabus.filePath}`
    : ''
  const canPreviewSyllabus = Boolean(selectedSyllabusDownloadUrl)

  const handleCloseSubjectDetail = () => {
    setIsSyllabusPreviewOpen(false)
    setSelectedSubject(null)
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-main">
        <div className="overview-header">
          <div>
            <h2>Chương trình đào tạo</h2>
            <p>{curriculum?.name || 'Sinh viên chỉ có quyền xem thông tin chương trình đào tạo.'}</p>
          </div>
        </div>

        {error && <p className="dashboard-error">{error}</p>}

        {isLoading ? (
          <p className="dashboard-loading">Đang tải chương trình đào tạo...</p>
        ) : (
          <div className="student-table-wrap">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Mã môn</th>
                  <th>Tên môn học</th>
                  <th>Kỳ học</th>
                  <th>Tín chỉ</th>
                </tr>
                <tr className="curriculum-filter-row">
                  <th>
                    <input
                      type="text"
                      name="subjectCode"
                      value={filters.subjectCode}
                      onChange={handleFilterChange}
                    />
                  </th>
                  <th>
                    <input
                      type="text"
                      name="name"
                      value={filters.name}
                      onChange={handleFilterChange}
                    />
                  </th>
                  <th>
                    <input
                      type="text"
                      name="recommendedSemester"
                      value={filters.recommendedSemester}
                      onChange={handleFilterChange}
                    />
                  </th>
                  <th>
                    <input
                      type="text"
                      name="credits"
                      value={filters.credits}
                      onChange={handleFilterChange}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedSubjects.length ? (
                  sortedSubjects.map((subject) => (
                    <tr
                      key={subject.subjectId}
                      className="curriculum-subject-row"
                      onClick={() => setSelectedSubject(subject)}
                    >
                      <td>{subject.subjectCode}</td>
                      <td>{subject.name}</td>
                      <td>{Number.isInteger(subject.recommendedSemester) ? subject.recommendedSemester : ''}</td>
                      <td>{subject.credits ?? ''}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="table-empty">Không có môn học phù hợp.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedSubject && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Chi tiết môn học</h3>
              <button type="button" className="modal-close" onClick={handleCloseSubjectDetail}>×</button>
            </div>

            <form className="student-form" onSubmit={(event) => event.preventDefault()} noValidate>
              <label className="full-width">
                Mã môn học
                <input type="text" value={selectedSubject.subjectCode || ''} disabled />
              </label>

              <label className="full-width">
                Tên môn học
                <input type="text" value={selectedSubject.name || ''} disabled />
              </label>

              <label className="full-width">
                Khoa/viện phụ trách
                <input type="text" value={selectedSubject.department || ''} disabled />
              </label>

              <label>
                Số tín chỉ
                <input type="text" value={selectedSubject.credits ?? ''} disabled />
              </label>

              <label>
                Trọng số thi cuối kỳ
                <input
                  type="text"
                  value={
                    Number.isFinite(selectedSubject.finalWeight)
                      ? selectedSubject.finalWeight
                      : ''
                  }
                  disabled
                />
              </label>

              <label>
                Kỳ học
                <input
                  type="text"
                  value={Number.isInteger(selectedSubject.recommendedSemester) ? selectedSubject.recommendedSemester : ''}
                  disabled
                />
              </label>

              <div className="student-field full-width">
                <span>Đề cương chi tiết môn học</span>
                {selectedSubject?.syllabus?.filePath ? (
                  <div className="subject-syllabus-card">
                    <p className="subject-syllabus-name">{selectedSubject.syllabus.fileName}</p>
                    <div className="subject-syllabus-actions">
                      <button
                        type="button"
                        className="table-button"
                        onClick={() => setIsSyllabusPreviewOpen(true)}
                      >
                        Xem đề cương
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="subject-syllabus-empty">Chưa có đề cương chi tiết.</p>
                )}
              </div>
            </form>

            <div className="modal-actions full-width">
              <button type="button" className="ghost" onClick={handleCloseSubjectDetail}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedSubject && canPreviewSyllabus && isSyllabusPreviewOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card syllabus-preview-modal">
            <div className="modal-header">
              <h3>Xem đề cương môn học</h3>
              <button type="button" className="modal-close" onClick={() => setIsSyllabusPreviewOpen(false)}>×</button>
            </div>

            <div className="subject-syllabus-preview">
              <iframe
                src={selectedSyllabusDownloadUrl}
                title="Xem trước đề cương môn học"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentCurriculumPage
