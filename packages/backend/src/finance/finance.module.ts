import { Module } from '@nestjs/common'
import { FinanceController } from './finance.controller'
import { InvoicesService } from './invoices.service'
import { ReceiptsService } from './receipts.service'
import { ExpensesService } from './expenses.service'
import { QuotationsService } from './quotations.service'
import { RetainersService } from './retainers.service'
import { PrismaService } from '../prisma.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [FinanceController],
  providers: [InvoicesService, ReceiptsService, ExpensesService, QuotationsService, RetainersService, PrismaService],
})
export class FinanceModule {}
