import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common'
import { TemplatesService } from './templates.service'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('templates')
@UseGuards(JwtGuard)
export class TemplatesController {
  constructor(private svc: TemplatesService) {}

  private orgId(req: any) { return req.user?.orgId }

  @Get()
  list(@Req() req: any) { return this.svc.findAll(this.orgId(req)) }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) { return this.svc.findOne(this.orgId(req), id) }

  @Post()
  create(@Req() req: any, @Body() dto: any) { return this.svc.create(this.orgId(req), dto) }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.update(this.orgId(req), id, dto) }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) { return this.svc.remove(this.orgId(req), id) }
}
