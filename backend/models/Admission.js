const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  admissionNumber: { type: String, unique: true, immutable: true },
  applicant:    { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant', required: true },
  program:      { type: mongoose.Schema.Types.ObjectId, ref: 'Program',   required: true },
  institution:  { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  quotaType:    { type: String, enum: ['KCET', 'COMEDK', 'Management', 'JK', 'NRI'], required: true },
  admissionMode:{ type: String, enum: ['Government', 'Management'], required: true },
  allotmentNumber: { type: String },

  seatAllocatedAt: { type: Date },
  confirmedAt:     { type: Date },

  status: {
    type: String,
    enum: ['Seat Locked', 'Documents Pending', 'Fee Pending', 'Confirmed', 'Cancelled'],
    default: 'Seat Locked',
  },

  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Auto-generate admission number: INST/2026/UG/CSE/KCET/0001
admissionSchema.statics.generateAdmissionNumber = async function ({ institutionCode, year, courseType, programCode, quotaType }) {
  const count = await this.countDocuments({}) + 1;
  const seq = String(count).padStart(4, '0');
  return `${institutionCode}/${year}/${courseType}/${programCode}/${quotaType}/${seq}`;
};

module.exports = mongoose.model('Admission', admissionSchema);
