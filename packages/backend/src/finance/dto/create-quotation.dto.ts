export class QuotationLineItemDto {
  description: string
  quantity?: number
  unitPrice?: number
  amount?: number
}

export class CreateQuotationDto {
  clientId?: string
  quotationLineItems: QuotationLineItemDto[]
}
