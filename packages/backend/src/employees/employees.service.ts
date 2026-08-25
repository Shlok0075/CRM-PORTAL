import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import bcrypt from 'bcryptjs'
import { CreateEmployeeDto } from './dto/create-employee.dto'
import { MarkAttendanceDto } from './dto/mark-attendance.dto'
import * as XLSX from 'xlsx'

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.user.findMany({
      where: { orgId },
      select: { id: true, email: true, name: true, phone: true, designation: true, isActive: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(orgId: string, id: string) {
    return this.prisma.user.findFirst({
      where: { id, orgId },
      select: { id: true, email: true, name: true, phone: true, designation: true, isActive: true, role: true, createdAt: true },
    })
  }

  async create(orgId: string, dto: CreateEmployeeDto) {
    const cleaned = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== null && v !== undefined)) as any
    const hash = await bcrypt.hash(cleaned.password, 10)
    return this.prisma.user.create({
      data: { org: { connect: { id: orgId } }, email: cleaned.email, name: cleaned.name, passwordHash: hash, phone: cleaned.phone, designation: cleaned.designation, role: cleaned.role || 'member', isActive: true },
      select: { id: true, email: true, name: true, phone: true, designation: true, role: true, isActive: true, createdAt: true },
    })
  }

  async update(orgId: string, id: string, data: any) {
    const user = await this.prisma.user.findFirst({ where: { id, orgId } })
    if (!user) return null
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, phone: true, designation: true, isActive: true, createdAt: true },
    })
  }

  async remove(orgId: string, id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, orgId } })
    if (!user) return null
    await this.prisma.user.delete({ where: { id } })
    return { id }
  }

  async markAttendance(orgId: string, dto: MarkAttendanceDto) {
    const user = await this.prisma.user.findFirst({ where: { id: dto.userId, orgId } })
    if (!user) throw new Error('User not found')

    const [year, month, day] = dto.date.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
    const inTime = dto.inTime ? new Date(`${dto.date}T${dto.inTime}:00`) : null
    const outTime = dto.outTime ? new Date(`${dto.date}T${dto.outTime}:00`) : null

    return this.prisma.attendance.upsert({
      where: { userId_date: { userId: dto.userId, date } },
      update: { inTime, outTime, status: dto.status },
      create: { orgId, userId: dto.userId, date, inTime, outTime, status: dto.status },
    })
  }

  async getAttendance(orgId: string, userId?: string, from?: string, to?: string) {
    const where: any = { orgId }
    if (userId) where.userId = userId
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
    return this.prisma.attendance.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { date: 'desc' },
    })
  }

  async getTimesheet(orgId: string, userId: string, from?: string, to?: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, orgId } })
    if (!user) return []

    const where: any = { userId, orgId }
    if (from || to) {
      where.startTime = {}
      if (from) where.startTime.gte = new Date(from)
      if (to) where.startTime.lte = new Date(to)
    }
    return this.prisma.taskTimeLog.findMany({
      where,
      include: { task: { select: { id: true, title: true } }, user: { select: { id: true, name: true, email: true } } },
      orderBy: { startTime: 'desc' },
    })
  }

  async attendanceExcel(orgId: string, userId?: string, from?: string, to?: string) {
    const records = await this.getAttendance(orgId, userId, from, to)
    const rows = records.map((r: any) => ({
      Employee: r.user?.name || '-',
      Email: r.user?.email || '-',
      Date: r.date ? new Date(r.date).toLocaleDateString('en-IN') : '-',
      'In Time': r.inTime ? new Date(r.inTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
      'Out Time': r.outTime ? new Date(r.outTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
      Status: r.status || '-',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance')
    return wb
  }

  async timesheetExcel(orgId: string, userId: string, from?: string, to?: string) {
    const logs = await this.getTimesheet(orgId, userId, from, to)
    const attendance = await this.getAttendance(orgId, userId, from, to)
    const wb = XLSX.utils.book_new()

    const timeRows = logs.map((l: any) => ({
      Type: 'Task Time Log',
      Employee: l.user?.name || '-',
      Email: l.user?.email || '-',
      Task: l.task?.title || '-',
      'Start Time': l.startTime ? new Date(l.startTime).toLocaleString('en-IN') : '-',
      'End Time': l.endTime ? new Date(l.endTime).toLocaleString('en-IN') : '-',
      'Duration (min)': l.durationMinutes || 0,
      Description: l.description || '-',
    }))
    const attRows = attendance.map((r: any) => ({
      Type: 'Attendance',
      Employee: r.user?.name || '-',
      Email: r.user?.email || '-',
      Task: '-',
      'Start Time': r.inTime ? new Date(r.inTime).toLocaleString('en-IN') : '-',
      'End Time': r.outTime ? new Date(r.outTime).toLocaleString('en-IN') : '-',
      'Duration (min)': r.inTime && r.outTime ? Math.round((new Date(r.outTime).getTime() - new Date(r.inTime).getTime()) / 60000) : 0,
      Description: r.status || '-',
    }))
    const allRows = [...timeRows, ...attRows]
    const ws = XLSX.utils.json_to_sheet(allRows)
    XLSX.utils.book_append_sheet(wb, ws, 'Timesheet')
    return wb
  }

  async combinedTimesheet(orgId: string, userId: string, from?: string, to?: string) {
    const logs = await this.getTimesheet(orgId, userId, from, to)
    const attendance = await this.getAttendance(orgId, userId, from, to)

    const timeLogs = logs.map((l: any) => ({
      id: l.id,
      type: 'task' as const,
      date: l.startTime ? new Date(l.startTime).toISOString().split('T')[0] : '-',
      startTime: l.startTime ? new Date(l.startTime).toLocaleString('en-IN') : '-',
      endTime: l.endTime ? new Date(l.endTime).toLocaleString('en-IN') : '-',
      durationMinutes: l.durationMinutes || 0,
      description: l.task?.title || '-',
      status: l.endTime ? 'completed' : 'in_progress',
    }))

    const attLogs = attendance.map((r: any) => ({
      id: r.id,
      type: 'attendance' as const,
      date: r.date ? new Date(r.date).toISOString().split('T')[0] : '-',
      startTime: r.inTime ? new Date(r.inTime).toLocaleString('en-IN') : '-',
      endTime: r.outTime ? new Date(r.outTime).toLocaleString('en-IN') : '-',
      durationMinutes: r.inTime && r.outTime ? Math.round((new Date(r.outTime).getTime() - new Date(r.inTime).getTime()) / 60000) : 0,
      description: r.status || '-',
      status: r.status,
    }))

    return [...timeLogs, ...attLogs].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }
}
