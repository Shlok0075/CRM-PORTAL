import { Controller, Post, Body, Get, Param, Req, UseGuards } from '@nestjs/common'
import { KpiCheckInsService } from './kpi-checkins.service'
import { CreateKpiCheckInDto } from './dto/create-kpi-checkin.dto'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('kpi-checkins')
export class KpiCheckInsController {
  constructor(private svc: KpiCheckInsService) {}

  @UseGuards(JwtGuard)
  @Post()
  async create(@Req() req: any, @Body() dto: CreateKpiCheckInDto) {
    return this.svc.create(dto)
  }

  @UseGuards(JwtGuard)
  @Get('startup/:startupId')
  async findByStartup(@Param('startupId') startupId: string) {
    return this.svc.findByStartup(startupId)
  }
}
