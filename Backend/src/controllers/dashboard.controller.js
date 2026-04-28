const { getOverview } = require('../services/dashboard.service');

const handleGetOverview = async (req, res, next) => {
  try {
    const requestedSemester = String(req.query.semester || '').trim() || undefined;
    const data = await getOverview(requestedSemester);
    return res.json({ success: true, ...data });
  } catch (error) {
    return next(error);
  }
};

module.exports = { handleGetOverview };
