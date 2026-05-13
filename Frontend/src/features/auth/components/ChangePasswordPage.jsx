import { useRef, useState } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { changePassword } from '../services/authService'

function VisibilityIcon({ visible }) {
  if (visible) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5c5 0 9 3.6 10.5 6.9C21 14.4 17 18 12 18S3 14.4 1.5 12C3 8.6 7 5 12 5Zm0 2C8.2 7 5.1 9.6 3.7 12c1.4 2.4 4.5 5 8.3 5s6.9-2.6 8.3-5C18.9 9.6 15.8 7 12 7Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.3 4.7a1 1 0 0 1 1.4-1.4l15 15a1 1 0 1 1-1.4 1.4l-2.5-2.5A11.8 11.8 0 0 1 12 18C7 18 3 14.4 1.5 12c.9-1.4 2.5-3.1 4.7-4.3L3.3 4.7Zm4.4 4.4A4 4 0 0 0 12 16a4 4 0 0 0 1.9-.5l-1.6-1.6a2 2 0 0 1-2.8-2.8L7.7 9.1Zm9.6 6-1.5-1.5A4 4 0 0 0 10.4 8l-1.6-1.6A6 6 0 0 1 18 12c-.2.4-.5.8-.7 1.1Z" />
    </svg>
  )
}

function ChangePasswordPage({ siteKey, onCancel, onSuccess }) {
  const recaptchaRef = useRef(null)
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [captchaToken, setCaptchaToken] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false)
  const [isOldPasswordVisible, setIsOldPasswordVisible] = useState(false)
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)

  const resetCaptcha = () => {
    recaptchaRef.current?.reset()
    setCaptchaToken('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setNotice('Vui lòng nhập đầy đủ thông tin.')
      return
    }

    if (!captchaToken) {
      setNotice('Vui lòng xác minh reCAPTCHA.')
      return
    }

    setIsSaving(true)
    setNotice('')

    try {
      const response = await changePassword({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
        captchaToken,
      })

      if (!response?.success) {
        setNotice(response?.message || 'Không thể đổi mật khẩu.')
        resetCaptcha()
        return
      }

      setNotice('')
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' })
      resetCaptcha()
      setIsSuccessPopupOpen(true)
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setNotice(backendMessage || 'Không thể đổi mật khẩu.')
      resetCaptcha()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="login-page" aria-label="Trang đổi mật khẩu">
      <div className="background-orb orb-left" aria-hidden="true" />
      <div className="background-orb orb-right" aria-hidden="true" />

      <section className="login-shell" aria-label="Đổi mật khẩu tài khoản">
        <header className="login-header">
          <h1>Đổi mật khẩu</h1>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="oldPassword">Mật khẩu cũ</label>
          <div className="password-field">
            <input
              id="oldPassword"
              name="oldPassword"
              type={isOldPasswordVisible ? 'text' : 'password'}
              value={formData.oldPassword}
              onChange={handleChange}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setIsOldPasswordVisible((prev) => !prev)}
              aria-label={isOldPasswordVisible ? 'Ẩn mật khẩu cũ' : 'Hiện mật khẩu cũ'}
            >
              <VisibilityIcon visible={isOldPasswordVisible} />
            </button>
          </div>

          <label htmlFor="newPassword">Mật khẩu mới</label>
          <div className="password-field">
            <input
              id="newPassword"
              name="newPassword"
              type={isNewPasswordVisible ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setIsNewPasswordVisible((prev) => !prev)}
              aria-label={isNewPasswordVisible ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
            >
              <VisibilityIcon visible={isNewPasswordVisible} />
            </button>
          </div>

          <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
          <div className="password-field">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={isConfirmPasswordVisible ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setIsConfirmPasswordVisible((prev) => !prev)}
              aria-label={isConfirmPasswordVisible ? 'Ẩn xác nhận mật khẩu mới' : 'Hiện xác nhận mật khẩu mới'}
            >
              <VisibilityIcon visible={isConfirmPasswordVisible} />
            </button>
          </div>

          <div className="recaptcha-wrap">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={siteKey}
              onChange={(token) => setCaptchaToken(token || '')}
              onExpired={() => setCaptchaToken('')}
            />
          </div>

          <div className="change-password-actions">
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'Đang xác nhận...' : 'Xác nhận'}
            </button>
            <button type="button" className="ghost" onClick={onCancel} disabled={isSaving}>
              Hủy
            </button>
          </div>

          {notice && <p className="notice">{notice}</p>}
        </form>
      </section>

      {isSuccessPopupOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>Thông báo</h3>
              <button type="button" className="modal-close" onClick={() => setIsSuccessPopupOpen(false)}>×</button>
            </div>

            <div className="notification-read-content">
              <p>Đổi mật khẩu thành công.</p>
            </div>

            <div className="modal-actions full-width">
              <button
                type="button"
                onClick={() => {
                  setIsSuccessPopupOpen(false)
                  onSuccess?.()
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default ChangePasswordPage
