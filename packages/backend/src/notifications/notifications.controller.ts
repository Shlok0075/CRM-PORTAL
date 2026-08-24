import { Controller, Get, Patch, Param, Body, Req, UseGuards, Post } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('notifications')
@UseGuards(JwtGuard)
export class NotificationsController {
  constructor(private svc: NotificationsService) {}

  private orgId(req: any) { return req.user?.orgId }
  private userId(req: any) { return req.user?.sub }

  @Get()
  list(@Req() req: any) {
    return this.svc.list(this.orgId(req), this.userId(req))
  }

  @Get('unread-count')
  async unreadCount(@Req() req: any) {
    return this.svc.unreadCount(this.orgId(req), this.userId(req))
  }

  @Patch(':id/read')
  markRead(@Req() req: any, @Param('id') id: string) {
    return this.svc.markRead(this.orgId(req), id, this.userId(req))
  }

  @Post('read-all')
  markAllRead(@Req() req: any) {
    return this.svc.markAllRead(this.orgId(req), this.userId(req))
  }

  @Post()
  create(@Req() req: any, @Body() body: { userId: string; type: string; payload: any }) {
    return this.svc.create(this.orgId(req), body.userId, body.type, body.payload)
  }
}
