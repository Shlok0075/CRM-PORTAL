import { Module } from '@nestjs/common'
import { MentorsService } from './mentors.service'
import { MentorsController } from './mentors.controller'
import { PrismaService } from '../prisma.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [MentorsController],
  providers: [MentorsService, PrismaService],
})
export class MentorsModule {}
