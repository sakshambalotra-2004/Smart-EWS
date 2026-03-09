const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  student_id: { type: String, required: true },
  run_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PredictionRun', required: true },
  risk_level: { type: String, enum: ['high', 'medium', 'low'], required: true },
  risk_score: { type: Number, min: 0, max: 100, required: true },
  features_used: {
    attendance_avg: Number,
    ca_avg: Number,
    midterm_avg: Number,
    past_cgpa: Number,
    failed_subjects: Number,
    semester: Number
  },
  model_version: { type: String, default: 'v1.0' },
  created_at: { type: Date, default: Date.now }
});

const predictionRunSchema = new mongoose.Schema({
  triggered_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  semester_label: { type: String, default: 'Spring 2025' },
  students_processed: { type: Number, default: 0 },
  high_count: { type: Number, default: 0 },
  medium_count: { type: Number, default: 0 },
  low_count: { type: Number, default: 0 },
  model_accuracy: { type: Number, default: null },
  created_at: { type: Date, default: Date.now }
});

const Prediction = mongoose.model('Prediction', predictionSchema);
const PredictionRun = mongoose.model('PredictionRun', predictionRunSchema);

module.exports = { Prediction, PredictionRun };
