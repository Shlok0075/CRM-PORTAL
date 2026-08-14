import { IsEmail, IsNotEmpty, MinLength } from 'class-validator'

export class CreateEmployeeDto {
  @IsEmail() email: string
  @IsNotEmpty() name: string
  @MinLength(6) password: string
  phone?: string
  designation?: string
  role?: string
}
