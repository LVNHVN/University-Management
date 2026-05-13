import { useState } from 'react'
import { createNotification } from '../services/notificationService'

const INITIAL_FORM = {
  title: '',
  content: '',
  targetStudent: false,
  targetTeacher: false,
}

function NotificationManagement() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (event) => {
    const { name, checked } = event.target
    setForm((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.title.trim() || !form.content.trim()) {
      setNotice('Vui lòng nhập tiêu đề và nội dung thông báo.')
      return
    }

    if (!form.targetStudent && !form.targetTeacher) {
      setNotice('Vui lòng chọn ít nhất một đối tượng nhận thông báo.')
      return
    }

    setIsSubmitting(true)
    setNotice('')

    const targetRoles = []
    if (form.targetTeacher) targetRoles.push('teacher')
    if (form.targetStudent) targetRoles.push('student')

    try {
      const response = await createNotification({
        title: form.title.trim(),
        content: form.content.trim(),
        targetRoles,
      })

      if (!response?.success) {
        setNotice(response?.message || 'Không thể gửi thông báo.')
        return
      }

      setNotice('Gửi thông báo thành công.')
      setForm(INITIAL_FORM)
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setNotice(backendMessage || 'Không thể gửi thông báo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setForm(INITIAL_FORM)
    setNotice('')
  }

  return (
    <div className="dashboard-main">
      <div className="overview-header">
        <h2>Gửi thông báo</h2>
        <p>Tạo thông báo gửi đến giảng viên hoặc sinh viên</p>
      </div>

      <section className="notification-panel" aria-label="Biểu mẫu gửi thông báo">
        <form className="student-form" onSubmit={handleSubmit} noValidate>
          <label className="full-width">
            Tiêu đề
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleInputChange}
              placeholder="Nhập tiêu đề thông báo"
            />
          </label>

          <label className="full-width">
            Nội dung
            <textarea
              name="content"
              value={form.content}
              onChange={handleInputChange}
              rows={6}
              placeholder="Nhập nội dung thông báo"
            />
          </label>

          <fieldset className="notification-target full-width">
            <legend>Gửi đến</legend>
            <label className="notification-target-option">
              <input
                type="checkbox"
                name="targetTeacher"
                checked={form.targetTeacher}
                onChange={handleRoleChange}
              />
              <span>Giảng viên</span>
            </label>
            <label className="notification-target-option">
              <input
                type="checkbox"
                name="targetStudent"
                checked={form.targetStudent}
                onChange={handleRoleChange}
              />
              <span>Sinh viên</span>
            </label>
          </fieldset>

          {notice && <p className="student-form-notice">{notice}</p>}

          <div className="modal-actions full-width">
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang gửi...' : 'Xác nhận'}</button>
            <button type="button" className="ghost" onClick={handleCancel} disabled={isSubmitting}>
              Hủy
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default NotificationManagement
