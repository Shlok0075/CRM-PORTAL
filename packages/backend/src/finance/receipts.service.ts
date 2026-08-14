import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class ReceiptsService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: any) {
    const cleaned = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== null && v !== undefined))
    const data: any = {
      ...cleaned,
      organizationId: orgId,
      date: cleaned.date ? new Date(cleaned.date) : new Date(),
    }
    return this.prisma.receipt.create({ data, include: { client: true, invoice: true } })
  }

  async findAll(orgId: string, query: any) {
    const where: any = { organizationId: orgId }
    if (query.clientId) where.clientId = query.clientId
    if (query.invoiceId) where.invoiceId = query.invoiceId
    if (query.mode) where.mode = query.mode

    return this.prisma.receipt.findMany({
      where,
      include: { client: true, invoice: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const receipt = await this.prisma.receipt.findUnique({ where: { id }, include: { client: true, invoice: true } })
    if (!receipt) throw new NotFoundException('Receipt not found')
    return receipt
  }
}
