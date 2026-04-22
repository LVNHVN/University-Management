import { useCallback, useEffect, useState } from 'react'
import { formatDateForDisplay, parseDisplayDateToIso } from '../../../shared/utils/date'
import { TEACHER_INITIAL_FORM } from '../constants/teacherConstants'
import {
  createTeacher,
  fetchTeacherAccount,
  fetchTeacherDetail,
  fetchTeachers,
  removeTeacher,
  updateTeacherAccount,
  updateTeacher,
} from '../services/teacherService'
import { validateTeacherForm } from '../validators/teacherValidator'

export const useTeacherManagement = ({ onTeacherChanged } = {}) => {
  const [teacherSearchKeyword, setTeacherSearchKeyword] = useState('')
  const [teachers, setTeachers] = useState([])
  const [isTeachersLoading, setIsTeachersLoading] = useState(false)
  const [teachersError, setTeachersError] = useState('')
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false)
  const [teacherModalMode, setTeacherModalMode] = useState('create')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [teacherForm, setTeacherForm] = useState(TEACHER_INITIAL_FORM)
  const [teacherFormErrors, setTeacherFormErrors] = useState({})
  const [teacherFormNotice, setTeacherFormNotice] = useState('')
  const [isTeacherSaving, setIsTeacherSaving] = useState(false)
  const [originalTeacherForm, setOriginalTeacherForm] = useState(null)
  const [isTeacherAccountModalOpen, setIsTeacherAccountModalOpen] = useState(false)
  const [teacherAccount, setTeacherAccount] = useState(null)
  const [teacherAccountNotice, setTeacherAccountNotice] = useState('')
  const [isTeacherAccountSaving, setIsTeacherAccountSaving] = useState(false)

  const loadTeachers = useCallback(async (keyword = '') => {
    setIsTeachersLoading(true)
    setTeachersError('')

    try {
      const payload = await fetchTeachers(keyword)

      if (!payload?.success) {
        throw new Error('Không tải được danh sách giảng viên.')
      }

      setTeachers(Array.isArray(payload.teachers) ? payload.teachers : [])
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setTeachersError(backendMessage || 'Không tải được danh sách giảng viên.')
      setTeachers([])
    } finally {
      setIsTeachersLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTeachers()
  }, [loadTeachers])

  const handleTeacherSearchSubmit = useCallback((event) => {
    event.preventDefault()
    loadTeachers(teacherSearchKeyword)
  }, [loadTeachers, teacherSearchKeyword])

  const openCreateTeacherModal = useCallback(() => {
    setTeacherModalMode('create')
    setSelectedTeacherId('')
    setTeacherForm(TEACHER_INITIAL_FORM)
    setTeacherFormErrors({})
    setTeacherFormNotice('')
    setIsTeacherModalOpen(true)
  }, [])

  const openTeacherDetailModal = useCallback(async (teacherId) => {
    setIsTeacherModalOpen(true)
    setTeacherModalMode('detail')
    setSelectedTeacherId(teacherId)
    setTeacherFormNotice('Đang tải thông tin giảng viên...')

    try {
      const payload = await fetchTeacherDetail(teacherId)

      if (!payload?.success || !payload.teacher) {
        throw new Error('Không tải được thông tin giảng viên.')
      }

      const teacher = payload.teacher
      setTeacherForm({
        teacherCode: teacher.teacherCode || '',
        fullName: teacher.fullName || '',
        dob: formatDateForDisplay(teacher.dob),
        gender: teacher.gender || '',
        nationalIdNumber: teacher.nationalIdNumber || '',
        phone: teacher.phone || '',
        address: teacher.address || '',
        department: teacher.department || '',
      })
      setTeacherFormErrors({})
      setTeacherFormNotice('')
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setTeacherFormNotice(backendMessage || 'Không tải được thông tin giảng viên.')
    }
  }, [])

  const handleTeacherFormChange = useCallback((event) => {
    const { name, value } = event.target
    setTeacherForm((prev) => ({
      ...prev,
      [name]: value,
    }))
    setTeacherFormErrors((prev) => {
      if (!prev[name]) {
        return prev
      }

      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [])

  const handleStartEditing = useCallback(() => {
    setOriginalTeacherForm(teacherForm)
    setTeacherModalMode('editing')
  }, [teacherForm])

  const handleCancelEditing = useCallback(() => {
    if (originalTeacherForm) {
      setTeacherForm(originalTeacherForm)
    }
    setTeacherFormErrors({})
    setTeacherFormNotice('')
    setTeacherModalMode('detail')
  }, [originalTeacherForm])

  const handleTeacherModalClose = useCallback(() => {
    if (isTeacherSaving) {
      return
    }

    setIsTeacherModalOpen(false)
    setTeacherFormErrors({})
    setTeacherFormNotice('')
  }, [isTeacherSaving])

  const openTeacherAccountModal = useCallback(async (teacherId) => {
    setIsTeacherAccountModalOpen(true)
    setTeacherAccount(null)
    setTeacherAccountNotice('Đang tải thông tin tài khoản...')

    try {
      const payload = await fetchTeacherAccount(teacherId)

      if (!payload?.success || !payload.account) {
        throw new Error('Không tải được thông tin tài khoản giảng viên.')
      }

      setTeacherAccount(payload.account)
      setTeacherAccountNotice('')
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setTeacherAccountNotice(backendMessage || 'Không tải được thông tin tài khoản giảng viên.')
    }
  }, [])

  const closeTeacherAccountModal = useCallback(() => {
    if (isTeacherAccountSaving) {
      return
    }

    setIsTeacherAccountModalOpen(false)
    setTeacherAccount(null)
    setTeacherAccountNotice('')
  }, [isTeacherAccountSaving])

  const handleToggleTeacherAccountStatus = useCallback(async () => {
    if (!teacherAccount?.userId) {
      return
    }

    setIsTeacherAccountSaving(true)
    setTeacherAccountNotice('')

    try {
      const payload = await updateTeacherAccount(teacherAccount.userId, {
        status: !teacherAccount.status,
      })

      if (!payload?.success || !payload.account) {
        throw new Error('Không cập nhật được trạng thái tài khoản.')
      }

      setTeacherAccount(payload.account)
      setTeacherAccountNotice(payload.message || 'Đã cập nhật trạng thái tài khoản.')
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setTeacherAccountNotice(backendMessage || 'Không cập nhật được trạng thái tài khoản.')
    } finally {
      setIsTeacherAccountSaving(false)
    }
  }, [teacherAccount])

  const handleResetTeacherAccountPassword = useCallback(async () => {
    if (!teacherAccount?.userId) {
      return
    }

    const shouldReset = window.confirm('Bạn có chắc muốn đặt lại mật khẩu về mặc định 123456?')
    if (!shouldReset) {
      return
    }

    setIsTeacherAccountSaving(true)
    setTeacherAccountNotice('')

    try {
      const payload = await updateTeacherAccount(teacherAccount.userId, {
        resetPassword: true,
      })

      if (!payload?.success || !payload.account) {
        throw new Error('Không đặt lại được mật khẩu tài khoản.')
      }

      setTeacherAccount(payload.account)
      setTeacherAccountNotice(payload.message || 'Đã đặt lại mật khẩu mặc định 123456.')
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setTeacherAccountNotice(backendMessage || 'Không đặt lại được mật khẩu tài khoản.')
    } finally {
      setIsTeacherAccountSaving(false)
    }
  }, [teacherAccount])

  const handleTeacherFormSubmit = useCallback(async (event) => {
    if (event?.preventDefault) {
      event.preventDefault()
    }

    if (teacherModalMode !== 'create' && teacherModalMode !== 'editing') {
      return
    }

    const errors = validateTeacherForm(teacherForm, parseDisplayDateToIso)
    if (Object.keys(errors).length > 0) {
      setTeacherFormErrors(errors)
      setTeacherFormNotice('Vui lòng kiểm tra lại thông tin bắt buộc.')
      return
    }

    const parsedDob = parseDisplayDateToIso(teacherForm.dob)

    const payload = {
      teacherCode: teacherForm.teacherCode.trim(),
      fullName: teacherForm.fullName.trim(),
      dob: parsedDob || undefined,
      nationalIdNumber: teacherForm.nationalIdNumber.trim(),
      phone: teacherForm.phone.trim(),
      address: teacherForm.address.trim(),
      gender: teacherForm.gender.trim(),
      department: teacherForm.department.trim(),
    }

    setIsTeacherSaving(true)
    setTeacherFormNotice('')

    try {
      if (teacherModalMode === 'create') {
        await createTeacher(payload)
      } else {
        await updateTeacher(selectedTeacherId, payload)
      }
      setOriginalTeacherForm(null)

      setIsTeacherModalOpen(false)
      setTeacherForm(TEACHER_INITIAL_FORM)
      await Promise.all([loadTeachers(teacherSearchKeyword), onTeacherChanged?.()])
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setTeacherFormNotice(backendMessage || 'Không thể lưu thông tin giảng viên.')
    } finally {
      setIsTeacherSaving(false)
    }
  }, [loadTeachers, onTeacherChanged, selectedTeacherId, teacherForm, teacherModalMode, teacherSearchKeyword])

  const handleDeleteTeacher = useCallback(async (teacher) => {
    const shouldDelete = window.confirm(`Bạn có chắc muốn xóa giảng viên ${teacher.fullName}?`)
    if (!shouldDelete) {
      return
    }

    try {
      await removeTeacher(teacher._id)
      await Promise.all([loadTeachers(teacherSearchKeyword), onTeacherChanged?.()])
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setTeachersError(backendMessage || 'Không thể xóa giảng viên.')
    }
  }, [loadTeachers, onTeacherChanged, teacherSearchKeyword])

  return {
    teacherSearchKeyword,
    setTeacherSearchKeyword,
    teachers,
    isTeachersLoading,
    teachersError,
    isTeacherModalOpen,
    teacherModalMode,
    teacherForm,
    teacherFormErrors,
    teacherFormNotice,
    isTeacherSaving,
    isTeacherAccountModalOpen,
    teacherAccount,
    teacherAccountNotice,
    isTeacherAccountSaving,
    handleTeacherSearchSubmit,
    openCreateTeacherModal,
    openTeacherDetailModal,
    handleTeacherFormChange,
    handleTeacherModalClose,
    handleTeacherFormSubmit,
    handleDeleteTeacher,
    handleStartEditing,
    handleCancelEditing,
    openTeacherAccountModal,
    closeTeacherAccountModal,
    handleToggleTeacherAccountStatus,
    handleResetTeacherAccountPassword,
  }
}
