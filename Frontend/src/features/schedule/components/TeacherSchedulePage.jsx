import { useEffect, useMemo, useState } from 'react'
import StudentSchedulePage from './StudentSchedulePage'
import TeacherClassStudentsPage from './TeacherClassStudentsPage'
import TeacherClassAttendancePage from './TeacherClassAttendancePage'
import DashboardSidebar from '../../../layout/components/DashboardSidebar'

const TEACHER_SIDEBAR_STATE_KEY = 'teacherSidebarCollapsed'
const TEACHER_VIEW_MODE_KEY = 'teacherScheduleViewMode'

const getInitialSidebarCollapsed = () => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(TEACHER_SIDEBAR_STATE_KEY) === '1'
}

const getInitialTeacherViewMode = () => {
  if (typeof window === 'undefined') {
    return 'calendar'
  }

  const saved = window.localStorage.getItem(TEACHER_VIEW_MODE_KEY)
  return saved === 'detail' ? 'detail' : 'calendar'
}

function TeacherSchedulePage() {
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedContext, setSelectedContext] = useState(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(getInitialSidebarCollapsed)
  const [activeView, setActiveView] = useState(getInitialTeacherViewMode)

  const teacherNavItems = useMemo(() => ([
    { key: 'calendar', label: 'Lịch' },
    { key: 'detail', label: 'Chi tiết' },
  ]), [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(TEACHER_SIDEBAR_STATE_KEY, isSidebarCollapsed ? '1' : '0')
  }, [isSidebarCollapsed])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(TEACHER_VIEW_MODE_KEY, activeView)
  }, [activeView])

  const handleSelectClass = (cls, context) => {
    setSelectedClass(cls)
    setSelectedContext(context || null)
  }

  const handleSelectView = (nextView) => {
    setActiveView(nextView)
    setSelectedClass(null)
    setSelectedContext(null)
  }

  let content = (
    <StudentSchedulePage
      mode="teacher"
      teacherViewMode={activeView}
      onTeacherViewModeChange={setActiveView}
      onClassSelect={handleSelectClass}
    />
  )

  if (selectedClass?._id) {
    if (selectedContext?.viewMode === 'calendar') {
      content = (
        <TeacherClassAttendancePage
          classId={selectedClass._id}
          classCode={selectedClass.classCode}
          attendanceDate={selectedContext?.selectedDate}
          onBack={() => {
            setSelectedClass(null)
            setSelectedContext(null)
          }}
        />
      )
    } else {
      content = (
        <TeacherClassStudentsPage
          classId={selectedClass._id}
          classCode={selectedClass.classCode}
          onBack={() => {
            setSelectedClass(null)
            setSelectedContext(null)
          }}
        />
      )
    }
  }

  return (
    <div className={`dashboard-body ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <DashboardSidebar
        navItems={teacherNavItems}
        activeView={activeView}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        onSelectView={handleSelectView}
      />

      <section className="teacher-portal-content" aria-label="Noi dung giang vien">
        {content}
      </section>
    </div>
  )
}

export default TeacherSchedulePage
