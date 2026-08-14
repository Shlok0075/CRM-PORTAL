import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class CommunicationService {
  constructor(private prisma: PrismaService) {}

  async createTemplate(orgId: string, data: { channel: string; name: string; body: string }) {
    return this.prisma.messageTemplate.create({ data: { ...data, org: { connect: { id: orgId } } } })
  }

  async listTemplates(orgId: string, channel?: string) {
    const where: any = { orgId }
    if (channel) where.channel = channel
    return this.prisma.messageTemplate.findMany({ where, orderBy: { createdAt: 'desc' } })
  }

  async getTemplate(orgId: string, id: string) {
    return this.prisma.messageTemplate.findFirst({ where: { id, orgId } })
  }

  async updateTemplate(orgId: string, id: string, data: any) {
    const existing = await this.prisma.messageTemplate.findFirst({ where: { id, orgId } })
    if (!existing) return null
    return this.prisma.messageTemplate.update({ where: { id }, data })
  }

  async deleteTemplate(orgId: string, id: string) {
    const existing = await this.prisma.messageTemplate.findFirst({ where: { id, orgId } })
    if (!existing) return null
    return this.prisma.messageTemplate.delete({ where: { id } })
  }

  async sendBulk(orgId: string, body: { clientIds: string[]; channel: string; templateId?: string; body?: string }) {
    const logs = []
    for (const clientId of body.clientIds) {
      logs.push(
        this.prisma.messageLog.create({
          data: {
            org: { connect: { id: orgId } },
            clientId,
            channel: body.channel,
            templateId: body.templateId,
            status: 'sent',
            sentAt: new Date(),
          } as any,
        }),
      )
    }
    return this.prisma.$transaction(logs)
  }

  async listLogs(orgId: string, filters: { clientId?: string; channel?: string; status?: string; from?: string; to?: string }) {
    const where: any = { orgId }

    if (filters.clientId) where.clientId = filters.clientId
    if (filters.channel) where.channel = filters.channel
    if (filters.status) where.status = filters.status
    if (filters.from || filters.to) {
      where.sentAt = {}
      if (filters.from) where.sentAt.gte = new Date(filters.from)
      if (filters.to) where.sentAt.lte = new Date(filters.to)
    }

    return this.prisma.messageLog.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      include: { client: { select: { name: true } }, template: { select: { name: true } } },
    })
  }
}
