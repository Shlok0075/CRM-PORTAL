import { NestFactory } from '@nestjs/core'
import { Module } from '@nestjs/common'
import * as express from 'express'
import { PrismaService } from './prisma.service'
import { UsersModule } from './users/users.module'
import { AuthModule } from './auth/auth.module'
import { ApplicationsModule } from './applications/applications.module'
import { StartupsModule } from './startups/startups.module'
import { DocumentsModule } from './documents/documents.module'
import { MentorsModule } from './mentors/mentors.module'
import { MentorSessionsModule } from './mentors/mentor-sessions.module'
import { CohortsModule } from './cohorts/cohorts.module'
import { TasksModule } from './tasks/tasks.module'
import { TaskDocumentsModule } from './tasks/task-documents.module'
import { ComplianceModule } from './tasks/compliance.module'
import { ReportsModule } from './reports/reports.module'
import { MessagesModule } from './messages/messages.module'
import { CommunicationModule } from './communication/communication.module'
import { DashboardModule } from './dashboard/dashboard.module'
import { KpiCheckInsModule } from './startups/kpi-checkins.module'
import { ClientsModule } from './clients/clients.module'
import { FinanceModule } from './finance/finance.module'
import { EmployeesModule } from './employees/employees.module'
import { TodosModule } from './todos/todos.module'
import { EventsModule } from './events/events.module'
import { TemplatesModule } from './templates/templates.module'

@Module({
  imports: [
    UsersModule,
    AuthModule,
    ApplicationsModule,
    StartupsModule,
    DocumentsModule,
    MentorsModule,
    MentorSessionsModule,
    CohortsModule,
    TasksModule,
    TaskDocumentsModule,
    ComplianceModule,
    ReportsModule,
    MessagesModule,
    CommunicationModule,
    DashboardModule,
    KpiCheckInsModule,
    ClientsModule,
    FinanceModule,
    EmployeesModule,
    TodosModule,
    EventsModule,
    TemplatesModule,
  ],
  providers: [PrismaService],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')

  const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000']
  app.enableCors({ origin: allowedOrigins, credentials: true })

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.useGlobalPipes(new (require('@nestjs/common').ValidationPipe)({ transform: true }))

  const prisma = app.get(PrismaService)
  ;(prisma as any).enableShutdownHooks?.(app)

  try {
    await (prisma as any).ensureDatabase()
    await (prisma as any).ensureSeed()
  } catch (err) {
    console.error('[STARTUP] DB init failed (continuing to serve API):', err)
  }

  await app.listen(process.env.PORT || 4000)
  console.log('Backend listening on', process.env.PORT || 4000)
}
bootstrap()
