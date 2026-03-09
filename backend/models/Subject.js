const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  subject_code: { type: String, required: true, unique: true, trim: true },
  subject_name: { type: String, required: true, trim: true },
  dept: { type: String, enum: ['CS', 'EE', 'ME', 'BBA'], required: true },
  semester: { type: Number, min: 1, max: 8 },
  faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  semester_label: { type: String, default: 'Spring 2025' }
});

module.exports = mongoose.model('Subject', subjectSchema);
