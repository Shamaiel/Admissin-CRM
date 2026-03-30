const mongoose = require('mongoose');

const quotaSchema = new mongoose.Schema({
  name: { type: String, required: true, enum: ['KCET', 'COMEDK', 'Management', 'JK', 'NRI'] },
  seats: { type: Number, required: true, min: 0 },
  filled: { type: Number, default: 0 },
}, { _id: false });

quotaSchema.virtual('available').get(function () {
  return this.seats - this.filled;
});

const programSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, uppercase: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  campus: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  courseType: { type: String, enum: ['UG', 'PG'], required: true },
  entryType: { type: String, enum: ['Regular', 'Lateral'], required: true },
  admissionMode: { type: String, enum: ['Government', 'Management'], default: 'Government' },
  totalIntake: { type: Number, required: true, min: 1 },
  quotas: { type: [quotaSchema], default: [] },
  supernumerarySeats: { type: Number, default: 0 },
  supernumeraryFilled: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Validate quota total equals intake
programSchema.pre('save', function (next) {
  const quotaTotal = this.quotas.reduce((sum, q) => sum + q.seats, 0);
  if (this.quotas.length > 0 && quotaTotal !== this.totalIntake) {
    return next(new Error(`Quota total (${quotaTotal}) must equal total intake (${this.totalIntake})`));
  }
  next();
});

programSchema.virtual('totalFilled').get(function () {
  return this.quotas.reduce((sum, q) => sum + q.filled, 0);
});

programSchema.virtual('totalAvailable').get(function () {
  return this.totalIntake - this.totalFilled;
});

module.exports = mongoose.model('Program', programSchema);
