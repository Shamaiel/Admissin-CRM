const Program = require('../models/Program');
const Applicant = require('../models/Applicant');
const Admission = require('../models/Admission');

exports.getSummary = async (req, res) => {
  try {
    const { academicYear, institution } = req.query;
    const filter = {};
    if (academicYear) filter.academicYear = academicYear;
    if (institution) filter.institution = institution;

    // Programs with seat matrix
    const programs = await Program.find(filter)
      .populate('department', 'name')
      .populate('campus', 'name')
      .lean();

    // const seatMatrix = programs.map((p) => ({
    //   programId: p._id,
    //   name: p.name,
    //   code: p.code,
    //   courseType: p.courseType,
    //   totalIntake: p.totalIntake,
    //   totalFilled: p.quotas.reduce((s, q) => s + q.filled, 0),
    //   totalAvailable: p.totalIntake - p.quotas.reduce((s, q) => s + q.filled, 0),
    //   quotas: p.quotas.map((q) => ({
    //     name: q.name,
    //     seats: q.seats,
    //     filled: q.filled,
    //     available: q.seats - q.filled,
    //   })),
    // }));
    const seatMatrix = programs.map((p) => ({
  programId: p._id,
  name: p.name,
  code: p.code,
  courseType: p.courseType,
  totalIntake: p.totalIntake,
  totalFilled: (p.quotas || []).reduce((s, q) => s + (q.filled || 0), 0),
  totalAvailable: p.totalIntake - (p.quotas || []).reduce((s, q) => s + (q.filled || 0), 0),
  quotas: (p.quotas || []).map((q) => ({
    name: q.name,
    seats: q.seats,
    filled: q.filled || 0,
    available: q.seats - (q.filled || 0),
  })),
}));

    // Totals
    const totalIntake   = seatMatrix.reduce((s, p) => s + p.totalIntake, 0);
    const totalFilled   = seatMatrix.reduce((s, p) => s + p.totalFilled, 0);
    const totalAvailable = totalIntake - totalFilled;

    // Applicant counts by status
    const applicantFilter = {};
    if (institution) applicantFilter.institution = institution;
    if (academicYear) applicantFilter.academicYear = academicYear;

    const applicantStats = await Applicant.aggregate([
      { $match: applicantFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const applicantStatusMap = {};
    applicantStats.forEach((s) => { applicantStatusMap[s._id] = s.count; });

    // Pending documents
    const pendingDocs = await Applicant.countDocuments({
      ...applicantFilter,
      'documents.status': { $in: ['Pending', 'Submitted'] },
      status: { $in: ['Seat Allocated', 'Documents Verified'] },
    });

    // Fee pending
    const feePending = await Applicant.countDocuments({ ...applicantFilter, feeStatus: 'Pending', status: { $ne: 'Applied' } });

    // Confirmed admissions
    const confirmedAdmissions = await Admission.countDocuments({ ...applicantFilter, status: 'Confirmed' });

    res.json({
      success: true,
      data: {
        overview: { totalIntake, totalFilled, totalAvailable, confirmedAdmissions },
        seatMatrix,
        applicantStats: applicantStatusMap,
        pendingDocuments: pendingDocs,
        feePending,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
