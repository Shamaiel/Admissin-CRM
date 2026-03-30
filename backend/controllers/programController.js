const Program = require('../models/Program');
const createCRUD = require('./crudFactory');

const base = createCRUD(Program, 'department campus institution academicYear');

exports.getAll  = base.getAll;
exports.getOne  = base.getOne;
exports.remove  = base.remove;

exports.create = async (req, res) => {
  try {
    const program = await Program.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: program });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) return res.status(404).json({ success: false, message: 'Program not found' });

    // Merge quotas properly
    if (req.body.quotas) {
      // Only allow updating seat counts, not filled counts
      req.body.quotas = req.body.quotas.map((q, i) => ({
        ...q,
        filled: program.quotas[i] ? program.quotas[i].filled : 0,
      }));
    }

    Object.assign(program, req.body);
    await program.save();
    res.json({ success: true, data: program });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Check seat availability for a quota
exports.checkAvailability = async (req, res) => {
  try {
    const { programId, quotaType } = req.params;
    const program = await Program.findById(programId).populate('department campus institution');
    if (!program) return res.status(404).json({ success: false, message: 'Program not found' });

    const quota = program.quotas.find((q) => q.name === quotaType);
    if (!quota) return res.status(404).json({ success: false, message: 'Quota not found in program' });

    res.json({
      success: true,
      data: {
        program: program.name,
        quota: quota.name,
        total: quota.seats,
        filled: quota.filled,
        available: quota.seats - quota.filled,
        isAvailable: quota.seats - quota.filled > 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
