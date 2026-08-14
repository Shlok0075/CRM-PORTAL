import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { CreateStartupDto } from './dto/create-startup.dto'

@Injectable()
export class StartupsService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: CreateStartupDto) {
    return this.prisma.startup.create({ data: { ...dto, org: { connect: { id: orgId } } } as any })
  }

  async findAll(orgId: string) {
    return this.prisma.startup.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } })
  }

  async findOne(id: string) {
    const s = await this.prisma.startup.findUnique({ where: { id } })
    if (!s) throw new NotFoundException()
    return s
  }

  async update(id: string, data: Partial<CreateStartupDto>) {
    return this.prisma.startup.update({ where: { id }, data })
  }
}
