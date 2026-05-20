import apiClient from '../../../shared/utils/apiClient'
import { API_BASE_URL } from '../../../shared/constants/api'

export const fetchMySchedule = async (semester = '') => {
  const response = await apiClient.get(`${API_BASE_URL}/api/classes/my/schedule`, {
    params: semester ? { semester: String(semester).trim() } : {},
  })
  return response.data
}
