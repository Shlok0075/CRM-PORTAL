import { Module } from '@nestjs/common'
import { ComplianceService } from './compliance.service'
import { ComplianceController } from './compliance.controller'
import { PrismaService } from '../prisma.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [ComplianceController],
  providers: [ComplianceService, PrismaService],
})
export class ComplianceModule {}
