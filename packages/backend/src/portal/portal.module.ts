import { Module } from '@nestjs/common'
import { PortalController } from './portal.controller'
import { AuthModule } from '../auth/auth.module'
import { PrismaService } from '../prisma.service'

@Module({
  imports: [AuthModule],
  controllers: [PortalController],
  providers: [PrismaService],
})
export class PortalModule {}
