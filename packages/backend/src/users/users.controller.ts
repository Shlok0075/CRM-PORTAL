import { Controller, Get, Param, Patch, Body, Req, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('users')
@UseGuards(JwtGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async me(@Req() req: any) {
    const userId = req.user?.sub
    if (!userId) return null
    return this.usersService.findById(userId)
  }

  @Get(':id')
  async getUser(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.sub
    if (!userId) return null
    return this.usersService.findById(id)
  }

  @Patch('me')
  async updateMe(@Req() req: any, @Body() data: any) {
    const userId = req.user?.sub
    if (!userId) return null
    return this.usersService.updateProfile(userId, data)
  }
}
