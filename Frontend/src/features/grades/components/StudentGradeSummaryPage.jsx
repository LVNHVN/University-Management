import { useEffect, useState } from 'react'
import { fetchMyGradeSummary } from '../services/gradeService'

const formatNumber = (value) => {
  if (!Number.isFinite(value)) {
    return ''
  }

  return Number(value).toFixed(2)
}

function StudentGradeSummaryPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [summaries, setSummaries] = useState([])

  useEffect(() => {
    const loadSummary = async () => {
      setIsLoading(true)
      setError('')

      try {
        const payload = await fetchMyGradeSummary()
        const list = Array.isArray(payload?.summary?.summaries) ? payload.summary.summaries : []
        setSummaries(list)
      } catch (requestError) {
        const backendMessage = requestError.response?.data?.message
        setError(backendMessage || 'Không tải được điểm tổng hợp.')
        setSummaries([])
      } finally {
        setIsLoading(false)
      }
    }

    loadSummary()
  }, [])

  if (isLoading) {
    return <p className="dashboard-loading">Đang tải điểm tổng hợp...</p>
  }

  return (
    <>
      {error && <p className="dashboard-error">{error}</p>}

      <div className="student-table-wrap">
        <table className="student-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Học kỳ</th>
              <th>GPA</th>
              <th>CPA</th>
              <th>Tín chỉ tích lũy</th>
            </tr>
          </thead>
          <tbody>
            {summaries.length ? (
              summaries.map((item, index) => (
                <tr key={item.semester || `${item.semesterName || 'semester'}-${index}`}>
                  <td>{index + 1}</td>
                  <td>{item.semesterName || item.semester || '-'}</td>
                  <td>{formatNumber(item.gpa)}</td>
                  <td>{formatNumber(item.cpa)}</td>
                  <td>{Number.isFinite(item.accumulatedCredits) ? item.accumulatedCredits : ''}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="table-empty">Chưa có dữ liệu điểm để tổng hợp.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default StudentGradeSummaryPage
