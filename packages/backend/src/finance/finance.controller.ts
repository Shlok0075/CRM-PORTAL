import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query, Res, Header } from '@nestjs/common'
import { Response } from 'express'
import { InvoicesService } from './invoices.service'
import { ReceiptsService } from './receipts.service'
import { ExpensesService } from './expenses.service'
import { QuotationsService } from './quotations.service'
import { RetainersService } from './retainers.service'
import { CreateInvoiceDto } from './dto/create-invoice.dto'
import { CreateReceiptDto } from './dto/create-receipt.dto'
import { CreateExpenseDto } from './dto/create-expense.dto'
import { CreateQuotationDto } from './dto/create-quotation.dto'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('finance')
export class FinanceController {
  constructor(
    private readonly invoices: InvoicesService,
    private readonly receipts: ReceiptsService,
    private readonly expenses: ExpensesService,
    private readonly quotations: QuotationsService,
    private readonly retainers: RetainersService,
  ) {}

  @UseGuards(JwtGuard)
  @Post('invoices')
  async createInvoice(@Req() req: any, @Body() dto: CreateInvoiceDto) {
    return this.invoices.create(req.user?.orgId, dto)
  }

  @UseGuards(JwtGuard)
  @Get('invoices')
  async listInvoices(@Req() req: any, @Query() query: any) {
    return this.invoices.findAll(req.user?.orgId, query)
  }

  @UseGuards(JwtGuard)
  @Get('invoices/:id')
  async getInvoice(@Param('id') id: string) {
    return this.invoices.findOne(id)
  }

  @UseGuards(JwtGuard)
  @Patch('invoices/:id')
  async updateInvoice(@Param('id') id: string, @Body() dto: any) {
    return this.invoices.update(id, dto)
  }

  @UseGuards(JwtGuard)
  @Delete('invoices/:id')
  async deleteInvoice(@Param('id') id: string) {
    return this.invoices.remove(id)
  }

  @UseGuards(JwtGuard)
  @Post('invoices/:id/line-items')
  async addLineItem(@Param('id') id: string, @Body() dto: any) {
    return this.invoices.addLineItem(id, dto)
  }

  @UseGuards(JwtGuard)
  @Patch('invoices/line-items/:itemId')
  async updateLineItem(@Param('itemId') itemId: string, @Body() dto: any) {
    return this.invoices.updateLineItem(itemId, dto)
  }

  @UseGuards(JwtGuard)
  @Delete('invoices/line-items/:itemId')
  async deleteLineItem(@Param('itemId') itemId: string) {
    return this.invoices.deleteLineItem(itemId)
  }

  @UseGuards(JwtGuard)
  @Post('invoices/:id/credit-notes')
  async createCreditNote(@Param('id') id: string, @Body() dto: { amount: number; reason?: string }) {
    return this.invoices.createCreditNote(id, dto)
  }

  @UseGuards(JwtGuard)
  @Get('invoices/:id/credit-notes')
  async listCreditNotes(@Param('id') id: string) {
    return this.invoices.findCreditNotes(id)
  }

  @UseGuards(JwtGuard)
  @Post('receipts')
  async createReceipt(@Req() req: any, @Body() dto: CreateReceiptDto) {
    return this.receipts.create(req.user?.orgId, dto)
  }

  @UseGuards(JwtGuard)
  @Get('receipts')
  async listReceipts(@Req() req: any, @Query() query: any) {
    return this.receipts.findAll(req.user?.orgId, query)
  }

  @UseGuards(JwtGuard)
  @Get('receipts/:id')
  async getReceipt(@Param('id') id: string) {
    return this.receipts.findOne(id)
  }

  @UseGuards(JwtGuard)
  @Post('expenses')
  async createExpense(@Req() req: any, @Body() dto: CreateExpenseDto) {
    return this.expenses.create(req.user?.orgId, dto)
  }

  @UseGuards(JwtGuard)
  @Get('expenses')
  async listExpenses(@Req() req: any, @Query() query: any) {
    return this.expenses.findAll(req.user?.orgId, query)
  }

  @UseGuards(JwtGuard)
  @Get('expenses/:id')
  async getExpense(@Param('id') id: string) {
    return this.expenses.findOne(id)
  }

  @UseGuards(JwtGuard)
  @Patch('expenses/:id')
  async updateExpense(@Param('id') id: string, @Body() dto: any) {
    return this.expenses.update(id, dto)
  }

  @UseGuards(JwtGuard)
  @Delete('expenses/:id')
  async deleteExpense(@Param('id') id: string) {
    return this.expenses.remove(id)
  }

  @UseGuards(JwtGuard)
  @Post('expense-categories')
  async createExpenseCategory(@Req() req: any, @Body() dto: { name: string }) {
    return this.expenses.createCategory(req.user?.orgId, dto)
  }

