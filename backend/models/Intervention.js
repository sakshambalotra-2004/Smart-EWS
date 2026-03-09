const mongoose = require('mongoose');

const interventionSchema = new mongoose.Schema({
  student_id: { type: String, required: true },
  counselor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['Academic Counseling', 'Parent Notification', 'Tutoring Session', 'Peer Mentoring', 'Warning Letter'],
    required: true
  },
  status: { type: String, enum: ['Scheduled', 'Active', 'Completed'], default: 'Scheduled' },
  notes: { type: String, default: '' },
  scheduled_date: { type: Date },
  completed_date: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Intervention', interventionSchema);
