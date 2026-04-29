import apiClient from '../../../shared/utils/apiClient'
import { API_BASE_URL } from '../../../shared/constants/api'

export const fetchDashboardOverview = async (semester) => {
  const response = await apiClient.get(`${API_BASE_URL}/api/dashboard/overview`, {
    params: { semester },
  })
  return response.data
}
