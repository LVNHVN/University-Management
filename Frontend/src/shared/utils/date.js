export const formatDateForDisplay = (dateValue) => {
  if (!dateValue) {
    return ''
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateValue))
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch
    return `${day}/${month}/${year}`
  }

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export const parseDisplayDateToIso = (displayValue) => {
  const value = String(displayValue || '').trim()
  if (!value) {
    return ''
  }

  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value)
  if (!match) {
    return null
  }

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const date = new Date(year, month - 1, day)

  const isInvalidDate =
    Number.isNaN(date.getTime())
    || date.getDate() !== day
    || date.getMonth() !== month - 1
    || date.getFullYear() !== year

  if (isInvalidDate) {
    return null
  }

  const isoMonth = String(month).padStart(2, '0')
  const isoDay = String(day).padStart(2, '0')
  return `${year}-${isoMonth}-${isoDay}`
}
