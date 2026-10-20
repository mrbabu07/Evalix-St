# Evalix

Evalix is a project submission and review dashboard. Students can create an account and submit one project; mentors can review a paginated queue, filter by server-side status, approve or reject work, and leave feedback.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS, and ShadCN-style UI primitives
- Express.js REST API with JWT authentication and role-based access control
- PostgreSQL with Prisma ORM
- Zod validation, bcrypt password hashing, Helmet, CORS, and rate limiting

## Project structure

```text
apps/
  api/    Express API, Prisma schema, seed script
  web/    Next.js frontend
```

## Run locally

Requirements: Node.js 20+, npm, Docker Desktop (or an existing PostgreSQL server).

1. Install packages:

   ```bash
   npm install
   ```

2. Create local environment files:

   ```powershell
   Copy-Item apps/api/.env.example apps/api/.env
   Copy-Item apps/web/.env.local.example apps/web/.env.local
   ```

3. Replace `JWT_SECRET` with a private random value of at least 32 characters. Change the seeded mentor password before any public deployment.

4. Start PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

5. Create the database schema and mentor account:

   ```bash
   npm run db:migrate -- --name init
   npm run db:seed
   ```

6. Start both applications:

   ```bash
   npm run dev
   ```

Open `http://localhost:3000`. The API health endpoint is `http://localhost:5000/api/health`.

## Important behavior

- Public signup always creates a `STUDENT`; mentor accounts are seeded server-side.
- JWTs are held in HTTP-only cookies rather than browser storage.
- Role checks run in Express before protected handlers.
- A database constraint permits one submission per student and prevents reused repository URLs.
- Input is validated in both the browser and API; database constraints remain the final safeguard.
- Filtering, pagination, and aggregate statistics are calculated on the server.
- Review status and optional feedback are written in one transaction.

## Useful commands

```bash
npm run dev
npm run type-check
npm run build
npm run db:generate
npm run db:migrate -- --name <migration-name>
npm run db:seed
```

## API overview

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | Public | Create student account |
| POST | `/api/auth/login` | Public | Sign in |
| POST | `/api/auth/logout` | Authenticated | Clear session |
| GET | `/api/auth/me` | Authenticated | Current user |
| POST | `/api/submissions` | Student | Create the student's only submission |
| GET | `/api/submissions/mine` | Student | Read own submission and feedback |
| PATCH | `/api/submissions/mine` | Student | Edit a pending submission |
| DELETE | `/api/submissions/mine` | Student | Withdraw a pending submission |
| GET | `/api/submissions` | Mentor | Paginated list with server-side status, search, and sorting |
| GET | `/api/submissions/stats` | Mentor | Aggregate status counts |
| PATCH | `/api/submissions/:id/status` | Mentor | Review and optionally add feedback |

## Deployment notes

Deploy the web and API services separately and use a managed PostgreSQL database. Set `WEB_ORIGIN` to the exact frontend origin and `NEXT_PUBLIC_API_URL` to the public API URL. Production cookies use `Secure` and `SameSite=None`, so both services must use HTTPS.
