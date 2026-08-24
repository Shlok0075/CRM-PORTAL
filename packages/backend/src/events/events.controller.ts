import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common'
import { EventsService } from './events.service'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('events')
@UseGuards(JwtGuard)
export class EventsController {
  constructor(private svc: EventsService) {}

  private orgId(req: any) { return req.user?.orgId }
  private userId(req: any) { return req.user?.sub }
  private role(req: any) { return req.user?.role }

  @Get()
  list(@Req() req: any, @Query('status') status?: string, @Query('clientId') clientId?: string, @Query('search') search?: string) {
    return this.svc.findAll(this.orgId(req), {
      status,
      clientId,
      search,
      userId: this.role(req) === 'member' ? this.userId(req) : undefined,
    })
  }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.svc.findOne(this.orgId(req), id, this.userId(req), this.role(req))
  }

  @Post()
  create(@Req() req: any, @Body() dto: any) {
    return this.svc.create(this.orgId(req), dto, this.userId(req))
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.svc.update(this.orgId(req), id, dto)
  }

  @Patch(':id/status')
  setStatus(@Req() req: any, @Param('id') id: string, @Body('status') status: string) {
    return this.svc.setStatus(this.orgId(req), id, status)
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.svc.remove(this.orgId(req), id)
  }
}
