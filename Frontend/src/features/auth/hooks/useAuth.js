import { useCallback, useEffect, useRef, useState } from 'react'
import { API_BASE_URL } from '../../../shared/constants/api'
import { login, verifyRecaptcha, fetchMe, requestLogout } from '../services/authService'

const INITIAL_FORM_DATA = {
  username: '',
  password: '',
}

const getStoredAuth = () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return { role: '', username: '' }
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token')
      return { role: '', username: '' }
    }
    return { role: payload.role || '', username: payload.username || '' }
  } catch {
    localStorage.removeItem('token')
    return { role: '', username: '' }
  }
}

export const useAuth = ({ onLoginSuccess } = {}) => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [isLoading, setIsLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [currentRole, setCurrentRole] = useState('')
  const [currentUserName, setCurrentUserName] = useState('')
  const [currentFullName, setCurrentFullName] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const recaptchaRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetchMe()
      .then(({ user }) => {
        setCurrentRole(user.role)
        setCurrentUserName(user.username)
        setCurrentFullName(user.fullName || '')
      })
      .catch(() => {
        localStorage.removeItem('token')
      })
  }, [])

  const handleChange = useCallback((event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  const resetRecaptcha = useCallback(() => {
    recaptchaRef.current?.reset()
    setCaptchaToken('')
  }, [])

  const handleCaptchaChange = useCallback((token) => {
    setCaptchaToken(token || '')
  }, [])

  const handleCaptchaExpired = useCallback(() => {
    setCaptchaToken('')
  }, [])

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault()

    if (!formData.username || !formData.password) {
      setNotice('Vui lòng nhập đầy đủ tài khoản và mật khẩu.')
      return
    }

    if (!captchaToken) {
      setNotice('Vui lòng xác minh reCAPTCHA.')
      return
    }

    setIsLoading(true)
    setNotice('')

    try {
      const verifyResponse = await verifyRecaptcha(captchaToken)

      if (!verifyResponse?.success) {
        setNotice('reCAPTCHA không hợp lệ. Vui lòng thử lại.')
        resetRecaptcha()
        return
      }

      const loginResponse = await login({
        username: formData.username,
        password: formData.password,
      })

      if (loginResponse?.success && loginResponse?.user?.role) {
        if (loginResponse.user.token) {
          localStorage.setItem('token', loginResponse.user.token)
        }
        setCurrentRole(loginResponse.user.role)
        setCurrentUserName(loginResponse.user.username || '')
        setCurrentFullName(loginResponse.user.fullName || '')
        onLoginSuccess?.(loginResponse.user)
        return
      }

      setNotice('Đăng nhập thất bại.')
      resetRecaptcha()
    } catch (error) {
      const isNetworkError = !error.response
      const backendMessage = error.response?.data?.message

      setNotice(
        isNetworkError
          ? `Không gọi được Backend (${API_BASE_URL}). Hãy chạy Backend rồi thử lại.`
          : backendMessage || ''
      )
      resetRecaptcha()
    } finally {
      setIsLoading(false)
    }
  }, [captchaToken, formData.password, formData.username, onLoginSuccess, resetRecaptcha])

  const logout = useCallback(async () => {
    try {
      await requestLogout()
    } catch {
      // Always clear local auth state even if backend logout fails.
    }

    localStorage.removeItem('token')
    setCurrentRole('')
    setCurrentUserName('')
    setCurrentFullName('')
    setNotice('')
    setFormData(INITIAL_FORM_DATA)
    resetRecaptcha()
  }, [resetRecaptcha])

  return {
    formData,
    isLoading,
    notice,
    currentRole,
    currentUserName,
    currentFullName,
    recaptchaRef,
    handleChange,
    handleSubmit,
    handleCaptchaChange,
    handleCaptchaExpired,
    resetRecaptcha,
    logout,
  }
}