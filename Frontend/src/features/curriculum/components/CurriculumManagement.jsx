import { useCurriculumManagement } from '../hooks/useCurriculumManagement'
import CurriculumManagementView from './CurriculumManagementView'

function CurriculumManagement() {
  const {
    curriculumSearchKeyword,
    setCurriculumSearchKeyword,
    curriculums,
    isCurriculumsLoading,
    curriculumsError,
    curriculumFeatureNotice,
    isCurriculumModalOpen,
    curriculumModalMode,
    curriculumForm,
    curriculumFormErrors,
    curriculumFormNotice,
    isCurriculumSaving,
    isViewOnly,
    isCreateMode,
    isEditingMode,
    filteredAvailableSubjects,
    selectedSubjectItems,
    totalSelectedCredits,
    subjectPickerKeyword,
    subjectPickerId,
    subjectPickerSemester,
    subjectPickerError,
    handleCurriculumSearchSubmit,
    handleOpenCreateCurriculum,
    handleOpenCurriculumDetail,
    handleStartEditing,
    handleCancelEditing,
    handleCurriculumModalClose,
    handleCurriculumFormChange,
    handleCurriculumFormSubmit,
    handleSubjectPickerKeywordChange,
    handleSubjectPickerKeywordSelect,
    handleSubjectPickerIdChange,
    handleSubjectPickerSemesterChange,
    handleAddSubjectToCurriculum,
    handleRemoveSubjectFromCurriculum,
    handleDeleteCurriculum,
    confirmDialog,
    handleConfirmDialogClose,
  } = useCurriculumManagement()

  return (
    <CurriculumManagementView
      curriculumSearchKeyword={curriculumSearchKeyword}
      onCurriculumSearchKeywordChange={setCurriculumSearchKeyword}
      onCurriculumSearchSubmit={handleCurriculumSearchSubmit}
      onOpenCreateCurriculum={handleOpenCreateCurriculum}
      curriculumsError={curriculumsError}
      curriculumFeatureNotice={curriculumFeatureNotice}
      isCurriculumsLoading={isCurriculumsLoading}
      curriculums={curriculums}
      onOpenCurriculumDetail={handleOpenCurriculumDetail}
      isCurriculumModalOpen={isCurriculumModalOpen}
      curriculumModalMode={curriculumModalMode}
      isViewOnly={isViewOnly}
      isCreateMode={isCreateMode}
      isEditingMode={isEditingMode}
      onCurriculumModalClose={handleCurriculumModalClose}
      onCurriculumFormSubmit={handleCurriculumFormSubmit}
      curriculumForm={curriculumForm}
      onCurriculumFormChange={handleCurriculumFormChange}
      curriculumFormErrors={curriculumFormErrors}
      curriculumFormNotice={curriculumFormNotice}
      isCurriculumSaving={isCurriculumSaving}
      filteredAvailableSubjects={filteredAvailableSubjects}
      selectedSubjectItems={selectedSubjectItems}
      totalSelectedCredits={totalSelectedCredits}
      subjectPickerKeyword={subjectPickerKeyword}
      subjectPickerId={subjectPickerId}
      subjectPickerSemester={subjectPickerSemester}
      subjectPickerError={subjectPickerError}
      onSubjectPickerKeywordChange={handleSubjectPickerKeywordChange}
      onSubjectPickerKeywordSelect={handleSubjectPickerKeywordSelect}
      onSubjectPickerIdChange={handleSubjectPickerIdChange}
      onSubjectPickerSemesterChange={handleSubjectPickerSemesterChange}
      onAddSubjectToCurriculum={handleAddSubjectToCurriculum}
      onRemoveSubjectFromCurriculum={handleRemoveSubjectFromCurriculum}
      onStartEditing={handleStartEditing}
      onCancelEditing={handleCancelEditing}
      onDeleteCurriculum={handleDeleteCurriculum}
      confirmDialog={confirmDialog}
      onConfirmDialogClose={handleConfirmDialogClose}
    />
  )
}

export default CurriculumManagement