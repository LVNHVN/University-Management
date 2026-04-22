import axios from 'axios'
import { API_BASE_URL } from '../../../shared/constants/api'

export const fetchStudents = async (keyword = '') => {
  const response = await axios.get(`${API_BASE_URL}/api/students`, {
    params: keyword ? { search: keyword.trim() } : {},
  })
  return response.data
}

export const fetchStudentDetail = async (studentId) => {
  const response = await axios.get(`${API_BASE_URL}/api/students/${studentId}`)
  return response.data
}

export const createStudent = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/api/students`, payload)
  return response.data
}

export const updateStudent = async (studentId, payload) => {
  const response = await axios.put(`${API_BASE_URL}/api/students/${studentId}`, payload)
  return response.data
}

export const removeStudent = async (studentId) => {
  const response = await axios.delete(`${API_BASE_URL}/api/students/${studentId}`)
  return response.data
}

export const fetchStudentAccount = async (studentId) => {
  const response = await axios.get(`${API_BASE_URL}/api/students/${studentId}/account`)
  return response.data
}

export const updateStudentAccount = async (userId, payload) => {
  const response = await axios.patch(`${API_BASE_URL}/api/users/${userId}/account`, payload)
  return response.data
}
