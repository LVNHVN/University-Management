import axios from 'axios'
import { API_BASE_URL } from '../../../shared/constants/api'

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
