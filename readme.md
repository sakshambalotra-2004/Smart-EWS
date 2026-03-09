# ⚡ SMART-EWS — Smart Early Warning System

Academic risk prediction platform for Spring 2025 Hackathon.

## Architecture

```
smart-ews/
├── backend/          # Node.js + Express + MongoDB
├── frontend/         # React + Vite
└── ml-model/         # Python Flask + MLP Perceptron
```

## Quick Start

### Prerequisites
- Node.js v18+
- Python 3.9+
- MongoDB running locally on port 27017

---

### 1. Backend Setup

```bash
cd backend
npm install
npm run seed          # Seeds database with demo data
npm run dev           # Starts on http://localhost:5000
```

### 2. ML Model Setup

```bash
cd ml-model
pip install -r requirements.txt
python app.py         # Starts on http://localhost:5001
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev           # Starts on http://localhost:3000
```

---

## Demo Credentials

| Role      | Email                        | Password       |
|-----------|------------------------------|----------------|
| Admin     | admin@university.edu         | Admin@123      |
| Counselor | counselor@university.edu     | Counselor@123  |
| Faculty   | roberts@university.edu       | Faculty@123    |
| Student   | aisha@university.edu         | Student@123    |

All faculty: `[roberts, nguyen, patel, chen]@university.edu` / `Faculty@123`  
All students: `[aisha, james, maria, ahmed, sophie, raj, fatima, david, nina, luis]@university.edu` / `Student@123`

---

## 3-Minute Demo Script

1. **Login as Admin** → Upload Records (already seeded) → Analytics
2. **Login as Faculty (Dr. Roberts)** → Upload Marks → all 3 tabs for CS301
3. **Login as Counselor** → Dashboard shows readiness → Generate Prediction → watch terminal → Risk Analysis
4. **Select Aisha Rahman** (HIGH risk, score 87) → Create Intervention
5. **Login as Student (aisha@university.edu)** → Dashboard shows HIGH RISK + recommendations + intervention

---

## System Flow

```
Admin → Upload Students CSV
         ↓
Admin → Create Subjects → Assign Faculty
         ↓
Faculty → Upload CA Marks (CSV)
        → Upload Midterm Marks (CSV)
        → Upload Attendance (CSV)
         ↓
Counselor → Data Readiness Check (all 4 subjects ✓)
          → Generate Prediction
             ↓
         Backend → Aggregates 6 features per student
                 → Calls Flask /api/predict/batch
                 → Flask MLP Perceptron → risk: high/medium/low
                 → Results stored in predictions collection
         ↓
Counselor → Risk Analysis → Create Interventions
         ↓
Student → Dashboard → Risk Score + Recommendations + Interventions
```

---

## ML Model — 6 Input Features

| Feature          | Range    | Source           |
|------------------|----------|------------------|
| attendance_avg   | 0-100    | marks collection |
| ca_avg           | 0-100    | marks collection |
| midterm_avg      | 0-100    | marks collection |
| past_cgpa        | 0.0-4.0  | students record  |
| failed_subjects  | 0-6      | marks collection |
| semester         | 1-8      | students record  |

---

## API Routes

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET  /api/auth/me`

### Admin
- `POST /api/admin/uploadrecords`
- `GET  /api/admin/students`
- `GET  /api/admin/users`
- `POST /api/admin/users`
- `POST /api/admin/subjects`
- `PUT  /api/admin/subjects/:id/assign`
- `GET  /api/admin/analytics`

### Faculty
- `GET  /api/faculty/subjects`
- `POST /api/faculty/uploadmarks`
- `GET  /api/faculty/submissionstatus`
- `POST /api/faculty/behavior`
- `GET  /api/faculty/students/:subject_code`

### Counselor
- `GET  /api/counselor/data-status`
- `POST /api/counselor/predict`
- `GET  /api/counselor/predictions`
- `GET  /api/counselor/students`
- `POST /api/counselor/interventions`
- `GET  /api/counselor/interventions`
- `PUT  /api/counselor/interventions/:id`

### Student
- `GET  /api/student/me`
- `GET  /api/student/marks`
- `GET  /api/student/interventions`

### ML Flask API
- `GET  /api/health`
- `POST /api/predict`
- `POST /api/predict/batch`
- `GET  /api/model/info`

---

## Fallback Mode

If Flask ML API is unavailable, the backend falls back to a heuristic scoring algorithm. The prediction will still work — just without the neural network.

If the entire backend is down during demo, the frontend has UI state that can be bypassed by navigating directly to `/admin`, `/faculty`, `/counselor`, or `/student`.

---

## Database Collections

- `users` — admin, faculty, counselor, student accounts
- `students` — master student records (seeded by admin CSV)
- `subjects` — course catalog with faculty assignments
- `marks` — CA marks, midterm scores, attendance per subject
- `predictions` — ML model output per student
- `predictionruns` — history of each prediction run
- `interventions` — counselor-created intervention plans