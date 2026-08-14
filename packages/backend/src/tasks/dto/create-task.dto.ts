export class CreateTaskDto {
  title!: string
  description?: string
  clientId?: string

  // For bulk creation: when provided, a task copy is created for each client id.
  clientIds?: string[]

  status?: string
  dueDate?: Date
  targetDate?: Date
  assigneeIds?: string[]
  tags?: string[]
  reviewerId?: string
  recurrenceRuleId?: string
  priority?: string
  serviceType?: string
  customFields?: Record<string, any>
}
