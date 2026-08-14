import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class ComplianceService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, body: { name: string; applicableTo: string; dueDateRule: string }) {
    return this.prisma.complianceCalendarEntry.create({
      data: {
        org: { connect: { id: orgId } },
        name: body.name,
        applicableTo: body.applicableTo,
        dueDateRule: body.dueDateRule,
      },
    })
  }

  async findAll(orgId: string, filters: { applicableTo?: string }) {
    const where: any = { orgId }
    if (filters.applicableTo) where.applicableTo = filters.applicableTo
    const entries = await this.prisma.complianceCalendarEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    entries.sort((a, b) => this.compareDueDateRule(a.dueDateRule, b.dueDateRule))
    return entries
  }

  async findOne(orgId: string, id: string) {
    const entry = await this.prisma.complianceCalendarEntry.findFirst({ where: { id, orgId } })
    if (!entry) throw new NotFoundException(`Compliance entry ${id} not found`)
    return entry
  }

  async update(orgId: string, id: string, body: { name?: string; applicableTo?: string; dueDateRule?: string }) {
    const entry = await this.prisma.complianceCalendarEntry.findFirst({ where: { id, orgId } })
    if (!entry) throw new NotFoundException(`Compliance entry ${id} not found`)
    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.applicableTo !== undefined) data.applicableTo = body.applicableTo
    if (body.dueDateRule !== undefined) data.dueDateRule = body.dueDateRule
    return this.prisma.complianceCalendarEntry.update({ where: { id }, data })
  }

  async delete(orgId: string, id: string) {
    const entry = await this.prisma.complianceCalendarEntry.findFirst({ where: { id, orgId } })
    if (!entry) throw new NotFoundException(`Compliance entry ${id} not found`)
    await this.prisma.complianceCalendarEntry.delete({ where: { id } })
    return { id }
  }

  async upcoming(orgId: string, filters: { applicableTo?: string }) {
    const where: any = { orgId }
    if (filters.applicableTo) where.applicableTo = filters.applicableTo
    const entries = await this.prisma.complianceCalendarEntry.findMany({ where })
    return entries
      .map((e) => ({ ...e, dueDate: this.parseDueDateRule(e.dueDateRule) }))
      .filter((e) => e.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
  }

  private parseDueDateRule(rule: string): Date | null {
    const candidates = rule.match(/\d{4}-\d{2}-\d{2}/)
    return candidates ? new Date(candidates[0]) : null
  }

  private compareDueDateRule(a: string, b: string): number {
    const da = this.parseDueDateRule(a)
    const db = this.parseDueDateRule(b)
    if (!da && !db) return 0
    if (!da) return 1
    if (!db) return -1
    return da.getTime() - db.getTime()
  }
}
