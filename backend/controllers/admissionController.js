const Admission = require('../models/Admission');
const Applicant = require('../models/Applicant');
const Program = require('../models/Program');
const Institution = require('../models/Institution');
const AcademicYear = require('../models/AcademicYear');

exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.program) filter.program = req.query.program;
    if (req.query.status) filter.status = req.query.status;

    const admissions = await Admission.find(filter)
      .populate('applicant', 'firstName lastName email phone category quotaType feeStatus documents status')
      .populate('program', 'name code courseType')
      .populate('institution', 'name code')
      .populate('academicYear', 'label')
      .populate('confirmedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: admissions, total: admissions.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id)
      .populate('applicant')
      .populate('program')
      .populate('institution')
      .populate('academicYear')
      .populate('confirmedBy', 'name');
    if (!admission) return res.status(404).json({ success: false, message: 'Admission not found' });
    res.json({ success: true, data: admission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Find admission by applicant ID
// exports.getByApplicant = async (req, res) => {
//   try {
//     const admission = await Admission.findOne({ applicant: req.params.applicantId })
//       .populate('program', 'name code courseType')
//       .populate('institution', 'name code')
//       .populate('academicYear', 'label');
//     res.json({ success: true, data: admission || null });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };
// Add this new function
exports.getByApplicant = async (req, res) => {
  try {
    const admission = await Admission.findOne({ applicant: req.params.applicantId })
      .populate('program', 'name code courseType')
      .populate('institution', 'name code')
      .populate('academicYear', 'label');
    res.json({ success: true, data: admission || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create admission record (called right after seat allocation)
exports.createAdmission = async (req, res) => {
  try {
    const { applicantId } = req.body;
    const applicant = await Applicant.findById(applicantId);

    if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });
    if (applicant.status !== 'Seat Allocated') {
      return res.status(400).json({ success: false, message: 'Applicant seat must be allocated first' });
    }

    // Prevent duplicate
    const existing = await Admission.findOne({ applicant: applicantId });
    if (existing) return res.status(200).json({ success: true, data: existing, message: 'Admission record already exists' });

    const admission = await Admission.create({
      applicant: applicantId,
      program: applicant.program,
      institution: applicant.institution,
      academicYear: applicant.academicYear,
      quotaType: applicant.quotaType,
      admissionMode: ['KCET', 'COMEDK'].includes(applicant.quotaType) ? 'Government' : 'Management',
      allotmentNumber: applicant.allotmentNumber,
      seatAllocatedAt: new Date(),
      status: 'Seat Locked',
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: admission });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// FIXED: Confirm admission - properly populate institution from program
exports.confirmAdmission = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id)
      .populate({ path: 'program', populate: { path: 'institution' } })
      .populate('academicYear');

    if (!admission) return res.status(404).json({ success: false, message: 'Admission not found' });
    if (admission.status === 'Confirmed') {
      return res.status(400).json({ success: false, message: 'Admission is already confirmed' });
    }

    // Check fee paid
    const applicant = await Applicant.findById(admission.applicant);
    if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });
    if (applicant.feeStatus !== 'Paid') {
      return res.status(400).json({ success: false, message: 'Fee must be paid before confirming admission' });
    }

    // Get institution from program (since it's populated there)
    const program = admission.program;
    const institution = program.institution;
    const academicYear = admission.academicYear;

    if (!institution || !institution.code) {
      return res.status(400).json({ success: false, message: 'Institution data missing. Please contact admin.' });
    }
    if (!academicYear) {
      return res.status(400).json({ success: false, message: 'Academic year data missing.' });
    }

    // Generate unique admission number: EIT/2026/UG/CSE/KCET/0001
    const admissionNumber = await Admission.generateAdmissionNumber({
      institutionCode: institution.code,
      year: academicYear.endYear,
      courseType: program.courseType,
      programCode: program.code,
      quotaType: admission.quotaType,
    });

    admission.admissionNumber = admissionNumber;
    admission.status = 'Confirmed';
    admission.confirmedAt = new Date();
    admission.confirmedBy = req.user._id;
    await admission.save();

    // Update applicant to Admitted
    applicant.status = 'Admitted';
    await applicant.save();

    res.json({
      success: true,
      data: admission,
      message: `Admission confirmed! Admission Number: ${admissionNumber}`,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Cancel admission - release seat back
exports.cancelAdmission = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);
    if (!admission) return res.status(404).json({ success: false, message: 'Admission not found' });
    if (admission.status === 'Confirmed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a confirmed admission' });
    }

    // Release the quota seat
    await Program.findOneAndUpdate(
      { _id: admission.program, 'quotas.name': admission.quotaType },
      { $inc: { 'quotas.$.filled': -1 } }
    );

    admission.status = 'Cancelled';
    await admission.save();

    const applicant = await Applicant.findById(admission.applicant);
    if (applicant) { applicant.status = 'Cancelled'; await applicant.save(); }

    res.json({ success: true, message: 'Admission cancelled and seat released back to quota' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
