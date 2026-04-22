import { useCallback, useEffect, useState } from 'react'
import { formatDateForDisplay, parseDisplayDateToIso } from '../../../shared/utils/date'
import { STUDENT_INITIAL_FORM } from '../constants/studentConstants'
import {
  createStudent,
  fetchStudentAccount,
  fetchStudentDetail,
  fetchStudents,
  removeStudent,
  updateStudentAccount,
  updateStudent,
} from '../services/studentService'
import { validateStudentForm } from '../validators/studentValidator'

export const useStudentManagement = ({ onStudentChanged } = {}) => {
  const [studentSearchKeyword, setStudentSearchKeyword] = useState('')
  const [students, setStudents] = useState([])
  const [isStudentsLoading, setIsStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState('')
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)
  const [studentModalMode, setStudentModalMode] = useState('create')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [studentForm, setStudentForm] = useState(STUDENT_INITIAL_FORM)
  const [studentFormErrors, setStudentFormErrors] = useState({})
  const [studentFormNotice, setStudentFormNotice] = useState('')
  const [isStudentSaving, setIsStudentSaving] = useState(false)
  const [originalStudentForm, setOriginalStudentForm] = useState(null)
  const [isStudentAccountModalOpen, setIsStudentAccountModalOpen] = useState(false)
  const [studentAccount, setStudentAccount] = useState(null)
  const [studentAccountNotice, setStudentAccountNotice] = useState('')
  const [isStudentAccountSaving, setIsStudentAccountSaving] = useState(false)

  const loadStudents = useCallback(async (keyword = '') => {
    setIsStudentsLoading(true)
    setStudentsError('')

    try {
      const payload = await fetchStudents(keyword)

      if (!payload?.success) {
        throw new Error('Không tải được danh sách sinh viên.')
      }

      setStudents(Array.isArray(payload.students) ? payload.students : [])
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setStudentsError(backendMessage || 'Không tải được danh sách sinh viên.')
      setStudents([])
    } finally {
      setIsStudentsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const resetStudentManagement = useCallback(() => {
    setStudentSearchKeyword('')
    setStudents([])
    setStudentsError('')
    setIsStudentsLoading(false)
    setIsStudentModalOpen(false)
    setStudentModalMode('create')
    setSelectedStudentId('')
    setStudentForm(STUDENT_INITIAL_FORM)
    setStudentFormErrors({})
    setStudentFormNotice('')
    setIsStudentSaving(false)
    setOriginalStudentForm(null)
  }, [])

  const handleStudentSearchSubmit = useCallback((event) => {
    event.preventDefault()
    loadStudents(studentSearchKeyword)
  }, [loadStudents, studentSearchKeyword])

  const openCreateStudentModal = useCallback(() => {
    setStudentModalMode('create')
    setSelectedStudentId('')
    setStudentForm(STUDENT_INITIAL_FORM)
    setStudentFormErrors({})
    setStudentFormNotice('')
    setIsStudentModalOpen(true)
  }, [])

  const openStudentDetailModal = useCallback(async (studentId) => {
    setIsStudentModalOpen(true)
    setStudentModalMode('detail')
    setSelectedStudentId(studentId)
    setStudentFormNotice('Đang tải thông tin sinh viên...')

    try {
      const payload = await fetchStudentDetail(studentId)

      if (!payload?.success || !payload.student) {
        throw new Error('Không tải được thông tin sinh viên.')
      }

      const student = payload.student
      setStudentForm({
        studentCode: student.studentCode || '',
        fullName: student.fullName || '',
        dob: formatDateForDisplay(student.dob),
        gender: student.gender || '',
        nationalIdNumber: student.nationalIdNumber || '',
        phone: student.phone || '',
        address: student.address || '',
        major: student.major || '',
        academicYear: student.academicYear || '',
      })
      setStudentFormErrors({})
      setStudentFormNotice('')
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setStudentFormNotice(backendMessage || 'Không tải được thông tin sinh viên.')
    }
  }, [])

  const handleStudentFormChange = useCallback((event) => {
    const { name, value } = event.target
    setStudentForm((prev) => ({
      ...prev,
      [name]: value,
    }))
    setStudentFormErrors((prev) => {
      if (!prev[name]) {
        return prev
      }

      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [])

  const handleStartEditing = useCallback(() => {
    setOriginalStudentForm(studentForm)
    setStudentModalMode('editing')
  }, [studentForm])

  const handleCancelEditing = useCallback(() => {
    if (originalStudentForm) {
      setStudentForm(originalStudentForm)
    }
    setStudentFormErrors({})
    setStudentFormNotice('')
    setStudentModalMode('detail')
  }, [originalStudentForm])

  const handleStudentModalClose = useCallback(() => {
    if (isStudentSaving) {
      return
    }

    setIsStudentModalOpen(false)
    setStudentFormErrors({})
    setStudentFormNotice('')
  }, [isStudentSaving])

  const openStudentAccountModal = useCallback(async (studentId) => {
    setIsStudentAccountModalOpen(true)
    setStudentAccount(null)
    setStudentAccountNotice('Đang tải thông tin tài khoản...')

    try {
      const payload = await fetchStudentAccount(studentId)

      if (!payload?.success || !payload.account) {
        throw new Error('Không tải được thông tin tài khoản sinh viên.')
      }

      setStudentAccount(payload.account)
      setStudentAccountNotice('')
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setStudentAccountNotice(backendMessage || 'Không tải được thông tin tài khoản sinh viên.')
    }
  }, [])

  const closeStudentAccountModal = useCallback(() => {
    if (isStudentAccountSaving) {
      return
    }

    setIsStudentAccountModalOpen(false)
    setStudentAccount(null)
    setStudentAccountNotice('')
  }, [isStudentAccountSaving])

  const handleToggleStudentAccountStatus = useCallback(async () => {
    if (!studentAccount?.userId) {
      return
    }

    setIsStudentAccountSaving(true)
    setStudentAccountNotice('')

    try {
      const payload = await updateStudentAccount(studentAccount.userId, {
        status: !studentAccount.status,
      })

      if (!payload?.success || !payload.account) {
        throw new Error('Không cập nhật được trạng thái tài khoản.')
      }

      setStudentAccount(payload.account)
      setStudentAccountNotice(payload.message || 'Đã cập nhật trạng thái tài khoản.')
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setStudentAccountNotice(backendMessage || 'Không cập nhật được trạng thái tài khoản.')
    } finally {
      setIsStudentAccountSaving(false)
    }
  }, [studentAccount])

  const handleResetStudentAccountPassword = useCallback(async () => {
    if (!studentAccount?.userId) {
      return
    }

    const shouldReset = window.confirm('Bạn có chắc muốn đặt lại mật khẩu về mặc định 123456?')
    if (!shouldReset) {
      return
    }

    setIsStudentAccountSaving(true)
    setStudentAccountNotice('')

    try {
      const payload = await updateStudentAccount(studentAccount.userId, {
        resetPassword: true,
      })

      if (!payload?.success || !payload.account) {
        throw new Error('Không đặt lại được mật khẩu tài khoản.')
      }

      setStudentAccount(payload.account)
      setStudentAccountNotice(payload.message || 'Đã đặt lại mật khẩu mặc định 123456.')
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setStudentAccountNotice(backendMessage || 'Không đặt lại được mật khẩu tài khoản.')
    } finally {
      setIsStudentAccountSaving(false)
    }
  }, [studentAccount])

  const handleStudentFormSubmit = useCallback(async (event) => {
    event.preventDefault()

    if (studentModalMode !== 'create' && studentModalMode !== 'editing') {
      return
    }

    const errors = validateStudentForm(studentForm, parseDisplayDateToIso)
    if (Object.keys(errors).length > 0) {
      setStudentFormErrors(errors)
      setStudentFormNotice('Vui lòng kiểm tra lại thông tin bắt buộc.')
      return
    }

    const parsedDob = parseDisplayDateToIso(studentForm.dob)

    const payload = {
      studentCode: studentForm.studentCode.trim(),
      fullName: studentForm.fullName.trim(),
      dob: parsedDob || undefined,
      nationalIdNumber: studentForm.nationalIdNumber.trim(),
      phone: studentForm.phone.trim(),
      address: studentForm.address.trim(),
      gender: studentForm.gender.trim(),
      major: studentForm.major.trim(),
      academicYear: studentForm.academicYear.trim(),
    }

    setIsStudentSaving(true)
    setStudentFormNotice('')

    try {
      if (studentModalMode === 'create') {
        await createStudent(payload)
      } else {
        await updateStudent(selectedStudentId, payload)
      }
      setOriginalStudentForm(null)

      setIsStudentModalOpen(false)
      setStudentForm(STUDENT_INITIAL_FORM)
      await Promise.all([loadStudents(studentSearchKeyword), onStudentChanged?.()])
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setStudentFormNotice(backendMessage || 'Không thể lưu thông tin sinh viên.')
    } finally {
      setIsStudentSaving(false)
    }
  }, [loadStudents, onStudentChanged, selectedStudentId, studentForm, studentModalMode, studentSearchKeyword])

  const handleDeleteStudent = useCallback(async (student) => {
    const shouldDelete = window.confirm(`Bạn có chắc muốn xóa sinh viên ${student.fullName}?`)
    if (!shouldDelete) {
      return
    }

    try {
      await removeStudent(student._id)
      await Promise.all([loadStudents(studentSearchKeyword), onStudentChanged?.()])
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setStudentsError(backendMessage || 'Không thể xóa sinh viên.')
    }
  }, [loadStudents, onStudentChanged, studentSearchKeyword])

  return {
    studentSearchKeyword,
    setStudentSearchKeyword,
    students,
    isStudentsLoading,
    studentsError,
    isStudentModalOpen,
    studentModalMode,
    studentForm,
    studentFormErrors,
    studentFormNotice,
    isStudentSaving,
    isStudentAccountModalOpen,
    studentAccount,
    studentAccountNotice,
    isStudentAccountSaving,
    loadStudents,
    resetStudentManagement,
    handleStudentSearchSubmit,
    openCreateStudentModal,
    openStudentDetailModal,
    handleStudentFormChange,
    handleStudentModalClose,
    handleStudentFormSubmit,
    handleDeleteStudent,
    handleStartEditing,
    handleCancelEditing,
    openStudentAccountModal,
    closeStudentAccountModal,
    handleToggleStudentAccountStatus,
    handleResetStudentAccountPassword,
  }
}
