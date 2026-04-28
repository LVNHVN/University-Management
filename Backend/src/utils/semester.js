const compareSemester = (a, b) => {
  const [aYear = '0', aTerm = '0'] = String(a).split('.');
  const [bYear = '0', bTerm = '0'] = String(b).split('.');
  const yearDiff = Number(aYear) - Number(bYear);

  if (yearDiff !== 0) {
    return yearDiff;
  }

  return Number(aTerm) - Number(bTerm);
};

const getLatestSemester = (semesters = []) => {
  const cleaned = semesters.filter(Boolean);

  if (!cleaned.length) {
    const currentYear = new Date().getFullYear();
    return `${currentYear}.2`;
  }

  return cleaned.sort(compareSemester).at(-1);
};

module.exports = { compareSemester, getLatestSemester };
