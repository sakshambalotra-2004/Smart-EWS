const mongoose = require('mongoose');

const perceptronModelSchema = new mongoose.Schema({
  version:    { type: String, required: true, unique: true },
  features:   [String],                // ['ca_avg', 'midterm_avg', 'attendance_avg', 'past_cgpa']
  weights:    [[Number]],              // W matrix [features x classes]
  biases:     [Number],                // b vector [classes]
  classes:    [String],                // ['high', 'medium', 'low']
  accuracy:   Number,
  is_active:  { type: Boolean, default: true },
  trained_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PerceptronModel', perceptronModelSchema);