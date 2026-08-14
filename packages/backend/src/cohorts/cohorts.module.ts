import { Module } from '@nestjs/common'
import { CohortsService } from './cohorts.service'
import { CohortsController } from './cohorts.controller'
import { PrismaService } from '../prisma.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [CohortsController],
  providers: [CohortsService, PrismaService],
})
export class CohortsModule {}
