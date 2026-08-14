import { Controller, Post, Body, Get, Param, Req, UseGuards } from '@nestjs/common'
import { CohortsService } from './cohorts.service'
import { CreateCohortDto } from './dto/create-cohort.dto'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('cohorts')
export class CohortsController {
  constructor(private svc: CohortsService) {}

  @UseGuards(JwtGuard)
  @Post()
  create(@Req() req, @Body() dto: CreateCohortDto) {
    const orgId = req.user.orgId
    return this.svc.create(orgId, dto)
  }

  @UseGuards(JwtGuard)
  @Get()
  list(@Req() req) {
    const orgId = req.user.orgId
    return this.svc.findAll(orgId)
  }

  @UseGuards(JwtGuard)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.findOne(id)
  }

  @UseGuards(JwtGuard)
  @Post(':id/enroll')
  enroll(@Param('id') id: string, @Body('startupId') startupId: string) {
    return this.svc.enroll(id, startupId)
  }

  @UseGuards(JwtGuard)
  @Get(':id/dashboard')
  dashboard(@Param('id') id: string) {
    return this.svc.getDashboard(id)
  }
}
