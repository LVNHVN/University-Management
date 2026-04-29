import apiClient from '../../../shared/utils/apiClient'
import { API_BASE_URL } from '../../../shared/constants/api'

export const fetchTeachers = async (keyword = '') => {
  const response = await apiClient.get(`${API_BASE_URL}/api/teachers`, {
    params: keyword ? { search: keyword.trim() } : {},
  })
  return response.data
}

export const fetchTeacherDetail = async (teacherId) => {
  const response = await apiClient.get(`${API_BASE_URL}/api/teachers/${teacherId}`)
  return response.data
}

export const createTeacher = async (payload) => {
  const response = await apiClient.post(`${API_BASE_URL}/api/teachers`, payload)
  return response.data
}

export const updateTeacher = async (teacherId, payload) => {
  const response = await apiClient.put(`${API_BASE_URL}/api/teachers/${teacherId}`, payload)
  return response.data
}

export const removeTeacher = async (teacherId) => {
  const response = await apiClient.delete(`${API_BASE_URL}/api/teachers/${teacherId}`)
  return response.data
}

export const fetchTeacherAccount = async (teacherId) => {
  const response = await apiClient.get(`${API_BASE_URL}/api/teachers/${teacherId}/account`)
  return response.data
}

export const updateTeacherAccount = async (userId, payload) => {
  const response = await apiClient.patch(`${API_BASE_URL}/api/users/${userId}/account`, payload)
  return response.data
}

export const importTeachersFromCsv = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post(`${API_BASE_URL}/api/teachers/import/csv`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export const previewTeachersImport = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post(`${API_BASE_URL}/api/teachers/import/csv/preview`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export const commitTeachersImport = async (validRows) => {
  const response = await apiClient.post(`${API_BASE_URL}/api/teachers/import/csv/commit`, {
    validRows,
  })

  return response.data
}
