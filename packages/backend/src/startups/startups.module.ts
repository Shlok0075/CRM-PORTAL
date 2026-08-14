import { Module } from '@nestjs/common'
import { StartupsService } from './startups.service'
import { StartupsController } from './startups.controller'
import { PrismaService } from '../prisma.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [StartupsController],
  providers: [StartupsService, PrismaService],
})
export class StartupsModule {}
