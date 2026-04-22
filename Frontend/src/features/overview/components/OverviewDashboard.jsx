import { useDashboardOverview } from '../hooks/useDashboardOverview'
import OverviewDashboardView from './OverviewDashboardView'

function OverviewDashboard({ refreshVersion }) {
  const { dashboardData, dashboardError, isDashboardLoading } = useDashboardOverview({
    refreshVersion,
  })

  return (
    <OverviewDashboardView
      dashboardData={dashboardData}
      dashboardError={dashboardError}
      isDashboardLoading={isDashboardLoading}
    />
  )
}

export default OverviewDashboard
