import apiClient from '../../../shared/utils/apiClient'
import { API_BASE_URL } from '../../../shared/constants/api'

export const fetchClasses = async (keyword = '') => {
  const response = await apiClient.get(`${API_BASE_URL}/api/classes`, {
    params: keyword ? { search: keyword.trim() } : {},
  })
  return response.data
}

export const fetchClassDetail = async (classId) => {
  const response = await apiClient.get(`${API_BASE_URL}/api/classes/${classId}`)
  return response.data
}

export const fetchClassStudents = async (classId) => {
  const response = await apiClient.get(`${API_BASE_URL}/api/classes/${classId}/students`)
  return response.data
}

export const updateClassStudentGrades = async (classId, enrollmentId, payload) => {
  const response = await apiClient.patch(`${API_BASE_URL}/api/classes/${classId}/students/${enrollmentId}/grades`, payload)
  return response.data
}

export const importClassGrades = async (classId, file) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post(`${API_BASE_URL}/api/classes/${classId}/students/grades/import`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export const fetchClassAttendance = async (classId, date) => {
  const response = await apiClient.get(`${API_BASE_URL}/api/classes/${classId}/attendance`, {
    params: { date },
  })
  return response.data
}

export const updateClassAttendance = async (classId, date, records) => {
  const response = await apiClient.patch(`${API_BASE_URL}/api/classes/${classId}/attendance`, {
    records,
  }, {
    params: { date },
  })
  return response.data
}

export const createClass = async (payload) => {
  const response = await apiClient.post(`${API_BASE_URL}/api/classes`, payload)
  return response.data
}

export const updateClass = async (classId, payload) => {
  const response = await apiClient.put(`${API_BASE_URL}/api/classes/${classId}`, payload)
  return response.data
}

export const removeClass = async (classId) => {
  const response = await apiClient.delete(`${API_BASE_URL}/api/classes/${classId}`)
  return response.data
}
