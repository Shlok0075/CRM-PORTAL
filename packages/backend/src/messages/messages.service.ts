import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async sendEmail(orgId: string, startupId: string | null, templateId: string, payload: any) {
    // Stub: In production send via SMTP or external provider
    return this.prisma.messageLog.create({ data: { org: { connect: { id: orgId } }, channel: 'email', templateId, status: 'queued', sentAt: new Date() } as any })
  }

  async listLogs(orgId: string) {
    return this.prisma.messageLog.findMany({ where: { orgId }, orderBy: { sentAt: 'desc' } })
  }
}
