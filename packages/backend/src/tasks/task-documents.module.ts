import { Module } from '@nestjs/common'
import { TaskDocumentsService } from './task-documents.service'
import { TaskDocumentsController } from './task-documents.controller'
import { PrismaService } from '../prisma.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [TaskDocumentsController],
  providers: [TaskDocumentsService, PrismaService],
})
export class TaskDocumentsModule {}
