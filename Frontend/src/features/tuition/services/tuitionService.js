import apiClient from '../../../shared/utils/apiClient'
import { API_BASE_URL } from '../../../shared/constants/api'

export const fetchMyTuition = async (semester = '') => {
  const response = await apiClient.get(`${API_BASE_URL}/api/tuition/my`, {
    params: semester ? { semester: String(semester).trim() } : {},
  })

  return response.data
}

export const createMyTuitionQr = async (semester = '') => {
  const response = await apiClient.post(`${API_BASE_URL}/api/tuition/my/qr`, {
    semester: semester ? String(semester).trim() : '',
  })

  return response.data
}

export const fetchTuitionsForAdmin = async ({ search = '', status = '', semester = '' } = {}) => {
  const response = await apiClient.get(`${API_BASE_URL}/api/tuition`, {
    params: {
      ...(search ? { search: String(search).trim() } : {}),
      ...(status ? { status: String(status).trim() } : {}),
      ...(semester ? { semester: String(semester).trim() } : {}),
    },
  })

  return response.data
}

export const fetchStudentTuitionHistoryForAdmin = async (tuitionId) => {
  const response = await apiClient.get(`${API_BASE_URL}/api/tuition/${tuitionId}/history`)
  return response.data
}

export const confirmTuitionForAdmin = async (tuitionId, payload = {}) => {
  const response = await apiClient.patch(`${API_BASE_URL}/api/tuition/${tuitionId}/confirm`, payload)
  return response.data
}
