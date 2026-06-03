import { useState } from 'react'
import StudentSchedulePage from './StudentSchedulePage'
import TeacherClassStudentsPage from './TeacherClassStudentsPage'
import TeacherClassAttendancePage from './TeacherClassAttendancePage'

function TeacherSchedulePage() {
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedContext, setSelectedContext] = useState(null)

  const handleSelectClass = (cls, context) => {
    setSelectedClass(cls)
    setSelectedContext(context || null)
  }

  if (selectedClass?._id) {
    if (selectedContext?.viewMode === 'calendar') {
      return (
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
    }

    return (
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

  return <StudentSchedulePage mode="teacher" onClassSelect={handleSelectClass} />
}

export default TeacherSchedulePage
