import { Controller, Post, Body, Get, Param, Req, UseGuards, Query, Put, Delete, Patch } from '@nestjs/common'
import { DocumentsService } from './documents.service'
import { JwtGuard } from '../auth/jwt.guard'
import { CreateDocumentDto } from './dto/create-document.dto'

@Controller('documents')
export class DocumentsController {
  constructor(private svc: DocumentsService) {}

  @UseGuards(JwtGuard)
  @Get()
  async listAll(@Req() req: any) {
    const orgId = req.user?.orgId
    return this.svc.listAll(orgId)
  }

  @UseGuards(JwtGuard)
  @Get('by-client/:clientId')
  async listByClient(@Req() req: any, @Param('clientId') clientId: string) {
    const orgId = req.user?.orgId
    return this.svc.listByClient(orgId, clientId)
  }

  @UseGuards(JwtGuard)
  @Get('by-event/:eventId')
  async listByEvent(@Req() req: any, @Param('eventId') eventId: string) {
    const orgId = req.user?.orgId
    return this.svc.listByEvent(orgId, eventId)
  }

  @UseGuards(JwtGuard)
  @Get('by-task/:taskId')
  async listByTask(@Req() req: any, @Param('taskId') taskId: string) {
    const orgId = req.user?.orgId
    return this.svc.listByTask(orgId, taskId)
  }

  @UseGuards(JwtGuard)
  @Get('search')
  async search(@Req() req: any, @Query('q') q: string, @Query('category') category?: string) {
    const orgId = req.user?.orgId
    return this.svc.search(orgId, q, category)
  }

  @UseGuards(JwtGuard)
  @Get('filter')
  async listWithFilters(
    @Req() req: any,
    @Query('clientId') clientId?: string,
    @Query('taskId') taskId?: string,
    @Query('category') category?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const orgId = req.user?.orgId
    return this.svc.listWithFilters(orgId, { clientId, taskId, category, from, to })
  }

  @UseGuards(JwtGuard)
  @Get('bulk-download')
  async bulkDownload(@Req() req: any, @Query('ids') ids: string) {
    const orgId = req.user?.orgId
    const documentIds = ids.split(',').filter(Boolean)
    return this.svc.bulkDownload(orgId, documentIds)
  }

  @UseGuards(JwtGuard)
  @Post('upload')
  async upload(@Req() req: any, @Body() body: any) {
    const orgId = req.user?.orgId
    return this.svc.upload(orgId, { ...body, uploadedBy: req.user?.sub })
  }

  @UseGuards(JwtGuard)
  @Put(':id/reupload')
  async reupload(@Req() req: any, @Param('id') id: string, @Body() body: { fileUrl: string; fileName?: string; fileType?: string; fileSize?: number }) {
    const orgId = req.user?.orgId
    return this.svc.reupload(orgId, id, { ...body, uploadedBy: req.user?.sub })
  }
}
