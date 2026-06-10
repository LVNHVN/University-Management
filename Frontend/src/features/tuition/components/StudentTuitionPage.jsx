import { useCallback, useEffect, useMemo, useState } from 'react'
import { createMyTuitionQr, fetchMyTuition } from '../services/tuitionService'

const formatCurrency = (value) => {
  if (!Number.isFinite(value)) {
    return '0 đ'
  }

  return `${value.toLocaleString('vi-VN')} đ`
}

function StudentTuitionPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingQr, setIsGeneratingQr] = useState(false)
  const [error, setError] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [tuitionData, setTuitionData] = useState(null)
  const [qrData, setQrData] = useState(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  const loadTuition = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const payload = await fetchMyTuition(selectedSemester)
      const tuition = payload?.tuition || null

      setTuitionData(tuition)
      setSelectedSemester(tuition?.semester || '')
      if (tuition?.activeQr) {
        setQrData(tuition.activeQr)
      }
    } catch (requestError) {
      const backendMessage = requestError.response?.data?.message
      setError(backendMessage || 'Không tải được dữ liệu học phí.')
      setTuitionData(null)
    } finally {
      setIsLoading(false)
    }
  }, [selectedSemester])

  useEffect(() => {
    loadTuition()
  }, [loadTuition])

  const tuitionRows = useMemo(() => {
    return Array.isArray(tuitionData?.items) ? tuitionData.items : []
  }, [tuitionData?.items])

  const totalAmount = useMemo(() => {
    return Number(tuitionData?.totalAmount) || 0
  }, [tuitionData?.totalAmount])

  const paymentStatus = tuitionData?.status || 'Unpaid'
  const availableSemesters = Array.isArray(tuitionData?.semesters) ? tuitionData.semesters : []
  const paymentStatusLabel = paymentStatus === 'Paid'
    ? 'Đã xác nhận thanh toán học phí'
    : paymentStatus === 'Transferred'
      ? 'Đã chuyển khoản, đang chờ admin xác nhận'
      : 'Chưa đóng học phí'

  const closeQrModal = () => {
    setIsQrModalOpen(false)
  }

  const handleGenerateQr = async () => {
    setIsGeneratingQr(true)
    setError('')

    try {
      const payload = await createMyTuitionQr(selectedSemester)
      setQrData(payload?.qr || null)
      setIsQrModalOpen(true)
      await loadTuition()
    } catch (requestError) {
      const backendMessage = requestError.response?.data?.message
      setError(backendMessage || 'Không tạo được mã thanh toán.')
    } finally {
      setIsGeneratingQr(false)
    }
  }

  const handleOpenQr = () => {
    const activeQr = tuitionData?.activeQr
    if (activeQr) {
      setQrData(activeQr)
      setIsQrModalOpen(true)
      return
    }

    handleGenerateQr()
  }

  useEffect(() => {
    if (!isQrModalOpen || !qrData?.expiresAt) {
      setRemainingSeconds(0)
      return undefined
    }

    const updateRemaining = () => {
      const diffMs = new Date(qrData.expiresAt).getTime() - Date.now()
      setRemainingSeconds(Math.max(0, Math.floor(diffMs / 1000)))
    }

    updateRemaining()
    const timerId = window.setInterval(updateRemaining, 1000)
    return () => window.clearInterval(timerId)
  }, [isQrModalOpen, qrData])

  const qrCountdownText = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60)
    const seconds = remainingSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }, [remainingSeconds])

  return (
    <div className="dashboard-content">
      <div className="dashboard-main">
        <div className="overview-header">
          <div>
            <h2>Học phí</h2>
            <p>Xem thông tin học phí theo từng học kỳ.</p>
          </div>
        </div>

        {error && <p className="dashboard-error">{error}</p>}

        <div className="student-grade-toolbar">
          <div className="student-schedule-semester-controls">
            <label htmlFor="student-tuition-semester">Học kỳ</label>
            <select
              id="student-tuition-semester"
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
        </div>

        <div className="tuition-student-info">
          <div>
            <span>Họ và tên</span>
            <strong>{tuitionData?.student?.fullName || '—'}</strong>
          </div>
          <div>
            <span>MSSV</span>
            <strong>{tuitionData?.student?.studentCode || '—'}</strong>
          </div>
        </div>

        {isLoading ? (
          <p className="dashboard-loading">Đang tải dữ liệu học phí...</p>
        ) : (
          <div className="student-table-wrap">
            <table className="student-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã môn</th>
                  <th>Tên môn học</th>
                  <th>Số tín chỉ</th>
                  <th>Tổng tiền môn học</th>
                </tr>
              </thead>
              <tbody>
                {tuitionRows.length ? (
                  tuitionRows.map((row) => (
                    <tr key={row.enrollmentId || `${row.subjectCode}-${row.order}`}>
                      <td>{row.order}</td>
                      <td>{row.subjectCode || '-'}</td>
                      <td>{row.subjectName || '-'}</td>
                      <td>{row.credits}</td>
                      <td>{formatCurrency(row.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="table-empty">Không có dữ liệu môn học trong học kỳ này.</td>
                  </tr>
                )}

                <tr className="tuition-total-row">
                  <td colSpan="4"><strong>Tổng học phí học kỳ</strong></td>
                  <td><strong>{formatCurrency(totalAmount)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <section className="tuition-payment-status" aria-label="Trạng thái thanh toán học phí">
          <div className="tuition-payment-status-header">
            <h3>Trạng thái thanh toán</h3>
            <p>{paymentStatusLabel}</p>
            {paymentStatus === 'Paid' && tuitionData?.paidAt && (
              <small>
                Thời gian thanh toán: {new Date(tuitionData.paidAt).toLocaleString('vi-VN')}
              </small>
            )}
          </div>

          <div className="tuition-payment-status-actions">
            {paymentStatus === 'Paid' ? (
              <button type="button" className="table-button" disabled>
                Xem lịch sử giao dịch
              </button>
            ) : paymentStatus === 'Transferred' ? (
              <button type="button" className="table-button" onClick={handleOpenQr} disabled={isGeneratingQr || isLoading}>
                Xem lại mã QR
              </button>
            ) : (
              <button type="button" className="table-button" onClick={handleOpenQr} disabled={isGeneratingQr || isLoading}>
                {isGeneratingQr ? 'Đang tạo mã QR...' : 'Thanh toán'}
              </button>
            )}
          </div>
        </section>

        {isQrModalOpen && qrData && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card tuition-qr-modal">
              <div className="modal-header">
                <h3>Thanh toán học phí qua VietQR</h3>
                <button type="button" className="modal-close" onClick={closeQrModal}>×</button>
              </div>

              <div className="tuition-qr-body">
                <img
                  src={qrData.qrImageUrl}
                  alt="Mã QR thanh toán học phí"
                  className="tuition-qr-image"
                />

                <div className="tuition-qr-details">
                  <p><strong>Ngân hàng:</strong> {qrData.bankId}</p>
                  <p><strong>Số tài khoản:</strong> {qrData.accountNo}</p>
                  <p><strong>Chủ tài khoản:</strong> {qrData.accountName}</p>
                  <p><strong>Số tiền:</strong> {formatCurrency(Number(qrData.amount) || 0)}</p>
                  <p><strong>Nội dung:</strong> {qrData.transferContent}</p>
                  <p><strong>Mã giao dịch:</strong> {qrData.transactionId}</p>

                  {remainingSeconds > 0 ? (
                    <p className="tuition-qr-expire">Mã QR còn hiệu lực: {qrCountdownText}</p>
                  ) : (
                    <p className="tuition-qr-expired">Mã QR đã hết hạn. Vui lòng tạo mã mới.</p>
                  )}
                </div>
              </div>

              <div className="modal-actions full-width">
                {remainingSeconds === 0 && (
                  <button type="button" onClick={handleGenerateQr} disabled={isGeneratingQr}>
                    {isGeneratingQr ? 'Đang tạo mã mới...' : 'Tạo mã QR mới'}
                  </button>
                )}
                <button type="button" className="ghost" onClick={closeQrModal}>Đóng</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentTuitionPage
