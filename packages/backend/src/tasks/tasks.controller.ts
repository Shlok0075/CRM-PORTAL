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
export class TasksController {
  constructor(private svc: TasksService) {}

  private orgId(req: any) {
    return req.user?.orgId
  }

  private userId(req: any) {
    return req.user?.sub
  }

  @UseGuards(JwtGuard)
  @Get('templates')
  templates() {
    return this.svc.getTemplates()
  }

  @UseGuards(JwtGuard)
  @Post('from-template/:templateId')
  async createFromTemplate(
    @Req() req: any,
    @Param('templateId') templateId: string,
    @Body() body: { clientId?: string; assigneeIds?: string[] },
  ) {
    return this.svc.createFromTemplate(this.orgId(req), templateId, body)
  }

  @UseGuards(JwtGuard)
  @Post('bulk')
  async bulkCreate(@Req() req: any, @Body() dto: CreateTaskDto) {
    return this.svc.bulkCreate(this.orgId(req), dto)
  }

  @UseGuards(JwtGuard)
  @Post()
  async create(@Req() req: any, @Body() dto: any) {
    try {
      return await this.svc.create(this.orgId(req), dto)
    } catch (err: any) {
      console.error('TASK CREATE ERROR:', err.message, err.stack, JSON.stringify(dto))
      throw err
    }
  }

  @UseGuards(JwtGuard)
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
    })
  }

  @UseGuards(JwtGuard)
  @Get(':id')
  async get(@Req() req: any, @Param('id') id: string) {
    return this.svc.findOne(this.orgId(req), id)
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.svc.update(this.orgId(req), id, dto)
  }

  @UseGuards(JwtGuard)
  @Patch(':id/status')
  async setStatus(@Req() req: any, @Param('id') id: string, @Body('status') status: string) {
    return this.svc.setStatus(this.orgId(req), id, status)
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.svc.delete(this.orgId(req), id)
  }

  // Checklist
  @UseGuards(JwtGuard)
  @Post(':id/checklist')
  async addChecklistItem(@Req() req: any, @Param('id') id: string, @Body() body: { label: string; order?: number }) {
    return this.svc.addChecklistItem(this.orgId(req), id, body)
  }

  @UseGuards(JwtGuard)
  @Delete(':id/checklist/:itemId')
  async removeChecklistItem(@Req() req: any, @Param('id') taskId: string, @Param('itemId') itemId: string) {
    return this.svc.removeChecklistItem(this.orgId(req), taskId, itemId)
  }

  @UseGuards(JwtGuard)
  @Patch(':id/checklist/:itemId/toggle')
  async toggleChecklistItem(@Req() req: any, @Param('id') taskId: string, @Param('itemId') itemId: string) {
    return this.svc.toggleChecklistItem(this.orgId(req), taskId, itemId)
  }

  // Subtasks
  @UseGuards(JwtGuard)
  @Post(':id/subtasks')
  async createSubtask(
    @Req() req: any,
    @Param('id') taskId: string,
    @Body() body: { title: string; assigneeId?: string; status?: string },
  ) {
    return this.svc.createSubtask(this.orgId(req), taskId, body)
  }

  @UseGuards(JwtGuard)
  @Get(':id/subtasks')
  async listSubtasks(@Req() req: any, @Param('id') taskId: string) {
    return this.svc.listSubtasks(this.orgId(req), taskId)
  }

  @UseGuards(JwtGuard)
  @Patch(':id/subtasks/:itemId')
  async updateSubtask(@Req() req: any, @Param('id') taskId: string, @Param('itemId') itemId: string, @Body() body: any) {
    return this.svc.updateSubtask(this.orgId(req), taskId, itemId, body)
  }

  @UseGuards(JwtGuard)
  @Delete(':id/subtasks/:itemId')
  async deleteSubtask(@Req() req: any, @Param('id') taskId: string, @Param('itemId') itemId: string) {
    return this.svc.deleteSubtask(this.orgId(req), taskId, itemId)
  }

  // Notes
  @UseGuards(JwtGuard)
  @Post(':id/notes')
  async addNote(@Req() req: any, @Param('id') taskId: string, @Body() body: { body: string; mentionedUserIds?: string[] }) {
    return this.svc.addNote(this.orgId(req), taskId, this.userId(req), body)
  }

  @UseGuards(JwtGuard)
  @Get(':id/notes')
  async listNotes(@Req() req: any, @Param('id') taskId: string) {
    return this.svc.listNotes(this.orgId(req), taskId)
  }

  // Time logs
  @UseGuards(JwtGuard)
  @Post(':id/time-logs/start')
  async startTimeLog(@Req() req: any, @Param('id') taskId: string) {
    return this.svc.startTimeLog(this.orgId(req), taskId, this.userId(req))
  }

  @UseGuards(JwtGuard)
  @Post(':id/time-logs/:logId/stop')
  async stopTimeLog(@Req() req: any, @Param('id') taskId: string, @Param('logId') logId: string) {
    return this.svc.stopTimeLog(this.orgId(req), taskId, logId)
  }

  @UseGuards(JwtGuard)
  @Post(':id/time-logs')
  async addTimeLog(@Req() req: any, @Param('id') taskId: string, @Body() body: any) {
    return this.svc.addTimeLog(this.orgId(req), taskId, body)
  }

  @UseGuards(JwtGuard)
  @Get(':id/time-logs')
  async listTimeLogs(@Req() req: any, @Param('id') taskId: string) {
    return this.svc.listTimeLogs(this.orgId(req), taskId)
  }
}
