import { useCallback, useEffect, useState } from 'react'
import { formatDateForDisplay, parseDisplayDateToIso } from '../../../shared/utils/date'
import { TEACHER_INITIAL_FORM } from '../constants/teacherConstants'
import {
  createTeacher,
  commitTeachersImport,
  fetchTeacherAccount,
  fetchTeacherDetail,
  fetchTeachers,
  previewTeachersImport,
  removeTeacher,
  updateTeacherAccount,
  updateTeacher,
} from '../services/teacherService'
import { validateTeacherForm } from '../validators/teacherValidator'

export const useTeacherManagement = ({ onTeacherChanged } = {}) => {
  const [isTeacherImportModalOpen, setIsTeacherImportModalOpen] = useState(false)
  const [teacherImportFile, setTeacherImportFile] = useState(null)
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
  const [isTeachersImporting, setIsTeachersImporting] = useState(false)
  const [isTeacherImportPreviewOpen, setIsTeacherImportPreviewOpen] = useState(false)
  const [teacherImportPreview, setTeacherImportPreview] = useState(null)
  const [isTeacherImportCommitting, setIsTeacherImportCommitting] = useState(false)
  const [teacherImportSuccess, setTeacherImportSuccess] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null })

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

  const openTeacherImportModal = useCallback(() => {
    setTeachersError('')
    setTeacherImportFile(null)
    setIsTeacherImportModalOpen(true)
  }, [])

  const closeTeacherImportModal = useCallback(() => {
    if (isTeachersImporting) {
      return
    }

    setIsTeacherImportModalOpen(false)
    setTeacherImportFile(null)
  }, [isTeachersImporting])

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

    setConfirmDialog({
      isOpen: true,
      title: 'Đặt lại mật khẩu',
      message: 'Bạn có chắc muốn đặt lại mật khẩu tài khoản về mặc định 123456?',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
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
      },
    })
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

  const handleDeleteTeacher = useCallback((teacher) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa giảng viên',
      message: `Bạn có chắc muốn xóa giảng viên "${teacher.fullName}"? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        try {
          await removeTeacher(teacher._id)
          await Promise.all([loadTeachers(teacherSearchKeyword), onTeacherChanged?.()])
        } catch (error) {
          const backendMessage = error.response?.data?.message
          setTeachersError(backendMessage || 'Không thể xóa giảng viên.')
        }
      },
    })
  }, [loadTeachers, onTeacherChanged, teacherSearchKeyword])

  const handleConfirmDialogClose = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const handleTeacherImportFileChange = useCallback((file) => {
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
      setTeachersError('Chỉ hỗ trợ import file .csv, .xlsx hoặc .xls.')
      setTeacherImportFile(null)
      return
    }

    setTeachersError('')
    setTeacherImportFile(file)
  }, [])

  const handleImportTeachersCsv = useCallback(async () => {
    if (!teacherImportFile) {
      setTeachersError('Vui lòng chọn file import giảng viên.')
      return
    }

    setIsTeachersImporting(true)
    setTeachersError('')

    try {
      const payload = await previewTeachersImport(teacherImportFile)
      setTeacherImportPreview(payload)
      setIsTeacherImportModalOpen(false)
      setIsTeacherImportPreviewOpen(true)
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setTeachersError(backendMessage || 'Không thể đọc file import giảng viên.')
    } finally {
      setIsTeachersImporting(false)
    }
  }, [teacherImportFile])

  const handleCommitTeachersImport = useCallback(async () => {
    if (!teacherImportPreview?.validRows?.length) {
      return
    }

    setIsTeacherImportCommitting(true)
    setTeachersError('')

    try {
      const payload = await commitTeachersImport(teacherImportPreview.validRows)
      setIsTeacherImportPreviewOpen(false)
      setTeacherImportPreview(null)
      setTeacherImportSuccess({
        createdRows: payload?.summary?.createdRows ?? 0,
        totalRows: payload?.summary?.totalRows ?? teacherImportPreview.validRows.length,
      })
      await Promise.all([loadTeachers(teacherSearchKeyword), onTeacherChanged?.()])
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setTeachersError(backendMessage || 'Không thể lưu dữ liệu import giảng viên.')
    } finally {
      setIsTeacherImportCommitting(false)
    }
  }, [loadTeachers, onTeacherChanged, teacherImportPreview, teacherSearchKeyword])

  const handleCloseTeacherImportPreview = useCallback(() => {
    if (isTeacherImportCommitting) {
      return
    }
    setIsTeacherImportPreviewOpen(false)
    setTeacherImportPreview(null)
  }, [isTeacherImportCommitting])

  const handleCloseTeacherImportSuccess = useCallback(() => {
    setTeacherImportSuccess(null)
    setTeacherImportFile(null)
  }, [])

  return {
    isTeacherImportModalOpen,
    teacherImportFileName: teacherImportFile?.name || '',
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
    isTeachersImporting,
    isTeacherImportPreviewOpen,
    teacherImportPreview,
    isTeacherImportCommitting,
    teacherImportSuccess,
    openTeacherImportModal,
    closeTeacherImportModal,
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
    handleTeacherImportFileChange,
    handleImportTeachersCsv,
    handleCommitTeachersImport,
    handleCloseTeacherImportPreview,
    handleCloseTeacherImportSuccess,
    confirmDialog,
    handleConfirmDialogClose,
  }
}
