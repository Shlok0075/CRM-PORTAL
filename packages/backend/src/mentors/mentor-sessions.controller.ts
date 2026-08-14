import { Controller, Post, Body, Get, Param, Req, UseGuards, ForbiddenException } from '@nestjs/common'
import { MentorSessionsService } from './mentor-sessions.service'
import { CreateMentorSessionDto } from './dto/create-mentor-session.dto'
import { JwtGuard } from '../auth/jwt.guard'
import { PrismaService } from '../prisma.service'

@Controller('mentor-sessions')
export class MentorSessionsController {
  constructor(private svc: MentorSessionsService, private prisma: PrismaService) {}

  @UseGuards(JwtGuard)
  @Post()
  async log(@Req() req: any, @Body() dto: CreateMentorSessionDto) {
    const userId = req.user?.sub
    const mentor = await this.prisma.mentor.findFirst({ where: { userId } })
    if (!mentor) throw new ForbiddenException('Not a mentor')
    return this.svc.logSession(mentor.id, dto)
  }

  @UseGuards(JwtGuard)
  @Get('me')
  async mySessions(@Req() req: any) {
    const userId = req.user?.sub
    const mentor = await this.prisma.mentor.findFirst({ where: { userId } })
    if (!mentor) throw new ForbiddenException('Not a mentor')
    return this.svc.findMentorSessions(mentor.id)
  }

  @UseGuards(JwtGuard)
  @Get('startup/:startupId')
  async startupSessions(@Param('startupId') startupId: string) {
    return this.svc.findStartupSessions(startupId)
  }
}
