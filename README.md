# ProjectFlow — Academic Project & Internship Attendance Portal

A role-based web portal for SRM students, faculty guides, HODs and administrators. Students on internships mark **daily attendance remotely** and submit **weekly progress reports**; their faculty guide verifies attendance and reviews reports; HODs monitor their whole department; admins manage accounts and guide assignments.

**Stack:** React + Vite + Tailwind (frontend) · Node.js + Express 5 + Prisma + PostgreSQL (backend) · JWT auth · Zod validation · Jest + Supertest · Swagger/OpenAPI

## What each role can do

| Role | Can do |
| --- | --- |
| **Student** | Register with an `@srmist.edu.in` email and register number · add internship details · mark attendance once per weekday (remote or on-site, with a work summary) · see attendance %, present/pending/absent days · propose a project to a faculty member · submit weekly reports with a link (late reports are flagged) · resubmit when changes are requested · see feedback and notifications |
| **Faculty (guide)** | Self-register, then wait for admin approval · verify or reject guided students' daily attendance (rejection needs a reason) · approve or reject project proposals (approval creates the student's team with them as leader) · create projects with domain, start date and deadline · move projects through Approved → In progress → Completed · create, rename and delete teams (max 4), pick a team leader · approve reports or request changes with feedback · export attendance CSV |
| **HOD** | Read-only view of their department: attendance % per student, low-attendance flags (< 75%), weekly reports, users |
| **Admin** | Approve faculty accounts · assign a faculty guide to each student · reassign a project's faculty · change roles · deactivate users · create HOD/admin accounts · see all departments |

## How it works

```
Browser (React)  ──REST + JWT──▶  Express API  ──Prisma──▶  PostgreSQL
                                  routes → auth / role / Zod middleware → controllers → services
```

- **Attendance rule:** attendance % = verified days ÷ working days (Mon–Fri) from internship start to today. One record per student per day (unique constraint), recorded in India Standard Time. Weekends, days outside the internship and duplicate check-ins are rejected.
- **Access control:** every query is scoped by role: students see only their own records, faculty see only students they guide, HODs only their department, admins everything. Students can't reach `/users`; faculty can't verify another guide's students.
- **Security:** bcrypt password hashing · JWT (1-day expiry) · login rate limiting (5/min per IP) · Helmet headers · CORS restricted to the frontend URL · deactivated accounts are blocked even with a valid token · production errors never leak stack traces.

## Project structure

```
backend/
  prisma/            schema.prisma, migrations/, seed.js (demo data)
  src/
    routes/          URL → middleware → controller
    middleware/      auth (JWT), role checks, Zod validation, rate limits, errors
    controllers/     HTTP in/out only
    services/        business rules and database access
    validators/      Zod schemas
    docs/openapi.js  Swagger spec served at /api/docs
  tests/             Jest + Supertest suites
frontend/
  src/pages/         Dashboard (per role), Attendance, Weekly Reports, Users, Projects, Teams, Notifications, Settings
  src/components/    layout + UI kit
```

## Run it locally

Requirements: Node.js 20+ and PostgreSQL 14+.

```bash
# 1. Backend
cd backend
cp .env.example .env            # set DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate deploy       # creates the tables
npm run db:seed                 # demo users and data
npm run dev                     # http://localhost:5000  (API docs: /api/docs)

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                     # http://localhost:5173
```

### Demo accounts (password `Password123`)

| Role | Email |
| --- | --- |
| Student | student1@srmist.edu.in (student3 has low attendance) |
| Faculty | faculty1@srmist.edu.in |
| HOD (CSE) | hod.cse@srmist.edu.in |
| Admin | admin@srmist.edu.in |
| Faculty awaiting approval | faculty.pending@srmist.edu.in |

The login page has one-click buttons for these.

### Environment variables (backend)

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | required |
| `JWT_SECRET` | Secret used to sign tokens (long and random in production) | required |
| `JWT_EXPIRES_IN` | Token lifetime | `1d` |
| `CLIENT_URL` | Allowed frontend origin(s), comma-separated | `http://localhost:5173` |
| `ALLOWED_EMAIL_DOMAIN` | Only this email domain can register | `srmist.edu.in` |
| `LOW_ATTENDANCE_THRESHOLD` | % below which students are flagged | `75` |
| `LOGIN_RATE_LIMIT` | Login attempts per minute per IP | `5` |

Frontend: `VITE_API_URL` — the API base URL, e.g. `https://projectflow-api.onrender.com/api/v1`.

## Tests

```bash
cd backend
cp .env.test.example .env.test   # points at a separate *_test database
npx prisma migrate deploy        # run once with DATABASE_URL set to the test DB
npm test
```

51 tests cover registration rules, login, expired/tampered tokens, role-based access, HOD department scoping, the attendance rules (duplicates, weekends, guide-only verification, percentage maths), project proposals and approval (including the auto-created team), project search/filter/sort/pagination, team leader rules, late-report flags and the report review loop. GitHub Actions runs them on every push, checks that the migrations match `schema.prisma`, and lints and builds the frontend.

## API

Interactive docs: **`/api/docs`** (Swagger UI). Main endpoints, all under `/api/v1`:

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `GET/PATCH /auth/profile` · `PATCH /auth/password` |
| Users (admin/HOD) | `GET/POST /users` · `GET/PATCH/DELETE /users/:id` · `PATCH /users/:id/guide` |
| Internship | `GET/PUT /internships/me` |
| Attendance | `POST /attendance` · `GET /attendance` · `GET /attendance/stats` · `GET /attendance/report?format=csv` · `GET /attendance/summary/:studentId` · `PATCH /attendance/:id/verify` |
| Weekly reports | `GET/POST /submissions` · `GET/PATCH /submissions/:id` · `PATCH /submissions/:id/review` |
| Projects | `GET /projects?search=&status=&domain=&sort=&order=&page=` · `POST /projects` · `POST /projects/proposals` · `GET/PATCH/DELETE /projects/:id` · `PATCH /projects/:id/review` · `PATCH /projects/:id/faculty` |
| Teams | `GET/POST /teams` · `PATCH/DELETE /teams/:id` · `POST /teams/assign` · `DELETE /teams/:id/members/:studentId` · `GET /teams/available-students` |
| Other | `GET /notifications` · `PATCH /notifications/:id/read` · `GET /dashboard` · `GET /health` |

Responses always look like `{ success, message, data }`; errors like `{ success: false, message, errors }` with field-level validation messages.

## Interactive demo build

`npm run build:demo` in `frontend/` produces `dist-demo/index.html`: the same app as one self-contained file, with an in-browser stand-in for the API (`src/demo/mockServer.js`) and seeded demo data. It's useful for presentations when the real backend isn't running. Data stays in the browser, and there's a "Reset demo data" button.

## Deployment (free tiers)

1. **Database — Neon:** create a project and copy the connection string (`…?sslmode=require`).
2. **API — Render:** *New → Blueprint* and pick this repo (uses `render.yaml`). Set `DATABASE_URL` (Neon) and `CLIENT_URL` (your Vercel URL). The build runs migrations and loads demo data only if the database is empty.
3. **Frontend — Vercel:** import the repo, set root directory to `frontend`, and add `VITE_API_URL=https://<render-app>.onrender.com/api/v1`.

Render's free tier sleeps after 15 minutes idle, so the first request after a break takes about a minute.

A `backend/Dockerfile` is included for container-based hosting.

## Known limitations / next steps

- Password reset by email and email notifications (in-app notifications only for now).
- File uploads for reports (links to GitHub/Drive are used instead).
- Attendance proof is a work summary; no location or photo check.
- Weekends are excluded; public holidays are not yet.
