const router = require('express').Router();
const Program = require('../models/Program');
const { protect } = require('../middleware/auth');

router.use(protect);

// Get full seat matrix across all programs
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;
    if (req.query.institution) filter.institution = req.query.institution;

    const programs = await Program.find(filter)
      .populate('department', 'name code')
      .populate('campus', 'name')
      .populate('institution', 'name code')
      .populate('academicYear', 'label')
      .lean();

    const matrix = programs.map((p) => ({
      ...p,
      totalFilled: p.quotas.reduce((s, q) => s + q.filled, 0),
      totalAvailable: p.totalIntake - p.quotas.reduce((s, q) => s + q.filled, 0),
      quotas: p.quotas.map((q) => ({ ...q, available: q.seats - q.filled })),
    }));

    res.json({ success: true, data: matrix });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
