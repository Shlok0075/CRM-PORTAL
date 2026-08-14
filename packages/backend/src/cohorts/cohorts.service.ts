import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class CohortsService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: any) {
    return this.prisma.cohort.create({ data: { ...dto, org: { connect: { id: orgId } } } })
  }

  async findAll(orgId: string) {
    return this.prisma.cohort.findMany({
      where: { orgId },
      include: {
        enrollments: { include: { startup: { select: { id: true, name: true, sector: true, status: true } } } },
        curriculum: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id },
      include: {
        enrollments: { include: { startup: true } },
        curriculum: { orderBy: { weekNumber: 'asc' } },
      },
    })
    if (!cohort) throw new NotFoundException()
    return cohort
  }

  async enroll(cohortId: string, startupId: string) {
    return this.prisma.cohortEnrollment.create({ data: { cohortId, startupId } })
  }

  async getDashboard(cohortId: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        enrollments: { include: { startup: { include: { milestones: true, kpiCheckIns: { take: 1, orderBy: { periodDate: 'desc' } } } } } },
        curriculum: { orderBy: { weekNumber: 'asc' } },
      },
    })
    if (!cohort) throw new NotFoundException()
    return cohort
  }
}
