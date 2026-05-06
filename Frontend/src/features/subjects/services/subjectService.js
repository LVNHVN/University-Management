import apiClient from '../../../shared/utils/apiClient'
import { API_BASE_URL } from '../../../shared/constants/api'

const appendSubjectFormData = (formData, payload) => {
  formData.append('subjectCode', payload.subjectCode)
  formData.append('name', payload.name)
  formData.append('department', payload.department)
  formData.append('credits', String(payload.credits))
  formData.append('finalWeight', String(payload.finalWeight))
}

export const fetchSubjects = async (keyword = '') => {
  const response = await apiClient.get(`${API_BASE_URL}/api/subjects`, {
    params: keyword ? { search: keyword.trim() } : {},
  })
  return response.data
}

export const fetchSubjectDetail = async (subjectId) => {
  const response = await apiClient.get(`${API_BASE_URL}/api/subjects/${subjectId}`)
  return response.data
}

export const createSubject = async (payload, syllabusFile) => {
  const formData = new FormData()
  appendSubjectFormData(formData, payload)
  if (syllabusFile) {
    formData.append('syllabusFile', syllabusFile)
  }

  const response = await apiClient.post(`${API_BASE_URL}/api/subjects`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const updateSubject = async (subjectId, payload, syllabusFile, removeSyllabus = false) => {
  const formData = new FormData()
  appendSubjectFormData(formData, payload)
  if (syllabusFile) {
    formData.append('syllabusFile', syllabusFile)
  }
  if (removeSyllabus) {
    formData.append('removeSyllabus', 'true')
  }

  const response = await apiClient.put(`${API_BASE_URL}/api/subjects/${subjectId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const removeSubject = async (subjectId) => {
  const response = await apiClient.delete(`${API_BASE_URL}/api/subjects/${subjectId}`)
  return response.data
}
