StartupGo — Project Scaffold (Complete)

This repository contains a scaffolded monorepo for the StartupGo CRM platform. The scaffold includes:

- packages/backend — NestJS API with Prisma schema, auth, users, applications, startups modules, Dockerfiles, and seed script.
- packages/admin — React + Vite admin app with Tailwind and basic pages (Applications list).
- packages/founder — Next.js founder portal with basic KPI checkin page.
- infra + docker-compose — Local Postgres and service definitions.
- CI workflow — GitHub Actions file to build packages.

How to run locally (developer machine):
1. Install dependencies at repo root (pnpm recommended), or run npm install in each package.
2. Start Postgres via docker compose: docker compose up -d
3. Create packages/backend/.env from .env.example and set DATABASE_URL and JWT_SECRET
4. From packages/backend:
   - npm install
   - npx prisma generate
   - npx prisma migrate dev --name init
   - npm run prisma:seed
   - npm run dev
5. Admin (packages/admin): npm install && npm run dev
6. Founder (packages/founder): npm install && npm run dev

Next steps:
- Implement remaining modules and UI per sprint plan. (Core modules now scaffolded: auth, users, applications, startups, tasks, mentors, documents, messages, reports.)
- Add tests, linting, and CI checks progressively.
- Run the scripts/setup-dev.ps1 locally to install dependencies and start services. The script attempts pnpm activation and generates Prisma client but cannot start Docker from this environment — run Docker Desktop or Docker Engine locally before running migrations.
