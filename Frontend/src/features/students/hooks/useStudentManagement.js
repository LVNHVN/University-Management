import { useCallback, useEffect, useState } from 'react'
import { formatDateForDisplay, parseDisplayDateToIso } from '../../../shared/utils/date'
import { STUDENT_INITIAL_FORM } from '../constants/studentConstants'
import {
  commitStudentsImport,
  createStudent,
  fetchStudentAccount,
  fetchStudentDetail,
  fetchStudents,
  previewStudentsImport,
  removeStudent,
  updateStudentAccount,
  updateStudent,
} from '../services/studentService'
import { validateStudentForm } from '../validators/studentValidator'

export const useStudentManagement = ({ onStudentChanged } = {}) => {
  const [isStudentImportModalOpen, setIsStudentImportModalOpen] = useState(false)
  const [studentImportFile, setStudentImportFile] = useState(null)
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
  const [isStudentsImporting, setIsStudentsImporting] = useState(false)
  const [isStudentImportPreviewOpen, setIsStudentImportPreviewOpen] = useState(false)
  const [studentImportPreview, setStudentImportPreview] = useState(null)
  const [isStudentImportCommitting, setIsStudentImportCommitting] = useState(false)
  const [studentImportSuccess, setStudentImportSuccess] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null })

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

  const openStudentImportModal = useCallback(() => {
    setStudentsError('')
    setStudentImportFile(null)
    setIsStudentImportModalOpen(true)
  }, [])

  const closeStudentImportModal = useCallback(() => {
    if (isStudentsImporting) {
      return
    }

    setIsStudentImportModalOpen(false)
    setStudentImportFile(null)
  }, [isStudentsImporting])

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

    setConfirmDialog({
      isOpen: true,
      title: 'Đặt lại mật khẩu',
      message: 'Bạn có chắc muốn đặt lại mật khẩu tài khoản về mặc định 123456?',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
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
      },
    })
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

  const handleDeleteStudent = useCallback((student) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa sinh viên',
      message: `Bạn có chắc muốn xóa sinh viên "${student.fullName}"? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        try {
          await removeStudent(student._id)
          await Promise.all([loadStudents(studentSearchKeyword), onStudentChanged?.()])
        } catch (error) {
          const backendMessage = error.response?.data?.message
          setStudentsError(backendMessage || 'Không thể xóa sinh viên.')
        }
      },
    })
  }, [loadStudents, onStudentChanged, studentSearchKeyword])

  const handleConfirmDialogClose = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const handleStudentImportFileChange = useCallback((file) => {
    if (!file) {
      return
    }

    const normalizedFileName = String(file.name || '').toLowerCase()
    const normalizedMimeType = String(file.type || '').toLowerCase()
    const isSupportedType =
      normalizedFileName.endsWith('.csv') ||
      normalizedFileName.endsWith('.xlsx') ||
      normalizedFileName.endsWith('.xls') ||
      normalizedMimeType.includes('csv') ||
      normalizedMimeType === 'text/plain' ||
      normalizedMimeType.includes('excel') ||
      normalizedMimeType.includes('spreadsheetml')

    if (!isSupportedType) {
      setStudentsError('Chỉ hỗ trợ import file .csv, .xlsx hoặc .xls.')
      setStudentImportFile(null)
      return
    }

    setStudentsError('')
    setStudentImportFile(file)
  }, [])

  const handleImportStudentsCsv = useCallback(async () => {
    if (!studentImportFile) {
      setStudentsError('Vui lòng chọn file import sinh viên.')
      return
    }

    setIsStudentsImporting(true)
    setStudentsError('')

    try {
      const payload = await previewStudentsImport(studentImportFile)
      setStudentImportPreview(payload)
      setIsStudentImportModalOpen(false)
      setIsStudentImportPreviewOpen(true)
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setStudentsError(backendMessage || 'Không thể đọc file import sinh viên.')
    } finally {
      setIsStudentsImporting(false)
    }
  }, [studentImportFile])

  const handleCommitStudentsImport = useCallback(async () => {
    if (!studentImportPreview?.validRows?.length) {
      return
    }

    setIsStudentImportCommitting(true)
    setStudentsError('')

    try {
      const payload = await commitStudentsImport(studentImportPreview.validRows)
      setIsStudentImportPreviewOpen(false)
      setStudentImportPreview(null)
      setStudentImportSuccess({
        createdRows: payload?.summary?.createdRows ?? 0,
      })
      await Promise.all([loadStudents(studentSearchKeyword), onStudentChanged?.()])
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setStudentsError(backendMessage || 'Không thể lưu dữ liệu import sinh viên.')
    } finally {
      setIsStudentImportCommitting(false)
    }
  }, [loadStudents, onStudentChanged, studentImportPreview, studentSearchKeyword])

  const handleCloseStudentImportPreview = useCallback(() => {
    if (isStudentImportCommitting) {
      return
    }
    setIsStudentImportPreviewOpen(false)
    setStudentImportPreview(null)
  }, [isStudentImportCommitting])

  const handleCloseStudentImportSuccess = useCallback(() => {
    setStudentImportSuccess(null)
    setStudentImportFile(null)
  }, [])

  return {
    isStudentImportModalOpen,
    studentImportFileName: studentImportFile?.name || '',
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
    isStudentsImporting,
    isStudentImportPreviewOpen,
    studentImportPreview,
    isStudentImportCommitting,
    studentImportSuccess,
    openStudentImportModal,
    closeStudentImportModal,
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
    handleStudentImportFileChange,
    handleImportStudentsCsv,
    handleCommitStudentsImport,
    handleCloseStudentImportPreview,
    handleCloseStudentImportSuccess,
    confirmDialog,
    handleConfirmDialogClose,
  }
}
