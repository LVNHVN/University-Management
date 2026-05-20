import { useCallback, useEffect, useState } from 'react'
import { formatDateForDisplay, parseDisplayDateToIso } from '../../../shared/utils/date'
import {
  createSemester,
  fetchSemesterDetail,
  fetchSemesters,
  updateSemester,
} from '../services/semesterService'

const INITIAL_FORM = {
  code: '',
  name: '',
  startDate: '',
  endDate: '',
}

export const useSemesterManagement = () => {
  const [semesterSearchKeyword, setSemesterSearchKeyword] = useState('')
  const [semesters, setSemesters] = useState([])
  const [isSemestersLoading, setIsSemestersLoading] = useState(false)
  const [semestersError, setSemestersError] = useState('')

  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false)
  const [semesterModalMode, setSemesterModalMode] = useState('detail')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')

  const [semesterForm, setSemesterForm] = useState(INITIAL_FORM)
  const [originalSemesterForm, setOriginalSemesterForm] = useState(null)
  const [semesterFormErrors, setSemesterFormErrors] = useState({})
  const [semesterFormNotice, setSemesterFormNotice] = useState('')
  const [isSemesterSaving, setIsSemesterSaving] = useState(false)

  const loadSemesters = useCallback(async (keyword = '') => {
    setIsSemestersLoading(true)
    setSemestersError('')

    try {
      const payload = await fetchSemesters(keyword)

      if (!payload?.success) {
        throw new Error('Không tải được danh sách học kỳ.')
      }

      setSemesters(Array.isArray(payload.semesters) ? payload.semesters : [])
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setSemestersError(backendMessage || 'Không tải được danh sách học kỳ.')
      setSemesters([])
    } finally {
      setIsSemestersLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSemesters()
  }, [loadSemesters])

  const handleSemesterSearchSubmit = useCallback((event) => {
    event.preventDefault()
    loadSemesters(semesterSearchKeyword)
  }, [loadSemesters, semesterSearchKeyword])

  const handleOpenCreateSemester = useCallback(() => {
    setIsSemesterModalOpen(true)
    setSemesterModalMode('create')
    setSelectedSemesterId('')
    setSemesterForm(INITIAL_FORM)
    setOriginalSemesterForm(null)
    setSemesterFormErrors({})
    setSemesterFormNotice('')
  }, [])

  const handleOpenSemesterDetail = useCallback(async (semesterId) => {
    setIsSemesterModalOpen(true)
    setSemesterModalMode('detail')
    setSelectedSemesterId(semesterId)
    setSemesterFormErrors({})
    setSemesterFormNotice('Đang tải thông tin học kỳ...')

    try {
      const payload = await fetchSemesterDetail(semesterId)

      if (!payload?.success || !payload.semester) {
        throw new Error('Không tải được thông tin học kỳ.')
      }

      const semester = payload.semester
      const formData = {
        code: semester.code || '',
        name: semester.name || '',
        startDate: formatDateForDisplay(semester.startDate),
        endDate: formatDateForDisplay(semester.endDate),
      }

      setSemesterForm(formData)
      setOriginalSemesterForm(formData)
      setSemesterFormNotice('')
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setSemesterFormNotice(backendMessage || 'Không tải được thông tin học kỳ.')
    }
  }, [])

  const handleSemesterModalClose = useCallback(() => {
    if (isSemesterSaving) return

    setIsSemesterModalOpen(false)
    setSemesterModalMode('detail')
    setSelectedSemesterId('')
    setSemesterFormErrors({})
    setSemesterFormNotice('')
  }, [isSemesterSaving])

  const handleStartEditing = useCallback(() => {
    setSemesterModalMode('editing')
    setSemesterFormErrors({})
    setSemesterFormNotice('')
  }, [])

  const handleCancelEditing = useCallback(() => {
    if (originalSemesterForm) {
      setSemesterForm(originalSemesterForm)
    }
    setSemesterModalMode('detail')
    setSemesterFormErrors({})
    setSemesterFormNotice('')
  }, [originalSemesterForm])

  const handleSemesterFormChange = useCallback((event) => {
    const { name, value } = event.target
    setSemesterForm((prev) => ({ ...prev, [name]: value }))
    setSemesterFormErrors((prev) => ({ ...prev, [name]: '' }))
  }, [])

  const handleSemesterFormSubmit = useCallback(async (event) => {
    event.preventDefault()

    if (semesterModalMode !== 'create' && semesterModalMode !== 'editing') {
      return
    }

    const errors = {}

    if (semesterModalMode === 'create') {
      if (!semesterForm.code.trim()) {
        errors.code = 'Vui lòng nhập mã học kỳ.'
      } else if (!/^\d{4}\.\d+$/.test(semesterForm.code.trim())) {
        errors.code = 'Mã học kỳ phải theo định dạng YYYY.T (ví dụ 2025.2).'
      }
    }

    if (!semesterForm.name.trim()) {
      errors.name = 'Vui lòng nhập tên học kỳ.'
    }

    if (!semesterForm.startDate) {
      errors.startDate = 'Vui lòng nhập ngày bắt đầu.'
    } else if (!parseDisplayDateToIso(semesterForm.startDate)) {
      errors.startDate = 'Ngày bắt đầu phải theo định dạng dd/mm/yyyy.'
    }

    if (!semesterForm.endDate) {
      errors.endDate = 'Vui lòng nhập ngày kết thúc.'
    } else if (!parseDisplayDateToIso(semesterForm.endDate)) {
      errors.endDate = 'Ngày kết thúc phải theo định dạng dd/mm/yyyy.'
    }

    const parsedStartDate = parseDisplayDateToIso(semesterForm.startDate)
    const parsedEndDate = parseDisplayDateToIso(semesterForm.endDate)

    if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
      errors.endDate = 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.'
    }

    if (Object.keys(errors).length > 0) {
      setSemesterFormErrors(errors)
      setSemesterFormNotice('Vui lòng kiểm tra lại thông tin bắt buộc.')
      return
    }

    setIsSemesterSaving(true)
    setSemesterFormNotice('')

    const payload = {
      code: semesterForm.code.trim(),
      name: semesterForm.name.trim(),
      startDate: parsedStartDate,
      endDate: parsedEndDate,
    }

    try {
      if (semesterModalMode === 'create') {
        await createSemester(payload)
      } else {
        await updateSemester(selectedSemesterId, {
          name: payload.name,
          startDate: payload.startDate,
          endDate: payload.endDate,
        })
      }

      setIsSemesterModalOpen(false)
      setSemesterModalMode('detail')
      setSelectedSemesterId('')
      setSemesterForm(INITIAL_FORM)
      setOriginalSemesterForm(null)
      setSemesterFormErrors({})
      setSemesterFormNotice('')
      await loadSemesters(semesterSearchKeyword)
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setSemesterFormNotice(backendMessage || 'Không thể lưu thông tin học kỳ.')
    } finally {
      setIsSemesterSaving(false)
    }
  }, [semesterForm, semesterModalMode, selectedSemesterId, loadSemesters, semesterSearchKeyword])

  return {
    semesterSearchKeyword,
    setSemesterSearchKeyword,
    semesters,
    isSemestersLoading,
    semestersError,
    isSemesterModalOpen,
    semesterModalMode,
    semesterForm,
    semesterFormErrors,
    semesterFormNotice,
    isSemesterSaving,
    handleSemesterSearchSubmit,
    handleOpenCreateSemester,
    handleOpenSemesterDetail,
    handleSemesterModalClose,
    handleStartEditing,
    handleCancelEditing,
    handleSemesterFormChange,
    handleSemesterFormSubmit,
  }
}
