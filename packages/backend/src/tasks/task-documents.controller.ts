import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common'
import { TaskDocumentsService } from './task-documents.service'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('task-documents')
@UseGuards(JwtGuard)
export class TaskDocumentsController {
  constructor(private svc: TaskDocumentsService) {}

  private orgId(req: any) {
    return req.user?.orgId
  }

  @Get()
  async list(
    @Req() req: any,
    @Query('clientId') clientId?: string,
    @Query('taskId') taskId?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.findAll(this.orgId(req), { clientId, taskId, status })
  }

  @Get(':id')
  async get(@Req() req: any, @Param('id') id: string) {
    return this.svc.findOne(this.orgId(req), id)
  }

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    return this.svc.create(this.orgId(req), body)
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.update(this.orgId(req), id, body)
  }

  @Post(':id/link-document')
  async linkDocument(@Req() req: any, @Param('id') id: string, @Body('documentId') documentId: string) {
    return this.svc.linkDocument(this.orgId(req), id, documentId)
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.svc.delete(this.orgId(req), id)
  }
}
