import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: any) {
    return this.prisma.expense.create({
      data: {
        org: { connect: { id: orgId } },
        clientId: dto.clientId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        isBillable: dto.isBillable || false,
        description: dto.description,
        date: dto.date ? new Date(dto.date) : new Date(),
        attachmentId: dto.attachmentId,
      },
      include: { client: true, category: true },
    })
  }

  async findAll(orgId: string, query: any) {
    const where: any = { orgId }
    if (query.clientId) where.clientId = query.clientId
    if (query.categoryId) where.categoryId = query.categoryId
    if (query.isBillable !== undefined) where.isBillable = query.isBillable
    if (query.fromDate || query.toDate) {
      where.date = {}
      if (query.fromDate) where.date.gte = new Date(query.fromDate)
      if (query.toDate) where.date.lte = new Date(query.toDate)
    }

    return this.prisma.expense.findMany({
      where,
      include: { client: true, category: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id }, include: { client: true, category: true } })
    if (!expense) throw new NotFoundException('Expense not found')
    return expense
  }

  async update(id: string, dto: any) {
    const data: any = { ...dto }
    if (dto.date) data.date = new Date(dto.date)
    return this.prisma.expense.update({ where: { id }, data, include: { client: true, category: true } })
  }

  async remove(id: string) {
    return this.prisma.expense.delete({ where: { id } })
  }

  async createCategory(orgId: string, dto: { name: string }) {
    return this.prisma.expenseCategory.create({ data: { org: { connect: { id: orgId } }, name: dto.name } })
  }

  async findCategories(orgId: string) {
    return this.prisma.expenseCategory.findMany({ where: { orgId }, include: { expenses: true } })
  }

  async deleteCategory(id: string) {
    return this.prisma.expenseCategory.delete({ where: { id } })
  }

  async expenseSummary(orgId: string, query: any) {
    const where: any = { orgId }
    if (query.categoryId) where.categoryId = query.categoryId
    if (query.clientId) where.clientId = query.clientId
    if (query.isBillable !== undefined) where.isBillable = query.isBillable
    if (query.fromDate || query.toDate) {
      where.date = {}
      if (query.fromDate) where.date.gte = new Date(query.fromDate)
      if (query.toDate) where.date.lte = new Date(query.toDate)
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      include: { category: true, client: true },
    })

    const total = expenses.reduce((sum, e) => sum + e.amount, 0)
    const billable = expenses.filter((e) => e.isBillable).reduce((sum, e) => sum + e.amount, 0)
    const nonBillable = total - billable

    const byCategory = new Map<string, { categoryId: string; categoryName: string; total: number }>()
    expenses.forEach((e) => {
      const key = e.categoryId || 'uncategorized'
      const name = e.category?.name || 'Uncategorized'
      if (!byCategory.has(key)) byCategory.set(key, { categoryId: key, categoryName: name, total: 0 })
      byCategory.get(key)!.total += e.amount
    })

    return { total, billable, nonBillable, byCategory: Array.from(byCategory.values()) }
  }
}
