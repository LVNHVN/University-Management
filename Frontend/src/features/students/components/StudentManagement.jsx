import { useStudentManagement } from '../hooks/useStudentManagement'
import StudentManagementView from './StudentManagementView'

function StudentManagement({ onStudentChanged }) {
  const {
    studentSearchKeyword,
    setStudentSearchKeyword,
    students,
    isStudentsLoading,
    studentsError,
    isStudentModalOpen,
    studentModalMode,
    studentForm,
    studentFormErrors,
    studentFormNotice,
    isStudentSaving,
    isStudentAccountModalOpen,
    studentAccount,
    studentAccountNotice,
    isStudentAccountSaving,
    isStudentsImporting,
    isStudentImportPreviewOpen,
    studentImportPreview,
    isStudentImportCommitting,
    studentImportSuccess,
    handleStudentSearchSubmit,
    openCreateStudentModal,
    openStudentDetailModal,
    handleStudentFormChange,
    handleStudentModalClose,
    handleStudentFormSubmit,
    handleDeleteStudent,
    handleStartEditing,
    handleCancelEditing,
    openStudentAccountModal,
    closeStudentAccountModal,
    handleToggleStudentAccountStatus,
    handleResetStudentAccountPassword,
    handleImportStudentsCsv,
    handleCommitStudentsImport,
    handleCloseStudentImportPreview,
    handleCloseStudentImportSuccess,
  } = useStudentManagement({
    onStudentChanged,
  })

  return (
    <StudentManagementView
      studentSearchKeyword={studentSearchKeyword}
      onStudentSearchKeywordChange={setStudentSearchKeyword}
      onStudentSearchSubmit={handleStudentSearchSubmit}
      onOpenCreateStudentModal={openCreateStudentModal}
      isStudentsImporting={isStudentsImporting}
      onImportStudentsCsv={handleImportStudentsCsv}
      studentsError={studentsError}
      isStudentsLoading={isStudentsLoading}
      students={students}
      onOpenStudentDetailModal={openStudentDetailModal}
      onDeleteStudent={handleDeleteStudent}
      isStudentModalOpen={isStudentModalOpen}
      studentModalMode={studentModalMode}
      onStudentModalClose={handleStudentModalClose}
      onStudentFormSubmit={handleStudentFormSubmit}
      studentForm={studentForm}
      onStudentFormChange={handleStudentFormChange}
      studentFormErrors={studentFormErrors}
      studentFormNotice={studentFormNotice}
      isStudentSaving={isStudentSaving}
      isStudentAccountModalOpen={isStudentAccountModalOpen}
      studentAccount={studentAccount}
      studentAccountNotice={studentAccountNotice}
      isStudentAccountSaving={isStudentAccountSaving}
      isStudentImportPreviewOpen={isStudentImportPreviewOpen}
      studentImportPreview={studentImportPreview}
      isStudentImportCommitting={isStudentImportCommitting}
      studentImportSuccess={studentImportSuccess}
      onStartEditing={handleStartEditing}
      onCancelEditing={handleCancelEditing}
      onOpenStudentAccountModal={openStudentAccountModal}
      onCloseStudentAccountModal={closeStudentAccountModal}
      onToggleStudentAccountStatus={handleToggleStudentAccountStatus}
      onResetStudentAccountPassword={handleResetStudentAccountPassword}
      onCommitStudentsImport={handleCommitStudentsImport}
      onCloseStudentImportPreview={handleCloseStudentImportPreview}
      onCloseStudentImportSuccess={handleCloseStudentImportSuccess}
    />
  )
}

export default StudentManagement
