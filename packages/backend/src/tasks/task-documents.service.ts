import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

export const DOCUMENT_REQUEST_STATUSES = ['pending', 'received', 'partial'] as const

@Injectable()
export class TaskDocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, body: any) {
    if (!body.taskId) throw new BadRequestException('taskId is required')
    if (!body.documentName) throw new BadRequestException('documentName is required')

    const task = await this.prisma.task.findFirst({ where: { id: body.taskId, orgId } })
    if (!task) throw new NotFoundException(`Task ${body.taskId} not found`)

    const data: any = {
      org: { connect: { id: orgId } },
      task: { connect: { id: body.taskId } },
      documentName: body.documentName,
      category: body.category,
      status: body.status || 'pending',
      uploadedDocumentId: body.uploadedDocumentId,
    }
    if (body.clientId) {
      const client = await this.prisma.client.findFirst({ where: { id: body.clientId, orgId } })
      if (!client) throw new NotFoundException(`Client ${body.clientId} not found`)
      data.client = { connect: { id: body.clientId } }
    }
    return this.prisma.taskDocumentRequest.create({ data })
  }

  async findAll(orgId: string, filters: { clientId?: string; taskId?: string; status?: string }) {
    const where: any = { orgId }
    if (filters.status) where.status = filters.status
    if (filters.clientId) where.clientId = filters.clientId
    if (filters.taskId) where.taskId = filters.taskId

    const docs = await this.prisma.taskDocumentRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        task: { select: { title: true, id: true } },
        client: { select: { name: true } },
        documents: { select: { id: true, fileUrl: true, fileName: true } },
      },
    })
    return docs
  }

  async findOne(orgId: string, id: string) {
    const doc = await this.prisma.taskDocumentRequest.findFirst({
      where: { id, orgId },
      include: {
        task: { select: { id: true, title: true, clientId: true } },
        client: { select: { id: true, name: true } },
        documents: true,
      },
    })
    if (!doc) throw new NotFoundException(`Document request ${id} not found`)
    return doc
  }

  async update(orgId: string, id: string, body: any) {
    const existing = await this.prisma.taskDocumentRequest.findFirst({ where: { id, orgId } })
    if (!existing) throw new NotFoundException(`Document request ${id} not found`)

    const data: any = {}
    if (body.documentName !== undefined) data.documentName = body.documentName
    if (body.category !== undefined) data.category = body.category
    if (body.status !== undefined) {
      if (!DOCUMENT_REQUEST_STATUSES.includes(body.status)) {
        throw new BadRequestException(`Invalid status: ${body.status}`)
      }
      data.status = body.status
    }
    if (body.uploadedDocumentId !== undefined) {
      if (body.uploadedDocumentId) {
        const doc = await this.prisma.document.findFirst({ where: { id: body.uploadedDocumentId, orgId } })
        if (!doc) throw new NotFoundException(`Document ${body.uploadedDocumentId} not found`)
      }
      data.uploadedDocumentId = body.uploadedDocumentId ?? null
    }
    if (body.clientId !== undefined) {
      if (body.clientId) {
        const client = await this.prisma.client.findFirst({ where: { id: body.clientId, orgId } })
        if (!client) throw new NotFoundException(`Client ${body.clientId} not found`)
        data.client = { connect: { id: body.clientId } }
      } else {
        data.client = { disconnect: true }
      }
    }

    return this.prisma.taskDocumentRequest.update({ where: { id }, data })
  }

  async linkDocument(orgId: string, id: string, documentId: string) {
    const existing = await this.prisma.taskDocumentRequest.findFirst({ where: { id, orgId } })
    if (!existing) throw new NotFoundException(`Document request ${id} not found`)
    const doc = await this.prisma.document.findFirst({ where: { id: documentId, orgId } })
    if (!doc) throw new NotFoundException(`Document ${documentId} not found`)
    return this.prisma.taskDocumentRequest.update({
      where: { id },
      data: { uploadedDocumentId: doc.id, status: 'received' },
    })
  }

  async delete(orgId: string, id: string) {
    const existing = await this.prisma.taskDocumentRequest.findFirst({ where: { id, orgId } })
    if (!existing) throw new NotFoundException(`Document request ${id} not found`)
    await this.prisma.taskDocumentRequest.delete({ where: { id } })
    return { id }
  }
}
