import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(orgId: string) {
    const [
      totalClients,
      totalTasks,
      totalInvoices,
      tasksByStatus,
      recentTasks,
      recentInvoices,
      upcomingCompliance,
    ] = await Promise.all([
      this.prisma.client.count({ where: { orgId } }),
      this.prisma.task.count({ where: { orgId } }),
      this.prisma.invoice.count({ where: { orgId } }),
      this.prisma.task.groupBy({ by: ['status'], where: { orgId }, _count: { status: true } }),
      this.prisma.task.findMany({ where: { orgId }, take: 5, orderBy: { createdAt: 'desc' }, include: { client: { select: { name: true } } } }),
      this.prisma.invoice.findMany({ where: { orgId }, take: 5, orderBy: { createdAt: 'desc' }, include: { client: { select: { name: true } } } }),
      this.prisma.complianceCalendarEntry.findMany({ where: { orgId }, take: 5, orderBy: { name: 'asc' } }),
    ])

    return {
      totalClients,
      totalTasks,
      totalInvoices,
      tasksByStatus,
      recentTasks,
      recentInvoices,
      upcomingCompliance,
    }
  }
}
