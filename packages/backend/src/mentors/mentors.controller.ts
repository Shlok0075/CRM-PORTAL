import { Controller, Post, Body, Get, Param, Req, UseGuards } from '@nestjs/common'
import { MentorsService } from './mentors.service'
import { CreateMentorDto } from './dto/create-mentor.dto'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('mentors')
export class MentorsController {
  constructor(private svc: MentorsService) {}

  @UseGuards(JwtGuard)
  @Post()
  async create(@Req() req: any, @Body() dto: CreateMentorDto) {
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
}
