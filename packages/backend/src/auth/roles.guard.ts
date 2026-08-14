import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PrismaService } from '../prisma.service'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const permission = this.reflector.get<string>('permission', context.getHandler())
    if (!permission) return true
    const req = context.switchToHttp().getRequest()
    const user = req.user
    if (!user) return false
    // load role and permissions
    const role = await this.prisma.role.findUnique({ where: { id: user.roleId } })
    if (!role) throw new ForbiddenException()
    const perms: string[] = (role.permissions as any) || []
    if (perms.includes('*') || perms.includes(permission)) return true
    throw new ForbiddenException()
  }
}
