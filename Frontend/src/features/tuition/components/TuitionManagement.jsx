import { useEffect, useMemo, useState } from 'react'
import {
  confirmTuitionForAdmin,
  fetchStudentTuitionHistoryForAdmin,
  fetchTuitionsForAdmin,
} from '../services/tuitionService'

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'Unpaid', label: 'Chưa đóng học phí' },
  { value: 'Transferred', label: 'Đã chuyển khoản' },
  { value: 'Paid', label: 'Đã xác nhận' },
]

const STATUS_LABEL = {
  Unpaid: 'Chưa đóng học phí',
  Transferred: 'Đã chuyển khoản',
  Paid: 'Đã xác nhận',
}

const formatCurrency = (value) => `${(Number(value) || 0).toLocaleString('vi-VN')} đ`

const formatDateTime = (value) => {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleString('vi-VN')
}

function TuitionManagement() {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tuitions, setTuitions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [historyData, setHistoryData] = useState(null)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const loadTuitions = async () => {
    setIsLoading(true)
    setError('')

    try {
      const payload = await fetchTuitionsForAdmin({
        search: searchKeyword,
        status: statusFilter,
      })

      setTuitions(Array.isArray(payload?.tuitions) ? payload.tuitions : [])
    } catch (requestError) {
      const backendMessage = requestError.response?.data?.message
      setError(backendMessage || 'Không tải được danh sách học phí.')
      setTuitions([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTuitions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    loadTuitions()
  }

  const handleOpenHistory = async (tuitionId) => {
    setIsHistoryOpen(true)
    setIsHistoryLoading(true)
    setHistoryData(null)
    setError('')

    try {
      const payload = await fetchStudentTuitionHistoryForAdmin(tuitionId)
      setHistoryData(payload)
    } catch (requestError) {
      const backendMessage = requestError.response?.data?.message
      setError(backendMessage || 'Không tải được lịch sử giao dịch.')
      setHistoryData(null)
    } finally {
      setIsHistoryLoading(false)
    }
  }

  const handleConfirm = async (tuitionId) => {
    setIsConfirming(true)
    setError('')

    try {
      await confirmTuitionForAdmin(tuitionId)
      await loadTuitions()
      if (historyData?.history?.length) {
        await handleOpenHistory(tuitionId)
      }
    } catch (requestError) {
      const backendMessage = requestError.response?.data?.message
      setError(backendMessage || 'Không xác nhận được học phí.')
    } finally {
      setIsConfirming(false)
    }
  }

  const rows = useMemo(() => tuitions.map((item) => ({
    id: item._id,
    studentCode: item?.student?.studentCode || '—',
    studentName: item?.student?.fullName || '—',
    amount: Number(item?.totalAmount) || 0,
    status: item?.status || 'Unpaid',
  })), [tuitions])

  return (
    <div className="dashboard-main">
      <div className="overview-header">
        <h2>Quản lý học phí</h2>
        <p>Theo dõi trạng thái đóng học phí và xác nhận thủ công.</p>
      </div>

      <div className="student-toolbar">
        <form className="student-search" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Tìm theo MSSV hoặc tên sinh viên"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />
          <button type="submit">Tìm kiếm</button>
        </form>
      </div>

      <div className="tuition-admin-filters">
        <label htmlFor="tuition-status-filter">Trạng thái</label>
        <select
          id="tuition-status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(String(event.target.value || ''))}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="dashboard-error">{error}</p>}

      {isLoading ? (
        <p className="dashboard-loading">Đang tải danh sách học phí...</p>
      ) : (
        <div className="student-table-wrap">
          <table className="student-table">
            <thead>
              <tr>
                <th>MSSV</th>
                <th>Tên sinh viên</th>
                <th>Học phí</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.studentCode}</td>
                    <td>{row.studentName}</td>
                    <td>{formatCurrency(row.amount)}</td>
                    <td>
                      <span className={`tuition-status-badge ${row.status.toLowerCase()}`}>
                        {STATUS_LABEL[row.status] || STATUS_LABEL.Unpaid}
                      </span>
                    </td>
                    <td>
                      {row.status === 'Transferred' ? (
                        <div className="table-actions">
                          <button type="button" className="table-button" onClick={() => handleOpenHistory(row.id)}>
                            Xem lịch sử giao dịch
                          </button>
                          <button
                            type="button"
                            className="table-button"
                            onClick={() => handleConfirm(row.id)}
                            disabled={isConfirming}
                          >
                            {isConfirming ? 'Đang xác nhận...' : 'Xác nhận'}
                          </button>
                        </div>
                      ) : (
                        <span className="tuition-action-placeholder">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="table-empty">Không có dữ liệu học phí phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isHistoryOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card tuition-history-modal">
            <div className="modal-header">
              <h3>Lịch sử giao dịch học phí</h3>
              <button type="button" className="modal-close" onClick={() => setIsHistoryOpen(false)}>×</button>
            </div>

            {isHistoryLoading ? (
              <p className="dashboard-loading">Đang tải lịch sử giao dịch...</p>
            ) : (
              <>
                <p className="tuition-history-student">
                  {historyData?.student?.studentCode || '—'} - {historyData?.student?.fullName || '—'}
                </p>

                <div className="student-table-wrap">
                  <table className="student-table">
                    <thead>
                      <tr>
                        <th>Học kỳ</th>
                        <th>Số tiền</th>
                        <th>Trạng thái</th>
                        <th>Nội dung CK</th>
                        <th>Mã giao dịch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData?.history?.length ? (
                        historyData.history.map((item) => (
                          <tr key={item._id}>
                            <td>{item?.semester?.code || '—'}</td>
                            <td>{formatCurrency(item?.totalAmount || 0)}</td>
                            <td>{STATUS_LABEL[item?.status] || STATUS_LABEL.Unpaid}</td>
                            <td>{item?.paymentContent || '—'}</td>
                            <td>{item?.transactionId || '—'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="table-empty">Sinh viên chưa có lịch sử giao dịch học phí.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TuitionManagement
