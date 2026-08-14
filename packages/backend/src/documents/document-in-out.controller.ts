import { Controller, Post, Body, Get, Param, Req, UseGuards, Query, Put, Delete, Patch } from '@nestjs/common'
import { DocumentInOutService } from './document-in-out.service'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('document-in-out')
export class DocumentInOutController {
  constructor(private svc: DocumentInOutService) {}

  @UseGuards(JwtGuard)
  @Post()
  async create(@Req() req: any, @Body() body: any) {
    const orgId = req.user?.orgId
    return this.svc.create(orgId, body)
  }

  @UseGuards(JwtGuard)
  @Get()
  async list(
    @Req() req: any,
    @Query('clientId') clientId?: string,
    @Query('direction') direction?: string,
    @Query('status') status?: string,
    @Query('returnable') returnable?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const orgId = req.user?.orgId
    return this.svc.list(orgId, { clientId, direction, status, returnable, from, to })
  }

  @UseGuards(JwtGuard)
  @Get('outstanding-returnables')
  async outstandingReturnables(@Req() req: any) {
    const orgId = req.user?.orgId
    return this.svc.outstandingReturnables(orgId)
  }

  @UseGuards(JwtGuard)
  @Get(':id')
  async get(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user?.orgId
    return this.svc.get(orgId, id)
  }

  @UseGuards(JwtGuard)
  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const orgId = req.user?.orgId
    return this.svc.update(orgId, id, body)
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user?.orgId
    return this.svc.remove(orgId, id)
  }
}
