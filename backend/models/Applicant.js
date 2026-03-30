const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Submitted', 'Verified'], default: 'Pending' },
}, { _id: false });

const applicantSchema = new mongoose.Schema({
  // Basic Details (<=15 fields as per doc)
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, trim: true, lowercase: true },
  phone:     { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender:    { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  category:  { type: String, enum: ['GM', 'SC', 'ST', 'OBC', 'EWS', 'Other'], required: true },
  address:   { type: String, required: true },
  state:     { type: String, required: true },

  // Academic
  qualifyingExam:   { type: String, required: true },  // e.g. PUC / 12th / Diploma
  qualifyingMarks:  { type: Number, required: true },   // percentage
  qualifyingBoard:  { type: String },
  rankOrScore:      { type: Number },                   // KCET rank / COMEDK score

  // Admission info
  entryType:  { type: String, enum: ['Regular', 'Lateral'], required: true },
  quotaType:  { type: String, enum: ['KCET', 'COMEDK', 'Management', 'JK', 'NRI'], required: true },
  allotmentNumber: { type: String },                    // For government quota

  // Program
  program:      { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
  institution:  { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },

  // Status
  status: {
    type: String,
    enum: ['Applied', 'Seat Allocated', 'Documents Verified', 'Fee Paid', 'Admitted', 'Cancelled'],
    default: 'Applied',
  },

  // Documents
  documents: {
    type: [documentSchema],
    default: [
      { name: '10th Marksheet',        status: 'Pending' },
      { name: '12th / PUC Marksheet',  status: 'Pending' },
      { name: 'Transfer Certificate',  status: 'Pending' },
      { name: 'Category Certificate',  status: 'Pending' },
      { name: 'Passport Photo',        status: 'Pending' },
      { name: 'Allotment Letter',      status: 'Pending' },
    ],
  },

  // Fee
  feeStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  feePaidOn:  { type: Date },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Applicant', applicantSchema);
