const mongoose = require('mongoose');

const campusSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  address: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Campus', campusSchema);
