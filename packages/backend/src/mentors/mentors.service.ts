import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { CreateMentorDto } from './dto/create-mentor.dto'

@Injectable()
export class MentorsService {
  constructor(private prisma: PrismaService) {}

  private serialize(dto: CreateMentorDto) {
    const data: any = { ...dto }
    if (Array.isArray(data.expertiseTags)) data.expertiseTags = JSON.stringify(data.expertiseTags)
    return data
  }

  async create(orgId: string, dto: CreateMentorDto) {
    const data = this.serialize(dto)
    const user = await this.prisma.user.create({ data: { org: { connect: { id: orgId } }, email: data.email, name: data.name } })
    const mentor = await this.prisma.mentor.create({ data: { userId: user.id, expertiseTags: data.expertiseTags || JSON.stringify([]), bio: data.bio } })
    return { user, mentor: { ...mentor, expertiseTags: mentor.expertiseTags ? JSON.parse(mentor.expertiseTags) : [] } }
  }

  async findAll(orgId: string) {
    const mentors = await this.prisma.mentor.findMany({
      where: { user: { orgId } },
      include: { user: true, assignments: { include: { startup: true } } },
    })
    return mentors.map((m) => ({
      ...m,
      expertiseTags: m.expertiseTags ? JSON.parse(m.expertiseTags) : [],
    }))
  }

  async findOne(id: string) {
    const m = await this.prisma.mentor.findUnique({ where: { id }, include: { user: true } })
    if (!m) throw new NotFoundException()
    return { ...m, expertiseTags: m.expertiseTags ? JSON.parse(m.expertiseTags) : [] }
  }
}
