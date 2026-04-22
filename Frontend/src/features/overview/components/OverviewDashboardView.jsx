import { currencyFormatter, numberFormatter } from '../../../shared/utils/formatters'

function OverviewDashboardView({ dashboardData, dashboardError, isDashboardLoading }) {
  const tuitionStatusMap = dashboardData.charts.tuitionStatus.reduce((acc, item) => {
    acc[item.status] = item.count
    return acc
  }, {})
  const paidCount = tuitionStatusMap['Đã đóng'] || 0
  const unpaidCount = tuitionStatusMap['Chưa đóng'] || 0
  const totalStatusCount = paidCount + unpaidCount
  const paidPercent = totalStatusCount ? Math.round((paidCount / totalStatusCount) * 100) : 0
  const majorChartItems = dashboardData.charts.studentsByMajor
  const maxMajorCount = Math.max(1, ...majorChartItems.map((item) => item.count || 0))

  return (
    <div className="dashboard-main">
      <div className="overview-header">
        <h2>Trang tổng quan</h2>
        <p>Dữ liệu kỳ {dashboardData.semester || '---'}</p>
      </div>

      {dashboardError && <p className="dashboard-error">{dashboardError}</p>}

      {isDashboardLoading ? (
        <p className="dashboard-loading">Đang tải dữ liệu tổng quan...</p>
      ) : (
        <>
          <div className="kpi-grid">
            <article className="kpi-card">
              <p>Tổng số sinh viên</p>
              <strong>{numberFormatter.format(dashboardData.cards.totalStudents)}</strong>
            </article>
            <article className="kpi-card">
              <p>Tổng số giảng viên</p>
              <strong>{numberFormatter.format(dashboardData.cards.totalTeachers)}</strong>
            </article>
            <article className="kpi-card">
              <p>Tổng số lớp đang mở kỳ {dashboardData.semester || '---'}</p>
              <strong>{numberFormatter.format(dashboardData.cards.totalOpenClasses)}</strong>
            </article>
            <article className="kpi-card">
              <p>Tổng số học phí đã thu kỳ {dashboardData.semester || '---'}</p>
              <strong>{currencyFormatter.format(dashboardData.cards.totalCollectedTuition)}</strong>
            </article>
          </div>

          <div className="chart-grid">
            <article className="chart-card">
              <h3>Số lượng sinh viên theo từng ngành</h3>
              <div className="bar-chart">
                {majorChartItems.length ? (
                  majorChartItems.map((item) => (
                    <div key={item.major} className="bar-row">
                      <span className="bar-label">{item.major}</span>
                      <div className="bar-track" role="img" aria-label={`${item.major}: ${item.count}`}>
                        <div
                          className="bar-fill"
                          style={{ width: `${(item.count / maxMajorCount) * 100}%` }}
                        />
                      </div>
                      <span className="bar-value">{numberFormatter.format(item.count)}</span>
                    </div>
                  ))
                ) : (
                  <p className="chart-empty">Chưa có dữ liệu ngành.</p>
                )}
              </div>
            </article>

            <article className="chart-card">
              <h3>Trạng thái đóng học phí</h3>
              <div className="pie-chart-layout">
                <div
                  className="pie-chart"
                  role="img"
                  aria-label={`Đã đóng ${paidCount}, chưa đóng ${unpaidCount}`}
                  style={{
                    background: `conic-gradient(#1f5ed8 0 ${paidPercent}%, #cbd5e1 ${paidPercent}% 100%)`,
                  }}
                />

                <div className="pie-legend">
                  <p>
                    <span className="dot paid" />Đã đóng: <strong>{numberFormatter.format(paidCount)}</strong>
                  </p>
                  <p>
                    <span className="dot unpaid" />Chưa đóng: <strong>{numberFormatter.format(unpaidCount)}</strong>
                  </p>
                  <p>
                    Tỷ lệ đã đóng: <strong>{paidPercent}%</strong>
                  </p>
                </div>
              </div>
            </article>
          </div>
        </>
      )}
    </div>
  )
}

export default OverviewDashboardView