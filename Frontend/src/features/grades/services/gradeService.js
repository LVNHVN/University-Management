import apiClient from '../../../shared/utils/apiClient'
import { API_BASE_URL } from '../../../shared/constants/api'

export const fetchMyGrades = async (semester = '') => {
  const response = await apiClient.get(`${API_BASE_URL}/api/classes/my/grades`, {
    params: semester ? { semester: String(semester).trim() } : {},
  })

  return response.data
}

export const fetchMyGradeSummary = async () => {
  const response = await apiClient.get(`${API_BASE_URL}/api/classes/my/grades-summary`)
  return response.data
}
