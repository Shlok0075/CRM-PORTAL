import { Controller, Get, Req, UseGuards, Query, Param, Post, Body, Patch, Delete } from '@nestjs/common'
import { JwtGuard } from '../auth/jwt.guard'
import { PrismaService } from '../prisma.service'

@Controller('portal')
@UseGuards(JwtGuard)
export class PortalController {
  constructor(private prisma: PrismaService) {}

  private user(req: any) { return req.user }

  @Get('me')
  async me(@Req() req: any) {
    const u = this.user(req)
    if (u.roleType === 'client') {
      const client = await this.prisma.client.findFirst({ where: { id: u.sub }, select: { id: true, name: true, pan: true, gstins: true, type: true, contactInfo: true, status: true, orgId: true } })
      return { ...u, profile: client }
    }
    const user = await this.prisma.user.findFirst({ where: { id: u.sub }, select: { id: true, name: true, email: true, phone: true, designation: true, role: true, orgId: true } })
    return { ...u, profile: user }
  }

  @Get('my-tasks')
  async myTasks(@Req() req: any, @Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const u = this.user(req)
    const orgId = u.orgId
    const where: any = { orgId }
    if (u.roleType === 'client') {
      where.clientId = u.sub
    } else if (u.roleType === 'employee') {
      where.assigneeIds = { contains: u.sub }
    }
    if (status) where.status = status
    const pageNum = page ? parseInt(page, 10) : 1
    const limitNum = limit ? parseInt(limit, 10) : 20
    const skip = (pageNum - 1) * limitNum
    const [items, total] = await Promise.all([
      this.prisma.task.findMany({ where, skip, take: limitNum, orderBy: { createdAt: 'desc' }, include: { client: { select: { name: true } } } }),
      this.prisma.task.count({ where }),
    ])
    return { items, total, page: pageNum, limit: limitNum }
  }

  @Get('my-tasks/:id')
  async myTask(@Req() req: any, @Param('id') id: string) {
    const u = this.user(req)
    const where: any = { id, orgId: u.orgId }
    if (u.roleType === 'client') where.clientId = u.sub
    if (u.roleType === 'employee') where.assigneeIds = { contains: u.sub }
    const task = await this.prisma.task.findFirst({ where, include: { client: { select: { name: true } }, checklistItems: true, subtasks: true, notes: { include: { author: { select: { name: true } } } } } })
    if (!task) return null
    return task
  }

  @Get('my-invoices')
  async myInvoices(@Req() req: any, @Query('status') status?: string) {
    const u = this.user(req)
    const where: any = { orgId: u.orgId }
    if (u.roleType === 'client') {
      where.clientId = u.sub
    }
    if (status) where.status = status
    return this.prisma.invoice.findMany({ where, include: { client: { select: { name: true } }, lineItemsList: true, creditNotes: true, receipts: true }, orderBy: { createdAt: 'desc' } })
  }

  @Get('my-documents')
  async myDocuments(@Req() req: any, @Query('category') category?: string) {
    const u = this.user(req)
    const where: any = { orgId: u.orgId }
    if (u.roleType === 'client') {
      where.clientId = u.sub
    }
    if (category) where.category = category
    return this.prisma.document.findMany({ where, orderBy: { createdAt: 'desc' } })
  }

  @Post('upload-document')
  async uploadDocument(@Req() req: any, @Body() body: any) {
    const u = this.user(req)
    const data: any = {
      orgId: u.orgId,
      category: body.category || 'Other',
      fileUrl: body.fileUrl,
      fileName: body.fileName,
      fileType: body.fileType,
      fileSize: body.fileSize,
      uploadedBy: u.sub,
      uploadedByType: u.roleType === 'client' ? 'client' : 'staff',
      version: 1,
    }
    if (u.roleType === 'client') {
      data.clientId = u.sub
    } else if (body.clientId) {
      data.clientId = body.clientId
    }
    if (body.taskId) data.taskId = body.taskId
    if (body.eventId) data.eventId = body.eventId
    return this.prisma.document.create({ data })
  }

  @Get('my-timesheet')
  async myTimesheet(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    const u = this.user(req)
    if (u.roleType !== 'employee') {
      return []
    }
    const where: any = { userId: u.sub }
    if (from || to) {
      where.startTime = {}
      if (from) where.startTime.gte = new Date(from)
      if (to) where.startTime.lte = new Date(to)
    }
    return this.prisma.taskTimeLog.findMany({ where, include: { task: { select: { id: true, title: true } } }, orderBy: { startTime: 'desc' } })
  }