  @UseGuards(JwtGuard)
  @Get('expense-categories')
  async listExpenseCategories(@Req() req: any) {
    return this.expenses.findCategories(req.user?.orgId)
  }

  @UseGuards(JwtGuard)
  @Delete('expense-categories/:id')
  async deleteExpenseCategory(@Param('id') id: string) {
    return this.expenses.deleteCategory(id)
  }

  @UseGuards(JwtGuard)
  @Post('quotations')
  async createQuotation(@Req() req: any, @Body() dto: CreateQuotationDto) {
    return this.quotations.create(req.user?.orgId, dto)
  }

  @UseGuards(JwtGuard)
  @Get('quotations')
  async listQuotations(@Req() req: any, @Query() query: any) {
    return this.quotations.findAll(req.user?.orgId, query)
  }

  @UseGuards(JwtGuard)
  @Get('quotations/:id')
  async getQuotation(@Param('id') id: string) {
    return this.quotations.findOne(id)
  }

  @UseGuards(JwtGuard)
  @Patch('quotations/:id')
  async updateQuotation(@Param('id') id: string, @Body() dto: any) {
    return this.quotations.update(id, dto)
  }

  @UseGuards(JwtGuard)
  @Delete('quotations/:id')
  async deleteQuotation(@Param('id') id: string) {
    return this.quotations.remove(id)
  }

  @UseGuards(JwtGuard)
  @Post('retainers')
  async createRetainer(@Req() req: any, @Body() dto: any) {
    return this.retainers.create(req.user?.orgId, dto)
  }

  @UseGuards(JwtGuard)
  @Get('retainers')
  async listRetainers(@Req() req: any, @Query() query: any) {
    return this.retainers.findAll(req.user?.orgId, query)
  }

  @UseGuards(JwtGuard)
  @Get('retainers/:id')
  async getRetainer(@Param('id') id: string) {
    return this.retainers.findOne(id)
  }

  @UseGuards(JwtGuard)
  @Patch('retainers/:id')
  async updateRetainer(@Param('id') id: string, @Body() dto: any) {
    return this.retainers.update(id, dto)
  }

  @UseGuards(JwtGuard)
  @Delete('retainers/:id')
  async deleteRetainer(@Param('id') id: string) {
    return this.retainers.remove(id)
  }

  @UseGuards(JwtGuard)
  @Post('billing-profiles')
  async createBillingProfile(@Req() req: any, @Body() dto: { name: string; clientIds: string[] }) {
    return this.invoices.createBillingProfile(req.user?.orgId, dto)
  }

  @UseGuards(JwtGuard)
  @Get('billing-profiles')
  async listBillingProfiles(@Req() req: any) {
    return this.invoices.findBillingProfiles(req.user?.orgId)
  }

  @UseGuards(JwtGuard)
  @Get('billing-profiles/:id')
  async getBillingProfile(@Param('id') id: string) {
    return this.invoices.findBillingProfile(id)
  }

  @UseGuards(JwtGuard)
  @Patch('billing-profiles/:id')
  async updateBillingProfile(@Param('id') id: string, @Body() dto: { name?: string; clientIds?: string[] }) {
    return this.invoices.updateBillingProfile(id, dto)
  }

  @UseGuards(JwtGuard)
  @Delete('billing-profiles/:id')
  async deleteBillingProfile(@Param('id') id: string) {
    return this.invoices.deleteBillingProfile(id)
  }

  @UseGuards(JwtGuard)
  @Get('reports/outstanding')
  async outstandingBalances(@Req() req: any) {
    return this.invoices.outstandingBalances(req.user?.orgId)
  }

  @UseGuards(JwtGuard)
  @Get('reports/revenue')
  async revenueByClient(@Req() req: any, @Query() query: any) {
    return this.invoices.revenueByClient(req.user?.orgId, query)
  }

  @UseGuards(JwtGuard)
  @Get('reports/expenses')
  async expenseSummary(@Req() req: any, @Query() query: any) {
    return this.expenses.expenseSummary(req.user?.orgId, query)
  }

  @UseGuards(JwtGuard)
  @Get('export/invoices/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=invoices.csv')
  async exportInvoicesCsv(@Req() req: any, @Res() res: Response) {
    const csv = await this.invoices.exportInvoicesCsv(req.user?.orgId)
    res.send(csv)
  }

  @UseGuards(JwtGuard)
  @Get('export/invoices/tally-xml')
  @Header('Content-Type', 'application/xml')
  @Header('Content-Disposition', 'attachment; filename=tally-export.xml')
  async exportInvoicesTallyXml(@Req() req: any, @Res() res: Response) {
    const xml = await this.invoices.exportInvoicesTallyXml(req.user?.orgId)
    res.send(xml)
  }
}
