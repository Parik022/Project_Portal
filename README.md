# Faculty Project Portal — Phase 1

University portal for faculty to manage student projects and for students to submit weekly progress reports. Attendance is automatically marked **PRESENT** when a weekly submission is created.

## Tech stack

- **Frontend:** React, Vite, Tailwind CSS, shadcn-style UI, React Router
- **Backend:** Node.js, Express (CommonJS), Prisma, PostgreSQL
- **Auth:** JWT + bcryptjs · **Validation:** Zod

## Quick start

### 1. Database

Create PostgreSQL database `faculty_portal` and set credentials in `backend/.env` (see `backend/.env.example`).

### 2. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

API: `http://localhost:5000/api`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

### Seed accounts

| Role    | Email                   | Password      |
|---------|-------------------------|---------------|
| Faculty | faculty@university.edu  | password123   |
| Student | alex@student.edu        | password123   |
| Student | sam@student.edu         | password123   |

## API routes

| Method | Route | Access |
|--------|-------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/profile` | Auth |
| CRUD | `/api/projects` | Faculty (write), both (read) |
| GET/POST | `/api/teams` | Auth |
| POST | `/api/teams/assign` | Faculty |
| GET/POST | `/api/submissions` | Auth |
| PATCH | `/api/submissions/:id/review` | Faculty |
| GET | `/api/attendance` | Auth |
| GET | `/api/attendance/stats` | Auth |
| GET | `/api/dashboard` | Auth |

## Architecture

```
Controller → Service → Prisma
```

Attendance is created inside `submission.service.js` in a transaction when a student submits a report. Duplicate week submissions and attendance records are blocked via unique constraints.
