Prisma migrations

This project uses Prisma for schema and migrations. Because generating and applying migrations requires a running Postgres DB, this folder contains the schema.prisma and a seed script.

To create and apply migrations locally:
1. Ensure Postgres is running and DATABASE_URL in packages/backend/.env points to it.
2. cd packages/backend
3. npx prisma migrate dev --name init
4. npx prisma generate
5. npm run prisma:seed

If you prefer to inspect the SQL for a migration without applying it, use prisma migrate diff against an empty DB.
