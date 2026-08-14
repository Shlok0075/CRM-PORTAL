import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query } from '@nestjs/common'
import { TodosService } from './todos.service'
import { CreateTodoDto } from './dto/create-todo.dto'
import { UpdateTodoDto } from './dto/update-todo.dto'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('todos')
@UseGuards(JwtGuard)
export class TodosController {
  constructor(private svc: TodosService) {}

  private orgId(req: any) { return req.user?.orgId }

  @Get()
  list(@Req() req: any, @Query('assigneeId') assigneeId?: string, @Query('status') status?: string) {
    return this.svc.findAll(this.orgId(req), assigneeId, status)
  }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.svc.findOne(this.orgId(req), id)
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateTodoDto) {
    return this.svc.create(this.orgId(req), dto)
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateTodoDto) {
    return this.svc.update(this.orgId(req), id, dto)
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.svc.remove(this.orgId(req), id)
  }
}
