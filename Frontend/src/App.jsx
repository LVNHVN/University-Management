import LoginPage from './features/auth/components/LoginPage'
import { useAuth } from './features/auth/hooks/useAuth'
import DashboardShell from './layout/components/DashboardShell'
import UserPortalShell from './layout/components/UserPortalShell'
import './App.css'

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY
const USER_MENU_LABEL = 'Nguyễn Văn A'

function App() {
  const {
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
    logout,
  } = useAuth()

  if (currentRole === 'admin') {
    return (
      <DashboardShell
        currentRole={currentRole}
        currentUserName={currentUserName}
        onLogout={logout}
        userMenuLabel={currentFullName || currentUserName}
        recaptchaSiteKey={RECAPTCHA_SITE_KEY}
      />
    )
  }

  if (currentRole === 'student' || currentRole === 'teacher') {
    return (
      <UserPortalShell
        currentRole={currentRole}
        currentUserName={currentUserName}
        currentFullName={currentFullName}
        onLogout={logout}
        recaptchaSiteKey={RECAPTCHA_SITE_KEY}
      />
    )
  }

  return (
    <LoginPage
      formData={formData}
      isLoading={isLoading}
      notice={notice}
      onChange={handleChange}
      onSubmit={handleSubmit}
      recaptchaRef={recaptchaRef}
      siteKey={RECAPTCHA_SITE_KEY}
      onCaptchaChange={handleCaptchaChange}
      onCaptchaExpired={handleCaptchaExpired}
    />
  )
}

export default App