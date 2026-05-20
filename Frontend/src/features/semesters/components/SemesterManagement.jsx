import { useSemesterManagement } from '../hooks/useSemesterManagement'
import SemesterManagementView from './SemesterManagementView'

function SemesterManagement() {
  const {
    semesterSearchKeyword,
    setSemesterSearchKeyword,
    semesters,
    isSemestersLoading,
    semestersError,
    isSemesterModalOpen,
    semesterModalMode,
    semesterForm,
    semesterFormErrors,
    semesterFormNotice,
    isSemesterSaving,
    handleSemesterSearchSubmit,
    handleOpenCreateSemester,
    handleOpenSemesterDetail,
    handleSemesterModalClose,
    handleStartEditing,
    handleCancelEditing,
    handleSemesterFormChange,
    handleSemesterFormSubmit,
  } = useSemesterManagement()

  return (
    <SemesterManagementView
      semesterSearchKeyword={semesterSearchKeyword}
      onSemesterSearchKeywordChange={setSemesterSearchKeyword}
      onSemesterSearchSubmit={handleSemesterSearchSubmit}
      onOpenCreateSemester={handleOpenCreateSemester}
      semestersError={semestersError}
      isSemestersLoading={isSemestersLoading}
      semesters={semesters}
      onOpenSemesterDetail={handleOpenSemesterDetail}
      isSemesterModalOpen={isSemesterModalOpen}
      semesterModalMode={semesterModalMode}
      semesterForm={semesterForm}
      semesterFormErrors={semesterFormErrors}
      semesterFormNotice={semesterFormNotice}
      isSemesterSaving={isSemesterSaving}
      onSemesterModalClose={handleSemesterModalClose}
      onSemesterFormSubmit={handleSemesterFormSubmit}
      onSemesterFormChange={handleSemesterFormChange}
      onStartEditing={handleStartEditing}
      onCancelEditing={handleCancelEditing}
    />
  )
}

export default SemesterManagement
