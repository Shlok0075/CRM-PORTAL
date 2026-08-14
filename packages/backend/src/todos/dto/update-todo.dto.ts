import { IsOptional, IsString } from 'class-validator'

export class UpdateTodoDto {
  @IsOptional() @IsString() title?: string
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsString() assigneeId?: string
  @IsOptional() @IsString() dueDate?: string
  @IsOptional() @IsString() repeatRule?: string
  @IsOptional() @IsString() priority?: string
}
