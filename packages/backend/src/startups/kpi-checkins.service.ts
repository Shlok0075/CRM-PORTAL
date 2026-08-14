import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { CreateKpiCheckInDto } from './dto/create-kpi-checkin.dto'

@Injectable()
export class KpiCheckInsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateKpiCheckInDto) {
    return this.prisma.kpiCheckIn.create({
      data: {
        startupId: dto.startupId,
        periodDate: new Date(dto.periodDate),
        metrics: JSON.stringify(dto.metrics),
        submittedBy: dto.submittedBy,
      },
    })
  }

  async findByStartup(startupId: string) {
    return this.prisma.kpiCheckIn.findMany({
      where: { startupId },
      orderBy: { periodDate: 'desc' },
    })
  }
}
