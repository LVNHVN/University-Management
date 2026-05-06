import { useSubjectManagement } from '../hooks/useSubjectManagement'
import SubjectManagementView from './SubjectManagementView'

function SubjectManagement() {
  const {
    subjectSearchKeyword,
    setSubjectSearchKeyword,
    subjects,
    isSubjectsLoading,
    subjectsError,
    isSubjectModalOpen,
    subjectModalMode,
    subjectForm,
    subjectFormErrors,
    subjectFormNotice,
    subjectSyllabus,
    subjectSyllabusFileName,
    removeSubjectSyllabus,
    isSubjectSaving,
    handleSubjectSearchSubmit,
    openCreateSubjectModal,
    openSubjectDetailModal,
    handleDeleteSubject,
    handleStartEditing,
    handleCancelEditing,
    handleSubjectModalClose,
    handleSubjectFormChange,
    handleSubjectSyllabusFileChange,
    handleRemoveSubjectSyllabus,
    handleSubjectFormSubmit,
    confirmDialog,
    handleConfirmDialogClose,
  } = useSubjectManagement()

  return (
    <SubjectManagementView
      subjectSearchKeyword={subjectSearchKeyword}
      onSubjectSearchKeywordChange={setSubjectSearchKeyword}
      onSubjectSearchSubmit={handleSubjectSearchSubmit}
      onOpenCreateSubjectModal={openCreateSubjectModal}
      subjectsError={subjectsError}
      isSubjectsLoading={isSubjectsLoading}
      subjects={subjects}
      onOpenSubjectDetailModal={openSubjectDetailModal}
      onDeleteSubject={handleDeleteSubject}
      onStartEditing={handleStartEditing}
      onCancelEditing={handleCancelEditing}
      isSubjectModalOpen={isSubjectModalOpen}
      subjectModalMode={subjectModalMode}
      onSubjectModalClose={handleSubjectModalClose}
      onSubjectFormSubmit={handleSubjectFormSubmit}
      subjectForm={subjectForm}
      onSubjectFormChange={handleSubjectFormChange}
      subjectSyllabus={subjectSyllabus}
      subjectSyllabusFileName={subjectSyllabusFileName}
      removeSubjectSyllabus={removeSubjectSyllabus}
      onSubjectSyllabusFileChange={handleSubjectSyllabusFileChange}
      onRemoveSubjectSyllabus={handleRemoveSubjectSyllabus}
      subjectFormErrors={subjectFormErrors}
      subjectFormNotice={subjectFormNotice}
      isSubjectSaving={isSubjectSaving}
      confirmDialog={confirmDialog}
      onConfirmDialogClose={handleConfirmDialogClose}
    />
  )
}

export default SubjectManagement
