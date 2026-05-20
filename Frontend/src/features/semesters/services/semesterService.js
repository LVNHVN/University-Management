import apiClient from '../../../shared/utils/apiClient'
import { API_BASE_URL } from '../../../shared/constants/api'

export const fetchSemesters = async (keyword = '') => {
  const response = await apiClient.get(`${API_BASE_URL}/api/semesters`, {
    params: keyword ? { search: keyword.trim() } : {},
  })

  return response.data
}

export const fetchSemesterDetail = async (semesterId) => {
  const response = await apiClient.get(`${API_BASE_URL}/api/semesters/${semesterId}`)
  return response.data
}

export const createSemester = async (payload) => {
  const response = await apiClient.post(`${API_BASE_URL}/api/semesters`, payload)
  return response.data
}

export const updateSemester = async (semesterId, payload) => {
  const response = await apiClient.put(`${API_BASE_URL}/api/semesters/${semesterId}`, payload)
  return response.data
}
