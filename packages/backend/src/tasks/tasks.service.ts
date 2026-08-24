import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { CreateTaskDto } from './dto/create-task.dto'
import { NotificationsService } from '../notifications/notifications.service'

export const TASK_STATUSES = ['not_started', 'in_progress', 'completed', 'verified'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

export type TaskTemplate = {
  id: string
  name: string
  serviceType: string
  priority: string
  defaultTitle: string
  defaultDescription?: string
  tags: string[]
  checklist: { label: string }[]
}

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  private readonly TEMPLATES: TaskTemplate[] = [
    {
      id: 'itr-filing',
      name: 'ITR Filing',
      serviceType: 'tax',
      priority: 'high',
      defaultTitle: 'ITR Filing - {{client}}',
      defaultDescription: 'Annual income tax return filing and computation.',
      tags: ['tax', 'compliance'],
      checklist: [
        { label: 'Collect annual statements' },
        { label: 'Compute income' },
        { label: 'Review prior year filings' },
        { label: 'File ITR' },
        { label: 'Acknowledge and dispatch' },
      ],
    },
    {
      id: 'tds-return',
      name: 'TDS Return',
      serviceType: 'tax',
      priority: 'medium',
      defaultTitle: 'TDS Return - {{client}}',
      defaultDescription: 'Quarterly TDS return preparation and filing.',
      tags: ['tax', 'tds'],
      checklist: [
        { label: 'Download form 26AS' },
        { label: 'Reconcile TDS records' },
        { label: 'Prepare quartery TDS return' },
        { label: 'File TDS return' },
        { label: 'Verify and dispatch' },
      ],
    },
    {
      id: 'monthly-bookkeeping',
      name: 'Monthly Bookkeeping',
      serviceType: 'accounting',
      priority: 'medium',
      defaultTitle: 'Monthly Bookkeeping - {{client}}',
      defaultDescription: 'Monthly bookkeeping, bank reconciliation and report generation.',
      tags: ['accounting', 'compliance'],
      checklist: [
        { label: 'Record journal entries' },
        { label: 'Reconcile bank statements' },
        { label: 'Post unpaid items' },
        { label: 'Generate financial reports' },
        { label: 'Review with client' },
      ],
    },
    {
      id: 'gst-return',
      name: 'GST Return',
      serviceType: 'tax',
      priority: 'high',
      defaultTitle: 'GST Return - {{client}}',
      defaultDescription: 'Monthly/quarterly GST return preparation and filing.',
      tags: ['tax', 'gst'],
      checklist: [
        { label: 'Reconcile input credit' },
        { label: 'Prepare GSTR-1' },
        { label: 'Prepare GSTR-3B' },
        { label: 'File returns' },
        { label: 'Cross-check with bank' },
      ],
    },
    {
      id: 'audit-engagement',
      name: 'Audit Engagement',
      serviceType: 'audit',
      priority: 'urgent',
      defaultTitle: 'Audit Engagement - {{client}}',
      defaultDescription: 'Statutory audit planning and execution.',
      tags: ['audit', 'compliance'],
      checklist: [
        { label: 'Send engagement letter' },
        { label: 'Perform risk assessment' },
        { label: 'Gather audit evidence' },
        { label: 'Draft audit report' },
        { label: 'Obtain management representation' },
        { label: 'Finalize and issue report' },
      ],
    },
  ]

  private toStrArray(value: any): string {
    if (!value) return '[]'
    if (Array.isArray(value)) return JSON.stringify(value)
    if (typeof value === 'string') {
      try {
        return JSON.stringify(JSON.parse(value))
      } catch {
        return value
      }
    }
    return JSON.stringify(value)
  }

  private fromStrArray(value: any): string[] {
    if (!value) return []
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  private serializeCustomFields(value: any): string | undefined {
    if (value === undefined || value === null) return undefined
    if (typeof value === 'string') return value
    return JSON.stringify(value)
  }

  private parseCustomFields(value: any): any {
    if (!value) return undefined
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }

  private normalizeAssigneeIds(value: any): string | null {
    if (Array.isArray(value)) return value.length > 0 ? value[0] : null
    if (typeof value === 'string') return value || null
    return null
  }

  private computeOverdue(dueDate: Date | null | undefined, status: string): boolean {
    if (!dueDate) return false
    if (['completed', 'verified'].includes(status)) return false
    return new Date(dueDate) < new Date()
  }

  private assertStatusTransition(current: string, next: string) {
    const cur = TASK_STATUSES.indexOf(current as TaskStatus)
    const nxt = TASK_STATUSES.indexOf(next as TaskStatus)
    if (nxt === -1) throw new BadRequestException(`Invalid status value: ${next}`)
    if (cur === -1) return
    if (nxt < cur) throw new BadRequestException(`Cannot move status backward from '${current}' to '${next}'`)
  }

  private serializeTask(task: any) {
    if (!task) return task
    return {
      ...task,
      assigneeIds: this.fromStrArray(task.assigneeIds),
      tags: this.fromStrArray(task.tags),
      customFields: this.parseCustomFields(task.customFields),
      isOverdue: this.computeOverdue(task.dueDate, task.status),
    }
  }

  private serializeNote(note: any) {
    if (!note) return note
    return {
      ...note,
      mentionedUserIds: this.fromStrArray(note.mentionedUserIds),
    }
  }

  private serializeTimeLog(log: any) {
    if (!log) return log
    return { ...log }
  }

  async create(orgId: string, dto: CreateTaskDto) {
    const { clientIds, recurrenceRuleId, ...rest } = dto
    const cleaned = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== null && v !== undefined && v !== '')) as any
    const data: any = {
      org: { connect: { id: orgId } },
      title: cleaned.title,
      status: cleaned.status || 'not_started',
      dueDate: cleaned.dueDate ? new Date(cleaned.dueDate) : undefined,
      targetDate: cleaned.targetDate ? new Date(cleaned.targetDate) : undefined,
      tags: this.toStrArray(cleaned.tags),
      priority: cleaned.priority || 'medium',
      serviceType: cleaned.serviceType,
      customFields: this.serializeCustomFields(cleaned.customFields),
      isOverdue: this.computeOverdue(cleaned.dueDate, cleaned.status || 'not_started'),
    }
    if (cleaned.description) data.description = cleaned.description
    if (cleaned.clientId) data.client = { connect: { id: cleaned.clientId } }
    if (cleaned.reviewerId) data.reviewerId = cleaned.reviewerId
    if (cleaned.assigneeIds) {
      data.assignee = { connect: { id: Array.isArray(cleaned.assigneeIds) ? cleaned.assigneeIds[0] : cleaned.assigneeIds } }
    }
    if (recurrenceRuleId) data.recurrenceRule = { connect: { id: recurrenceRuleId } }
    console.log('CREATE TASK DATA:', JSON.stringify(data))
    try {
      const task = this.serializeTask(await this.prisma.task.create({ data }))
      if (cleaned.assigneeIds) {
        const assigneeId = Array.isArray(cleaned.assigneeIds) ? cleaned.assigneeIds[0] : cleaned.assigneeIds
        this.notifications.create(orgId, assigneeId, 'task.assigned', { taskId: task.id, title: task.title }).catch(() => {})
      }
      return task
    } catch (err: any) {
      console.error('TASK CREATE ERROR:', err.message, err.stack, JSON.stringify(data))
      throw err
    }
  }

  async bulkCreate(orgId: string, dto: CreateTaskDto) {
    const clientIds = dto.clientIds || []
    if (!clientIds.length) throw new BadRequestException('clientIds is required for bulk creation')

    const owned = await this.prisma.client.findMany({
      where: { id: { in: clientIds }, orgId },
      select: { id: true, name: true },
    })
    if (owned.length !== clientIds.length) {
      const found = owned.map((c) => c.id)
      const invalid = clientIds.filter((id) => !found.includes(id))
      throw new BadRequestException(`Invalid client ids for this org: ${invalid.join(', ')}`)
    }

    const { recurrenceRuleId, ...rest } = dto
    const tasks = await this.prisma.$transaction(
      owned.map((c) => {
        const data: any = {
          org: { connect: { id: orgId } },
          client: { connect: { id: c.id } },
          tags: this.toStrArray(rest.tags),
          status: rest.status || 'not_started',
          priority: rest.priority || 'medium',
          isOverdue: this.computeOverdue(rest.dueDate, rest.status || 'not_started'),
        }
        if (rest.title) data.title = rest.title
        if (rest.description) data.description = rest.description
        if (rest.dueDate) data.dueDate = new Date(rest.dueDate)
        if (rest.targetDate) data.targetDate = new Date(rest.targetDate)
        if (rest.serviceType) data.serviceType = rest.serviceType
        if (rest.customFields) data.customFields = this.serializeCustomFields(rest.customFields)
        if (rest.reviewerId) data.reviewerId = rest.reviewerId
        const assigneeId = this.normalizeAssigneeIds(rest.assigneeIds)
        if (assigneeId) data.assignee = { connect: { id: assigneeId } }
        if (recurrenceRuleId) data.recurrenceRule = { connect: { id: recurrenceRuleId } }
        return this.prisma.task.create({ data })
      }),
    )
    return tasks.map((t) => this.serializeTask(t))
  }

  async findAll(orgId: string, filters: any) {
    const where: any = { orgId }

    if (filters.status) where.status = filters.status
    if (filters.serviceType) where.serviceType = filters.serviceType
    if (filters.assignee) where.assigneeIds = filters.assignee
    if (filters.userId) where.assigneeIds = { contains: filters.userId }

    if (filters.client) {
      if (Array.isArray(filters.client)) where.clientId = { in: filters.client }
      else where.clientId = filters.client
    }

    if (filters.tag) {
      where.tags = { contains: filters.tag }
    }

    if (filters.from || filters.to) {
      where.dueDate = {}
      if (filters.from) where.dueDate.gte = new Date(filters.from)
      if (filters.to) where.dueDate.lte = new Date(filters.to)
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const page = filters.page ? Math.max(1, parseInt(filters.page, 10)) : 1
    const limit = filters.limit ? Math.min(100, parseInt(filters.limit, 10)) : 50
    const skip = (page - 1) * limit

    const [tasks, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          client: { select: { name: true } },
          recurrenceRule: { select: { frequency: true, interval: true, nextRunDate: true } },
          _count: {
            select: {
              checklistItems: true,
              subtasks: true,
              notes: true,
              documentRequests: true,
              timeLogs: true,
            },
          },
        },
      }),
      this.prisma.task.count({ where }),
    ])

    return {
      data: tasks.map((t) => this.serializeTask(t)),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    }
  }

  async findOne(orgId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, orgId },
      include: {
        client: { select: { name: true, pan: true } },
        recurrenceRule: { select: { frequency: true, interval: true, nextRunDate: true } },
        checklistItems: { orderBy: { order: 'asc' } },
        subtasks: { orderBy: { id: 'asc' } },
        notes: { orderBy: { createdAt: 'desc' } },
        documentRequests: { include: { client: { select: { name: true } } } },
        timeLogs: { include: { user: { select: { name: true, email: true } } } },
        documents: { select: { id: true, fileUrl: true, fileName: true, category: true } },
      },
    })
    if (!task) throw new NotFoundException(`Task ${id} not found`)
    return this.serializeTask(task)
  }

  async update(orgId: string, id: string, dto: any) {
    const existing = await this.prisma.task.findFirst({ where: { id, orgId } })
    if (!existing) throw new NotFoundException(`Task ${id} not found`)

    const { clientIds, ...rest } = dto
    const data: any = { ...rest }

    if (rest.status && rest.status !== existing.status) {
      this.assertStatusTransition(existing.status, rest.status)
    }

    if (rest.assigneeIds !== undefined) {
      const normalized = this.normalizeAssigneeIds(rest.assigneeIds)
      if (normalized) data.assignee = { connect: { id: normalized } }
      else data.assignee = { disconnect: true }
    }
    if (Array.isArray(rest.tags)) data.tags = this.toStrArray(rest.tags)
    if (rest.customFields !== undefined) data.customFields = this.serializeCustomFields(rest.customFields)

    if ('recurrenceRuleId' in dto) {
      if (dto.recurrenceRuleId) {
        const rule = await this.prisma.recurrenceRule.findFirst({ where: { id: dto.recurrenceRuleId, orgId } })
        if (!rule) throw new NotFoundException(`Recurrence rule ${dto.recurrenceRuleId} not found`)
        data.recurrenceRule = { connect: { id: dto.recurrenceRuleId } }
      } else {
        data.recurrenceRule = { disconnect: true }
      }
    }

    data.isOverdue = this.computeOverdue(rest.dueDate ?? existing.dueDate, data.status ?? existing.status)

    const updated = this.serializeTask(await this.prisma.task.update({ where: { id }, data }))
    if (rest.status && rest.status !== existing.status) {
      this.notifications.create(orgId, updated.assigneeIds || existing.assigneeIds, 'task.status_changed', { taskId: updated.id, title: updated.title, status: updated.status }).catch(() => {})
    }
    return updated
  }

  async setStatus(orgId: string, id: string, status: string) {
    const task = await this.prisma.task.findFirst({ where: { id, orgId } })
    if (!task) throw new NotFoundException(`Task ${id} not found`)
    this.assertStatusTransition(task.status, status)

    const data: any = { status }
    if (status === 'completed' || status === 'verified') data.isOverdue = false

    const updated = this.serializeTask(await this.prisma.task.update({ where: { id }, data }))
    this.notifications.create(orgId, updated.assigneeIds, 'task.status_changed', { taskId: updated.id, title: updated.title, status: updated.status }).catch(() => {})
    return updated
  }

  async delete(orgId: string, id: string) {
    const existing = await this.prisma.task.findFirst({ where: { id, orgId } })
    if (!existing) throw new NotFoundException(`Task ${id} not found`)
    await this.prisma.task.delete({ where: { id } })
    return { id }
  }

  async verify(orgId: string, id: string, reviewerId?: string) {
    const task = await this.prisma.task.findFirst({ where: { id, orgId } })
    if (!task) throw new NotFoundException(`Task ${id} not found`)
    if (task.status !== 'completed') throw new BadRequestException('Task must be completed before verification')
    return this.serializeTask(await this.prisma.task.update({
      where: { id },
      data: { status: 'verified', isOverdue: false },
    }))
  }

  // Checklists
  async addChecklistItem(orgId: string, taskId: string, body: { label: string; order?: number }) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, orgId } })
    if (!task) throw new NotFoundException(`Task ${taskId} not found`)
    const order = body.order ?? (await this.prisma.taskChecklistItem.count({ where: { taskId } }))
    return this.prisma.taskChecklistItem.create({
      data: { task: { connect: { id: taskId } }, label: body.label, order },
    })
  }

  async removeChecklistItem(orgId: string, taskId: string, itemId: string) {
    const item = await this.prisma.taskChecklistItem.findFirst({
      where: { id: itemId, task: { orgId } },
    })
    if (!item) throw new NotFoundException(`Checklist item ${itemId} not found`)
    await this.prisma.taskChecklistItem.delete({ where: { id: itemId } })
    return { id: itemId }
  }

  async toggleChecklistItem(orgId: string, taskId: string, itemId: string) {
    const item = await this.prisma.taskChecklistItem.findFirst({
      where: { id: itemId, taskId, task: { orgId } },
    })
    if (!item) throw new NotFoundException(`Checklist item ${itemId} not found`)
    return this.prisma.taskChecklistItem.update({ where: { id: itemId }, data: { isDone: !item.isDone } })
  }

  // Subtasks
  async createSubtask(orgId: string, taskId: string, body: { title: string; assigneeId?: string; status?: string }) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, orgId } })
    if (!task) throw new NotFoundException(`Task ${taskId} not found`)
    const data: any = { title: body.title, status: body.status || 'not_started' }
    if (body.assigneeId) {
      const assignee = await this.prisma.user.findFirst({ where: { id: body.assigneeId, orgId } })
      if (!assignee) throw new NotFoundException(`Assignee ${body.assigneeId} not found`)
      data.assignee = { connect: { id: body.assigneeId } }
    }
    return this.prisma.taskSubtask.create({
      data: { parentTask: { connect: { id: taskId } }, ...data },
    })
  }

  async listSubtasks(orgId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, orgId } })
    if (!task) throw new NotFoundException(`Task ${taskId} not found`)
    return this.prisma.taskSubtask.findMany({ where: { parentTaskId: taskId }, orderBy: { id: 'asc' } })
  }

  async updateSubtask(orgId: string, taskId: string, itemId: string, body: any) {
    const item = await this.prisma.taskSubtask.findFirst({
      where: { id: itemId, parentTask: { orgId } },
    })
    if (!item || item.parentTaskId !== taskId) throw new NotFoundException(`Subtask ${itemId} not found`)
    return this.prisma.taskSubtask.update({ where: { id: itemId }, data: body })
  }

  async deleteSubtask(orgId: string, taskId: string, itemId: string) {
    const item = await this.prisma.taskSubtask.findFirst({
      where: { id: itemId, parentTask: { orgId } },
    })
    if (!item || item.parentTaskId !== taskId) throw new NotFoundException(`Subtask ${itemId} not found`)
    await this.prisma.taskSubtask.delete({ where: { id: itemId } })
    return { id: itemId }
  }

  // Notes
  async addNote(orgId: string, taskId: string, authorId: string, body: { body: string; mentionedUserIds?: string[] }) {
    if (!body.body) throw new BadRequestException('Note body is required')
    const task = await this.prisma.task.findFirst({ where: { id: taskId, orgId } })
    if (!task) throw new NotFoundException(`Task ${taskId} not found`)

    const mentioned = body.mentionedUserIds || []
    let author: any = undefined
    if (authorId) {
      const user = await this.prisma.user.findFirst({ where: { id: authorId, orgId } })
      if (user) author = { connect: { id: authorId } }
    }
    if (mentioned.length) {
      await this.prisma.user.findMany({ where: { id: { in: mentioned }, orgId } })
    }

    const note = await this.prisma.taskNote.create({
      data: {
        task: { connect: { id: taskId } },
        body: body.body,
        mentionedUserIds: this.toStrArray(mentioned),
        ...(author ? { author } : {}),
      },
    })
    return this.serializeNote(note)
  }

  async listNotes(orgId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, orgId } })
    if (!task) throw new NotFoundException(`Task ${taskId} not found`)
    const notes = await this.prisma.taskNote.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, name: true, email: true } } },
    })
    return notes.map((n) => this.serializeNote(n))
  }

  // Time logs
  async startTimeLog(orgId: string, taskId: string, userId?: string) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, orgId } })
    if (!task) throw new NotFoundException(`Task ${taskId} not found`)

    const open = await this.prisma.taskTimeLog.findFirst({
      where: { taskId, endTime: null, orgId },
    })
    if (open) throw new BadRequestException('A timer is already running for this task')

    return this.prisma.taskTimeLog.create({
      data: {
        org: { connect: { id: orgId } },
        task: { connect: { id: taskId } },
        ...(userId ? { user: { connect: { id: userId } } } : {}),
        startTime: new Date(),
      },
    })
  }

  async stopTimeLog(orgId: string, taskId: string, logId: string) {
    const log = await this.prisma.taskTimeLog.findFirst({ where: { id: logId, taskId, orgId } })
    if (!log) throw new NotFoundException(`Time log ${logId} not found`)
    if (log.endTime) throw new BadRequestException('Timer already stopped')

    const endTime = new Date()
    const durationMinutes = Math.round((endTime.getTime() - new Date(log.startTime).getTime()) / 60000)
    return this.prisma.taskTimeLog.update({
      where: { id: logId },
      data: { endTime, durationMinutes },
    })
  }

  async addTimeLog(orgId: string, taskId: string, body: any) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, orgId } })
    if (!task) throw new NotFoundException(`Task ${taskId} not found`)
    if (!body.startTime) throw new BadRequestException('startTime is required')

    const data: any = {
      org: { connect: { id: orgId } },
      task: { connect: { id: taskId } },
      startTime: new Date(body.startTime),
    }
    if (body.endTime) {
      data.endTime = new Date(body.endTime)
      if (body.durationMinutes) data.durationMinutes = Number(body.durationMinutes)
      else data.durationMinutes = Math.round((data.endTime.getTime() - new Date(body.startTime).getTime()) / 60000)
    } else if (body.durationMinutes) {
      data.durationMinutes = Number(body.durationMinutes)
    }
    if (body.userId) {
      const user = await this.prisma.user.findFirst({ where: { id: body.userId, orgId } })
      if (!user) throw new NotFoundException(`User ${body.userId} not found`)
      data.user = { connect: { id: body.userId } }
    }
    if (body.description) data.description = body.description

    return this.prisma.taskTimeLog.create({ data })
  }

  async listTimeLogs(orgId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, orgId } })
    if (!task) throw new NotFoundException(`Task ${taskId} not found`)
    const logs = await this.prisma.taskTimeLog.findMany({
      where: { taskId, orgId },
      orderBy: { startTime: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } }, task: { select: { title: true } } },
    })
    return logs.map((l) => this.serializeTimeLog(l))
  }

  totalBillableMinutes(orgId: string, taskId: string) {
    return this.prisma.taskTimeLog.aggregate({
      where: { taskId, orgId },
      _sum: { durationMinutes: true },
    })
  }

  // Recurrence
  async createRecurrenceRule(orgId: string, dto: any) {
    const frequency = dto.frequency
    const valid = ['daily', 'weekly', 'monthly', 'yearly']
    if (!frequency || !valid.includes(frequency)) {
      throw new BadRequestException(`Invalid frequency. Must be one of: ${valid.join(', ')}`)
    }
    const data: any = {
      org: { connect: { id: orgId } },
      frequency,
      interval: dto.interval || 1,
    }
    if (dto.nextRunDate) data.nextRunDate = new Date(dto.nextRunDate)

    const rule = await this.prisma.recurrenceRule.create({ data })

    if (Array.isArray(dto.taskIds) && dto.taskIds.length) {
      await this.prisma.task.updateMany({
        where: { id: { in: dto.taskIds }, orgId },
        data: { recurrenceRuleId: rule.id },
      })
    }
    return rule
  }

  async listRecurrenceRules(orgId: string) {
    return this.prisma.recurrenceRule.findMany({
      where: { orgId },
      include: { tasks: { select: { id: true, title: true, clientId: true } } },
      orderBy: { id: 'desc' },
    })
  }

  private addInterval(date: Date, frequency: string, interval: number): Date {
    const d = new Date(date)
    switch (frequency) {
      case 'daily':
        d.setDate(d.getDate() + interval)
        break
      case 'weekly':
        d.setDate(d.getDate() + interval * 7)
        break
      case 'monthly':
        d.setMonth(d.getMonth() + interval)
        break
      case 'yearly':
        d.setFullYear(d.getFullYear() + interval)
        break
    }
    return d
  }

  async generateDueTasks(orgId: string, ruleId?: string) {
    const where: any = { orgId, nextRunDate: { lte: new Date() } }
    if (ruleId) where.id = ruleId
    const rules = await this.prisma.recurrenceRule.findMany({
      where,
      include: { tasks: true },
    })

    const generated = []
    for (const rule of rules) {
      for (const template of rule.tasks) {
        const newTask = await this.prisma.task.create({
          data: {
            org: { connect: { id: orgId } },
            clientId: template.clientId,
            title: template.title,
            description: template.description,
            assigneeIds: template.assigneeIds,
            tags: template.tags,
            priority: template.priority,
            serviceType: template.serviceType,
            customFields: template.customFields,
            recurrenceRule: { connect: { id: rule.id } },
            status: 'not_started',
            isOverdue: false,
            dueDate: template.dueDate ? this.addInterval(new Date(template.dueDate), rule.frequency, rule.interval) : null,
            targetDate: template.targetDate
              ? this.addInterval(new Date(template.targetDate), rule.frequency, rule.interval)
              : null,
          } as any,
        })
        generated.push(this.serializeTask(newTask))
      }
      await this.prisma.recurrenceRule.update({
        where: { id: rule.id },
        data: { nextRunDate: this.addInterval(new Date(rule.nextRunDate || new Date()), rule.frequency, rule.interval) },
      })
    }
    return generated
  }

  // Templates
  getTemplates() {
    return this.TEMPLATES
  }

  async createFromTemplate(orgId: string, templateId: string, body: { clientId?: string; assigneeIds?: string[] }) {
    const tmpl = this.TEMPLATES.find((t) => t.id === templateId)
    if (!tmpl) throw new NotFoundException(`Template ${templateId} not found`)

    const title = body.clientId ? await this.resolveTemplatedTitle(orgId, tmpl, body.clientId) : tmpl.defaultTitle
    const checklist = tmpl.checklist

    const created = await this.prisma.$transaction(async (tx) => {
      const data: any = {
        org: { connect: { id: orgId } },
        title,
        description: tmpl.defaultDescription,
        priority: tmpl.priority,
        serviceType: tmpl.serviceType,
        tags: this.toStrArray(tmpl.tags),
        status: 'not_started',
        isOverdue: false,
      }
      if (body.clientId) data.client = { connect: { id: body.clientId } }
      const assigneeId = this.normalizeAssigneeIds(body.assigneeIds)
      if (assigneeId) data.assignee = { connect: { id: assigneeId } }

      const task = await tx.task.create({ data })

      if (checklist.length) {
        await tx.taskChecklistItem.createMany({
          data: checklist.map((c, i) => ({
            taskId: task.id,
            label: c.label,
            order: i,
          })),
        })
      }
      return task
    })
    return this.serializeTask(created)
  }

  private async resolveTemplatedTitle(orgId: string, tmpl: TaskTemplate, clientId: string) {
    const client = await this.prisma.client.findFirst({ where: { id: clientId, orgId }, select: { name: true } })
    const name = client?.name || clientId
    return tmpl.defaultTitle.replace('{{client}}', name)
  }

  // Recompute overdue flag for the org's tasks
  async refreshOverdue(orgId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { orgId, isOverdue: true },
      select: { id: true, dueDate: true, status: true },
    })
    await this.prisma.$transaction(
      tasks.map((t) =>
        this.prisma.task.update({
          where: { id: t.id },
          data: { isOverdue: this.computeOverdue(t.dueDate, t.status) },
        }),
      ),
    )
    return { updated: tasks.length }
  }
}
