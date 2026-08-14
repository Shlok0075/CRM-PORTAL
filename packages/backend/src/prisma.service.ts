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
      throw err
    }

    try {
      const tables = await this.$queryRaw<any[]>`
        SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
      `
      const tableNames = tables.map(t => t.table_name)
      console.log('[DB] ensureDatabase: existing tables:', tableNames)

      if (!tableNames.includes('User')) {
        console.log('[DB] ensureDatabase: User table missing, running db push')
        const { execSync } = await import('child_process')
        try {
          const out = execSync('npx prisma db push', { encoding: 'utf8', cwd: process.cwd() })
          console.log('[DB] ensureDatabase: db push output:', out)
        } catch (err: any) {
          console.error('[DB] ensureDatabase: db push failed:', err?.stderr || err?.message || err)
          throw err
        }
      } else {
        console.log('[DB] ensureDatabase: tables already exist, skipping db push')
      }
    } catch (err) {
      console.error('[DB] ensureDatabase: failed', err)
      throw err
    }
  }

  async ensureSeed() {
    console.log('[DB] ensureSeed: starting')
    try {
      const admin = await this.user.findFirst({ where: { email: 'admin@ca-firm.local' }, select: { id: true } })
      if (!admin) {
        console.log('[DB] ensureSeed: admin user missing, running seed')
        const { execSync } = await import('child_process')
        try {
          const out = execSync('npx ts-node --transpile-only prisma/seed.ts', { encoding: 'utf8', cwd: process.cwd() })
          console.log('[DB] ensureSeed: output:', out)
        } catch (err: any) {
          console.error('[DB] ensureSeed: seed failed:', err?.stderr || err?.message || err)
          throw err
        }
      } else {
        console.log('[DB] ensureSeed: admin user exists, skipping seed')
      }
    } catch (err) {
      console.error('[DB] ensureSeed: failed', err)
      throw err
    }
  }
}
