const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
  label: { type: String, required: true, unique: true }, // e.g., "2025-26"
  startYear: { type: Number, required: true },
  endYear: { type: Number, required: true },
  isActive: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('AcademicYear', academicYearSchema);
