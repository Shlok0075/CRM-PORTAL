import { Module } from '@nestjs/common'
import { DocumentsService } from './documents.service'
import { DocumentsController } from './documents.controller'
import { DocumentInOutService } from './document-in-out.service'
import { DocumentInOutController } from './document-in-out.controller'
import { PrismaService } from '../prisma.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [DocumentsController, DocumentInOutController],
  providers: [DocumentsService, DocumentInOutService, PrismaService],
})
export class DocumentsModule {}
