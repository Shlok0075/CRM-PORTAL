export class SendMessageDto {
  clientIds!: string[]
  channel!: string
  templateId?: string
  body?: string
}
