import { IsString, IsOptional } from 'class-validator'

export class CreateTodoDto {
  @IsString() title: string
  @IsOptional() @IsString() assigneeId?: string
  @IsOptional() @IsString() dueDate?: string
  @IsOptional() @IsString() repeatRule?: string
  @IsOptional() @IsString() priority?: string
}

export class UpdateTodoDto {
  @IsOptional() @IsString() title?: string
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsString() assigneeId?: string
  @IsOptional() @IsString() dueDate?: string
  @IsOptional() @IsString() repeatRule?: string
  @IsOptional() @IsString() priority?: string
}
