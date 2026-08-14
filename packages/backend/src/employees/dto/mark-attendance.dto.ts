import { IsOptional, IsString } from 'class-validator'

export class MarkAttendanceDto {
  @IsString() userId: string
  @IsString() date: string
  @IsOptional() inTime?: string
  @IsOptional() outTime?: string
  @IsString() status: string
}
