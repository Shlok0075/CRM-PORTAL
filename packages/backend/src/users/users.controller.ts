import { Controller, Get, Param, Patch, Body, Req, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtGuard)
  async me(@Req() req: any) {
    const userId = req.user?.sub
    if (!userId) return null
    return this.usersService.findById(userId)
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.findByEmail(id)
  }

  @Patch('me')
  @UseGuards(JwtGuard)
  async updateMe(@Req() req: any, @Body() data: any) {
    return this.usersService.updateProfile(req.user.sub, data)
  }
}
