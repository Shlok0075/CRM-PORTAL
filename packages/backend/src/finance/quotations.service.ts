import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: any) {
    const data: any = {
      org: { connect: { id: orgId } },
      lineItems: JSON.stringify(dto.lineItems || []),
      status: 'draft',
    }
    if (dto.clientId) {
      data.client = { connect: { id: dto.clientId } }
    }
    return this.prisma.quotation.create({
      data,
      include: { client: true },
    })
  }

  async findAll(orgId: string, query: any) {
    const where: any = { orgId }
    if (query.clientId) where.clientId = query.clientId
    if (query.status) where.status = query.status

    return this.prisma.quotation.findMany({
      where,
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const q = await this.prisma.quotation.findUnique({ where: { id }, include: { client: true } })
    if (!q) throw new NotFoundException('Quotation not found')
    return { ...q, lineItems: q.lineItems ? JSON.parse(q.lineItems) : [] }
  }

  async update(id: string, dto: any) {
    const updateData: any = { ...dto }
    if (dto.lineItems) {
      updateData.lineItems = JSON.stringify(dto.lineItems)
    }
    return this.prisma.quotation.update({ where: { id }, data: updateData, include: { client: true } })
  }

  async remove(id: string) {
    return this.prisma.quotation.delete({ where: { id } })
  }
}
