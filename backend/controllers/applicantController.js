const Applicant = require('../models/Applicant');
const Program = require('../models/Program');

// exports.getAll = async (req, res) => {
//   try {
//     const filter = {};
//     if (req.query.status) filter.status = req.query.status;
//     if (req.query.program) filter.program = req.query.program;
//     if (req.query.quotaType) filter.quotaType = req.query.quotaType;
//     if (req.query.institution) filter.institution = req.query.institution;

//     const applicants = await Applicant.find(filter)
//       .populate('program', 'name code courseType')
//       .populate('institution', 'name code')
//       .populate('academicYear', 'label')
//       .populate('createdBy', 'name')
//       .sort({ createdAt: -1 });

//     res.json({ success: true, data: applicants, total: applicants.length });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.program) filter.program = req.query.program;
    if (req.query.quotaType) filter.quotaType = req.query.quotaType;
    if (req.query.institution) filter.institution = req.query.institution;

    const applicants = await Applicant.find(filter)
      .populate('program', 'name code courseType quotas totalIntake')
      .populate('institution', 'name code')
      .populate('academicYear', 'label')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: applicants, total: applicants.length });
  } catch (err) {
    console.error('getAll applicants error:', err); // log full error
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getOne = async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id)
      .populate('program', 'name code courseType quotas totalIntake')
      .populate('institution', 'name code')
      .populate('academicYear', 'label')
      .populate('createdBy', 'name');
    if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });
    res.json({ success: true, data: applicant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// exports.create = async (req, res) => {

//   try {
//     const applicant = await Applicant.create({ ...req.body, createdBy: req.user._id });
//     res.status(201).json({ success: true, data: applicant });
//   } catch (err) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// };



exports.create = async (req, res) => {
  try {
    const body = { ...req.body, createdBy: req.user._id };

    // Remove empty string fields that are ObjectId references
    // Program is assigned later during seat allocation — not at creation
    if (!body.program)      delete body.program;
    if (!body.institution)  delete body.institution;
    if (!body.academicYear) delete body.academicYear;

    const applicant = await Applicant.create(body);
    res.status(201).json({ success: true, data: applicant });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const applicant = await Applicant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });
    res.json({ success: true, data: applicant });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const { docName, status } = req.body;
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });

    const doc = applicant.documents.find((d) => d.name === docName);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found in checklist' });
    doc.status = status;

    const allVerified = applicant.documents.every((d) => d.status === 'Verified');
    if (allVerified && applicant.status === 'Seat Allocated') {
      applicant.status = 'Documents Verified';
    }

    await applicant.save();
    res.json({ success: true, data: applicant });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateFeeStatus = async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });

    if (applicant.feeStatus === 'Paid') {
      return res.status(400).json({ success: false, message: 'Fee is already marked as paid' });
    }

    applicant.feeStatus = 'Paid';
    applicant.feePaidOn = new Date();
    if (['Seat Allocated', 'Documents Verified'].includes(applicant.status)) {
      applicant.status = 'Fee Paid';
    }

    await applicant.save();
    res.json({ success: true, data: applicant });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// FIXED: Correct atomic seat allocation
exports.allocateSeat = async (req, res) => {
  try {
    const { programId, quotaType } = req.body;

    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });

    if (applicant.status !== 'Applied') {
      return res.status(400).json({ success: false, message: 'Applicant is not in Applied status' });
    }

    // Read current program quota
    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ success: false, message: 'Program not found' });

    const quota = program.quotas.find((q) => q.name === quotaType);
    if (!quota) {
      return res.status(404).json({ success: false, message: `Quota '${quotaType}' not configured for this program` });
    }

    // Hard check before atomic update
    if (quota.filled >= quota.seats) {
      return res.status(400).json({
        success: false,
        message: `Quota ${quotaType} is FULL (${quota.filled}/${quota.seats}). Allocation blocked.`,
      });
    }

    // Atomic increment with condition — prevents double booking
    const updated = await Program.findOneAndUpdate(
      { _id: programId, 'quotas.name': quotaType, 'quotas.filled': { $lt: quota.seats } },
      { $inc: { 'quotas.$.filled': 1 } },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: `Quota ${quotaType} is FULL. Seat allocation blocked.`,
      });
    }

    // Update applicant record
    applicant.program = programId;
    applicant.quotaType = quotaType;
    applicant.status = 'Seat Allocated';
    if (req.body.allotmentNumber) applicant.allotmentNumber = req.body.allotmentNumber;
    await applicant.save();

    res.json({ success: true, message: `Seat allocated in ${quotaType} quota successfully`, data: applicant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


