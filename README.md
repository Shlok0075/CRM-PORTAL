StartupGo — Monorepo scaffold

This workspace contains a starter monorepo scaffold for the StartupGo CRM portal.

Structure:
- packages/backend — NestJS API (Prisma + PostgreSQL)
- packages/admin — React + Vite admin app (shadcn/ui + Tailwind)
- packages/founder — Next.js founder portal
- packages/infra — infra / docker / deployment helpers

Getting started (recommended):
1. Install pnpm: https://pnpm.io/
2. Run: pnpm install
3. Configure database (see packages/backend/.env.example)
4. From the root: pnpm --filter backend install && pnpm --filter backend dev

This scaffold contains minimal starter files and instructions. Use the project spec (STARTUPGO_CRM_SPEC.md) to continue implementation.
