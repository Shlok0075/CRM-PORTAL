import { Module } from '@nestjs/common'
import { CommunicationService } from './communication.service'
import { CommunicationController } from './communication.controller'
import { PrismaService } from '../prisma.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [CommunicationController],
  providers: [CommunicationService, PrismaService],
})
export class CommunicationModule {}
