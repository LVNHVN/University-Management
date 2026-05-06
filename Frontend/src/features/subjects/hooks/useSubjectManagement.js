import { useCallback, useEffect, useState } from 'react'
import { SUBJECT_INITIAL_FORM } from '../constants/subjectConstants'
import { createSubject, fetchSubjectDetail, fetchSubjects, removeSubject, updateSubject } from '../services/subjectService'
import { validateSubjectForm } from '../validators/subjectValidator'

const EMPTY_SYLLABUS = {
  fileName: '',
  filePath: '',
  mimeType: '',
  fileSize: 0,
  uploadedAt: null,
}

const isSupportedSyllabusFile = (file) => /\.(pdf)$/i.test(String(file?.name || ''))

export const useSubjectManagement = () => {
  const [subjectSearchKeyword, setSubjectSearchKeyword] = useState('')
  const [subjects, setSubjects] = useState([])
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(false)
  const [subjectsError, setSubjectsError] = useState('')
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false)
  const [subjectModalMode, setSubjectModalMode] = useState('detail')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [subjectForm, setSubjectForm] = useState(SUBJECT_INITIAL_FORM)
  const [subjectFormErrors, setSubjectFormErrors] = useState({})
  const [subjectFormNotice, setSubjectFormNotice] = useState('')
  const [isSubjectSaving, setIsSubjectSaving] = useState(false)
  const [originalSubjectForm, setOriginalSubjectForm] = useState(null)
  const [subjectSyllabus, setSubjectSyllabus] = useState(EMPTY_SYLLABUS)
  const [originalSubjectSyllabus, setOriginalSubjectSyllabus] = useState(EMPTY_SYLLABUS)
  const [subjectSyllabusFile, setSubjectSyllabusFile] = useState(null)
  const [removeSubjectSyllabus, setRemoveSubjectSyllabus] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null })

  const loadSubjects = useCallback(async (keyword = '') => {
    setIsSubjectsLoading(true)
    setSubjectsError('')

    try {
      const payload = await fetchSubjects(keyword)

      if (!payload?.success) {
        throw new Error('Không tải được danh sách môn học.')
      }

      setSubjects(Array.isArray(payload.subjects) ? payload.subjects : [])
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setSubjectsError(backendMessage || 'Không tải được danh sách môn học.')
      setSubjects([])
    } finally {
      setIsSubjectsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSubjects()
  }, [loadSubjects])

  const handleSubjectSearchSubmit = useCallback((event) => {
    event.preventDefault()
    loadSubjects(subjectSearchKeyword)
  }, [loadSubjects, subjectSearchKeyword])

  const openCreateSubjectModal = useCallback(() => {
    setIsSubjectModalOpen(true)
    setSubjectModalMode('create')
    setSelectedSubjectId('')
    setOriginalSubjectForm(null)
    setSubjectForm(SUBJECT_INITIAL_FORM)
    setSubjectSyllabus(EMPTY_SYLLABUS)
    setOriginalSubjectSyllabus(EMPTY_SYLLABUS)
    setSubjectSyllabusFile(null)
    setRemoveSubjectSyllabus(false)
    setSubjectFormErrors({})
    setSubjectFormNotice('')
  }, [])

  const openSubjectModal = useCallback(async (subjectId, mode) => {
    setIsSubjectModalOpen(true)
    setSubjectModalMode(mode)
    setSelectedSubjectId(subjectId)
    setSubjectFormNotice('Đang tải thông tin môn học...')

    try {
      const payload = await fetchSubjectDetail(subjectId)

      if (!payload?.success || !payload.subject) {
        throw new Error('Không tải được thông tin môn học.')
      }

      const subject = payload.subject
      setSubjectForm({
        subjectCode: subject.subjectCode || '',
        name: subject.name || '',
        department: subject.department || '',
        credits: String(subject.credits ?? ''),
        finalWeight: String(subject.finalWeight ?? ''),
      })
      setOriginalSubjectForm({
        subjectCode: subject.subjectCode || '',
        name: subject.name || '',
        department: subject.department || '',
        credits: String(subject.credits ?? ''),
        finalWeight: String(subject.finalWeight ?? ''),
      })
      const syllabus = subject.syllabus?.filePath ? subject.syllabus : EMPTY_SYLLABUS
      setSubjectSyllabus(syllabus)
      setOriginalSubjectSyllabus(syllabus)
      setSubjectSyllabusFile(null)
      setRemoveSubjectSyllabus(false)
      setSubjectFormErrors({})
      setSubjectFormNotice('')
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setSubjectFormNotice(backendMessage || 'Không tải được thông tin môn học.')
    }
  }, [])

  const openSubjectDetailModal = useCallback((subjectId) => {
    openSubjectModal(subjectId, 'detail')
  }, [openSubjectModal])

  const handleStartEditing = useCallback(() => {
    setSubjectModalMode('editing')
    setSubjectFormErrors({})
    setSubjectFormNotice('')
  }, [])

  const handleCancelEditing = useCallback(() => {
    if (originalSubjectForm) {
      setSubjectForm(originalSubjectForm)
    }

    setSubjectSyllabus(originalSubjectSyllabus)
    setSubjectSyllabusFile(null)
    setRemoveSubjectSyllabus(false)

    setSubjectModalMode('detail')
    setSubjectFormErrors({})
    setSubjectFormNotice('')
  }, [originalSubjectForm, originalSubjectSyllabus])

  const handleSubjectModalClose = useCallback(() => {
    if (isSubjectSaving) {
      return
    }

    setIsSubjectModalOpen(false)
    setSubjectFormErrors({})
    setSubjectFormNotice('')
    setSubjectSyllabusFile(null)
    setRemoveSubjectSyllabus(false)
  }, [isSubjectSaving])

  const handleSubjectFormChange = useCallback((event) => {
    const { name, value } = event.target
    setSubjectForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    setSubjectFormErrors((prev) => {
      if (!prev[name]) {
        return prev
      }

      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [])

  const handleSubjectSyllabusFileChange = useCallback((file) => {
    if (!file) {
      return
    }

    if (!isSupportedSyllabusFile(file)) {
      setSubjectFormErrors((prev) => ({
        ...prev,
        syllabusFile: 'Chỉ hỗ trợ file PDF định dạng .pdf.',
      }))
      return
    }

    setSubjectSyllabusFile(file)
    setRemoveSubjectSyllabus(false)
    setSubjectFormErrors((prev) => {
      if (!prev.syllabusFile) {
        return prev
      }

      const next = { ...prev }
      delete next.syllabusFile
      return next
    })
  }, [])

  const handleRemoveSubjectSyllabus = useCallback(() => {
    setSubjectSyllabusFile(null)
    setRemoveSubjectSyllabus(Boolean(subjectSyllabus.filePath))
    setSubjectFormErrors((prev) => {
      if (!prev.syllabusFile) {
        return prev
      }

      const next = { ...prev }
      delete next.syllabusFile
      return next
    })
  }, [subjectSyllabus.filePath])

  const handleSubjectFormSubmit = useCallback(async (event) => {
    event.preventDefault()

    if (subjectModalMode !== 'editing' && subjectModalMode !== 'create') {
      return
    }

    const errors = validateSubjectForm(subjectForm)
    if (Object.keys(errors).length > 0) {
      setSubjectFormErrors(errors)
      setSubjectFormNotice('Vui lòng kiểm tra lại thông tin bắt buộc.')
      return
    }

    const payload = {
      subjectCode: subjectForm.subjectCode.trim(),
      name: subjectForm.name.trim(),
      department: subjectForm.department.trim(),
      credits: Number(subjectForm.credits),
      finalWeight: Number(subjectForm.finalWeight),
    }

    setIsSubjectSaving(true)
    setSubjectFormNotice('')

    try {
      if (subjectModalMode === 'create') {
        await createSubject(payload, subjectSyllabusFile)
      } else {
        await updateSubject(selectedSubjectId, payload, subjectSyllabusFile, removeSubjectSyllabus)
      }
      setIsSubjectModalOpen(false)
      setOriginalSubjectForm(null)
      setSubjectForm(SUBJECT_INITIAL_FORM)
      setSubjectSyllabus(EMPTY_SYLLABUS)
      setOriginalSubjectSyllabus(EMPTY_SYLLABUS)
      setSubjectSyllabusFile(null)
      setRemoveSubjectSyllabus(false)
      await loadSubjects(subjectSearchKeyword)
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setSubjectFormNotice(backendMessage || 'Không thể lưu thông tin môn học.')
    } finally {
      setIsSubjectSaving(false)
    }
  }, [loadSubjects, removeSubjectSyllabus, selectedSubjectId, subjectForm, subjectModalMode, subjectSearchKeyword, subjectSyllabusFile])

  const handleDeleteSubject = useCallback((subject) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa môn học',
      message: `Bạn có chắc muốn xóa môn học "${subject.name}"? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        try {
          await removeSubject(subject._id)
          await loadSubjects(subjectSearchKeyword)
        } catch (error) {
          const backendMessage = error.response?.data?.message
          setSubjectsError(backendMessage || 'Không thể xóa môn học.')
        }
      },
    })
  }, [loadSubjects, subjectSearchKeyword])

  const handleConfirmDialogClose = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
  }, [])

  return {
    subjectSearchKeyword,
    setSubjectSearchKeyword,
    subjects,
    isSubjectsLoading,
    subjectsError,
    isSubjectModalOpen,
    subjectModalMode,
    subjectForm,
    subjectFormErrors,
    subjectFormNotice,
    subjectSyllabus,
    subjectSyllabusFileName: subjectSyllabusFile?.name || '',
    removeSubjectSyllabus,
    isSubjectSaving,
    handleSubjectSearchSubmit,
    openCreateSubjectModal,
    openSubjectDetailModal,
    handleDeleteSubject,
    handleStartEditing,
    handleCancelEditing,
    handleSubjectModalClose,
    handleSubjectFormChange,
    handleSubjectSyllabusFileChange,
    handleRemoveSubjectSyllabus,
    handleSubjectFormSubmit,
    confirmDialog,
    handleConfirmDialogClose,
  }
}
