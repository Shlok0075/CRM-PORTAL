import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import bcrypt from 'bcryptjs'
import { CreateEmployeeDto } from './dto/create-employee.dto'
import { MarkAttendanceDto } from './dto/mark-attendance.dto'

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

    const date = new Date(dto.date)
    const inTime = dto.inTime ? new Date(`${dto.date}T${dto.inTime}`) : null
    const outTime = dto.outTime ? new Date(`${dto.date}T${dto.outTime}`) : null

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
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to)
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

    const where: any = { userId }
    if (from || to) {
      where.startTime = {}
      if (from) where.startTime.gte = new Date(from)
      if (to) where.startTime.lte = new Date(to)
    }
    return this.prisma.taskTimeLog.findMany({
      where,
      include: { task: { select: { id: true, title: true } } },
      orderBy: { startTime: 'desc' },
    })
  }
}
