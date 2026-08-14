import { Module } from '@nestjs/common'
import { TodosService } from './todos.service'
import { TodosController } from './todos.controller'
import { PrismaService } from '../prisma.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [TodosController],
  providers: [TodosService, PrismaService],
  exports: [TodosService],
})
export class TodosModule {}
