import { useRef, useState } from 'react'
import axios from 'axios'
import ReCAPTCHA from 'react-google-recaptcha'
import './App.css'

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || 'Nhập key'
const API_BASE_URL = 'http://localhost:5000'
const ROLE_LABEL_MAP = {
  admin: 'Admin',
  student: 'Student',
  teacher: 'Teacher',
}

function App() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [currentRole, setCurrentRole] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const recaptchaRef = useRef(null)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resetRecaptcha = () => {
    recaptchaRef.current?.reset()
    setCaptchaToken('')
  }

  const handleSubmit = async (event) => {
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
      const verifyResponse = await axios.post(`${API_BASE_URL}/api/verify-recaptcha`, {
        token: captchaToken,
      })

      if (!verifyResponse.data?.success) {
        setNotice('reCAPTCHA không hợp lệ. Vui lòng thử lại.')
        resetRecaptcha()
        return
      }

      const loginResponse = await axios.post(`${API_BASE_URL}/api/login`, {
        username: formData.username,
        password: formData.password,
      })

      if (loginResponse.data?.success && loginResponse.data?.user?.role) {
        setCurrentRole(loginResponse.data.user.role)
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
  }

  if (currentRole) {
    return (
      <main className="role-page" aria-label={`Role page ${currentRole}`}>
        <p>Test UI của {ROLE_LABEL_MAP[currentRole] || currentRole}</p>
      </main>
    )
  }

  return (
    <main className="login-page">
      <div className="background-orb orb-left" aria-hidden="true" />
      <div className="background-orb orb-right" aria-hidden="true" />

      <section className="login-shell" aria-label="Đăng nhập hệ thống">
        <header className="login-header">
          <h1>Đăng nhập</h1>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Tài khoản</label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="Nhập tên tài khoản"
            value={formData.username}
            onChange={handleChange}
            autoComplete="username"
          />

          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Nhập mật khẩu"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
          />

          <div className="recaptcha-wrap">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={(token) => setCaptchaToken(token || '')}
              onExpired={() => setCaptchaToken('')}
            />
          </div>

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          {notice && <p className="notice">{notice}</p>}
        </form>
      </section>
    </main>
  )
}

export default App