export class LineItemDto {
  description: string
  quantity: number
  unitPrice: number
  amount: number
  hsnSac?: string
}

export class CreateInvoiceDto {
  clientId?: string
  billingProfileId?: string
  lineItems: LineItemDto[]
  hsnSac?: string
  placeOfSupply?: string
  issueDate?: string
  dueDate?: string
}
