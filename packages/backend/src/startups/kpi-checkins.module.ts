import { Module } from '@nestjs/common'
import { KpiCheckInsController } from './kpi-checkins.controller'
import { KpiCheckInsService } from './kpi-checkins.service'
import { PrismaService } from '../prisma.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [KpiCheckInsController],
  providers: [KpiCheckInsService, PrismaService],
})
export class KpiCheckInsModule {}
