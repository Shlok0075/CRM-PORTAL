import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class RetainersService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: any) {
    return this.prisma.retainer.create({
      data: {
        org: { connect: { id: orgId } },
        clientId: dto.clientId,
        packageIds: JSON.stringify(dto.packageIds || []),
        totalAmount: dto.totalAmount,
        billingFrequency: dto.billingFrequency,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        autoRenew: dto.autoRenew || false,
        status: dto.status || 'active',
      },
      include: { client: true },
    })
  }

  async findAll(orgId: string, query: any) {
    const where: any = { orgId }
    if (query.clientId) where.clientId = query.clientId
    if (query.status) where.status = query.status

    return this.prisma.retainer.findMany({
      where,
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const ret = await this.prisma.retainer.findUnique({ where: { id }, include: { client: true } })
    if (!ret) throw new NotFoundException('Retainer not found')
    return { ...ret, packageIds: ret.packageIds ? JSON.parse(ret.packageIds) : [] }
  }

  async update(id: string, dto: any) {
    const data: any = { ...dto }
    if (dto.packageIds) data.packageIds = JSON.stringify(dto.packageIds)
    if (dto.startDate) data.startDate = new Date(dto.startDate)
    if (dto.endDate) data.endDate = new Date(dto.endDate)
    return this.prisma.retainer.update({ where: { id }, data, include: { client: true } })
  }

  async remove(id: string) {
    return this.prisma.retainer.delete({ where: { id } })
  }
}
