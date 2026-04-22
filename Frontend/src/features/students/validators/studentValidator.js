export const validateStudentForm = (studentForm, parseDisplayDateToIso) => {
  const errors = {}

  if (!studentForm.studentCode.trim()) {
    errors.studentCode = 'Vui lòng nhập mã số sinh viên.'
  } else if (!/^\d+$/.test(studentForm.studentCode.trim())) {
    errors.studentCode = 'Mã số sinh viên chỉ được nhập số.'
  }

  if (!studentForm.fullName.trim()) {
    errors.fullName = 'Vui lòng nhập họ và tên.'
  } else if (!/^[\p{L}\s]+$/u.test(studentForm.fullName.trim())) {
    errors.fullName = 'Họ và tên chỉ được nhập chữ.'
  }

  if (!studentForm.dob.trim()) {
    errors.dob = 'Vui lòng nhập ngày sinh.'
  } else if (!parseDisplayDateToIso(studentForm.dob)) {
    errors.dob = 'Ngày sinh không hợp lệ. Vui lòng nhập theo định dạng dd/mm/yyyy.'
  }

  if (!studentForm.gender.trim()) {
    errors.gender = 'Vui lòng chọn giới tính.'
  }

  if (!studentForm.nationalIdNumber.trim()) {
    errors.nationalIdNumber = 'Vui lòng nhập CCCD.'
  } else if (!/^\d{12}$/.test(studentForm.nationalIdNumber.trim())) {
    errors.nationalIdNumber = 'CCCD phải gồm đúng 12 số.'
  }

  if (!studentForm.phone.trim()) {
    errors.phone = 'Vui lòng nhập số điện thoại.'
  } else if (!/^\d{10}$/.test(studentForm.phone.trim())) {
    errors.phone = 'Số điện thoại phải gồm đúng 10 số.'
  }

  if (!studentForm.address.trim()) {
    errors.address = 'Vui lòng nhập địa chỉ.'
  }

  if (!studentForm.major.trim()) {
    errors.major = 'Vui lòng nhập ngành.'
  }

  if (!studentForm.academicYear.trim()) {
    errors.academicYear = 'Vui lòng nhập khóa học.'
  } else if (!/^\d+$/.test(studentForm.academicYear.trim())) {
    errors.academicYear = 'Khóa học chỉ được nhập số.'
  }

  return errors
}
