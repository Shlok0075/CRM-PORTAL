import { Controller, Post, Body, Get, Param, Req, UseGuards, Query, Put, Delete, Patch, Res, Header } from '@nestjs/common'
import { DocumentsService } from './documents.service'
import { JwtGuard } from '../auth/jwt.guard'
import { CreateDocumentDto } from './dto/create-document.dto'
import { Response } from 'express'

@Controller('documents')
export class DocumentsController {
  constructor(private svc: DocumentsService) {}

  @UseGuards(JwtGuard)
  @Get()
  async listAll(@Req() req: any, @Query('search') search?: string, @Query('category') category?: string) {
    const orgId = req.user?.orgId
    if (search) {
      return this.svc.search(orgId, search, category)
    }
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
  @Post('upload-file')
  async uploadFile(@Req() req: any, @Body() body: any) {
    const orgId = req.user?.orgId
    return this.svc.uploadFile(orgId, { ...body, uploadedBy: req.user?.sub, uploadedByType: 'staff' })
  }

  @UseGuards(JwtGuard)
  @Put(':id/reupload')
  async reupload(@Req() req: any, @Param('id') id: string, @Body() body: { fileUrl: string; fileName?: string; fileType?: string; fileSize?: number }) {
    const orgId = req.user?.orgId
    return this.svc.reupload(orgId, id, { ...body, uploadedBy: req.user?.sub })
  }

  @UseGuards(JwtGuard)
  @Put(':id/reupload-file')
  async reuploadFile(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const orgId = req.user?.orgId
    return this.svc.reuploadFile(orgId, id, { ...body, uploadedBy: req.user?.sub, uploadedByType: 'staff' })
  }

  @UseGuards(JwtGuard)
  @Get(':id/download')
  async download(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const orgId = req.user?.orgId
    const doc = await this.svc.getDocument(orgId, id)
    if (!doc) {
      res.status(404).json({ message: 'Document not found' })
      return
    }

    if (doc.fileUrl && doc.fileUrl.startsWith('data:')) {
      const matches = doc.fileUrl.match(/^data:([^;]+);/)
      const contentType = matches ? matches[1] : 'application/octet-stream'
      const base64Data = doc.fileUrl.split(',')[1] || ''
      const buffer = Buffer.from(base64Data, 'base64')
      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName || 'document'}"`)
      res.send(buffer)
      return
    }

    if (doc.fileUrl) {
      res.redirect(doc.fileUrl)
      return
    }

    res.status(404).json({ message: 'File not found' })
  }

  @UseGuards(JwtGuard)
  @Get(':id/preview')
  async preview(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const orgId = req.user?.orgId
    const doc = await this.svc.getDocument(orgId, id)
    if (!doc) {
      res.status(404).json({ message: 'Document not found' })
      return
    }

    if (doc.fileUrl && doc.fileUrl.startsWith('data:')) {
      const matches = doc.fileUrl.match(/^data:([^;]+);/)
      const contentType = matches ? matches[1] : 'application/octet-stream'
      const base64Data = doc.fileUrl.split(',')[1] || ''
      const buffer = Buffer.from(base64Data, 'base64')
      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', `inline; filename="${doc.fileName || 'document'}"`)
      res.send(buffer)
      return
    }

    if (doc.fileUrl) {
      res.redirect(doc.fileUrl)
      return
    }

    res.status(404).json({ message: 'File not found' })
  }
}
