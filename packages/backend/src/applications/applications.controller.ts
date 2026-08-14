import { Controller, Post, Body, Get, Param, Patch, Req, UseGuards } from '@nestjs/common'
import { ApplicationsService } from './applications.service'
import { CreateApplicationDto } from './dto/create-application.dto'
import { JwtGuard } from '../auth/jwt.guard'
import { UpdateStageDto } from './dto/update-stage.dto'

@Controller('applications')
export class ApplicationsController {
  constructor(private svc: ApplicationsService) {}

  @UseGuards(JwtGuard)
  @Post()
  async submit(@Req() req: any, @Body() dto: CreateApplicationDto) {
    const orgId = req.user?.orgId || dto.orgId || process.env.DEFAULT_ORG_ID || ''
    return this.svc.create(orgId, dto)
  }

  @UseGuards(JwtGuard)
  @Get()
  async list(@Req() req: any) {
    const orgId = req.user?.orgId
    return this.svc.findAll(orgId)
  }

  @UseGuards(JwtGuard)
  @Get(':id')
  async get(@Param('id') id: string) {
    return this.svc.findOne(id)
  }

  @UseGuards(JwtGuard)
  @Patch(':id/stage')
  async updateStage(@Param('id') id: string, @Body() body: UpdateStageDto) {
    return this.svc.updateStage(id, body.stage)
  }

  @UseGuards(JwtGuard)
  @Post(':id/convert-to-startup')
  async convert(@Param('id') id: string, @Body() body: { assignToUserId?: string }) {
    return this.svc.convertToStartup(id, body.assignToUserId)
  }
}
