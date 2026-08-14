import { Controller, Post, Body, Get, Param, Req, UseGuards, Query, Put, Delete } from '@nestjs/common'
import { CommunicationService } from './communication.service'
import { JwtGuard } from '../auth/jwt.guard'
import { CreateTemplateDto } from './dto/create-template.dto'
import { SendMessageDto } from './dto/send-message.dto'

@Controller('communication')
export class CommunicationController {
  constructor(private svc: CommunicationService) {}

  @UseGuards(JwtGuard)
  @Post('templates')
  async createTemplate(@Req() req: any, @Body() body: CreateTemplateDto) {
    const orgId = req.user?.orgId
    return this.svc.createTemplate(orgId, body)
  }

  @UseGuards(JwtGuard)
  @Get('templates')
  async listTemplates(@Req() req: any, @Query('channel') channel?: string) {
    const orgId = req.user?.orgId
    return this.svc.listTemplates(orgId, channel)
  }

  @UseGuards(JwtGuard)
  @Get('templates/:id')
  async getTemplate(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user?.orgId
    return this.svc.getTemplate(orgId, id)
  }

  @UseGuards(JwtGuard)
  @Put('templates/:id')
  async updateTemplate(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const orgId = req.user?.orgId
    return this.svc.updateTemplate(orgId, id, body)
  }

  @UseGuards(JwtGuard)
  @Delete('templates/:id')
  async deleteTemplate(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user?.orgId
    return this.svc.deleteTemplate(orgId, id)
  }

  @UseGuards(JwtGuard)
  @Post('send')
  async send(@Req() req: any, @Body() body: SendMessageDto) {
    const orgId = req.user?.orgId
    return this.svc.sendBulk(orgId, body)
  }

  @UseGuards(JwtGuard)
  @Get('logs')
  async listLogs(
    @Req() req: any,
    @Query('clientId') clientId?: string,
    @Query('channel') channel?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const orgId = req.user?.orgId
    return this.svc.listLogs(orgId, { clientId, channel, status, from, to })
  }
}
