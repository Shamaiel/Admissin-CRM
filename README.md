# EduMerge – Admission Management & CRM

A full-stack MERN application for managing college admissions — built as per the EduMerge assignment specification.

**AI Disclosure:** Scaffolding, boilerplate and structure generated with Claude (Anthropic). Business logic, quota validation, admission number generation, and workflow design authored manually.

---

## 🏗️ Tech Stack

| Layer    | Technology                         |
|----------|------------------------------------|
| Frontend | React 18, React Router v6, Recharts |
| Backend  | Node.js, Express.js                |
| Database | MongoDB + Mongoose                 |
| Auth     | JWT (jsonwebtoken + bcryptjs)      |

---

## 📁 Project Structure

```
admission-crm/
├── backend/
│   ├── config/
│   │   ├── db.js          # MongoDB connection
│   │   └── seed.js        # Seed demo data & users
│   ├── controllers/       # Business logic
│   ├── middleware/        # JWT auth & role guard
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express routers
│   ├── server.js          # Entry point
│   └── .env.example
└── frontend/
    └── src/
        ├── components/    # Reusable UI (Layout, Modal)
        ├── context/       # AuthContext
        ├── pages/         # All page components
        │   ├── masters/   # Institution, Campus, Dept, AY, Program
        │   ├── ApplicantsPage.js
        │   ├── ApplicantDetailPage.js
        │   ├── AdmissionsPage.js
        │   ├── DashboardPage.js
        │   └── UsersPage.js
        └── services/      # Axios API calls
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB running locally (or MongoDB Atlas URI)
- Git

---

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd admission-crm
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set MONGO_URI and JWT_SECRET
```

**`.env` file:**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/admission_crm
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

### 3. Seed Demo Data
```bash
node config/seed.js
```

This creates:
- 1 Institution, 1 Campus, 2 Departments, 1 Academic Year, 2 Programs
- 3 test users (Admin, Admission Officer, Management)

### 4. Start Backend
```bash
npm run dev      # development (nodemon)
# or
npm start        # production
```
API runs at: `http://localhost:5000`

---

### 5. Frontend Setup
```bash
cd ../frontend
npm install
npm start
```
App runs at: `http://localhost:3000`

> The frontend proxies `/api` to `http://localhost:5000` via `package.json` proxy setting.

---

## 🔑 Test Credentials

| Role             | Email                  | Password    |
|------------------|------------------------|-------------|
| Admin            | admin@edumerge.com     | admin123    |
| Admission Officer | officer@edumerge.com  | officer123  |
| Management       | mgmt@edumerge.com      | mgmt123     |

---

## ✅ Features Implemented

### Master Setup (Admin only)
- ✅ Institution management (CRUD)
- ✅ Campus management (linked to institution)
- ✅ Department management (linked to campus)
- ✅ Academic Year management (with active flag)
- ✅ Program/Branch management (UG/PG, Regular/Lateral)

### Seat Matrix & Quota
- ✅ Total intake per program
- ✅ Quota configuration: KCET, COMEDK, Management, JK, NRI
- ✅ Quota total must equal intake (enforced frontend + backend)
- ✅ Real-time seat counter per quota
- ✅ **Atomic seat block** — uses MongoDB `$inc` with conditional filter to prevent race conditions
- ✅ Supernumerary seats (separate counter)

### Applicant Management
- ✅ Create applicant form (≤15 fields as per spec)
- ✅ Category: GM/SC/ST/OBC/EWS
- ✅ Entry type, Quota type
- ✅ Qualifying exam marks & rank
- ✅ Document checklist (6 docs) with Pending/Submitted/Verified status

### Admission Workflow
- ✅ Government Flow: allotment number → quota check → seat lock
- ✅ Management Flow: manual selection → quota check → seat lock
- ✅ Real-time availability check before allocation
- ✅ Quota full = allocation BLOCKED with clear message

### Admission Confirmation
- ✅ Admission Number generated: `EIT/2026/UG/CSE/KCET/0001`
- ✅ Number is unique and immutable (MongoDB `immutable: true`)
- ✅ Confirmation only after fee = Paid

### Fee Status
- ✅ Pending / Paid
- ✅ Seat confirmed only when fee is Paid

### Dashboard
- ✅ Total intake vs admitted (bar chart)
- ✅ Quota-wise filled seats with progress bars
- ✅ Applicant pipeline (pie chart)
- ✅ Pending documents count
- ✅ Fee pending count
- ✅ Filter by Academic Year and Institution

### User Roles
- ✅ Admin — full access, master setup
- ✅ Admission Officer — create applicants, allocate seats, verify docs, confirm admission
- ✅ Management — view dashboard, seat matrix, admissions (read-only)

---

## 🔒 Key System Rules Implemented

1. **Quota seats cannot exceed intake** — validated on save (frontend + Mongoose pre-save hook)
2. **No seat allocation if quota full** — atomic MongoDB update with conditional filter
3. **Admission number generated only once** — `immutable: true` in Mongoose schema
4. **Admission confirmed only if fee paid** — checked in `confirmAdmission` controller
5. **Seat counters update in real time** — `$inc` on `quotas.$.filled`

---

## 📡 API Endpoints

```
POST   /api/auth/login
GET    /api/auth/me
GET    /api/auth/users          (admin)
POST   /api/auth/users          (admin)

GET    /api/institutions
POST   /api/institutions        (admin)
PUT    /api/institutions/:id    (admin)

GET    /api/campuses
POST   /api/campuses            (admin)

GET    /api/departments
POST   /api/departments         (admin)

GET    /api/academic-years
POST   /api/academic-years      (admin)

GET    /api/programs
POST   /api/programs            (admin)
GET    /api/programs/:id/availability/:quotaType

GET    /api/seat-matrix

GET    /api/applicants
POST   /api/applicants
GET    /api/applicants/:id
PUT    /api/applicants/:id
POST   /api/applicants/:id/allocate-seat
PATCH  /api/applicants/:id/document
PATCH  /api/applicants/:id/fee

GET    /api/admissions
POST   /api/admissions
POST   /api/admissions/:id/confirm
POST   /api/admissions/:id/cancel

GET    /api/dashboard/summary
```

---

## 🔗 Demo Walkthrough

1. Login as **Admin** → Set up masters (already seeded)
2. Login as **Admission Officer** → Create an applicant
3. Open the applicant → Click **Allocate Seat** → Check availability → Allocate
4. Update documents to **Verified**
5. Click **Mark as Paid**
6. Click **Confirm Admission** → Admission Number is generated
7. Login as **Management** → View Dashboard & Seat Matrix
