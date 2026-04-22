import { useTeacherManagement } from '../hooks/useTeacherManagement'
import TeacherManagementView from './TeacherManagementView'

function TeacherManagement({ onTeacherChanged }) {
  const {
    teacherSearchKeyword,
    setTeacherSearchKeyword,
    teachers,
    isTeachersLoading,
    teachersError,
    isTeacherModalOpen,
    teacherModalMode,
    teacherForm,
    teacherFormErrors,
    teacherFormNotice,
    isTeacherSaving,
    isTeacherAccountModalOpen,
    teacherAccount,
    teacherAccountNotice,
    isTeacherAccountSaving,
    handleTeacherSearchSubmit,
    openCreateTeacherModal,
    openTeacherDetailModal,
    handleTeacherFormChange,
    handleTeacherModalClose,
    handleTeacherFormSubmit,
    handleDeleteTeacher,
    handleStartEditing,
    handleCancelEditing,
    openTeacherAccountModal,
    closeTeacherAccountModal,
    handleToggleTeacherAccountStatus,
    handleResetTeacherAccountPassword,
  } = useTeacherManagement({
    onTeacherChanged,
  })

  return (
    <TeacherManagementView
      teacherSearchKeyword={teacherSearchKeyword}
      onTeacherSearchKeywordChange={setTeacherSearchKeyword}
      onTeacherSearchSubmit={handleTeacherSearchSubmit}
      onOpenCreateTeacherModal={openCreateTeacherModal}
      teachersError={teachersError}
      isTeachersLoading={isTeachersLoading}
      teachers={teachers}
      onOpenTeacherDetailModal={openTeacherDetailModal}
      onDeleteTeacher={handleDeleteTeacher}
      isTeacherModalOpen={isTeacherModalOpen}
      teacherModalMode={teacherModalMode}
      onTeacherModalClose={handleTeacherModalClose}
      onTeacherFormSubmit={handleTeacherFormSubmit}
      teacherForm={teacherForm}
      onTeacherFormChange={handleTeacherFormChange}
      teacherFormErrors={teacherFormErrors}
      teacherFormNotice={teacherFormNotice}
      isTeacherSaving={isTeacherSaving}
      isTeacherAccountModalOpen={isTeacherAccountModalOpen}
      teacherAccount={teacherAccount}
      teacherAccountNotice={teacherAccountNotice}
      isTeacherAccountSaving={isTeacherAccountSaving}
      onStartEditing={handleStartEditing}
      onCancelEditing={handleCancelEditing}
      onOpenTeacherAccountModal={openTeacherAccountModal}
      onCloseTeacherAccountModal={closeTeacherAccountModal}
      onToggleTeacherAccountStatus={handleToggleTeacherAccountStatus}
      onResetTeacherAccountPassword={handleResetTeacherAccountPassword}
    />
  )
}

export default TeacherManagement
