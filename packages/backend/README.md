Backend (NestJS + Prisma)

This is the Sprint 1 scaffold for the backend API (auth, prisma, RBAC stub).

Setup (local dev):
1. From repo root: pnpm install
2. Start local Postgres (see packages/infra/docker-compose.yml) or set DATABASE_URL in packages/backend/.env
3. From packages/backend:
   - pnpm run prisma:generate
   - pnpm run prisma:migrate -- --name init
   - pnpm run prisma:seed
   - pnpm run dev

Endpoints added in Sprint 1:
- POST /api/auth/login  { email, password } → { accessToken }
- POST /api/auth/otp/request { email } → stub
- POST /api/auth/otp/verify { email, code } → stub

Notes:
- JWT_SECRET must be set in .env for production use.
- The seed creates an org and an admin user: admin@startupgo.local / adminpass (local only)
