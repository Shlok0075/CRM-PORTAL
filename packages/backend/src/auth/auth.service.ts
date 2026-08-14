import { Injectable } from '@nestjs/common'
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
    const role = user.roleId ? await this.prisma.role.findUnique({ where: { id: user.roleId } }) : null
    const roleName = role?.name || 'user'
    const payload = { sub: user.id, email: user.email, orgId: user.orgId, roleId: user.roleId, isMentor: user.isMentor }
    return { accessToken: this.jwt.sign(payload), role: roleName, user: { id: user.id, email: user.email, name: user.name, isMentor: user.isMentor } }
  }

  // stub for OTP: create token and send via email in production
  async requestOtp(email: string) {
    // generate OTP and persist temporarily (omitted) — return a stub response
    return { ok: true, message: 'OTP sent (stub)' }
  }

  async verifyOtp(email: string, code: string) {
    // verify OTP (stub)
    return { ok: true, token: 'FOUNDERTOKEN-STUB' }
  }
}
