import axios from 'axios'
import { API_BASE_URL } from '../../../shared/constants/api'
import apiClient from '../../../shared/utils/apiClient'

export const verifyRecaptcha = async (token) => {
  const response = await axios.post(`${API_BASE_URL}/api/verify-recaptcha`, { token })
  return response.data
}

export const login = async ({ username, password }) => {
  const response = await axios.post(`${API_BASE_URL}/api/login`, {
    username,
    password,
  })
  return response.data
}

export const requestLogout = async () => {
  const response = await apiClient.post(`${API_BASE_URL}/api/logout`)
  return response.data
}

export const fetchMe = async () => {
  const response = await apiClient.get(`${API_BASE_URL}/api/me`)
  return response.data
}

export const fetchProfile = async () => {
  const response = await apiClient.get(`${API_BASE_URL}/api/profile`)
  return response.data
}
