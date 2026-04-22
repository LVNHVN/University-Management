import axios from 'axios'
import { API_BASE_URL } from '../../../shared/constants/api'

export const fetchTeachers = async (keyword = '') => {
  const response = await axios.get(`${API_BASE_URL}/api/teachers`, {
    params: keyword ? { search: keyword.trim() } : {},
  })
  return response.data
}

export const fetchTeacherDetail = async (teacherId) => {
  const response = await axios.get(`${API_BASE_URL}/api/teachers/${teacherId}`)
  return response.data
}

export const createTeacher = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/api/teachers`, payload)
  return response.data
}

export const updateTeacher = async (teacherId, payload) => {
  const response = await axios.put(`${API_BASE_URL}/api/teachers/${teacherId}`, payload)
  return response.data
}

export const removeTeacher = async (teacherId) => {
  const response = await axios.delete(`${API_BASE_URL}/api/teachers/${teacherId}`)
  return response.data
}

export const fetchTeacherAccount = async (teacherId) => {
  const response = await axios.get(`${API_BASE_URL}/api/teachers/${teacherId}/account`)
  return response.data
}

export const updateTeacherAccount = async (userId, payload) => {
  const response = await axios.patch(`${API_BASE_URL}/api/users/${userId}/account`, payload)
  return response.data
}
