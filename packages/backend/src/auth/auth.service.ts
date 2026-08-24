import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { JwtService } from '@nestjs/jwt'
import bcrypt from 'bcryptjs'

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async validateStaff(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) return null
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return null
    return user
  }

  async loginStaff(user: any) {
    const roleType = user.role === 'admin' ? 'admin' : 'employee'
    const payload = { sub: user.id, email: user.email, orgId: user.orgId, role: user.role || 'member', roleType }
    const token = this.jwt.sign(payload)
    return { accessToken: token, roleType, role: user.role || 'member', user: { id: user.id, email: user.email, name: user.name, role: user.role || 'member', roleType } }
  }

  async requestOtp(email: string) {
    return { ok: true, message: 'OTP sent (stub)' }
  }

  async verifyOtp(email: string, code: string) {
    if (!email) throw new BadRequestException('Email is required')
    if (code !== '123456') throw new BadRequestException('Invalid OTP')

    let client = await this.prisma.client.findFirst({ where: { contactInfo: { contains: email, mode: 'insensitive' } } })

    if (!client) {
      const org = await this.prisma.organization.findFirst()
      if (!org) throw new BadRequestException('No organization found')
      client = await this.prisma.client.create({
        data: {
          org: { connect: { id: org.id } },
          name: email.split('@')[0],
          contactInfo: JSON.stringify({ email }),
          status: 'active',
          gstins: '[]',
        },
      })
    }

    let clientEmail = email
    if (client.contactInfo) {
      try {
        const parsed = JSON.parse(client.contactInfo)
        if (parsed.email) clientEmail = parsed.email
      } catch {}
    }

    const payload = { sub: client.id, email: clientEmail, orgId: client.orgId, roleType: 'client', clientId: client.id }
    const token = this.jwt.sign(payload)
    return { accessToken: token, roleType: 'client', user: { id: client.id, name: client.name, email: clientEmail, roleType: 'client' } }
  }

  async validateClientToken(clientId: string) {
    const client = await this.prisma.client.findFirst({ where: { id: clientId } })
    if (!client) return null
    return client
  }
}
