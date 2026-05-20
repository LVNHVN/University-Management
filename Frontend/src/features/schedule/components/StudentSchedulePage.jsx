import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../../../shared/constants/api'
import { fetchMySchedule } from '../services/scheduleService'

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

const toYmd = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toClassDayOfWeek = (date) => {
  const jsDay = date.getDay()
  return jsDay === 0 ? 1 : jsDay + 1
}

const buildCalendarCells = (viewDate) => {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)
  const daysInMonth = monthEnd.getDate()

  const mondayFirstOffset = (monthStart.getDay() + 6) % 7
  const cells = []

  for (let i = 0; i < mondayFirstOffset; i += 1) {
    const date = new Date(year, month, i - mondayFirstOffset + 1)
    cells.push({ date, isCurrentMonth: false })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(year, month, day), isCurrentMonth: true })
  }

  const totalCells = Math.ceil(cells.length / 7) * 7
  const trailingDays = totalCells - cells.length
  for (let i = 0; i < trailingDays; i += 1) {
    const date = new Date(year, month + 1, i + 1)
    cells.push({ date, isCurrentMonth: false })
  }

  return cells
}

function StudentSchedulePage() {
  const today = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [classes, setClasses] = useState([])
  const [availableSemesters, setAvailableSemesters] = useState([])
  const [selectedSemester, setSelectedSemester] = useState('')
  const [semesterInfo, setSemesterInfo] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedDate, setSelectedDate] = useState(today)
  const [calendarMonthDate, setCalendarMonthDate] = useState(today)

  useEffect(() => {
    const loadSchedule = async () => {
      setIsLoading(true)
      setError('')

      try {
        const payload = await fetchMySchedule(selectedSemester)
        const list = Array.isArray(payload?.schedule?.classes) ? payload.schedule.classes : []
        const semesters = Array.isArray(payload?.schedule?.semesters) ? payload.schedule.semesters : []

        setClasses(list)
        setAvailableSemesters(semesters)
        setSelectedSemester(payload?.schedule?.semester || '')
        setSemesterInfo(payload?.schedule?.semesterInfo || null)
      } catch (requestError) {
        const backendMessage = requestError.response?.data?.message
        setError(backendMessage || 'Không tải được lịch học cá nhân.')
        setClasses([])
        setAvailableSemesters([])
        setSemesterInfo(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadSchedule()
  }, [selectedSemester])

  const handleSemesterChange = (event) => {
    const nextSemester = String(event.target.value || '')
    if (nextSemester === selectedSemester) {
      return
    }

    setSelectedSemester(nextSemester)
  }

  const selectedDayValue = toClassDayOfWeek(selectedDate)

  const semesterRange = useMemo(() => {
    const start = semesterInfo?.startDate ? new Date(semesterInfo.startDate) : null
    const end = semesterInfo?.endDate ? new Date(semesterInfo.endDate) : null

    if (!start || Number.isNaN(start.getTime()) || !end || Number.isNaN(end.getTime())) {
      return null
    }

    return {
      start: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
      end: new Date(end.getFullYear(), end.getMonth(), end.getDate()),
    }
  }, [semesterInfo])

  const isDateWithinSemester = useMemo(() => {
    return (date) => {
      if (!semesterRange) {
        return true
      }

      const comparedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      return comparedDate >= semesterRange.start && comparedDate <= semesterRange.end
    }
  }, [semesterRange])

  const classesByDay = useMemo(() => {
    if (!isDateWithinSemester(selectedDate)) {
      return []
    }

    return classes
      .filter((item) => Number(item?.dayOfWeek) === selectedDayValue)
      .sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || '')))
  }, [classes, selectedDayValue, selectedDate, isDateWithinSemester])

  const classDaySet = useMemo(() => {
    const daySet = new Set()
    classes.forEach((item) => {
      const day = Number(item?.dayOfWeek)
      if (!Number.isNaN(day) && day >= 1 && day <= 7) {
        daySet.add(day)
      }
    })
    return daySet
  }, [classes])

  const calendarCells = useMemo(() => buildCalendarCells(calendarMonthDate), [calendarMonthDate])

  const selectedDateText = selectedDate.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const monthTitle = calendarMonthDate.toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  })

  const goToPreviousMonth = () => {
    setCalendarMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCalendarMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setSelectedDate(today)
    setCalendarMonthDate(today)
  }

  const selectedSyllabusDownloadUrl = selectedClass?.subject?.syllabus?.filePath
    ? `${API_BASE_URL}${selectedClass.subject.syllabus.filePath}`
    : ''

  return (
    <div className="dashboard-content">
      <div className="dashboard-main">
        {error && <p className="dashboard-error">{error}</p>}

        {isLoading ? (
          <p className="dashboard-loading">Đang tải lịch học...</p>
        ) : (
          <>
            <div className="student-schedule-toolbar">
              <div className="student-schedule-semester-controls">
                <label htmlFor="student-schedule-semester">Học kỳ</label>
                <select
                  id="student-schedule-semester"
                  value={selectedSemester}
                  onChange={handleSemesterChange}
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

            <div className="student-schedule-layout">
              <section className="student-calendar-card" aria-label="Lịch tháng">
              <div className="student-calendar-header">
                <button type="button" className="student-calendar-nav" onClick={goToPreviousMonth}>
                  ‹
                </button>
                <strong>{monthTitle}</strong>
                <button type="button" className="student-calendar-nav" onClick={goToNextMonth}>
                  ›
                </button>
              </div>

              <button type="button" className="student-calendar-today" onClick={goToToday}>
                Hôm nay
              </button>

              <div className="student-calendar-weekdays">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>

              <div className="student-calendar-grid">
                {calendarCells.map(({ date, isCurrentMonth }) => {
                  const cellDateKey = toYmd(date)
                  const isSelected = toYmd(selectedDate) === cellDateKey
                  const isToday = toYmd(today) === cellDateKey
                  const hasClass = isDateWithinSemester(date) && classDaySet.has(toClassDayOfWeek(date))

                  return (
                    <button
                      key={cellDateKey}
                      type="button"
                      className={[
                        'student-calendar-day',
                        isCurrentMonth ? '' : 'is-outside',
                        isSelected ? 'is-selected' : '',
                        isToday ? 'is-today' : '',
                      ].join(' ')}
                      onClick={() => {
                        setSelectedDate(date)
                        if (!isCurrentMonth) {
                          setCalendarMonthDate(new Date(date.getFullYear(), date.getMonth(), 1))
                        }
                      }}
                    >
                      <span>{date.getDate()}</span>
                      {hasClass && <span className="student-calendar-dot" aria-hidden="true" />}
                    </button>
                  )
                })}
              </div>
              </section>

              <section className="student-schedule-list-card" aria-label="Danh sách tiết học theo ngày">
                <div className="student-schedule-list-header">
                  <h3>Lớp học ngày {selectedDateText}</h3>
                </div>

                <div className="student-table-wrap">
                  <table className="student-table">
                    <thead>
                      <tr>
                        <th>Lớp học</th>
                        <th>Thời gian</th>
                        <th>Địa điểm</th>
                        <th>Giảng viên</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classesByDay.length ? (
                        classesByDay.map((item) => (
                          <tr
                            key={item._id}
                            className="curriculum-subject-row"
                            onClick={() => setSelectedClass(item)}
                          >
                            <td>
                              {item.classCode} - {item.subject?.name || ''} - {item.subject?.subjectCode || ''}
                            </td>
                            <td>
                              {item.startTime || '--:--'} - {item.endTime || '--:--'}
                            </td>
                            <td>{item.room || 'Chưa cập nhật'}</td>
                            <td>{item.teacher?.fullName || 'Chưa cập nhật'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="table-empty">Không có tiết học.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </>
        )}
      </div>

      {selectedClass && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Chi tiết môn học</h3>
              <button type="button" className="modal-close" onClick={() => setSelectedClass(null)}>×</button>
            </div>

            <form className="student-form" onSubmit={(event) => event.preventDefault()} noValidate>
              <label className="full-width">
                Mã môn học
                <input type="text" value={selectedClass.subject?.subjectCode || ''} disabled />
              </label>

              <label className="full-width">
                Tên môn học
                <input type="text" value={selectedClass.subject?.name || ''} disabled />
              </label>

              <label className="full-width">
                Khoa/viện phụ trách
                <input type="text" value={selectedClass.subject?.department || ''} disabled />
              </label>

              <label>
                Số tín chỉ
                <input type="text" value={selectedClass.subject?.credits ?? ''} disabled />
              </label>

              <label>
                Trọng số thi cuối kỳ
                <input
                  type="text"
                  value={
                    Number.isFinite(selectedClass.subject?.finalWeight)
                      ? selectedClass.subject.finalWeight
                      : ''
                  }
                  disabled
                />
              </label>

              <label>
                Kỳ học
                <input
                  type="text"
                  value={selectedClass.semester || ''}
                  disabled
                />
              </label>

              <div className="student-field full-width">
                <span>Đề cương chi tiết môn học</span>
                {selectedClass?.subject?.syllabus?.filePath ? (
                  <div className="subject-syllabus-card">
                    <p className="subject-syllabus-name">{selectedClass.subject.syllabus.fileName}</p>
                    <div className="subject-syllabus-actions">
                      <a
                        className="table-button"
                        href={selectedSyllabusDownloadUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Xem đề cương
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="subject-syllabus-empty">Chưa có đề cương chi tiết.</p>
                )}
              </div>
            </form>

            <div className="modal-actions full-width">
              <button type="button" className="ghost" onClick={() => setSelectedClass(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentSchedulePage
