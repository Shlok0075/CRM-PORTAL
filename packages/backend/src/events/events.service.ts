import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  private toStrArray(value: any): string {
    if (!value) return '[]'
    if (Array.isArray(value)) return JSON.stringify(value)
    if (typeof value === 'string') {
      try {
        return JSON.stringify(JSON.parse(value))
      } catch {
        return value
      }
    }
    return JSON.stringify(value)
  }

  private fromStrArray(value: any): string[] {
    if (!value) return []
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  private serialize(event: any) {
    if (!event) return event
    return { ...event, assigneeIds: this.fromStrArray(event.assigneeIds) }
  }

  async create(orgId: string, dto: any, createdById?: string) {
    const cleaned = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== null && v !== undefined)) as any
    const data: any = {
      org: { connect: { id: orgId } },
      title: cleaned.title,
      description: cleaned.description,
      clientId: cleaned.clientId,
      assigneeIds: this.toStrArray(cleaned.assigneeIds),
      status: cleaned.status || 'pending',
      priority: cleaned.priority || 'medium',
      startDate: cleaned.startDate ? new Date(cleaned.startDate) : undefined,
      dueDate: cleaned.dueDate ? new Date(cleaned.dueDate) : undefined,
      expectedDate: cleaned.expectedDate ? new Date(cleaned.expectedDate) : undefined,
      createdBy: createdById ? { connect: { id: createdById } } : undefined,
    }
    return this.serialize(
      await this.prisma.event.create({
        data,
        include: { client: { select: { name: true } }, createdBy: { select: { name: true } } },
      }),
    )
  }

  async findAll(orgId: string, filters: any) {
    const where: any = { orgId }
    if (filters.status) where.status = filters.status
    if (filters.clientId) where.clientId = filters.clientId
    if (filters.userId) where.assigneeIds = { contains: filters.userId }

    const events = await this.prisma.event.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { name: true } }, createdBy: { select: { name: true } } },
    })
    return events.map((e) => this.serialize(e))
  }

  async findOne(orgId: string, id: string, userId?: string, role?: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, orgId },
      include: { client: { select: { name: true } }, createdBy: { select: { name: true } }, documents: true },
    })
    if (!event) throw new NotFoundException('Event not found')
    if (role === 'member' && userId) {
      const assignees = this.fromStrArray(event.assigneeIds)
      if (!assignees.includes(userId)) throw new NotFoundException('Event not found')
    }
    return this.serialize(event)
  }

  async update(orgId: string, id: string, dto: any) {
    const existing = await this.prisma.event.findFirst({ where: { id, orgId } })
    if (!existing) throw new NotFoundException('Event not found')
    const cleaned = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== null && v !== undefined)) as any
    const data: any = {}
    if (cleaned.title !== undefined) data.title = cleaned.title
    if (cleaned.description !== undefined) data.description = cleaned.description
    if (cleaned.clientId !== undefined) data.clientId = cleaned.clientId
    if (cleaned.assigneeIds !== undefined) data.assigneeIds = this.toStrArray(cleaned.assigneeIds)
    if (cleaned.status !== undefined) data.status = cleaned.status
    if (cleaned.priority !== undefined) data.priority = cleaned.priority
    if (cleaned.startDate !== undefined) data.startDate = cleaned.startDate ? new Date(cleaned.startDate) : null
    if (cleaned.dueDate !== undefined) data.dueDate = cleaned.dueDate ? new Date(cleaned.dueDate) : null
    if (cleaned.expectedDate !== undefined) data.expectedDate = cleaned.expectedDate ? new Date(cleaned.expectedDate) : null

    return this.serialize(
      await this.prisma.event.update({ where: { id }, data, include: { client: { select: { name: true } }, createdBy: { select: { name: true } } } }),
    )
  }

  async setStatus(orgId: string, id: string, status: string) {
    const existing = await this.prisma.event.findFirst({ where: { id, orgId } })
    if (!existing) throw new NotFoundException('Event not found')
    const valid = ['pending', 'ongoing', 'completed', 'cancelled']
    if (!valid.includes(status)) throw new BadRequestException(`Invalid status: ${status}`)
    return this.serialize(
      await this.prisma.event.update({ where: { id }, data: { status }, include: { client: { select: { name: true } }, createdBy: { select: { name: true } } } }),
    )
  }

  async remove(orgId: string, id: string) {
    const existing = await this.prisma.event.findFirst({ where: { id, orgId } })
    if (!existing) throw new NotFoundException('Event not found')
    await this.prisma.event.delete({ where: { id } })
    return { id }
  }
}
