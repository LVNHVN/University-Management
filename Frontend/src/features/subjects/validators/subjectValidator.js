export const validateSubjectForm = (subjectForm) => {
  const errors = {}

  if (!subjectForm.subjectCode.trim()) {
    errors.subjectCode = 'Vui lòng nhập mã môn học.'
  } else if (!/^[A-Za-z0-9_-]+$/.test(subjectForm.subjectCode.trim())) {
    errors.subjectCode = 'Mã môn học chỉ gồm chữ, số, gạch ngang hoặc gạch dưới.'
  }

  if (!subjectForm.name.trim()) {
    errors.name = 'Vui lòng nhập tên môn học.'
  }

  if (!subjectForm.department.trim()) {
    errors.department = 'Vui lòng nhập khoa/viện phụ trách môn học.'
  }

  const creditsValue = Number(subjectForm.credits)
  if (!subjectForm.credits.toString().trim()) {
    errors.credits = 'Vui lòng nhập số tín chỉ.'
  } else if (!Number.isInteger(creditsValue) || creditsValue <= 0) {
    errors.credits = 'Số tín chỉ phải là số nguyên dương.'
  }

  const finalWeightValue = Number(subjectForm.finalWeight)
  if (!subjectForm.finalWeight.toString().trim()) {
    errors.finalWeight = 'Vui lòng nhập trọng số điểm thi cuối kỳ.'
  } else if (!Number.isFinite(finalWeightValue) || finalWeightValue < 0 || finalWeightValue > 1) {
    errors.finalWeight = 'Trọng số điểm thi cuối kỳ phải trong khoảng từ 0 đến 1.'
  }

  return errors
}
