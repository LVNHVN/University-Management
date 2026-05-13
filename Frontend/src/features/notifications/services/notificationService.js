import { API_BASE_URL } from '../../../shared/constants/api'
import apiClient from '../../../shared/utils/apiClient'

export const createNotification = async ({ title, content, targetRoles }) => {
  const response = await apiClient.post(`${API_BASE_URL}/api/notifications`, {
    title,
    content,
    targetRoles,
  })
  return response.data
}

export const fetchMyNotifications = async () => {
  const response = await apiClient.get(`${API_BASE_URL}/api/notifications/me`)
  return response.data
}

export const markNotificationAsRead = async (notificationId) => {
  const response = await apiClient.post(`${API_BASE_URL}/api/notifications/${notificationId}/read`)
  return response.data
}
