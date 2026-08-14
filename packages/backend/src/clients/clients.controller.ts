import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Res,
  Header,
} from '@nestjs/common'
import { Response } from 'express'
import { JwtGuard } from '../auth/jwt.guard'
import { ClientsService } from './clients.service'
import { CreateClientDto } from './dto/create-client.dto'
import { UpdateClientDto } from './dto/update-client.dto'
import { CreateClientGroupDto } from './dto/create-client-group.dto'
import { CreateCredentialDto } from './dto/create-credential.dto'
import { CreateDscDto } from './dto/create-dsc.dto'

@Controller('clients')
@UseGuards(JwtGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get('export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="clients.csv"')
  async exportClients(@Req() req: any, @Res() res: Response) {
    const result = await this.clientsService.exportClients(req.user.orgId)
    return res.send(result.csv)
  }

  @Get('groups')
  async getGroups(@Req() req: any) {
    return this.clientsService.getGroups(req.user.orgId)
  }

  @Get('dsc/expiring')
  async getExpiringDsc(@Req() req: any, @Query('days') days?: string) {
    const d = days ? parseInt(days, 10) : 30
    return this.clientsService.getExpiringDsc(req.user.orgId, d)
  }

  @Get()
  async getClients(@Req() req: any, @Query('search') search?: string, @Query('status') status?: string) {
    return this.clientsService.getClients(req.user.orgId, search, status)
  }

  @Get(':id')
  async getClient(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.getClient(req.user.orgId, id)
  }

  @Post()
  async createClient(@Body() body: CreateClientDto, @Req() req: any) {
    return this.clientsService.createClient(req.user.orgId, body)
  }

  @Patch(':id')
  async updateClient(@Param('id') id: string, @Body() body: UpdateClientDto, @Req() req: any) {
    return this.clientsService.updateClient(req.user.orgId, id, body)
  }

  @Delete(':id')
  async deleteClient(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.deleteClient(req.user.orgId, id)
  }

  @Post('import')
  async importClients(@Body() body: { clients: any[] }, @Req() req: any) {
    return this.clientsService.importClients(req.user.orgId, body.clients)
  }

  @Post('groups')
  async createGroup(@Body() body: CreateClientGroupDto, @Req() req: any) {
    return this.clientsService.createGroup(req.user.orgId, body)
  }

  @Delete('groups/:id')
  async deleteGroup(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.deleteGroup(req.user.orgId, id)
  }

  @Get(':clientId/credentials')
  async getCredentials(@Param('clientId') clientId: string, @Req() req: any) {
    return this.clientsService.getCredentials(req.user.orgId, clientId)
  }

  @Post('credentials')
  async createCredential(@Body() body: CreateCredentialDto, @Req() req: any) {
    return this.clientsService.createCredential(req.user.orgId, body)
  }

  @Delete('credentials/:id')
  async deleteCredential(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.deleteCredential(req.user.orgId, id)
  }

  @Get(':clientId/dsc')
  async getDscRecords(@Param('clientId') clientId: string, @Req() req: any) {
    return this.clientsService.getDscRecords(req.user.orgId, clientId)
  }

  @Post('dsc')
  async createDsc(@Body() body: CreateDscDto, @Req() req: any) {
    return this.clientsService.createDsc(req.user.orgId, body)
  }

  @Delete('dsc/:id')
  async deleteDsc(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.deleteDsc(req.user.orgId, id)
  }

  @Get('gstin/:gstin')
  async gstinLookup(@Param('gstin') gstin: string) {
    return this.clientsService.gstinLookup(gstin)
  }
}