  @Get('my-attendance')
  async myAttendance(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    const u = this.user(req)
    if (u.roleType !== 'employee') {
      return []
    }
    const where: any = { userId: u.sub }
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to)
    }
    return this.prisma.attendance.findMany({ where, orderBy: { date: 'desc' } })
  }

  @Post('my-attendance')
  async markMyAttendance(@Req() req: any, @Body() body: any) {
    const u = this.user(req)
    if (u.roleType !== 'employee') {
      throw new Error('Only employees can mark attendance')
    }
    const date = new Date(body.date)
    const inTime = body.inTime ? new Date(`${body.date}T${body.inTime}`) : null
    const outTime = body.outTime ? new Date(`${body.date}T${body.outTime}`) : null
    return this.prisma.attendance.upsert({
      where: { userId_date: { userId: u.sub, date } },
      update: { inTime, outTime, status: body.status || 'present' },
      create: { orgId: u.orgId, userId: u.sub, date, inTime, outTime, status: body.status || 'present' },
    })
  }

  @Get('dashboard')
  async portalDashboard(@Req() req: any) {
    const u = this.user(req)
    const orgId = u.orgId

    if (u.roleType === 'admin') {
      const [totalClients, totalTasks, totalInvoices, tasksByStatus, recentTasks, recentInvoices, upcomingCompliance] = await Promise.all([
        this.prisma.client.count({ where: { orgId } }),
        this.prisma.task.count({ where: { orgId } }),
        this.prisma.invoice.count({ where: { orgId } }),
        this.prisma.task.groupBy({ by: ['status'], where: { orgId }, _count: { status: true } }),
        this.prisma.task.findMany({ where: { orgId }, take: 5, orderBy: { createdAt: 'desc' }, include: { client: { select: { name: true } } } }),
        this.prisma.invoice.findMany({ where: { orgId }, take: 5, orderBy: { createdAt: 'desc' }, include: { client: { select: { name: true } } } }),
        this.prisma.complianceCalendarEntry.findMany({ where: { orgId }, take: 5, orderBy: { name: 'asc' } }),
      ])
      return { roleType: 'admin', totalClients, totalTasks, totalInvoices, tasksByStatus, recentTasks, recentInvoices, upcomingCompliance }
    }

    if (u.roleType === 'employee') {
      const myTaskWhere = { orgId, assigneeIds: { contains: u.sub } }
      const [totalTasks, pendingTasks, inProgressTasks, completedTasks, overdueTasks, recentTasks] = await Promise.all([
        this.prisma.task.count({ where: myTaskWhere }),
        this.prisma.task.count({ where: { ...myTaskWhere, status: 'pending' } }),
        this.prisma.task.count({ where: { ...myTaskWhere, status: 'in_progress' } }),
        this.prisma.task.count({ where: { ...myTaskWhere, status: { in: ['completed', 'verified'] } } }),
        this.prisma.task.count({ where: { ...myTaskWhere, isOverdue: true } }),
        this.prisma.task.findMany({ where: myTaskWhere, take: 5, orderBy: { createdAt: 'desc' }, include: { client: { select: { name: true } } } }),
      ])
      return { roleType: 'employee', totalTasks, pendingTasks, inProgressTasks, completedTasks, overdueTasks, recentTasks }
    }

    if (u.roleType === 'client') {
      const clientWhere = { orgId, clientId: u.sub }
      const [totalTasks, pendingTasks, totalInvoices, outstandingAmount, recentTasks, recentInvoices] = await Promise.all([
        this.prisma.task.count({ where: { orgId, clientId: u.sub } }),
        this.prisma.task.count({ where: { orgId, clientId: u.sub, status: { in: ['pending', 'in_progress'] } } }),
        this.prisma.invoice.count({ where: { orgId, clientId: u.sub } }),
        this.prisma.invoice.findMany({ where: { orgId, clientId: u.sub }, include: { receipts: true } }),
        this.prisma.task.findMany({ where: { orgId, clientId: u.sub }, take: 5, orderBy: { createdAt: 'desc' } }),
        this.prisma.invoice.findMany({ where: { orgId, clientId: u.sub }, take: 5, orderBy: { createdAt: 'desc' } }),
      ])
      const outstanding = recentInvoices.reduce((sum: number, inv: any) => {
        const paid = (inv.receipts || []).reduce((s: number, r: any) => s + (r.amount || 0), 0)
        return sum + Math.max(0, (inv.total || 0) - paid)
      }, 0)
      return { roleType: 'client', totalTasks, pendingTasks, totalInvoices, outstandingAmount: outstanding, recentTasks, recentInvoices }
    }

    return { roleType: 'unknown' }
  }
}
