import apiClient from '../../../shared/utils/apiClient'
import { API_BASE_URL } from '../../../shared/constants/api'

export const fetchCurriculums = async (keyword = '') => {
  const response = await apiClient.get(`${API_BASE_URL}/api/curriculum`, {
    params: keyword ? { search: keyword.trim() } : {},
  })

  return response.data
}

export const createCurriculum = async (payload) => {
  const response = await apiClient.post(`${API_BASE_URL}/api/curriculum`, payload)
  return response.data
}

export const fetchCurriculumDetail = async (curriculumId) => {
  const response = await apiClient.get(`${API_BASE_URL}/api/curriculum/${curriculumId}`)
  return response.data
}

export const updateCurriculum = async (curriculumId, payload) => {
  const response = await apiClient.put(`${API_BASE_URL}/api/curriculum/${curriculumId}`, payload)
  return response.data
}

export const removeCurriculum = async (curriculumId) => {
  const response = await apiClient.delete(`${API_BASE_URL}/api/curriculum/${curriculumId}`)
  return response.data
}