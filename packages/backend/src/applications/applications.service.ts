import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { CreateApplicationDto } from './dto/create-application.dto'

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  private serialize(dto: CreateApplicationDto) {
    const data: any = { ...dto }
    if (Array.isArray(data.founderNames)) data.founderNames = JSON.stringify(data.founderNames)
    if (Array.isArray(data.reviewerIds)) data.reviewerIds = JSON.stringify(data.reviewerIds)
    return data
  }

  async create(orgId: string, dto: CreateApplicationDto) {
    const data: any = { ...this.serialize(dto), org: { connect: { id: orgId } } }
    if (!data.reviewerIds) data.reviewerIds = JSON.stringify([])
    if (!data.founderNames) data.founderNames = JSON.stringify([])
    return this.prisma.application.create({ data })
  }

  async findAll(orgId: string) {
    const apps = await this.prisma.application.findMany({ where: { orgId }, orderBy: { submittedAt: 'desc' } })
    return apps.map((a) => ({
      ...a,
      founderNames: a.founderNames ? JSON.parse(a.founderNames) : [],
      reviewerIds: a.reviewerIds ? JSON.parse(a.reviewerIds) : [],
    }))
  }

  async findOne(id: string) {
    const app = await this.prisma.application.findUnique({ where: { id } })
    if (!app) throw new NotFoundException()
    return {
      ...app,
      founderNames: app.founderNames ? JSON.parse(app.founderNames) : [],
      reviewerIds: app.reviewerIds ? JSON.parse(app.reviewerIds) : [],
    }
  }

  async updateStage(id: string, stage: string) {
    return this.prisma.application.update({ where: { id }, data: { status: stage } })
  }

  async convertToStartup(id: string, assignToUserId?: string) {
    const app = await this.findOne(id)
    const startup = await this.prisma.startup.create({
      data: {
        org: { connect: { id: app.orgId } },
        name: app.startupName,
        sector: app.sector,
        createdAt: new Date(),
        responsibleUserId: assignToUserId || undefined,
      } as any,
    })
    await this.prisma.application.update({ where: { id }, data: { status: 'accepted' } })
    return startup
  }
}
