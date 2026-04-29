import apiClient from '../../../shared/utils/apiClient'
import { API_BASE_URL } from '../../../shared/constants/api'

export const fetchStudents = async (keyword = '') => {
  const response = await apiClient.get(`${API_BASE_URL}/api/students`, {
    params: keyword ? { search: keyword.trim() } : {},
  })
  return response.data
}

export const fetchStudentDetail = async (studentId) => {
  const response = await apiClient.get(`${API_BASE_URL}/api/students/${studentId}`)
  return response.data
}

export const createStudent = async (payload) => {
  const response = await apiClient.post(`${API_BASE_URL}/api/students`, payload)
  return response.data
}

export const updateStudent = async (studentId, payload) => {
  const response = await apiClient.put(`${API_BASE_URL}/api/students/${studentId}`, payload)
  return response.data
}

export const removeStudent = async (studentId) => {
  const response = await apiClient.delete(`${API_BASE_URL}/api/students/${studentId}`)
  return response.data
}

export const fetchStudentAccount = async (studentId) => {
  const response = await apiClient.get(`${API_BASE_URL}/api/students/${studentId}/account`)
  return response.data
}

export const updateStudentAccount = async (userId, payload) => {
  const response = await apiClient.patch(`${API_BASE_URL}/api/users/${userId}/account`, payload)
  return response.data
}

export const importStudentsFromCsv = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post(`${API_BASE_URL}/api/students/import/csv`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export const previewStudentsImport = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post(`${API_BASE_URL}/api/students/import/csv/preview`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export const commitStudentsImport = async (validRows) => {
  const response = await apiClient.post(`${API_BASE_URL}/api/students/import/csv/commit`, {
    validRows,
  })

  return response.data
}
