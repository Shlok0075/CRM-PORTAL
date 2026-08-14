import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import bcrypt from 'bcryptjs'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } })
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } })
  }

  async validateUser(email: string, password: string) {
    const user = await this.findByEmail(email)
    if (!user || !user.passwordHash) return null
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return null
    return user
  }

  async createUser(orgId: string, email: string, name?: string, password?: string) {
    const hash = password ? await bcrypt.hash(password, 10) : null
    return this.prisma.user.create({
      data: { orgId, email, name, passwordHash: hash }
    })
  }

  async updateProfile(id: string, data: { name?: string; email?: string; phone?: string }) {
    return this.prisma.user.update({
      where: { id },
      data: { ...data, phone: data.phone || null },
    })
  }
}
