# Kaizentrix Exam Portal

Secure online examination system for Kaizentrix Global Solutions: public website, Student portal, Staff invigilation, and Master Admin control center.

The **Next.js** app renders the UI. The **NestJS** API owns exam rules, deadlines, scoring, warnings, and publication. **PostgreSQL** is the official state.

## Architecture

```
apps/web     Next.js 15 + TypeScript   public site + three portals
apps/api     NestJS                    /api/v1 auth, exams, sessions, proctoring, results
packages/shared                        roles, routes, proctoring event types
```

Main flows live in:

| Flow | Backend | Frontend |
| --- | --- | --- |
| Login / roles | `apps/api/src/auth` | `apps/web/app/student/login`, `company/login` |
| Question bank & exam builder | `apps/api/src/catalog/catalog.controller.ts` | `apps/web/app/admin/questions`, `exams`, `assignments` |
| Staff start, attempt, autosave, submit | `apps/api/src/engine` | `apps/web/app/staff/exams/[id]/lobby`, `apps/web/app/student/exams/[id]/*` |
| Three-warning policy | `apps/api/src/proctoring/proctoring.service.ts` | live exam bar + staff monitoring |
| Approve / publish results | `apps/api/src/results/results.controller.ts` | `apps/web/app/admin/results` |
| Schema | `apps/api/prisma/schema.prisma` | — |

AI camera **models are not bundled**. The attempt page sends structured events (tab blur, plus simulate buttons for gaze/phone). Plug a detector into `POST /api/v1/exam-sessions/:id/proctoring-events`. The policy engine already deduplicates, applies cooldowns, and opens a human-review incident on the third warning.

Coding execution is scaffolded (`RunnerJob` in Prisma) and must stay **out of the API process**.

## How to run

Requirements: Node.js 20+, Docker Desktop (Postgres + Redis), Git.

```bash
cd kaizentrix-exam-portal
copy .env.example apps\api\.env
copy .env.example apps\web\.env.local
docker compose up -d
npm install
npx prisma migrate dev --schema apps/api/prisma/schema.prisma --name init
npm run db:seed
npm run dev
```

- Website: http://localhost:3000
- API: http://localhost:4000/api/v1

Seeded accounts (password `ChangeMe_123`):

- `admin@kaizentrix.com` — Master Admin
- `staff@kaizentrix.com` — Staff
- `student@kaizentrix.com` — Student, assigned to **Graduate Aptitude Screen 2026**

Walkthrough: company login → staff lobby → **Authorized start** → student login → readiness → consent → lobby → attempt.

## First change to make

Start in `apps/api/src/proctoring/proctoring.service.ts` (warning thresholds) or `apps/web/app/globals.css` (brand tokens). Do not put exam deadlines or scoring only in the browser — those belong in `apps/api/src/engine/engine.service.ts`.




powershell


npm.cmd run dev -w web
Then open http://localhost:3000 in your browser:

Role	Login Route	Email	Password
Candidate	/student/login	student@kaizentrix.com	ChangeMe_123
Staff Invigilator	/company/login	staff@kaizentrix.com	ChangeMe_123
Master Admin	/company/login	admin@kaizentrix.com	ChangeMe_123


The production build has completed successfully and the application is running live:

Production Server Status
Status: Live and serving requests on http://localhost:3000
Mode: Optimized Next.js 15.5 Production Server (next start --port 3000)
Verified Routes:
HTTP 200 Home Portal (/)
HTTP 200 Student Intake & Login (/student/login)
HTTP 200 Admin & Invigilator Login (/company/login)
HTTP 200 Master Admin Dashboard (/admin/dashboard)
HTTP 200 Candidate Management & Excel Download (/admin/students)
HTTP 200 Staff Attendance Roster & Excel Download (/staff/candidates)
HTTP 200 Instructions (/instructions) & About (/about)
HTTP 404 Custom Security 404 (/_not-found)

