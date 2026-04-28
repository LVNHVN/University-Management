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
    isTeachersImporting,
    isTeacherImportPreviewOpen,
    teacherImportPreview,
    isTeacherImportCommitting,
    teacherImportSuccess,
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
    handleImportTeachersCsv,
    handleCommitTeachersImport,
    handleCloseTeacherImportPreview,
    handleCloseTeacherImportSuccess,
  } = useTeacherManagement({
    onTeacherChanged,
  })

  return (
    <TeacherManagementView
      teacherSearchKeyword={teacherSearchKeyword}
      onTeacherSearchKeywordChange={setTeacherSearchKeyword}
      onTeacherSearchSubmit={handleTeacherSearchSubmit}
      onOpenCreateTeacherModal={openCreateTeacherModal}
      isTeachersImporting={isTeachersImporting}
      onImportTeachersCsv={handleImportTeachersCsv}
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
      isTeacherImportPreviewOpen={isTeacherImportPreviewOpen}
      teacherImportPreview={teacherImportPreview}
      isTeacherImportCommitting={isTeacherImportCommitting}
      teacherImportSuccess={teacherImportSuccess}
      onStartEditing={handleStartEditing}
      onCancelEditing={handleCancelEditing}
      onOpenTeacherAccountModal={openTeacherAccountModal}
      onCloseTeacherAccountModal={closeTeacherAccountModal}
      onToggleTeacherAccountStatus={handleToggleTeacherAccountStatus}
      onResetTeacherAccountPassword={handleResetTeacherAccountPassword}
      onCommitTeachersImport={handleCommitTeachersImport}
      onCloseTeacherImportPreview={handleCloseTeacherImportPreview}
      onCloseTeacherImportSuccess={handleCloseTeacherImportSuccess}
    />
  )
}

export default TeacherManagement
