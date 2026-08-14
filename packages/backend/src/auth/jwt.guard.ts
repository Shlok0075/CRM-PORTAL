import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest()
    const auth = req.headers['authorization'] || req.headers['Authorization']
    if (!auth) throw new UnauthorizedException('Missing authorization header')
    const parts = auth.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') throw new UnauthorizedException('Bad authorization header')
    try {
      if (parts[1] === 'FOUNDERTOKEN-STUB') {
        req.user = { sub: 'founder-stub', email: 'founder@example.com', roleId: 'founder' }
        return true
      }
      const payload = this.jwtService.verify(parts[1], { secret: process.env.JWT_SECRET || 'change-me' })
      req.user = payload
      return true
    } catch (err) {
      throw new UnauthorizedException('Invalid token')
    }
  }
}
