import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect()
  }
  async onModuleDestroy() {
    await this.$disconnect()
  }

  async ensureDatabase() {
    console.log('[DB] ensureDatabase: starting')
    try {
      await this.$queryRaw`SELECT 1`
      console.log('[DB] ensureDatabase: connection OK')
    } catch (err) {
      console.error('[DB] ensureDatabase: connection failed', err)
      return
    }

    const run = async (sql: string, label: string) => {
      try {
        await this.$executeRawUnsafe(sql)
        console.log('[DB] ensureDatabase: applied ->', label)
      } catch (err: any) {
        console.error('[DB] ensureDatabase: failed ->', label, err?.message || err)
      }
    }

    // Idempotent schema deltas (no shadow DB / migrations required)
    await run(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'member';`, 'User.role column')

    await run(
      `CREATE TABLE IF NOT EXISTS "Document" ("id" TEXT NOT NULL, "orgId" TEXT NOT NULL, "clientId" TEXT, "taskId" TEXT, "eventId" TEXT, "taskDocumentRequestId" TEXT, "category" TEXT NOT NULL, "fileUrl" TEXT NOT NULL, "fileName" TEXT, "fileType" TEXT, "fileSize" INTEGER, "version" INTEGER NOT NULL DEFAULT 1, "uploadedBy" TEXT, "uploadedByType" TEXT, "isPublic" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Document_pkey" PRIMARY KEY ("id"));`,
      'Document table ensure',
    )
    await run(`ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "eventId" TEXT;`, 'Document.eventId column')

    await run(
      `CREATE TABLE IF NOT EXISTS "Event" (
        "id" TEXT NOT NULL,
        "orgId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "clientId" TEXT,
        "assigneeIds" TEXT NOT NULL DEFAULT '[]',
        "status" TEXT NOT NULL DEFAULT 'pending',
        "priority" TEXT NOT NULL DEFAULT 'medium',
        "startDate" TIMESTAMP(3),
        "dueDate" TIMESTAMP(3),
        "expectedDate" TIMESTAMP(3),
        "createdById" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
      );`,
      'Event table',
    )
    await run(`CREATE INDEX IF NOT EXISTS "Event_orgId_idx" ON "Event"("orgId");`, 'Event orgId index')
    await run(`CREATE INDEX IF NOT EXISTS "Event_clientId_idx" ON "Event"("clientId");`, 'Event clientId index')
    await run(`CREATE INDEX IF NOT EXISTS "Event_createdById_idx" ON "Event"("createdById");`, 'Event createdById index')
    await run(`ALTER TABLE "Event" ADD CONSTRAINT "Event_org_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`, 'Event org FK')
    await run(`ALTER TABLE "Event" ADD CONSTRAINT "Event_client_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;`, 'Event client FK')
    await run(`ALTER TABLE "Event" ADD CONSTRAINT "Event_createdBy_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;`, 'Event createdBy FK')

    await run(
      `CREATE TABLE IF NOT EXISTS "AgreementTemplate" (
        "id" TEXT NOT NULL,
        "orgId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "AgreementTemplate_pkey" PRIMARY KEY ("id")
      );`,
      'AgreementTemplate table',
    )
    await run(`CREATE INDEX IF NOT EXISTS "AgreementTemplate_orgId_idx" ON "AgreementTemplate"("orgId");`, 'AgreementTemplate orgId index')
    await run(`ALTER TABLE "AgreementTemplate" ADD CONSTRAINT "AgreementTemplate_org_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`, 'AgreementTemplate org FK')

    await run(`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "hsnSac" TEXT;`, 'Invoice.hsnSac column')
    await run(`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "placeOfSupply" TEXT;`, 'Invoice.placeOfSupply column')

    console.log('[DB] ensureDatabase: schema sync complete')
  }

  async ensureSeed() {
    console.log('[DB] ensureSeed: starting')
    try {
      const admin = await this.user.findFirst({ where: { email: 'admin@ca-firm.local' }, select: { id: true, orgId: true } })
      if (!admin) {
        console.log('[DB] ensureSeed: admin user missing, running seed')
        const { execSync } = await import('child_process')
        try {
          const out = execSync('npx ts-node --transpile-only prisma/seed.ts', { encoding: 'utf8', cwd: process.cwd(), timeout: 120000 })
          console.log('[DB] ensureSeed: output:', out)
        } catch (err: any) {
          console.error('[DB] ensureSeed: seed failed (continuing):', err?.stderr || err?.message || err)
        }
      } else {
        await this.user.update({ where: { email: 'admin@ca-firm.local' }, data: { role: 'admin' } }).catch(() => {})
        console.log('[DB] ensureSeed: admin user exists, ensured admin role')
      }

      const employee = await this.user.findFirst({ where: { email: 'employee@ca-firm.local' }, select: { id: true } })
      if (!employee) {
        console.log('[DB] ensureSeed: employee user missing, creating')
        const { hash } = await import('bcryptjs')
        const employeeHash = await hash('employeepass', 10)
        await this.user.create({
          data: {
            org: { connect: { id: admin?.orgId || (await this.organization.findFirst())!.id } },
            email: 'employee@ca-firm.local',
            name: 'Rahul Sharma',
            passwordHash: employeeHash,
            role: 'member',
            designation: 'Senior Accountant',
            phone: '+919876543210',
            isActive: true,
          },
        }).catch((err: any) => console.error('[DB] ensureSeed: employee creation failed:', err?.message || err))
        console.log('[DB] ensureSeed: employee user created')
      } else {
        console.log('[DB] ensureSeed: employee user exists')
      }

      const clientsWithoutContact = await this.client.findMany({
        where: { orgId: admin?.orgId || (await this.organization.findFirst())!.id, contactInfo: null },
        select: { id: true, name: true },
      })
      for (const c of clientsWithoutContact) {
        const email = c.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '@example.com'
        await this.client.update({
          where: { id: c.id },
          data: { contactInfo: JSON.stringify({ email, phone: '', address: '' }) },
        }).catch((err: any) => console.error('[DB] ensureSeed: client contactInfo update failed:', err?.message || err))
        console.log(`[DB] ensureSeed: added contactInfo for client ${c.name}`)
      }
    } catch (err) {
      console.error('[DB] ensureSeed: failed', err)
    }
  }
}
