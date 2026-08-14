export class CreateMentorSessionDto {
  startupId!: string
  date!: string
  durationMinutes?: number
  notes?: string
  actionItems?: string
}
