import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common'
import { MessagesService } from './messages.service'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('messages')
export class MessagesController {
  constructor(private svc: MessagesService) {}

  @UseGuards(JwtGuard)
  @Post('send-email')
  async sendEmail(@Req() req: any, @Body() body: { startupId?: string; templateId: string; payload?: any }) {
    const orgId = req.user?.orgId
    return this.svc.sendEmail(orgId, body.startupId || null, body.templateId, body.payload || {})
  }

  @UseGuards(JwtGuard)
  @Get('logs')
  async logs(@Req() req: any) {
    const orgId = req.user?.orgId
    return this.svc.listLogs(orgId)
  }
}
