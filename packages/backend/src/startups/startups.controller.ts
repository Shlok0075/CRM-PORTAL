import { Controller, Post, Body, Get, Param, Patch, Req, UseGuards } from '@nestjs/common'
import { StartupsService } from './startups.service'
import { CreateStartupDto } from './dto/create-startup.dto'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('startups')
export class StartupsController {
  constructor(private svc: StartupsService) {}

  @UseGuards(JwtGuard)
  @Post()
  async create(@Req() req: any, @Body() dto: CreateStartupDto) {
    const orgId = req.user?.orgId
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
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: Partial<CreateStartupDto>) {
    return this.svc.update(id, body)
  }
}
