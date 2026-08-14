import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common'
import { ComplianceService } from './compliance.service'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('compliance')
@UseGuards(JwtGuard)
export class ComplianceController {
  constructor(private svc: ComplianceService) {}

  private orgId(req: any) {
    return req.user?.orgId
  }

  @Get('upcoming')
  async upcoming(@Req() req: any, @Query('applicableTo') applicableTo?: string) {
    return this.svc.upcoming(this.orgId(req), { applicableTo })
  }

  @Get()
  async list(@Req() req: any, @Query('applicableTo') applicableTo?: string) {
    return this.svc.findAll(this.orgId(req), { applicableTo })
  }

  @Get(':id')
  async get(@Req() req: any, @Param('id') id: string) {
    return this.svc.findOne(this.orgId(req), id)
  }

  @Post()
  async create(
    @Req() req: any,
    @Body() body: { name: string; applicableTo: string; dueDateRule: string },
  ) {
    return this.svc.create(this.orgId(req), body)
  }

  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { name?: string; applicableTo?: string; dueDateRule?: string },
  ) {
    return this.svc.update(this.orgId(req), id, body)
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.svc.delete(this.orgId(req), id)
  }
}
