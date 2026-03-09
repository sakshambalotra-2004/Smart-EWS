const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  student_id: { type: String, required: true },
  subject_code: { type: String, required: true },
  faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  semester_label: { type: String, default: 'Spring 2025' },
  ca_marks: {
    ca1: { type: Number, default: 0 },
    ca2: { type: Number, default: 0 },
    ca3: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    max: { type: Number, default: 75 }
  },
  midterm_score: { type: Number, default: 0 },
  midterm_max: { type: Number, default: 50 },
  attendance_pct: { type: Number, min: 0, max: 100, default: 0 },
  submitted_at: { type: Date, default: Date.now }
});

// Compound index to prevent duplicate entries
marksSchema.index({ student_id: 1, subject_code: 1, semester_label: 1 }, { unique: true });

module.exports = mongoose.model('Marks', marksSchema);
