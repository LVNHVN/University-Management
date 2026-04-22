export const validateTeacherForm = (teacherForm, parseDisplayDateToIso) => {
  const errors = {}

  if (!teacherForm.teacherCode.trim()) {
    errors.teacherCode = 'Vui lòng nhập mã số giảng viên.'
  } else if (!/^\d+$/.test(teacherForm.teacherCode.trim())) {
    errors.teacherCode = 'Mã số giảng viên chỉ được nhập số.'
  }

  if (!teacherForm.fullName.trim()) {
    errors.fullName = 'Vui lòng nhập họ và tên.'
  } else if (!/^[\p{L}\s]+$/u.test(teacherForm.fullName.trim())) {
    errors.fullName = 'Họ và tên chỉ được nhập chữ.'
  }

  if (!teacherForm.dob.trim()) {
    errors.dob = 'Vui lòng nhập ngày sinh.'
  } else if (!parseDisplayDateToIso(teacherForm.dob)) {
    errors.dob = 'Ngày sinh không hợp lệ. Vui lòng nhập theo định dạng dd/mm/yyyy.'
  }

  if (!teacherForm.gender.trim()) {
    errors.gender = 'Vui lòng chọn giới tính.'
  }

  if (!teacherForm.nationalIdNumber.trim()) {
    errors.nationalIdNumber = 'Vui lòng nhập CCCD.'
  } else if (!/^\d{12}$/.test(teacherForm.nationalIdNumber.trim())) {
    errors.nationalIdNumber = 'CCCD phải gồm đúng 12 số.'
  }

  if (!teacherForm.phone.trim()) {
    errors.phone = 'Vui lòng nhập số điện thoại.'
  } else if (!/^\d{10}$/.test(teacherForm.phone.trim())) {
    errors.phone = 'Số điện thoại phải gồm đúng 10 số.'
  }

  if (!teacherForm.address.trim()) {
    errors.address = 'Vui lòng nhập địa chỉ.'
  }

  if (!teacherForm.department.trim()) {
    errors.department = 'Vui lòng nhập khoa/viện công tác.'
  }

  return errors
}
