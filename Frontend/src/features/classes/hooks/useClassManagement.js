import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClass, fetchClassDetail, fetchClasses, removeClass, updateClass } from '../services/classService'
import { fetchSubjects } from '../../subjects/services/subjectService'
import { fetchTeachers } from '../../teachers/services/teacherService'
import { fetchSemesters } from '../../semesters/services/semesterService'

const CLASS_INITIAL_FORM = {
  _id: '',
  classCode: '',
  semester: '',
  studentCount: 0,
  dayOfWeek: '',
  startTime: '',
  endTime: '',
  room: '',
}

export const useClassManagement = () => {
  const [classSearchKeyword, setClassSearchKeyword] = useState('')
  const [classes, setClasses] = useState([])
  const [isClassesLoading, setIsClassesLoading] = useState(false)
  const [classesError, setClassesError] = useState('')
  const [classFeatureNotice, setClassFeatureNotice] = useState('')

  const [isClassModalOpen, setIsClassModalOpen] = useState(false)
  const [classModalMode, setClassModalMode] = useState('detail')
  const [selectedClassId, setSelectedClassId] = useState('')

  const [classForm, setClassForm] = useState(CLASS_INITIAL_FORM)
  const [originalClassForm, setOriginalClassForm] = useState(null)
  const [classFormErrors, setClassFormErrors] = useState({})
  const [classFormNotice, setClassFormNotice] = useState('')
  const [isClassSaving, setIsClassSaving] = useState(false)

  // Subject combobox
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [subjectPickerKeyword, setSubjectPickerKeyword] = useState('')
  const [subjectPickerId, setSubjectPickerId] = useState('')
  const [originalSubjectPickerId, setOriginalSubjectPickerId] = useState('')

  // Teacher combobox
  const [availableTeachers, setAvailableTeachers] = useState([])
  const [teacherPickerKeyword, setTeacherPickerKeyword] = useState('')
  const [teacherPickerId, setTeacherPickerId] = useState('')
  const [originalTeacherPickerId, setOriginalTeacherPickerId] = useState('')

  const [availableSemesters, setAvailableSemesters] = useState([])

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null })

  const filteredAvailableSubjects = useMemo(() => {
    const keyword = subjectPickerKeyword.trim().toLowerCase()
    if (!keyword) return availableSubjects
    return availableSubjects.filter((s) => {
      const code = String(s.subjectCode || '').toLowerCase()
      const name = String(s.name || '').toLowerCase()
      return code.includes(keyword) || name.includes(keyword)
    })
  }, [availableSubjects, subjectPickerKeyword])

  const filteredAvailableTeachers = useMemo(() => {
    const keyword = teacherPickerKeyword.trim().toLowerCase()
    if (!keyword) return availableTeachers
    return availableTeachers.filter((t) => {
      const code = String(t.teacherCode || '').toLowerCase()
      const name = String(t.fullName || '').toLowerCase()
      return code.includes(keyword) || name.includes(keyword)
    })
  }, [availableTeachers, teacherPickerKeyword])

  const isViewOnly = classModalMode === 'detail'
  const isCreateMode = classModalMode === 'create'
  const isEditingMode = classModalMode === 'editing'

  const loadClasses = useCallback(async (keyword = '') => {
    setIsClassesLoading(true)
    setClassesError('')

    try {
      const payload = await fetchClasses(keyword)

      if (!payload?.success) {
        throw new Error('Không tải được danh sách lớp học.')
      }

      setClasses(Array.isArray(payload.classes) ? payload.classes : [])
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setClassesError(backendMessage || 'Không tải được danh sách lớp học.')
      setClasses([])
    } finally {
      setIsClassesLoading(false)
    }
  }, [])

  useEffect(() => {
    loadClasses()
  }, [loadClasses])

  const loadPickerData = useCallback(async () => {
    try {
      const [subjectsPayload, teachersPayload, semestersPayload] = await Promise.all([
        fetchSubjects(),
        fetchTeachers(),
        fetchSemesters(),
      ])
      setAvailableSubjects(Array.isArray(subjectsPayload?.subjects) ? subjectsPayload.subjects : [])
      setAvailableTeachers(Array.isArray(teachersPayload?.teachers) ? teachersPayload.teachers : [])
      setAvailableSemesters(Array.isArray(semestersPayload?.semesters) ? semestersPayload.semesters : [])
    } catch {
      setAvailableSubjects([])
      setAvailableTeachers([])
      setAvailableSemesters([])
    }
  }, [])

  const resetPickers = useCallback(() => {
    setSubjectPickerKeyword('')
    setSubjectPickerId('')
    setTeacherPickerKeyword('')
    setTeacherPickerId('')
  }, [])

  const handleClassSearchSubmit = useCallback(
    (event) => {
      event.preventDefault()
      setClassFeatureNotice('')
      loadClasses(classSearchKeyword)
    },
    [classSearchKeyword, loadClasses],
  )

  const handleOpenCreateClass = useCallback(async () => {
    setClassFeatureNotice('')
    setSelectedClassId('')
    setClassModalMode('create')
    setClassForm(CLASS_INITIAL_FORM)
    setOriginalClassForm(null)
    setClassFormErrors({})
    setClassFormNotice('')
    resetPickers()
    setOriginalSubjectPickerId('')
    setOriginalTeacherPickerId('')
    setIsClassModalOpen(true)
    await loadPickerData()
  }, [loadPickerData, resetPickers])

  const handleOpenClassDetail = useCallback(
    async (classId) => {
      setClassFeatureNotice('')
      setSelectedClassId(classId)
      setClassModalMode('detail')
      setClassFormErrors({})
      setClassFormNotice('Đang tải thông tin lớp học...')
      setIsClassModalOpen(true)

      try {
        const [detailPayload] = await Promise.all([fetchClassDetail(classId), loadPickerData()])

        if (!detailPayload?.success || !detailPayload.class) {
          throw new Error('Không tải được thông tin lớp học.')
        }

        const cls = detailPayload.class
        const formData = {
          _id: cls._id || '',
          classCode: cls.classCode || '',
          semester: cls.semester || '',
          studentCount: cls.studentCount ?? 0,
          dayOfWeek: cls.dayOfWeek ?? '',
          startTime: cls.startTime || '',
          endTime: cls.endTime || '',
          room: cls.room || '',
        }

        const subjectId = cls.subject?._id ? String(cls.subject._id) : ''
        const teacherId = cls.teacher?._id ? String(cls.teacher._id) : ''
        const subjectLabel = cls.subject
          ? `${cls.subject.subjectCode} - ${cls.subject.name}`
          : ''
        const teacherLabel = cls.teacher
          ? `${cls.teacher.teacherCode} - ${cls.teacher.fullName}`
          : ''

        setClassForm(formData)
        setOriginalClassForm(formData)
        setSubjectPickerId(subjectId)
        setOriginalSubjectPickerId(subjectId)
        setSubjectPickerKeyword(subjectLabel)
        setTeacherPickerId(teacherId)
        setOriginalTeacherPickerId(teacherId)
        setTeacherPickerKeyword(teacherLabel)
        setClassFormNotice('')
      } catch (error) {
        const backendMessage = error.response?.data?.message
        setClassFormNotice(backendMessage || 'Không tải được thông tin lớp học.')
      }
    },
    [loadPickerData],
  )

  const handleStartEditing = useCallback(() => {
    setClassModalMode('editing')
    setClassFormErrors({})
    setClassFormNotice('')
  }, [])

  const handleCancelEditing = useCallback(() => {
    if (originalClassForm) {
      setClassForm(originalClassForm)
    }

    const subjectLabel = originalSubjectPickerId
      ? availableSubjects.find((s) => String(s._id) === originalSubjectPickerId)
        ? (() => {
            const s = availableSubjects.find((sub) => String(sub._id) === originalSubjectPickerId)
            return `${s.subjectCode} - ${s.name}`
          })()
        : subjectPickerKeyword
      : ''

    const teacherLabel = originalTeacherPickerId
      ? availableTeachers.find((t) => String(t._id) === originalTeacherPickerId)
        ? (() => {
            const t = availableTeachers.find((tea) => String(tea._id) === originalTeacherPickerId)
            return `${t.teacherCode} - ${t.fullName}`
          })()
        : teacherPickerKeyword
      : ''

    setSubjectPickerId(originalSubjectPickerId)
    setSubjectPickerKeyword(subjectLabel)
    setTeacherPickerId(originalTeacherPickerId)
    setTeacherPickerKeyword(teacherLabel)
    setClassModalMode('detail')
    setClassFormErrors({})
    setClassFormNotice('')
  }, [
    originalClassForm,
    originalSubjectPickerId,
    originalTeacherPickerId,
    availableSubjects,
    availableTeachers,
    subjectPickerKeyword,
    teacherPickerKeyword,
  ])

  const handleClassModalClose = useCallback(() => {
    if (isClassSaving) return

    setIsClassModalOpen(false)
    setClassModalMode('detail')
    setSelectedClassId('')
    setClassFormErrors({})
    setClassFormNotice('')
    resetPickers()
  }, [isClassSaving, resetPickers])

  const handleClassFormChange = useCallback((event) => {
    const { name, value } = event.target
    setClassForm((prev) => ({ ...prev, [name]: value }))
    setClassFormErrors((prev) => ({ ...prev, [name]: '' }))
  }, [])

  const handleSubjectPickerKeywordChange = useCallback((value) => {
    setSubjectPickerKeyword(value)
    setSubjectPickerId('')
  }, [])

  const handleSubjectPickerKeywordSelect = useCallback((value) => {
    setSubjectPickerKeyword(value)
  }, [])

  const handleSubjectPickerIdChange = useCallback((id) => {
    setSubjectPickerId(id)
  }, [])

  const handleTeacherPickerKeywordChange = useCallback((value) => {
    setTeacherPickerKeyword(value)
    setTeacherPickerId('')
  }, [])

  const handleTeacherPickerKeywordSelect = useCallback((value) => {
    setTeacherPickerKeyword(value)
  }, [])

  const handleTeacherPickerIdChange = useCallback((id) => {
    setTeacherPickerId(id)
  }, [])

  const handleClassFormSubmit = useCallback(async (event) => {
    event.preventDefault()

    if (!isCreateMode && !isEditingMode) {
      return
    }

    const errors = {}

    if (!classForm.classCode.trim()) {
      errors.classCode = 'Vui lòng nhập mã lớp học.'
    } else if (!/^[A-Za-z0-9_-]+$/.test(classForm.classCode.trim())) {
      errors.classCode = 'Mã lớp học chỉ gồm chữ, số, gạch ngang hoặc gạch dưới.'
    }

    if (!subjectPickerId) {
      errors.subject = 'Vui lòng chọn môn học.'
    }

    if (!teacherPickerId) {
      errors.teacher = 'Vui lòng chọn giảng viên.'
    }

    if (!classForm.semester.trim()) {
      errors.semester = 'Vui lòng chọn học kỳ.'
    } else if (!availableSemesters.some((s) => s.code === classForm.semester.trim())) {
      errors.semester = 'Học kỳ đã chọn không tồn tại trong hệ thống.'
    }

    if (!classForm.dayOfWeek) {
      errors.dayOfWeek = 'Vui lòng chọn thứ học.'
    }

    if (!classForm.startTime.trim()) {
      errors.startTime = 'Vui lòng nhập giờ bắt đầu.'
    } else if (!/^\d{2}:\d{2}$/.test(classForm.startTime.trim())) {
      errors.startTime = 'Giờ bắt đầu không hợp lệ (định dạng HH:MM).'
    }

    if (!classForm.endTime.trim()) {
      errors.endTime = 'Vui lòng nhập giờ kết thúc.'
    } else if (!/^\d{2}:\d{2}$/.test(classForm.endTime.trim())) {
      errors.endTime = 'Giờ kết thúc không hợp lệ (định dạng HH:MM).'
    }

    if (!classForm.room.trim()) {
      errors.room = 'Vui lòng nhập phòng học.'
    }

    if (Object.keys(errors).length > 0) {
      setClassFormErrors(errors)
      setClassFormNotice('Vui lòng kiểm tra lại thông tin bắt buộc.')
      return
    }

    setIsClassSaving(true)
    setClassFormNotice('')

    const payload = {
      classCode: classForm.classCode.trim(),
      subjectId: subjectPickerId,
      teacherId: teacherPickerId,
      semester: classForm.semester.trim(),
      dayOfWeek: classForm.dayOfWeek !== '' ? Number(classForm.dayOfWeek) : null,
      startTime: classForm.startTime.trim(),
      endTime: classForm.endTime.trim(),
      room: classForm.room.trim(),
    }

    try {
      if (isCreateMode) {
        await createClass(payload)
      } else {
        await updateClass(selectedClassId, payload)
      }

      setIsClassModalOpen(false)
      setClassModalMode('detail')
      setSelectedClassId('')
      setClassForm(CLASS_INITIAL_FORM)
      setClassFormErrors({})
      setClassFormNotice('')
      setOriginalClassForm(null)
      resetPickers()
      setOriginalSubjectPickerId('')
      setOriginalTeacherPickerId('')
      await loadClasses(classSearchKeyword)
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setClassFormNotice(backendMessage || 'Không thể lưu thông tin lớp học.')
    } finally {
      setIsClassSaving(false)
    }
  }, [
    classForm,
    subjectPickerId,
    teacherPickerId,
    isCreateMode,
    isEditingMode,
    selectedClassId,
    classSearchKeyword,
    loadClasses,
    resetPickers,
    availableSemesters,
  ])

  const handleDeleteClass = useCallback(
    (cls) => {
      setConfirmDialog({
        isOpen: true,
        title: 'Xác nhận xóa lớp học',
        message: `Bạn có chắc chắn muốn xóa lớp học "${cls.classCode}"? Hành động này không thể hoàn tác.`,
        onConfirm: async () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }))

          try {
            await removeClass(cls._id)
            await loadClasses(classSearchKeyword)
          } catch (error) {
            const backendMessage = error.response?.data?.message
            setClassFeatureNotice(backendMessage || 'Xóa lớp học thất bại.')
          }
        },
      })
    },
    [classSearchKeyword, loadClasses],
  )

  const handleConfirmDialogClose = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
  }, [])

  return {
    classSearchKeyword,
    onClassSearchKeywordChange: setClassSearchKeyword,
    onClassSearchSubmit: handleClassSearchSubmit,
    onOpenCreateClass: handleOpenCreateClass,
    classesError,
    classFeatureNotice,
    isClassesLoading,
    classes,
    onOpenClassDetail: handleOpenClassDetail,
    isClassModalOpen,
    classModalMode,
    isViewOnly,
    isCreateMode,
    isEditingMode,
    onClassModalClose: handleClassModalClose,
    onClassFormSubmit: handleClassFormSubmit,
    classForm,
    onClassFormChange: handleClassFormChange,
    classFormErrors,
    classFormNotice,
    isClassSaving,
    filteredAvailableSubjects,
    subjectPickerKeyword,
    subjectPickerId,
    onSubjectPickerKeywordChange: handleSubjectPickerKeywordChange,
    onSubjectPickerKeywordSelect: handleSubjectPickerKeywordSelect,
    onSubjectPickerIdChange: handleSubjectPickerIdChange,
    filteredAvailableTeachers,
    availableSemesters,
    teacherPickerKeyword,
    teacherPickerId,
    onTeacherPickerKeywordChange: handleTeacherPickerKeywordChange,
    onTeacherPickerKeywordSelect: handleTeacherPickerKeywordSelect,
    onTeacherPickerIdChange: handleTeacherPickerIdChange,
    onStartEditing: handleStartEditing,
    onCancelEditing: handleCancelEditing,
    onDeleteClass: handleDeleteClass,
    confirmDialog,
    onConfirmDialogClose: handleConfirmDialogClose,
  }
}
