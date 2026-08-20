import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: any) {
    const cleaned = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== null && v !== undefined)) as any
    return this.prisma.agreementTemplate.create({
      data: { org: { connect: { id: orgId } }, name: cleaned.name, type: cleaned.type || 'General', body: cleaned.body || '' },
    })
  }

  async findAll(orgId: string) {
    return this.prisma.agreementTemplate.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } })
  }

  async findOne(orgId: string, id: string) {
    const tpl = await this.prisma.agreementTemplate.findFirst({ where: { id, orgId } })
    if (!tpl) throw new NotFoundException('Template not found')
    return tpl
  }

  async update(orgId: string, id: string, dto: any) {
    const existing = await this.prisma.agreementTemplate.findFirst({ where: { id, orgId } })
    if (!existing) throw new NotFoundException('Template not found')
    const cleaned = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== null && v !== undefined)) as any
    return this.prisma.agreementTemplate.update({ where: { id }, data: cleaned })
  }

  async remove(orgId: string, id: string) {
    const existing = await this.prisma.agreementTemplate.findFirst({ where: { id, orgId } })
    if (!existing) throw new NotFoundException('Template not found')
    await this.prisma.agreementTemplate.delete({ where: { id } })
    return { id }
  }

  fillTemplate(body: string, fields: Record<string, any>) {
    let out = body || ''
    Object.entries(fields || {}).forEach(([k, v]) => {
      out = out.split(`{{${k}}}`).join(v ?? '')
    })
    return out
  }
}
