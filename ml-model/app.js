const express   = require('express')
const mongoose  = require('mongoose')
const math      = require('mathjs')
require('dotenv').config()

const PerceptronModel = require('./models/PerceptronModel')

const app = express()
app.use(express.json())

// ============================
// Model State
// ============================

let W, b, CLASS_NAMES, modelVersion

async function loadActiveModel() {
  const model = await PerceptronModel.findOne({ is_active: true })
  if (!model) throw new Error('No active model found in database')

  W            = model.weights
  b            = model.biases
  CLASS_NAMES  = model.classes
  modelVersion = model.version

  console.log(`Model loaded: ${modelVersion}`)
}

// ============================
// Feature Extraction
// ca_avg: 0-75, midterm_avg: 0-50, attendance_avg: 0-100
// past_cgpa: 0-10 scale (converted to 0-4 for model)
// failed_subjects: 0-6
// semester: 1-8
// ============================

function extractFeatures(s) {
  return [
    s.ca_avg          ?? s.ca_total       ?? 0,
    s.midterm_avg     ?? s.midterm_score  ?? 0,
    s.attendance_avg  ?? s.attendance_pct ?? 0,
    (s.past_cgpa / 10) * 4,
    s.failed_subjects ?? 0,
    s.semester        ?? 1
  ]
}

// ============================
// Softmax
// ============================

function softmax(z) {
  const exp = z.map(v => Math.exp(v))
  const sum = exp.reduce((a, b) => a + b, 0)
  return exp.map(v => v / sum)
}

// ============================
// Predict
// ============================

function predict(x) {
  const z     = math.add(math.multiply(x, W), b)
  const probs = softmax(z)
  const idx   = probs.indexOf(Math.max(...probs))
  return { risk: CLASS_NAMES[idx], confidence: probs[idx], probs }
}

// ============================
// Health
// ============================

app.get('/api/health', (req, res) => {
  res.json({
    status:         'ok',
    model:          'SMART-EWS Perceptron',
    version:        modelVersion,
    features:       ['ca_avg', 'midterm_avg', 'attendance_avg', 'past_cgpa', 'failed_subjects', 'semester'],
    weights_loaded: !!W
  })
})

// ============================
// Single Predict
// ============================

app.post('/api/predict', (req, res) => {
  try {
    const x = extractFeatures(req.body)
    const { risk, confidence, probs } = predict(x)
    res.json({
      risk,
      confidence,
      probabilities: { high: probs[0], medium: probs[1], low: probs[2] }
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// ============================
// Batch Predict
// ============================

app.post('/api/predict/batch', (req, res) => {
  try {
    const { students } = req.body
    if (!Array.isArray(students) || students.length === 0)
      return res.status(400).json({ message: 'students array is required' })

    const results = students.map(student => {
      const x = extractFeatures(student)
      const { risk, confidence, probs } = predict(x)
      return {
        student_id: student.student_id,
        risk,
        score:      Math.round(confidence * 100),
        confidence,
        probabilities: { high: probs[0], medium: probs[1], low: probs[2] }
      }
    })

    res.json({ results, total: results.length })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// ============================
// Reload Model (hot-swap)
// ============================

app.post('/api/reload-model', async (req, res) => {
  try {
    await loadActiveModel()
    res.json({ message: 'Model reloaded', version: modelVersion })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ============================
// Connect DB then Start
// ============================

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected')
    await loadActiveModel()
    app.listen(5001, () => console.log('SMART-EWS running on port 5001'))
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  })