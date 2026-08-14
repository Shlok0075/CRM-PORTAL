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
    const cleaned = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== null && v !== undefined))
    const data: any = { ...cleaned, status: 'pending', org: { connect: { id: orgId } } }
    if (cleaned.assigneeId) data.assignee = { connect: { id: cleaned.assigneeId } }
    if (data.dueDate) data.dueDate = new Date(data.dueDate)
    try {
      return await this.prisma.todo.create({ data, include: { assignee: { select: { name: true } } } })
    } catch (err: any) {
      console.error('TODO CREATE ERROR:', err.message, err.stack)
      throw err
    }
  }

  async update(orgId: string, id: string, dto: UpdateTodoDto) {
    const todo = await this.prisma.todo.findFirst({ where: { id, orgId } })
    if (!todo) throw new NotFoundException(`Todo ${id} not found`)
    const data: any = { ...dto }
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate)
    return this.prisma.todo.update({ where: { id }, data, include: { assignee: { select: { name: true } } } })
  }

  async remove(orgId: string, id: string) {
    const todo = await this.prisma.todo.findFirst({ where: { id, orgId } })
    if (!todo) throw new NotFoundException(`Todo ${id} not found`)
    await this.prisma.todo.delete({ where: { id } })
    return { id }
  }
}
