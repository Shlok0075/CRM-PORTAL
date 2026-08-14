export class CreateRecurrenceDto {
  frequency!: string
  interval?: number
  nextRunDate?: Date

  // Optional task ids (template tasks) to associate with the recurrence rule.
  taskIds?: string[]
}
