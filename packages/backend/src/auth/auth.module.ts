import { Module, forwardRef } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { UsersModule } from '../users/users.module'
import { JwtModule } from '@nestjs/jwt'
import { PrismaService } from '../prisma.service'
import { JwtGuard } from './jwt.guard'
import { RolesGuard } from './roles.guard'
import { Reflector } from '@nestjs/core'

@Module({
  imports: [forwardRef(() => UsersModule), JwtModule.register({
    secret: process.env.JWT_SECRET || 'change-me',
    signOptions: { expiresIn: '7d' }
  })],
  providers: [AuthService, PrismaService, JwtGuard, RolesGuard, Reflector],
  controllers: [AuthController],
  exports: [AuthService, JwtModule]
})
export class AuthModule {}
