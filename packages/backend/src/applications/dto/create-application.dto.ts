export class CreateApplicationDto {
  orgId?: string
  startupName!: string
  founderNames!: string[]
  sector?: string
  stage?: string
  pitchDeckUrl?: string
  askAmount?: number
  source?: string
}
