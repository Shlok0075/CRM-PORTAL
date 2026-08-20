export class CreateEventDto {
  title!: string
  description?: string
  clientId?: string
  assigneeIds?: string[]
  status?: string
  priority?: string
  startDate?: string
  dueDate?: string
  expectedDate?: string
}

export class UpdateEventDto {
  title?: string
  description?: string
  clientId?: string
  assigneeIds?: string[]
  status?: string
  priority?: string
  startDate?: string
  dueDate?: string
  expectedDate?: string
}
