import { Module } from '@nestjs/common'
import { ClientsService } from './clients.service'
import { ClientsController } from './clients.controller'
import { PrismaService } from '../prisma.service'
import { AuthModule } from '../auth/auth.module'
import { JwtGuard } from '../auth/jwt.guard'

@Module({
  imports: [AuthModule],
  controllers: [ClientsController],
  providers: [ClientsService, PrismaService, JwtGuard],
})
export class ClientsModule {}
