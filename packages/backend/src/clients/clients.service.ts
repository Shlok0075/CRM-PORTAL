import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async getClients(orgId: string, search?: string, status?: string) {
    const where: any = { orgId }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { pan: { contains: search, mode: 'insensitive' } },
        { gstins: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status) {
      where.status = status
    }
    return this.prisma.client.findMany({
      where,
      include: { group: true, responsibleUser: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getClient(orgId: string, id: string) {
    return this.prisma.client.findFirst({
      where: { id, orgId },
      include: { group: true, responsibleUser: true, credentials: true, dscRecords: true },
    })
  }

  async createClient(orgId: string, data: any) {
    const cleaned = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null && v !== undefined))
    if (!cleaned.gstins) cleaned.gstins = ''
    return this.prisma.client.create({
      data: { ...cleaned, orgId },
      include: { group: true, responsibleUser: true },
    })
  }

  async updateClient(orgId: string, id: string, data: any) {
    const cleaned = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null && v !== undefined))
    return this.prisma.client.update({
      where: { id },
      data: cleaned,
      include: { group: true, responsibleUser: true },
    })
  }

  async deleteClient(orgId: string, id: string) {
    return this.prisma.client.delete({
      where: { id },
    })
  }

  async importClients(orgId: string, clients: any[]) {
    return this.prisma.$transaction(
      clients.map((c) =>
        this.prisma.client.create({
          data: { ...c, orgId },
        }),
      ),
    )
  }

  async exportClients(orgId: string) {
    const clients = await this.prisma.client.findMany({
      where: { orgId },
      include: { group: true },
      orderBy: { createdAt: 'desc' },
    })
    const headers = ['ID', 'Name', 'PAN', 'GSTINs', 'Type', 'Group', 'Status', 'Created At']
    const rows = clients.map((c) => [
      c.id,
      c.name,
      c.pan || '',
      c.gstins || '',
      c.type || '',
      c.group?.name || '',
      c.status,
      c.createdAt.toISOString(),
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    return { csv, count: clients.length }
  }

  async getGroups(orgId: string) {
    return this.prisma.clientGroup.findMany({
      where: { orgId },
      include: { _count: { select: { clients: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createGroup(orgId: string, data: any) {
    return this.prisma.clientGroup.create({
      data: { ...data, orgId },
    })
  }

  async deleteGroup(orgId: string, id: string) {
    return this.prisma.clientGroup.delete({
      where: { id },
    })
  }

  async getCredentials(orgId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, orgId },
      select: { id: true },
    })
    if (!client) return []
    return this.prisma.clientCredential.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createCredential(orgId: string, data: any) {
    const client = await this.prisma.client.findFirst({
      where: { id: data.clientId, orgId },
      select: { id: true },
    })
    if (!client) throw new Error('Client not found')
    const { clientId, ...rest } = data
    return this.prisma.clientCredential.create({
      data: { ...rest, clientId },
    })
  }

  async deleteCredential(orgId: string, id: string) {
    const cred = await this.prisma.clientCredential.findUnique({
      where: { id },
      include: { client: { select: { orgId: true } } },
    })
    if (!cred || cred.client.orgId !== orgId) throw new Error('Credential not found')
    return this.prisma.clientCredential.delete({
      where: { id },
    })
  }

  async getDscRecords(orgId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, orgId },
      select: { id: true },
    })
    if (!client) return []
    return this.prisma.dscRecord.findMany({
      where: { clientId },
      orderBy: { expiryDate: 'asc' },
    })
  }

  async getExpiringDsc(orgId: string, days: number = 30) {
    const clients = await this.prisma.client.findMany({
      where: { orgId },
      select: { id: true },
    })
    const clientIds = clients.map((c) => c.id)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + days)
    return this.prisma.dscRecord.findMany({
      where: {
        clientId: { in: clientIds },
        expiryDate: { lte: cutoff },
      },
      include: { client: { select: { name: true } } },
      orderBy: { expiryDate: 'asc' },
    })
  }

  async createDsc(orgId: string, data: any) {
    const client = await this.prisma.client.findFirst({
      where: { id: data.clientId, orgId },
      select: { id: true },
    })
    if (!client) throw new Error('Client not found')
    const { clientId, expiryDate, ...rest } = data
    return this.prisma.dscRecord.create({
      data: { ...rest, clientId, expiryDate: new Date(expiryDate) },
    })
  }

  async deleteDsc(orgId: string, id: string) {
    const dsc = await this.prisma.dscRecord.findUnique({
      where: { id },
      include: { client: { select: { orgId: true } } },
    })
    if (!dsc || dsc.client.orgId !== orgId) throw new Error('DSC record not found')
    return this.prisma.dscRecord.delete({
      where: { id },
    })
  }

  async gstinLookup(gstin: string) {
    return {
      gstin,
      legalName: 'MOCK LEGAL NAME PVT LTD',
      tradeName: 'MOCK TRADE NAME',
      status: 'Active',
      registrationDate: '2020-01-15',
      lastUpdate: '2024-01-01',
      address: 'MOCK ADDRESS, MOCK CITY, MOCK STATE - 000000',
      businessType: 'Private Limited Company',
    }
  }
}
