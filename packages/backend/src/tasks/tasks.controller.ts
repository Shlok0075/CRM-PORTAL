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
import { TasksService } from './tasks.service'
import { CreateTaskDto } from './dto/create-task.dto'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('tasks')
@UseGuards(JwtGuard)
export class TasksController {
  constructor(private svc: TasksService) {}

  private orgId(req: any) {
    return req.user?.orgId
  }

  private userId(req: any) {
    return req.user?.sub
  }

  @Get('templates')
  templates() {
    return this.svc.getTemplates()
  }

  @Post('from-template/:templateId')
  async createFromTemplate(
    @Req() req: any,
    @Param('templateId') templateId: string,
    @Body() body: { clientId?: string; assigneeIds?: string[] },
  ) {
    return this.svc.createFromTemplate(this.orgId(req), templateId, body)
  }

  @Post('bulk')
  async bulkCreate(@Req() req: any, @Body() dto: CreateTaskDto) {
    return this.svc.bulkCreate(this.orgId(req), dto)
  }

  @Post()
  async create(@Req() req: any, @Body() dto: any) {
    try {
      return await this.svc.create(this.orgId(req), dto)
    } catch (err: any) {
      console.error('TASK CREATE ERROR:', err.message, err.stack, JSON.stringify(dto))
      throw err
    }
  }

  @Get()
  async list(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('assignee') assignee?: string,
    @Query('client') client?: string,
    @Query('tag') tag?: string,
    @Query('serviceType') serviceType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.findAll(this.orgId(req), {
      status,
      assignee,
      client,
      tag,
      serviceType,
      from,
      to,
      search,
      page,
      limit,
      userId: req.user?.role === 'member' ? req.user?.sub : undefined,
    })
  }

  @Get(':id')
  async get(@Req() req: any, @Param('id') id: string) {
    return this.svc.findOne(this.orgId(req), id)
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.svc.update(this.orgId(req), id, dto)
  }

  @Patch(':id/status')
  async setStatus(@Req() req: any, @Param('id') id: string, @Body('status') status: string) {
    return this.svc.setStatus(this.orgId(req), id, status)
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.svc.delete(this.orgId(req), id)
  }

  @Patch(':id/verify')
  async verify(@Req() req: any, @Param('id') id: string) {
    return this.svc.verify(this.orgId(req), id, this.userId(req))
  }

  // Checklist
  @Post(':id/checklist')
  async addChecklistItem(@Req() req: any, @Param('id') id: string, @Body() body: { label: string; order?: number }) {
    return this.svc.addChecklistItem(this.orgId(req), id, body)
  }

  @Delete(':id/checklist/:itemId')
  async removeChecklistItem(@Req() req: any, @Param('id') taskId: string, @Param('itemId') itemId: string) {
    return this.svc.removeChecklistItem(this.orgId(req), taskId, itemId)
  }

  @Patch(':id/checklist/:itemId/toggle')
  async toggleChecklistItem(@Req() req: any, @Param('id') taskId: string, @Param('itemId') itemId: string) {
    return this.svc.toggleChecklistItem(this.orgId(req), taskId, itemId)
  }

  // Subtasks
  @Post(':id/subtasks')
  async createSubtask(
    @Req() req: any,
    @Param('id') taskId: string,
    @Body() body: { title: string; assigneeId?: string; status?: string },
  ) {
    return this.svc.createSubtask(this.orgId(req), taskId, body)
  }

  @Get(':id/subtasks')
  async listSubtasks(@Req() req: any, @Param('id') taskId: string) {
    return this.svc.listSubtasks(this.orgId(req), taskId)
  }

  @Patch(':id/subtasks/:itemId')
  async updateSubtask(@Req() req: any, @Param('id') taskId: string, @Param('itemId') itemId: string, @Body() body: any) {
    return this.svc.updateSubtask(this.orgId(req), taskId, itemId, body)
  }

  @Delete(':id/subtasks/:itemId')
  async deleteSubtask(@Req() req: any, @Param('id') taskId: string, @Param('itemId') itemId: string) {
    return this.svc.deleteSubtask(this.orgId(req), taskId, itemId)
  }

  // Notes
  @Post(':id/notes')
  async addNote(@Req() req: any, @Param('id') taskId: string, @Body() body: { body: string; mentionedUserIds?: string[] }) {
    return this.svc.addNote(this.orgId(req), taskId, this.userId(req), body)
  }

  @Get(':id/notes')
  async listNotes(@Req() req: any, @Param('id') taskId: string) {
    return this.svc.listNotes(this.orgId(req), taskId)
  }

  // Time logs
  @Post(':id/time-logs/start')
  async startTimeLog(@Req() req: any, @Param('id') taskId: string) {
    return this.svc.startTimeLog(this.orgId(req), taskId, this.userId(req))
  }

  @Post(':id/time-logs/:logId/stop')
  async stopTimeLog(@Req() req: any, @Param('id') taskId: string, @Param('logId') logId: string) {
    return this.svc.stopTimeLog(this.orgId(req), taskId, logId)
  }

  @Post(':id/time-logs')
  async addTimeLog(@Req() req: any, @Param('id') taskId: string, @Body() body: any) {
    return this.svc.addTimeLog(this.orgId(req), taskId, body)
  }

  @Get(':id/time-logs')
  async listTimeLogs(@Req() req: any, @Param('id') taskId: string) {
    return this.svc.listTimeLogs(this.orgId(req), taskId)
  }
}
