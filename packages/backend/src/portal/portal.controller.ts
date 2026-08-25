import { Controller, Get, Req, UseGuards, Query, Param, Post, Body, Patch, Delete, BadRequestException, Res } from '@nestjs/common'
import { Response } from 'express'
import { JwtGuard } from '../auth/jwt.guard'
import { PrismaService } from '../prisma.service'
import * as XLSX from 'xlsx'

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
    const orgId = u.orgId
    const data: any = {
      orgId,
      category: body.category || 'Other',
      fileUrl: body.fileUrl,
      fileName: body.fileName,
      fileType: body.fileType,
      fileSize: body.fileSize,
      fileData: body.fileData,
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
    if (data.fileData) {
      const maxSize = 10 * 1024 * 1024
      if (data.fileSize && data.fileSize > maxSize) {
        throw new BadRequestException('File size exceeds 10MB limit')
      }
      const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/zip',
        'application/x-zip-compressed',
        'text/plain',
        'text/csv',
      ]
      if (data.fileType && !allowedTypes.includes(data.fileType)) {
        throw new BadRequestException(`File type ${data.fileType} is not allowed`)
      }
      return this.prisma.document.create({
        data: {
          org: { connect: { id: orgId } },
          fileName: data.fileName,
          fileType: data.fileType || 'application/octet-stream',
          fileSize: data.fileSize || 0,
          category: data.category,
          fileUrl: data.fileData,
          clientId: data.clientId as any,
          taskId: data.taskId as any,
          eventId: data.eventId as any,
          uploadedBy: data.uploadedBy,
          uploadedByType: data.uploadedByType || 'staff',
          isPublic: false,
        },
      } as any)
    }
    return this.prisma.document.create({ data: { ...data, org: { connect: { id: orgId } } } } as any)
  }

  @Get('my-timesheet')
  async myTimesheet(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    const u = this.user(req)
    if (u.roleType !== 'employee') {
      return []
    }
    const where: any = { userId: u.sub, orgId: u.orgId }
    if (from || to) {
      where.startTime = {}
      if (from) where.startTime.gte = new Date(from)
      if (to) where.startTime.lte = new Date(to)
    }
    return this.prisma.taskTimeLog.findMany({ where, include: { task: { select: { id: true, title: true } } }, orderBy: { startTime: 'desc' } })
  }

  @Post('my-timesheet')
  async createMyTimesheet(@Req() req: any, @Body() body: any) {
    const u = this.user(req)
    if (u.roleType !== 'employee') {
      throw new Error('Only employees can create timesheet entries')
    }
    const data: any = {
      org: { connect: { id: u.orgId } },
      userId: u.sub,
      startTime: new Date(body.startTime),
      description: body.description || 'Manual entry',
    }
    if (body.endTime) data.endTime = new Date(body.endTime)
    if (body.durationMinutes) data.durationMinutes = Number(body.durationMinutes)
    else if (body.endTime) data.durationMinutes = Math.round((new Date(body.endTime).getTime() - new Date(body.startTime).getTime()) / 60000)
    return this.prisma.taskTimeLog.create({ data: data as any })
  }

  @Patch('my-timesheet/:id')
  async updateMyTimesheet(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const u = this.user(req)
    if (u.roleType !== 'employee') {
      throw new Error('Only employees can update timesheet entries')
    }
    const log = await this.prisma.taskTimeLog.findFirst({ where: { id, userId: u.sub, orgId: u.orgId } })
    if (!log) throw new Error('Timesheet entry not found')
    const data: any = {}
    if (body.startTime) data.startTime = new Date(body.startTime)
    if (body.endTime) data.endTime = new Date(body.endTime)
    if (body.description !== undefined) data.description = body.description
    if (body.durationMinutes !== undefined) data.durationMinutes = Number(body.durationMinutes)
    else if (body.endTime && data.startTime) data.durationMinutes = Math.round((new Date(body.endTime).getTime() - new Date(data.startTime || log.startTime).getTime()) / 60000)
    return this.prisma.taskTimeLog.update({ where: { id }, data })
  }

  @Delete('my-timesheet/:id')
  async deleteMyTimesheet(@Req() req: any, @Param('id') id: string) {
    const u = this.user(req)
    if (u.roleType !== 'employee') {
      throw new Error('Only employees can delete timesheet entries')
    }
    const log = await this.prisma.taskTimeLog.findFirst({ where: { id, userId: u.sub, orgId: u.orgId } })
    if (!log) throw new Error('Timesheet entry not found')
    await this.prisma.taskTimeLog.delete({ where: { id } })
    return { id }
  }

  @Get('my-timesheet/export')
  async myTimesheetExport(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string, @Res({ passthrough: true }) res?: Response) {
    const u = this.user(req)
    if (u.roleType !== 'employee') {
      throw new Error('Only employees can export timesheet')
    }
    const [logs, attendance] = await Promise.all([
      this.prisma.taskTimeLog.findMany({
        where: { userId: u.sub, orgId: u.orgId, ...(from || to ? { startTime: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}) },
        include: { task: { select: { id: true, title: true } } },
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.attendance.findMany({
        where: { userId: u.sub, orgId: u.orgId, ...(from || to ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}) },
        orderBy: { date: 'desc' },
      }),
    ])

    const timeRows = logs.map((l: any) => ({
      Type: 'Task Time Log',
      Description: l.task?.title || '-',
      'Start Time': l.startTime ? new Date(l.startTime).toLocaleString('en-IN') : '-',
      'End Time': l.endTime ? new Date(l.endTime).toLocaleString('en-IN') : '-',
      'Duration (min)': l.durationMinutes || 0,
    }))
    const attRows = attendance.map((r: any) => ({
      Type: 'Attendance',
      Description: r.status || '-',
      'Start Time': r.inTime ? new Date(r.inTime).toLocaleString('en-IN') : '-',
      'End Time': r.outTime ? new Date(r.outTime).toLocaleString('en-IN') : '-',
      'Duration (min)': r.inTime && r.outTime ? Math.round((new Date(r.outTime).getTime() - new Date(r.inTime).getTime()) / 60000) : 0,
    }))
    const allRows = [...timeRows, ...attRows]
    const ws = XLSX.utils.json_to_sheet(allRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Timesheet')
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=my_timesheet.xlsx')
    return buffer
  }

  @Get('my-attendance')
  async myAttendance(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    const u = this.user(req)
    if (u.roleType !== 'employee') {
      return []
    }
    const where: any = { userId: u.sub, orgId: u.orgId }
    if (from || to) {
      where.date = {}
      if (from) {
        const [fy, fm, fd] = from.split('-').map(Number)
        where.date.gte = new Date(Date.UTC(fy, fm - 1, fd, 0, 0, 0))
      }
      if (to) {
        const [ty, tm, td] = to.split('-').map(Number)
        where.date.lte = new Date(Date.UTC(ty, tm - 1, td, 23, 59, 59))
      }
    }
    return this.prisma.attendance.findMany({ where, orderBy: { date: 'desc' } })
  }

  @Post('my-attendance')
  async markMyAttendance(@Req() req: any, @Body() body: any) {
    const u = this.user(req)
    if (u.roleType !== 'employee') {
      throw new BadRequestException('Only employees can mark attendance')
    }
    if (!body.date) {
      throw new BadRequestException('Date is required')
    }
    const [year, month, day] = body.date.split('-').map(Number)
    if (!year || !month || !day) {
      throw new BadRequestException('Invalid date format, expected YYYY-MM-DD')
    }
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
    const inTime = body.inTime ? new Date(`${body.date}T${body.inTime}:00`) : null
    const outTime = body.outTime ? new Date(`${body.date}T${body.outTime}:00`) : null

    const existing = await this.prisma.attendance.findFirst({
      where: { userId: u.sub, date },
    })

    let attendance
    if (existing) {
      attendance = await this.prisma.attendance.update({
        where: { id: existing.id },
        data: { inTime, outTime, status: body.status || 'present' },
      })
    } else {
      attendance = await this.prisma.attendance.create({
        data: { orgId: u.orgId, userId: u.sub, date, inTime, outTime, status: body.status || 'present' },
      })
    }

    if (inTime && outTime) {
      const durationMinutes = Math.round((outTime.getTime() - inTime.getTime()) / 60000)
      try {
        const existingLog = await this.prisma.taskTimeLog.findFirst({
          where: { userId: u.sub, orgId: u.orgId, startTime: inTime },
        })
        if (!existingLog) {
          await this.prisma.taskTimeLog.create({
            data: {
              org: { connect: { id: u.orgId } },
              userId: u.sub,
              startTime: inTime,
              endTime: outTime,
              durationMinutes,
              description: `Attendance - ${attendance.status || 'present'}`,
            } as any,
          })
        }
      } catch (timesheetErr) {
        console.error('TIMESHEET CREATE ERROR:', timesheetErr)
      }
    }

    return attendance
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
