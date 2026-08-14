export class CreateReceiptDto {
  invoiceId?: string
  clientId?: string
  amount: number
  mode: string
  date?: string
}
