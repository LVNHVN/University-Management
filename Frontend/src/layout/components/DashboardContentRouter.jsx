import OverviewDashboard from '../../features/overview/components/OverviewDashboard'
import StudentManagement from '../../features/students/components/StudentManagement'
import TeacherManagement from '../../features/teachers/components/TeacherManagement'
import { NAV_ITEMS } from '../../shared/constants/navigation'

function DashboardContentRouter({ activeView, dashboardRefreshVersion, onStudentChanged, onTeacherChanged }) {
  if (activeView === 'overview') {
    return <OverviewDashboard refreshVersion={dashboardRefreshVersion} />
  }

  if (activeView === 'students') {
    return <StudentManagement onStudentChanged={onStudentChanged} />
  }

  if (activeView === 'teachers') {
    return <TeacherManagement onTeacherChanged={onTeacherChanged} />
  }

  const selected = NAV_ITEMS.find((item) => item.key === activeView)

  return (
    <div className="dashboard-main">
      <div className="overview-header">
        <h2>{selected?.label || 'Đang cập nhật'}</h2>
        <p>Chức năng đang được phát triển</p>
      </div>
    </div>
  )
}

export default DashboardContentRouter