import { useCallback, useRef, useState } from 'react'
import { API_BASE_URL } from '../../../shared/constants/api'
import { login, verifyRecaptcha } from '../services/authService'

const INITIAL_FORM_DATA = {
  username: '',
  password: '',
}

export const useAuth = ({ onLoginSuccess } = {}) => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [isLoading, setIsLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [currentRole, setCurrentRole] = useState('')
  const [currentUserName, setCurrentUserName] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const recaptchaRef = useRef(null)

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
        setCurrentRole(loginResponse.user.role)
        setCurrentUserName(loginResponse.user.username || 'Nguyen Van A')
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

  const logout = useCallback(() => {
    setCurrentRole('')
    setCurrentUserName('')
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
    recaptchaRef,
    handleChange,
    handleSubmit,
    handleCaptchaChange,
    handleCaptchaExpired,
    resetRecaptcha,
    logout,
  }
}