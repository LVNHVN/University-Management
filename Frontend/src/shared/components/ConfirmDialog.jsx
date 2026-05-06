import './ConfirmDialog.css'

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Xác nhận', cancelLabel = 'Hủy', isDangerous = false }) {
  if (!isOpen) return null

  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm-card">
        <div className="confirm-header">
          <h3 className="confirm-title">{title}</h3>
        </div>
        {message && <p className="confirm-message">{message}</p>}
        <div className="confirm-actions">
          <button
            type="button"
            className={`confirm-button${isDangerous ? ' danger' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            className="confirm-button ghost"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
