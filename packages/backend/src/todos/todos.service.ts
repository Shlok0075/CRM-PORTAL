import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { CreateTodoDto } from './dto/create-todo.dto'
import { UpdateTodoDto } from './dto/update-todo.dto'

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, assigneeId?: string, status?: string) {
    const where: any = { orgId }
    if (assigneeId) where.assigneeId = assigneeId
    if (status) where.status = status
    return this.prisma.todo.findMany({
      where,
      include: { assignee: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(orgId: string, id: string) {
    const todo = await this.prisma.todo.findFirst({
      where: { id, orgId },
      include: { assignee: { select: { id: true, name: true, email: true } } },
    })
    if (!todo) throw new NotFoundException(`Todo ${id} not found`)
    return todo
  }

  async create(orgId: string, dto: CreateTodoDto) {
    const cleaned = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== null && v !== undefined && v !== '')) as any
    const data: any = {
      org: { connect: { id: orgId } },
      title: cleaned.title,
      status: 'pending',
      dueDate: cleaned.dueDate ? new Date(cleaned.dueDate) : undefined,
      repeatRule: cleaned.repeatRule,
      priority: cleaned.priority || 'medium',
    }
    if (cleaned.assigneeId) {
      data.assignee = { connect: { id: cleaned.assigneeId } }
    }
    try {
      return await this.prisma.todo.create({ data, include: { assignee: { select: { name: true } } } })
    } catch (err: any) {
      console.error('TODO CREATE ERROR:', err.message, err.stack, JSON.stringify(data))
      throw err
    }
  }

  async update(orgId: string, id: string, dto: UpdateTodoDto) {
    const todo = await this.prisma.todo.findFirst({ where: { id, orgId } })
    if (!todo) throw new NotFoundException(`Todo ${id} not found`)
    const data: any = { ...dto }
    if (data.dueDate) data.dueDate = new Date(data.dueDate)
    if (data.assigneeId) {
      data.assignee = { connect: { id: data.assigneeId } }
      delete data.assigneeId
    }
    return this.prisma.todo.update({ where: { id }, data, include: { assignee: { select: { name: true } } } })
  }

  async remove(orgId: string, id: string) {
    const todo = await this.prisma.todo.findFirst({ where: { id, orgId } })
    if (!todo) throw new NotFoundException(`Todo ${id} not found`)
    await this.prisma.todo.delete({ where: { id } })
    return { id }
  }
}
