import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async list(orgId: string, userId: string) {
    return this.prisma.notification.findMany({
      where: { orgId, userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  async markRead(orgId: string, id: string, userId: string) {
    const n = await this.prisma.notification.findFirst({ where: { id, orgId } })
    if (!n) throw new BadRequestException('Notification not found')
    if (n.userId !== userId) throw new BadRequestException('Forbidden')
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } })
  }

  async markAllRead(orgId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { orgId, userId, readAt: null },
      data: { readAt: new Date() },
    })
    return { success: true }
  }

  async unreadCount(orgId: string, userId: string) {
    return this.prisma.notification.count({
      where: { orgId, userId, readAt: null },
    })
  }

  async create(orgId: string, userId: string, type: string, payload: any) {
    return this.prisma.notification.create({
      data: {
        org: { connect: { id: orgId } },
        user: { connect: { id: userId } },
        type,
        payload: JSON.stringify(payload),
      },
    })
  }
}
