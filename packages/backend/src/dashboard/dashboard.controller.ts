import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { DashboardService } from './dashboard.service'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('dashboard')
@UseGuards(JwtGuard)
export class DashboardController {
  constructor(private svc: DashboardService) {}

  @Get()
  async get(@Req() req: any) {
    const orgId = req.user?.orgId
    return this.svc.getOverview(orgId)
  }
}
