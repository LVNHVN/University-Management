import ReCAPTCHA from 'react-google-recaptcha'

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
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Nhập mật khẩu"
            value={formData.password}
            onChange={onChange}
            autoComplete="current-password"
          />

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
