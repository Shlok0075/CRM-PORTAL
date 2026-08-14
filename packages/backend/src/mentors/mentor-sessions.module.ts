import { Module } from '@nestjs/common'
import { MentorSessionsController } from './mentor-sessions.controller'
import { MentorSessionsService } from './mentor-sessions.service'
import { PrismaService } from '../prisma.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [MentorSessionsController],
  providers: [MentorSessionsService, PrismaService],
})
export class MentorSessionsModule {}
