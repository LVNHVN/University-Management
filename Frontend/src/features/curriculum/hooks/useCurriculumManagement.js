import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createCurriculum,
  fetchCurriculumDetail,
  fetchCurriculums,
  removeCurriculum,
  updateCurriculum,
} from '../services/curriculumService'
import { fetchSubjects } from '../../subjects/services/subjectService'

const CURRICULUM_INITIAL_FORM = {
  curriculumCode: '',
  name: '',
}

export const useCurriculumManagement = () => {
  const [curriculumSearchKeyword, setCurriculumSearchKeyword] = useState('')
  const [curriculums, setCurriculums] = useState([])
  const [isCurriculumsLoading, setIsCurriculumsLoading] = useState(false)
  const [curriculumsError, setCurriculumsError] = useState('')
  const [curriculumFeatureNotice, setCurriculumFeatureNotice] = useState('')

  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false)
  const [curriculumModalMode, setCurriculumModalMode] = useState('detail')
  const [selectedCurriculumId, setSelectedCurriculumId] = useState('')

  const [curriculumForm, setCurriculumForm] = useState(CURRICULUM_INITIAL_FORM)
  const [originalCurriculumForm, setOriginalCurriculumForm] = useState(null)
  const [curriculumFormErrors, setCurriculumFormErrors] = useState({})
  const [curriculumFormNotice, setCurriculumFormNotice] = useState('')
  const [isCurriculumSaving, setIsCurriculumSaving] = useState(false)

  const [availableSubjects, setAvailableSubjects] = useState([])
  const [selectedSubjectItems, setSelectedSubjectItems] = useState([])
  const [originalSelectedSubjectItems, setOriginalSelectedSubjectItems] = useState([])
  const [subjectPickerKeyword, setSubjectPickerKeyword] = useState('')
  const [subjectPickerId, setSubjectPickerId] = useState('')
  const [subjectPickerSemester, setSubjectPickerSemester] = useState('')
  const [subjectPickerError, setSubjectPickerError] = useState('')

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null })

  const totalSelectedCredits = useMemo(
    () => selectedSubjectItems.reduce((sum, item) => sum + (item.credits || 0), 0),
    [selectedSubjectItems],
  )

  const filteredAvailableSubjects = useMemo(() => {
    const keyword = subjectPickerKeyword.trim().toLowerCase()

    if (!keyword) {
      return availableSubjects
    }

    return availableSubjects.filter((subject) => {
      const subjectCode = String(subject.subjectCode || '').toLowerCase()
      const subjectName = String(subject.name || '').toLowerCase()
      return subjectCode.includes(keyword) || subjectName.includes(keyword)
    })
  }, [availableSubjects, subjectPickerKeyword])

  const isViewOnly = curriculumModalMode === 'detail'
  const isCreateMode = curriculumModalMode === 'create'
  const isEditingMode = curriculumModalMode === 'editing'

  const loadCurriculums = useCallback(async (keyword = '') => {
    setIsCurriculumsLoading(true)
    setCurriculumsError('')

    try {
      const payload = await fetchCurriculums(keyword)

      if (!payload?.success) {
        throw new Error('Không tải được danh sách chương trình đào tạo.')
      }

      setCurriculums(Array.isArray(payload.curriculums) ? payload.curriculums : [])
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setCurriculumsError(backendMessage || 'Không tải được danh sách chương trình đào tạo.')
      setCurriculums([])
    } finally {
      setIsCurriculumsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCurriculums()
  }, [loadCurriculums])

  const loadAvailableSubjects = useCallback(async () => {
    try {
      const payload = await fetchSubjects()
      setAvailableSubjects(Array.isArray(payload?.subjects) ? payload.subjects : [])
    } catch {
      setAvailableSubjects([])
    }
  }, [])

  const resetPicker = useCallback(() => {
    setSubjectPickerKeyword('')
    setSubjectPickerId('')
    setSubjectPickerSemester('')
    setSubjectPickerError('')
  }, [])

  const handleCurriculumSearchSubmit = useCallback((event) => {
    event.preventDefault()
    setCurriculumFeatureNotice('')
    loadCurriculums(curriculumSearchKeyword)
  }, [curriculumSearchKeyword, loadCurriculums])

  const handleOpenCreateCurriculum = useCallback(async () => {
    setCurriculumFeatureNotice('')
    setSelectedCurriculumId('')
    setCurriculumModalMode('create')
    setCurriculumForm(CURRICULUM_INITIAL_FORM)
    setOriginalCurriculumForm(null)
    setCurriculumFormErrors({})
    setCurriculumFormNotice('')
    setSelectedSubjectItems([])
    setOriginalSelectedSubjectItems([])
    resetPicker()
    setIsCurriculumModalOpen(true)
    await loadAvailableSubjects()
  }, [loadAvailableSubjects, resetPicker])

  const handleOpenCurriculumDetail = useCallback(async (curriculumId) => {
    setCurriculumFeatureNotice('')
    setSelectedCurriculumId(curriculumId)
    setCurriculumModalMode('detail')
    setCurriculumFormErrors({})
    setCurriculumFormNotice('Đang tải thông tin chương trình đào tạo...')
    setIsCurriculumModalOpen(true)

    try {
      const [detailPayload] = await Promise.all([
        fetchCurriculumDetail(curriculumId),
        loadAvailableSubjects(),
      ])

      if (!detailPayload?.success || !detailPayload.curriculum) {
        throw new Error('Không tải được thông tin chương trình đào tạo.')
      }

      const curriculum = detailPayload.curriculum
      const formData = {
        curriculumCode: curriculum.curriculumCode || '',
        name: curriculum.name || '',
      }

      const subjects = Array.isArray(curriculum.subjects)
        ? curriculum.subjects.map((item) => ({
            subjectId: item.subjectId,
            subjectCode: item.subjectCode,
            name: item.name,
            credits: item.credits,
            recommendedSemester: item.recommendedSemester,
          }))
        : []

      setCurriculumForm(formData)
      setOriginalCurriculumForm(formData)
      setSelectedSubjectItems(subjects)
      setOriginalSelectedSubjectItems(subjects)
      resetPicker()
      setCurriculumFormNotice('')
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setCurriculumFormNotice(backendMessage || 'Không tải được thông tin chương trình đào tạo.')
    }
  }, [loadAvailableSubjects, resetPicker])

  const handleStartEditing = useCallback(() => {
    setCurriculumModalMode('editing')
    setCurriculumFormErrors({})
    setCurriculumFormNotice('')
  }, [])

  const handleCancelEditing = useCallback(() => {
    if (originalCurriculumForm) {
      setCurriculumForm(originalCurriculumForm)
    }
    setSelectedSubjectItems(originalSelectedSubjectItems)
    setCurriculumModalMode('detail')
    setCurriculumFormErrors({})
    setCurriculumFormNotice('')
    resetPicker()
  }, [originalCurriculumForm, originalSelectedSubjectItems, resetPicker])

  const handleCurriculumModalClose = useCallback(() => {
    if (isCurriculumSaving) {
      return
    }

    setIsCurriculumModalOpen(false)
    setCurriculumModalMode('detail')
    setSelectedCurriculumId('')
    setCurriculumFormErrors({})
    setCurriculumFormNotice('')
    setOriginalCurriculumForm(null)
    setSelectedSubjectItems([])
    setOriginalSelectedSubjectItems([])
    resetPicker()
  }, [isCurriculumSaving, resetPicker])

  const handleCurriculumFormChange = useCallback((event) => {
    const { name, value } = event.target
    setCurriculumForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    setCurriculumFormErrors((prev) => {
      if (!prev[name]) {
        return prev
      }

      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [])

  const validateCurriculumForm = useCallback(() => {
    const nextErrors = {}

    if (!curriculumForm.curriculumCode.trim()) {
      nextErrors.curriculumCode = 'Vui lòng nhập mã chương trình đào tạo.'
    } else if (!/^[A-Za-z0-9_-]+$/.test(curriculumForm.curriculumCode.trim())) {
      nextErrors.curriculumCode = 'Mã chương trình đào tạo chỉ gồm chữ, số, gạch ngang hoặc gạch dưới.'
    }

    if (!curriculumForm.name.trim()) {
      nextErrors.name = 'Vui lòng nhập tên chương trình đào tạo.'
    }

    return nextErrors
  }, [curriculumForm.curriculumCode, curriculumForm.name])

  const handleCurriculumFormSubmit = useCallback(async (event) => {
    event.preventDefault()

    if (!isCreateMode && !isEditingMode) {
      return
    }

    const nextErrors = validateCurriculumForm()

    if (Object.keys(nextErrors).length > 0) {
      setCurriculumFormErrors(nextErrors)
      setCurriculumFormNotice('Vui lòng kiểm tra lại thông tin bắt buộc.')
      return
    }

    const payload = {
      curriculumCode: curriculumForm.curriculumCode.trim(),
      name: curriculumForm.name.trim(),
      subjects: selectedSubjectItems.map(({ subjectId, recommendedSemester }) => ({ subjectId, recommendedSemester })),
    }

    setIsCurriculumSaving(true)
    setCurriculumFormNotice('')

    try {
      if (isCreateMode) {
        await createCurriculum(payload)
      } else {
        await updateCurriculum(selectedCurriculumId, payload)
      }

      setIsCurriculumModalOpen(false)
      setCurriculumModalMode('detail')
      setSelectedCurriculumId('')
      setCurriculumForm(CURRICULUM_INITIAL_FORM)
      setCurriculumFormErrors({})
      setCurriculumFormNotice('')
      setOriginalCurriculumForm(null)
      setSelectedSubjectItems([])
      setOriginalSelectedSubjectItems([])
      resetPicker()
      await loadCurriculums(curriculumSearchKeyword)
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setCurriculumFormNotice(backendMessage || 'Không thể lưu thông tin chương trình đào tạo.')
    } finally {
      setIsCurriculumSaving(false)
    }
  }, [
    curriculumForm,
    curriculumSearchKeyword,
    isCreateMode,
    isEditingMode,
    loadCurriculums,
    resetPicker,
    selectedCurriculumId,
    selectedSubjectItems,
    validateCurriculumForm,
  ])

  const handleSubjectPickerIdChange = useCallback((value) => {
    setSubjectPickerId(value)
    setSubjectPickerError('')
  }, [])

  const handleSubjectPickerKeywordChange = useCallback((value) => {
    setSubjectPickerKeyword(value)
    setSubjectPickerId('')
    setSubjectPickerError('')
  }, [])

  const handleSubjectPickerKeywordSelect = useCallback((value) => {
    setSubjectPickerKeyword(value)
    setSubjectPickerError('')
  }, [])

  const handleSubjectPickerSemesterChange = useCallback((value) => {
    setSubjectPickerSemester(value)
    setSubjectPickerError('')
  }, [])

  const handleAddSubjectToCurriculum = useCallback(() => {
    setSubjectPickerError('')

    if (!subjectPickerId) {
      setSubjectPickerError('Vui lòng chọn môn học.')
      return
    }

    const semValue = Number(subjectPickerSemester)

    if (!subjectPickerSemester.toString().trim() || !Number.isInteger(semValue) || semValue <= 0) {
      setSubjectPickerError('Học kỳ khuyến nghị phải là số nguyên dương.')
      return
    }

    if (selectedSubjectItems.some((item) => item.subjectId === subjectPickerId)) {
      setSubjectPickerError('Môn học này đã được thêm vào chương trình.')
      return
    }

    const subject = availableSubjects.find((s) => s._id === subjectPickerId)

    if (!subject) {
      setSubjectPickerError('Môn học không tồn tại.')
      return
    }

    setSelectedSubjectItems((prev) => [
      ...prev,
      {
        subjectId: subject._id,
        subjectCode: subject.subjectCode,
        name: subject.name,
        credits: subject.credits,
        recommendedSemester: semValue,
      },
    ])
    resetPicker()
  }, [subjectPickerId, subjectPickerSemester, selectedSubjectItems, availableSubjects, resetPicker])

  const handleRemoveSubjectFromCurriculum = useCallback((subjectId) => {
    setSelectedSubjectItems((prev) => prev.filter((item) => item.subjectId !== subjectId))
  }, [])

  const handleDeleteCurriculum = useCallback((curriculum) => {
    const curriculumCode = curriculum.curriculumCode || 'không xác định'
    const curriculumName = curriculum.name || 'Không xác định'

    setConfirmDialog({
      isOpen: true,
      title: 'Xóa chương trình đào tạo',
      message: `Bạn có chắc muốn xóa chương trình đào tạo "${curriculumCode} - ${curriculumName}"?`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))

        try {
          await removeCurriculum(curriculum._id)
          await loadCurriculums(curriculumSearchKeyword)
          setCurriculumFeatureNotice('')
        } catch (error) {
          const backendMessage = error.response?.data?.message
          setCurriculumsError(backendMessage || 'Không thể xóa chương trình đào tạo.')
        }
      },
    })
  }, [curriculumSearchKeyword, loadCurriculums])

  const handleConfirmDialogClose = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
  }, [])

  return {
    curriculumSearchKeyword,
    setCurriculumSearchKeyword,
    curriculums,
    isCurriculumsLoading,
    curriculumsError,
    curriculumFeatureNotice,
    isCurriculumModalOpen,
    curriculumModalMode,
    curriculumForm,
    curriculumFormErrors,
    curriculumFormNotice,
    isCurriculumSaving,
    isViewOnly,
    isCreateMode,
    isEditingMode,
    availableSubjects,
    filteredAvailableSubjects,
    selectedSubjectItems,
    totalSelectedCredits,
    subjectPickerKeyword,
    subjectPickerId,
    subjectPickerSemester,
    subjectPickerError,
    handleCurriculumSearchSubmit,
    handleOpenCreateCurriculum,
    handleOpenCurriculumDetail,
    handleStartEditing,
    handleCancelEditing,
    handleCurriculumModalClose,
    handleCurriculumFormChange,
    handleCurriculumFormSubmit,
    handleSubjectPickerKeywordChange,
    handleSubjectPickerKeywordSelect,
    handleSubjectPickerIdChange,
    handleSubjectPickerSemesterChange,
    handleAddSubjectToCurriculum,
    handleRemoveSubjectFromCurriculum,
    handleDeleteCurriculum,
    confirmDialog,
    handleConfirmDialogClose,
  }
}
