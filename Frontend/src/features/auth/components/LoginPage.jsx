import ReCAPTCHA from 'react-google-recaptcha'
import { useState } from 'react'

function LoginPage({
  formData,
  isLoading,
  notice,
  onChange,
  onSubmit,
  recaptchaRef,
  siteKey,
  onCaptchaChange,
  onCaptchaExpired,
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  return (
    <main className="login-page">
      <div className="background-orb orb-left" aria-hidden="true" />
      <div className="background-orb orb-right" aria-hidden="true" />

      <section className="login-shell" aria-label="Đăng nhập hệ thống">
        <header className="login-header">
          <h1>Đăng nhập</h1>
        </header>

        <form className="login-form" onSubmit={onSubmit}>
          <label htmlFor="username">Tài khoản</label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="Nhập tên tài khoản"
            value={formData.username}
            onChange={onChange}
            autoComplete="username"
          />

          <label htmlFor="password">Mật khẩu</label>
          <div className="password-field">
            <input
              id="password"
              name="password"
              type={isPasswordVisible ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              value={formData.password}
              onChange={onChange}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setIsPasswordVisible((prev) => !prev)}
              aria-label={isPasswordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {isPasswordVisible ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5c5 0 9 3.6 10.5 6.9C21 14.4 17 18 12 18S3 14.4 1.5 12C3 8.6 7 5 12 5Zm0 2C8.2 7 5.1 9.6 3.7 12c1.4 2.4 4.5 5 8.3 5s6.9-2.6 8.3-5C18.9 9.6 15.8 7 12 7Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3.3 4.7a1 1 0 0 1 1.4-1.4l15 15a1 1 0 1 1-1.4 1.4l-2.5-2.5A11.8 11.8 0 0 1 12 18C7 18 3 14.4 1.5 12c.9-1.4 2.5-3.1 4.7-4.3L3.3 4.7Zm4.4 4.4A4 4 0 0 0 12 16a4 4 0 0 0 1.9-.5l-1.6-1.6a2 2 0 0 1-2.8-2.8L7.7 9.1Zm9.6 6-1.5-1.5A4 4 0 0 0 10.4 8l-1.6-1.6A6 6 0 0 1 18 12c-.2.4-.5.8-.7 1.1Z" />
                </svg>
              )}
            </button>
          </div>

          <div className="recaptcha-wrap">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={siteKey}
              onChange={onCaptchaChange}
              onExpired={onCaptchaExpired}
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

export default LoginPage
