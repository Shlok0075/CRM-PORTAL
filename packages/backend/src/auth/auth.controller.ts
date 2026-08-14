import { Controller, Post, Body, BadRequestException } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    if (!body.email || !body.password) throw new BadRequestException('email and password required')
    const user = await this.authService.validateStaff(body.email, body.password)
    if (!user) throw new BadRequestException('invalid credentials')
    return this.authService.loginStaff(user)
  }

  @Post('otp/request')
  async requestOtp(@Body() body: { email: string }) {
    if (!body.email) throw new BadRequestException('email required')
    return this.authService.requestOtp(body.email)
  }

  @Post('otp/verify')
  async verifyOtp(@Body() body: { email: string; code: string }) {
    if (!body.email || !body.code) throw new BadRequestException('email and code required')
    return this.authService.verifyOtp(body.email, body.code)
  }
}
