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
    const client = await this.prisma.client.findFirst({ where: { contactInfo: { contains: email } } })
    if (!client) return { ok: true, message: 'OTP sent if email matches a client' }
    return { ok: true, message: 'OTP sent (stub)', clientId: client.id }
  }

  async verifyOtp(email: string, code: string) {
    const client = await this.prisma.client.findFirst({ where: { contactInfo: { contains: email } } })
    if (!client) throw new BadRequestException('Client not found')
    if (code !== '123456') throw new BadRequestException('Invalid OTP')
    const payload = { sub: client.id, email: client.contactInfo || email, orgId: client.orgId, roleType: 'client', clientId: client.id }
    const token = this.jwt.sign(payload)
    return { accessToken: token, roleType: 'client', user: { id: client.id, name: client.name, email: client.contactInfo || email, roleType: 'client' } }
  }

  async validateClientToken(clientId: string) {
    const client = await this.prisma.client.findFirst({ where: { id: clientId } })
    if (!client) return null
    return client
  }
}
