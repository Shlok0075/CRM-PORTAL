export class CreateExpenseDto {
  clientId?: string
  categoryId?: string
  amount: number
  isBillable?: boolean
  description?: string
  date?: string
  attachmentId?: string
}
