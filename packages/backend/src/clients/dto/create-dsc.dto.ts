export class CreateDscDto {
  clientId!: string
  holderName!: string
  dscClass?: string
  issuingAuthority?: string
  expiryDate!: string
  custodyStatus?: string
}
