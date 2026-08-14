import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class DocumentInOutService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, data: any) {
    return this.prisma.documentInOutLog.create({ data: { ...data, org: { connect: { id: orgId } } } })
  }

  async list(orgId: string, filters: { clientId?: string; direction?: string; status?: string; returnable?: string; from?: string; to?: string }) {
    const where: any = { orgId }

    if (filters.clientId) where.clientId = filters.clientId
    if (filters.direction) where.direction = filters.direction
    if (filters.status) where.status = filters.status
    if (filters.returnable !== undefined) where.returnable = filters.returnable === 'true'
    if (filters.from || filters.to) {
      where.date = {}
      if (filters.from) where.date.gte = new Date(filters.from)
      if (filters.to) where.date.lte = new Date(filters.to)
    }

    return this.prisma.documentInOutLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { name: true } } },
    })
  }

  async outstandingReturnables(orgId: string) {
    return this.prisma.documentInOutLog.findMany({
      where: { orgId, returnable: true, status: { not: 'returned' } },
      orderBy: { date: 'asc' },
      include: { client: { select: { name: true } } },
    })
  }

  async get(orgId: string, id: string) {
    return this.prisma.documentInOutLog.findFirst({ where: { id, orgId }, include: { client: { select: { name: true } } } })
  }

  async update(orgId: string, id: string, data: any) {
    const existing = await this.prisma.documentInOutLog.findFirst({ where: { id, orgId } })
    if (!existing) return null
    return this.prisma.documentInOutLog.update({ where: { id }, data })
  }

  async remove(orgId: string, id: string) {
    const existing = await this.prisma.documentInOutLog.findFirst({ where: { id, orgId } })
    if (!existing) return null
    return this.prisma.documentInOutLog.delete({ where: { id } })
  }
}
