import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { CreateMentorSessionDto } from './dto/create-mentor-session.dto'

@Injectable()
export class MentorSessionsService {
  constructor(private prisma: PrismaService) {}

  async logSession(mentorId: string, dto: CreateMentorSessionDto) {
    const mentor = await this.prisma.mentor.findUnique({ where: { id: mentorId } })
    if (!mentor) throw new NotFoundException('Mentor not found')

    return this.prisma.mentorSessionLog.create({
      data: {
        mentorId,
        startupId: dto.startupId,
        date: new Date(dto.date),
        durationMinutes: dto.durationMinutes,
        notes: dto.notes,
        actionItems: dto.actionItems,
      },
      include: { startup: { select: { name: true } } },
    })
  }

  async findMentorSessions(mentorId: string) {
    return this.prisma.mentorSessionLog.findMany({
      where: { mentorId },
      orderBy: { date: 'desc' },
      include: { startup: { select: { name: true, sector: true } } },
    })
  }

  async findStartupSessions(startupId: string) {
    return this.prisma.mentorSessionLog.findMany({
      where: { startupId },
      orderBy: { date: 'desc' },
      include: { mentor: { include: { user: { select: { name: true, email: true } } } } },
    })
  }
}
