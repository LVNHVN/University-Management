import axios from 'axios'
import { API_BASE_URL } from '../../../shared/constants/api'

export const fetchDashboardOverview = async (semester) => {
  const response = await axios.get(`${API_BASE_URL}/api/dashboard/overview`, {
    params: { semester },
  })
  return response.data
}
