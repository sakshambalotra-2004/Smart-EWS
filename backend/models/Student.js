const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  student_id: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  parent_email: { type: String, required: true, lowercase: true, trim: true },
  dept: { type: String, enum: ['CS', 'EE', 'ME', 'BBA'], required: true },
  semester: { type: Number, min: 1, max: 8, required: true },
  past_cgpa: { type: Number, min: 0.0, max: 10.0, required: true },
  enrolled_subjects: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', studentSchema);